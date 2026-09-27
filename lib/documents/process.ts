import { eq } from "drizzle-orm";
import { documents, documentChunks, type Document, type NewDocumentChunk } from "@/lib/db/schema";
import { getDb } from "@/lib/db/client";
import { chunkText, type ChunkingOptions } from "@/lib/documents/chunk";
import { createGeminiEmbedder } from "@/lib/documents/embedding";
import { DocumentProcessingError } from "@/lib/documents/processing-error";
import { extractPdfPages } from "@/lib/documents/pdf";

export type ProcessPdfInput = {
  file: Buffer | Uint8Array | Blob;
  filename: string;
  originalName?: string;
  mimeType?: string;
};

export type ProcessPdfOptions = ChunkingOptions & {
  targetChunkCount?: number;
  embed?: (content: string) => Promise<number[]>;
};

export type ProcessedDocument = {
  document: Document;
  chunkCount: number;
};

export async function processPdfDocument(
  input: ProcessPdfInput,
  options: ProcessPdfOptions = {},
): Promise<ProcessedDocument> {
  const database = getDb();
  const originalName = input.originalName ?? input.filename;
  const mimeType = input.mimeType ?? "application/pdf";
  const file = await toBuffer(input.file);

  if (mimeType !== "application/pdf" || file.length === 0) {
    throw new DocumentProcessingError("The uploaded file must be a non-empty PDF.", "INVALID_PDF");
  }

  let document: Document;
  try {
    [document] = await database
      .insert(documents)
      .values({
        filename: input.filename,
        originalName,
        mimeType,
        fileSize: file.length,
        processingStatus: "PENDING",
      })
      .returning();
    await setStatus(database, document.id, "PROCESSING");
  } catch (error) {
    throw new DocumentProcessingError("Unable to create the document record.", "DATABASE_FAILED", undefined, { cause: error });
  }

  try {
    const pages = await extractPdfPages(file);
    const chunkingOptions = getChunkingOptions(pages, options);
    const pageChunks = pages.flatMap((page) =>
      chunkText(page.text, chunkingOptions).map((chunk) => ({
        ...chunk,
        pageNumber: page.pageNumber,
      })),
    );
    if (!pageChunks.length) {
      throw new DocumentProcessingError("The PDF contains no extractable text.", "EMPTY_PDF", document.id);
    }

    function getChunkingOptions(
      pages: Array<{ pageNumber: number; text: string }>,
      options: ProcessPdfOptions,
    ): ChunkingOptions {
      if (options.targetChunkCount === undefined) {
        return { chunkSize: options.chunkSize, overlap: options.overlap };
      }

      if (
        !Number.isInteger(options.targetChunkCount) ||
        options.targetChunkCount < 1 ||
        options.targetChunkCount > 1000
      ) {
        throw new DocumentProcessingError(
          "targetChunkCount must be an integer between 1 and 1000.",
          "EXTRACTION_FAILED",
        );
      }

      const totalTextLength = pages.reduce((total, page) => total + page.text.length, 0);
      const overlap = options.overlap ?? 240;
      const chunkSize = Math.max(
        overlap + 1,
        Math.ceil((totalTextLength + (options.targetChunkCount - 1) * overlap) / options.targetChunkCount),
      );

      return { chunkSize, overlap };
    }

    const embed = options.embed ?? createGeminiEmbedder();
    const chunks: NewDocumentChunk[] = [];
    for (const chunk of pageChunks) {
      let embedding: number[];
      try {
        embedding = await embed(chunk.content);
      } catch (error) {
        throw new DocumentProcessingError(`Embedding failed for chunk ${chunk.chunkIndex}.`, "EMBEDDING_FAILED", document.id, { cause: error });
      }
      if (embedding.length !== 3072 || embedding.some((value) => !Number.isFinite(value))) {
        throw new DocumentProcessingError(`Embedding has an invalid dimension for chunk ${chunk.chunkIndex}.`, "EMBEDDING_FAILED", document.id);
      }
      chunks.push({
        documentId: document.id,
        content: chunk.content,
        chunkIndex: chunks.length,
        embedding,
        metadata: {
          originalFilename: originalName,
          pageNumber: chunk.pageNumber,
          chunkIndex: chunks.length,
        },
      });
    }

    try {
      await database.transaction(async (tx) => {
        await tx.insert(documentChunks).values(chunks);
        await tx
          .update(documents)
          .set({ processingStatus: "COMPLETED", errorMessage: null, updatedAt: new Date() })
          .where(eq(documents.id, document.id));
      });
    } catch (error) {
      throw new DocumentProcessingError("Unable to store document chunks.", "DATABASE_FAILED", document.id, { cause: error });
    }

    return { document: { ...document, processingStatus: "COMPLETED", errorMessage: null }, chunkCount: chunks.length };
  } catch (error) {
    const processingError = error instanceof DocumentProcessingError
      ? error
      : new DocumentProcessingError("Document processing failed.", "EXTRACTION_FAILED", document.id, { cause: error });
    try {
      await setStatus(database, document.id, "FAILED", processingError.message);
    } catch (statusError) {
      throw new DocumentProcessingError(
        `${processingError.message} The failed status could not be persisted.`,
        "DATABASE_FAILED",
        document.id,
        { cause: statusError },
      );
    }
    throw processingError;
  }
}

async function setStatus(database: ReturnType<typeof getDb>, id: string, status: "PROCESSING" | "COMPLETED" | "FAILED", errorMessage?: string) {
  await database
    .update(documents)
    .set({ processingStatus: status, errorMessage: errorMessage ?? null, updatedAt: new Date() })
    .where(eq(documents.id, id));
}

async function toBuffer(file: Buffer | Uint8Array | Blob): Promise<Buffer> {
  if (Buffer.isBuffer(file)) return file;
  if (file instanceof Uint8Array) return Buffer.from(file);
  return Buffer.from(await file.arrayBuffer());
}
