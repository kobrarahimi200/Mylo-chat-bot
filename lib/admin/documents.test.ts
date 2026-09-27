import assert from "node:assert/strict";
import test from "node:test";

import {
  createAdminDocumentUpload,
  deleteAdminDocument,
  getAdminDocumentById,
  listAdminDocuments,
  validateChunkCount,
  validateUploadedPdf,
} from "@/lib/admin/documents";

test("validateUploadedPdf enforces PDF-only uploads and size limits", () => {
  const pdf = new File(["pdf"], "report.pdf", { type: "application/pdf" });
  const txt = new File(["hello"], "report.txt", { type: "text/plain" });
  const oversized = new File([new Uint8Array(11 * 1024 * 1024)], "large.pdf", { type: "application/pdf" });

  assert.equal(validateUploadedPdf(pdf).name, "report.pdf");
  assert.throws(() => validateUploadedPdf(txt), /Only PDF files are allowed/);
  assert.throws(() => validateUploadedPdf(oversized), /size limit/);
});

test("validateChunkCount accepts a bounded integer and rejects invalid values", () => {
  assert.equal(validateChunkCount("12"), 12);
  assert.throws(() => validateChunkCount("0"), /Number of chunks/);
  assert.throws(() => validateChunkCount("1.5"), /Number of chunks/);
  assert.throws(() => validateChunkCount("1001"), /Number of chunks/);
});

test("createAdminDocumentUpload validates input and processes the uploaded PDF", async () => {
  const formData = new FormData();
  formData.set("chunkCount", "5");
  formData.set("file", new File(["hello world"], "bank.pdf", { type: "application/pdf" }));

  const result = await createAdminDocumentUpload(formData, async () => ({
    document: {
      id: "doc_123",
      filename: "bank.pdf",
      originalName: "bank.pdf",
      mimeType: "application/pdf",
      fileSize: 11,
      createdAt: new Date("2025-01-01T00:00:00Z"),
      updatedAt: new Date("2025-01-01T00:00:00Z"),
      processingStatus: "COMPLETED",
      errorMessage: null,
    },
    chunkCount: 4,
  }));

  assert.equal(result.id, "doc_123");
  assert.equal(result.processingStatus, "COMPLETED");
  assert.equal(result.chunkCount, 4);
});

test("listAdminDocuments returns the admin document summary with chunk counts", async () => {
  const rows = [{
    id: "doc_1",
    filename: "bank.pdf",
    processingStatus: "COMPLETED",
    createdAt: new Date("2025-01-02T00:00:00Z"),
    errorMessage: null,
  }];

  const database = {
    select(columns: Record<string, unknown>) {
      return {
        from() {
          if (columns && "count" in columns) {
            return { where: async () => [{ count: 2 }] };
          }
          return { orderBy: async () => rows };
        },
      };
    },
  } as any;

  const documents = await listAdminDocuments(database);
  assert.equal(documents.length, 1);
  assert.equal(documents[0].chunkCount, 2);
  assert.equal(documents[0].filename, "bank.pdf");
});

test("getAdminDocumentById returns a document or 404 when missing", async () => {
  let isCountQuery = false;
  const database = {
    select(columns: Record<string, unknown>) {
      isCountQuery = Boolean(columns && "count" in columns);
      return {
        from() {
          return {
            where: async () => isCountQuery
              ? [{ count: 1 }]
              : [{
                  id: "doc_2",
                  filename: "plant.pdf",
                  processingStatus: "FAILED",
                  createdAt: new Date("2025-02-01T00:00:00Z"),
                  errorMessage: "Parsing failed",
                }],
          };
        },
      };
    },
  } as any;

  const document = await getAdminDocumentById("doc_2", database);
  assert.equal(document.filename, "plant.pdf");
  assert.equal(document.errorMessage, "Parsing failed");

  const missingDatabase = {
    select() {
      return {
        from() {
          return {
            where: async () => [],
          };
        },
      };
    },
  } as any;

  await assert.rejects(() => getAdminDocumentById("missing", missingDatabase), /Document not found/);
});

test("deleteAdminDocument removes the document and its related chunks", async () => {
  const deleteCalls: string[] = [];
  const database = {
    select: () => ({
      from: () => ({
        where: async () => [{ id: "doc_3" }],
      }),
    }),
    transaction: async (callback: (tx: any) => Promise<void>) => {
      const tx = {
        delete: () => ({
          where: async (predicate: unknown) => {
            deleteCalls.push(String(predicate));
          },
        }),
      };
      await callback(tx);
    },
  } as any;

  const result = await deleteAdminDocument("doc_3", database);
  assert.deepEqual(result, { id: "doc_3", deleted: true });
  assert.equal(deleteCalls.length, 2);
});
