import { count, desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import { documentChunks, documents } from "@/lib/db/schema";
import { DocumentProcessingError } from "@/lib/documents/processing-error";
import { processPdfDocument } from "@/lib/documents/process";

export const MAX_ADMIN_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

export class AdminDocumentError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = "AdminDocumentError";
  }
}

export type AdminDocumentSummary = {
  id: string;
  filename: string;
  processingStatus: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  createdAt: Date | string | null;
  chunkCount: number;
  errorMessage: string | null;
};

export function validateUploadedPdf(file: FormDataEntryValue | File | null): File {
  if (!(file instanceof File)) {
    throw new AdminDocumentError("A valid PDF file is required.", 400);
  }

  const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
  const mimeType = file.type || "application/pdf";
  if (mimeType !== "application/pdf" && !hasPdfExtension) {
    throw new AdminDocumentError("Only PDF files are allowed.", 415);
  }

  if (file.size === 0) {
    throw new AdminDocumentError("The uploaded PDF is empty.", 400);
  }

  if (file.size > MAX_ADMIN_DOCUMENT_SIZE_BYTES) {
    throw new AdminDocumentError(
      `The uploaded PDF exceeds the ${MAX_ADMIN_DOCUMENT_SIZE_BYTES / 1024 / 1024} MB size limit.`,
      413,
    );
  }

  return file;
}

export function validateChunkCount(value: FormDataEntryValue | string | null | undefined): number {
  const rawValue = typeof value === "string" ? value.trim() : "";
  const chunkCount = Number(rawValue);
  if (!rawValue || !Number.isInteger(chunkCount) || chunkCount < 1 || chunkCount > 1000) {
    throw new AdminDocumentError("Number of chunks must be an integer between 1 and 1000.", 400);
  }
  return chunkCount;
}

export async function createAdminDocumentUpload(
  formData: FormData,
  processor: typeof processPdfDocument = processPdfDocument,
): Promise<AdminDocumentSummary> {
  const file = validateUploadedPdf(formData.get("file"));
  const targetChunkCount = validateChunkCount(formData.get("chunkCount"));

  try {
    const result = await processor({
      file: Buffer.from(await file.arrayBuffer()),
      filename: file.name,
      originalName: file.name,
      mimeType: file.type || "application/pdf",
    }, { targetChunkCount });

    return {
      id: result.document.id,
      filename: result.document.filename,
      processingStatus: result.document.processingStatus,
      createdAt: result.document.createdAt,
      chunkCount: result.chunkCount,
      errorMessage: result.document.errorMessage ?? null,
    };
  } catch (error) {
    if (error instanceof AdminDocumentError) throw error;
    const message = error instanceof DocumentProcessingError ? error.message : "Unable to process the uploaded document.";
    throw new AdminDocumentError(message, 500);
  }
}

export async function listAdminDocuments(database = getDb()): Promise<AdminDocumentSummary[]> {
  const rows = await database
    .select({
      id: documents.id,
      filename: documents.filename,
      processingStatus: documents.processingStatus,
      createdAt: documents.createdAt,
      errorMessage: documents.errorMessage,
    })
    .from(documents)
    .orderBy(desc(documents.createdAt));

  const summaries: AdminDocumentSummary[] = [];
  for (const row of rows) {
    const [chunkCountResult] = await database
      .select({ count: count(documentChunks.id) })
      .from(documentChunks)
      .where(eq(documentChunks.documentId, row.id));

    summaries.push({
      id: row.id,
      filename: row.filename,
      processingStatus: row.processingStatus,
      createdAt: row.createdAt,
      chunkCount: Number(chunkCountResult?.count ?? 0),
      errorMessage: row.errorMessage ?? null,
    });
  }

  return summaries;
}

export async function getAdminDocumentById(id: string, database = getDb()): Promise<AdminDocumentSummary> {
  const [row] = await database
    .select({
      id: documents.id,
      filename: documents.filename,
      processingStatus: documents.processingStatus,
      createdAt: documents.createdAt,
      errorMessage: documents.errorMessage,
    })
    .from(documents)
    .where(eq(documents.id, id));

  if (!row) {
    throw new AdminDocumentError("Document not found.", 404);
  }

  const [chunkCountResult] = await database
    .select({ count: count(documentChunks.id) })
    .from(documentChunks)
    .where(eq(documentChunks.documentId, row.id));

  return {
    id: row.id,
    filename: row.filename,
    processingStatus: row.processingStatus,
    createdAt: row.createdAt,
    chunkCount: Number(chunkCountResult?.count ?? 0),
    errorMessage: row.errorMessage ?? null,
  };
}

export async function deleteAdminDocument(id: string, database = getDb()): Promise<{ id: string; deleted: true }> {
  const [existing] = await database
    .select({ id: documents.id })
    .from(documents)
    .where(eq(documents.id, id));

  if (!existing) {
    throw new AdminDocumentError("Document not found.", 404);
  }

  await database.transaction(async (tx) => {
    await tx.delete(documentChunks).where(eq(documentChunks.documentId, id));
    await tx.delete(documents).where(eq(documents.id, id));
  });

  return { id, deleted: true };
}
