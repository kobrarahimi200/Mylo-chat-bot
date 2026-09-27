import assert from "node:assert/strict";
import test from "node:test";
import { chunkText, cleanExtractedText } from "@/lib/documents/chunk";

test("cleans extracted whitespace", () => {
  assert.equal(cleanExtractedText("  Alpha \r\n\r\n beta\t gamma  "), "Alpha\n\nbeta gamma");
});

test("chunks by paragraph and sentence boundaries with overlap", () => {
  const chunks = chunkText(
    "First paragraph has useful context. It continues here.\n\nSecond paragraph contains another fact. Final sentence.",
    { chunkSize: 62, overlap: 12 },
  );
  assert.ok(chunks.length > 1);
  assert.deepEqual(chunks.map((chunk) => chunk.chunkIndex), chunks.map((_, index) => index));
  assert.ok(chunks.every((chunk) => chunk.content.length <= 62 || chunk.content.split(/\s+/).length === 1));
});

test("returns no chunks for empty text", () => {
  assert.deepEqual(chunkText(" \n\t "), []);
});
