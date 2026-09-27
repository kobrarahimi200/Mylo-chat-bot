import assert from "node:assert/strict";
import test from "node:test";
import { PgDialect } from "drizzle-orm/pg-core";
import { retrieveRelevantChunks } from "@/lib/retrieval/service";

const queryEmbedding = Array.from({ length: 3072 }, () => 0);
const documentId = "39d8f8de-7f75-4f04-9b13-f6f7fd870c7b";

function createDatabase() {
  const queries: Array<{ sql: string; params: unknown[] }> = [];
  const database = {
    async execute(query: Parameters<typeof PgDialect.prototype.sqlToQuery>[0]) {
      const built = new PgDialect().sqlToQuery(query);
      queries.push(built);
      return [{
        chunkId: "chunk-1",
        documentId,
        filename: "report.pdf",
        content: "Relevant content",
        metadata: { pageNumber: 2 },
        similarity: 0.91,
      }];
    },
    queries,
  };
  return database;
}

test("retrieval searches all completed documents without a category boundary", async () => {
  const database = createDatabase();
  const result = await retrieveRelevantChunks(
    { query: "What information is relevant?" },
    { database: database as never, embed: async () => queryEmbedding },
  );

  assert.deepEqual(result, [{
    chunkId: "chunk-1",
    documentId,
    filename: "report.pdf",
    content: "Relevant content",
    pageNumber: 2,
    similarity: 0.91,
  }]);
  assert.match(database.queries[0].sql, /processing_status/);
  assert.doesNotMatch(database.queries[0].sql, /category/);
});

test("selected document retrieval scopes results to that document", async () => {
  const database = createDatabase();
  const result = await retrieveRelevantChunks(
    { query: "question about this file", documentId },
    { database: database as never, embed: async () => queryEmbedding },
  );

  assert.deepEqual(result.map((chunk) => chunk.documentId), [documentId]);
  assert.match(database.queries[0].sql, /"documents"\."id" =/);
  assert.ok(database.queries[0].params.includes(documentId));
});

test("retrieval validates configurable topK and similarity threshold", async () => {
  const database = createDatabase();
  await assert.rejects(
    () => retrieveRelevantChunks({ query: "query" }, {
      database: database as never, embed: async () => queryEmbedding, topK: 0,
    }),
    /topK/,
  );
  await assert.rejects(
    () => retrieveRelevantChunks({ query: "query" }, {
      database: database as never, embed: async () => queryEmbedding, similarityThreshold: 2,
    }),
    /similarityThreshold/,
  );
});
