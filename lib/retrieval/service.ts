import { sql } from "drizzle-orm";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { createGeminiEmbedder, type EmbedText } from "@/lib/documents/embedding";
import { getDb } from "@/lib/db/client";
import { EMBEDDING_DIMENSIONS, documentChunks, documents } from "@/lib/db/schema";

export type RetrievalInput = {
  query: string;
  documentId?: string;
};

export type RetrievalOptions = {
  topK?: number;
  similarityThreshold?: number;
  embed?: EmbedText;
  database?: PostgresJsDatabase;
};

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  filename: string;
  content: string;
  pageNumber?: number;
  similarity: number;
};

const DEFAULT_TOP_K = 5;
const DEFAULT_SIMILARITY_THRESHOLD = 0.5;

export async function retrieveRelevantChunks(
  input: RetrievalInput,
  options: RetrievalOptions = {},
): Promise<RetrievedChunk[]> {
  const query = input.query.trim();
  if (!query) return [];

  const topK = validateTopK(options.topK ?? DEFAULT_TOP_K);
  const similarityThreshold = validateSimilarityThreshold(
    options.similarityThreshold ?? DEFAULT_SIMILARITY_THRESHOLD,
  );
  const embed = options.embed ?? createGeminiEmbedder();
  const queryEmbedding = await embed(query);
  if (
    queryEmbedding.length !== EMBEDDING_DIMENSIONS ||
    queryEmbedding.some((value) => !Number.isFinite(value))
  ) {
    throw new Error(`Query embedding must contain ${EMBEDDING_DIMENSIONS} finite values.`);
  }

  const vectorLiteral = `[${queryEmbedding.join(",")}]`;
  const distance = sql`(${documentChunks.embedding} <=> ${vectorLiteral}::vector)`;
  const similarity = sql`(1 - ${distance})`;
  const database = options.database ?? getDb();
  const documentFilter = input.documentId
    ? sql`AND ${documents.id} = ${input.documentId}`
    : sql``;
  const rows = await database.execute(sql`
    SELECT
      ${documentChunks.id} AS "chunkId",
      ${documents.id} AS "documentId",
      ${documents.filename} AS "filename",
      ${documentChunks.content} AS "content",
      ${documentChunks.metadata} AS "metadata",
      ${similarity} AS "similarity"
    FROM ${documentChunks}
    INNER JOIN ${documents} ON ${documentChunks.documentId} = ${documents.id}
    WHERE ${documents.processingStatus} = 'COMPLETED'
      ${documentFilter}
      AND ${similarity} >= ${similarityThreshold}
    ORDER BY ${distance} ASC
    LIMIT ${topK}
  `);

  return (rows as unknown as Array<Record<string, unknown>>).map(toRetrievedChunk);
}

function toRetrievedChunk(row: Record<string, unknown>): RetrievedChunk {
  const similarity = Number(row.similarity);
  if (!Number.isFinite(similarity)) {
    throw new Error("Retrieval returned an invalid similarity score.");
  }
  return {
    chunkId: String(row.chunkId),
    documentId: String(row.documentId),
    filename: String(row.filename),
    content: String(row.content),
    pageNumber: getPageNumber(row.metadata),
    similarity,
  };
}

function getPageNumber(metadata: unknown): number | undefined {
  if (!metadata || typeof metadata !== "object" || !("pageNumber" in metadata)) return undefined;
  const pageNumber = metadata.pageNumber;
  return typeof pageNumber === "number" && Number.isInteger(pageNumber) ? pageNumber : undefined;
}

function validateTopK(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > 100) {
    throw new Error("topK must be an integer between 1 and 100.");
  }
  return value;
}

function validateSimilarityThreshold(value: number): number {
  if (!Number.isFinite(value) || value < -1 || value > 1) {
    throw new Error("similarityThreshold must be between -1 and 1.");
  }
  return value;
}
