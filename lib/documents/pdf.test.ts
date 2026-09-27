import assert from "node:assert/strict";
import test from "node:test";
import { extractPdfPages } from "@/lib/documents/pdf";

const testPdf = Buffer.from(`%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>
endobj
4 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT /F1 24 Tf 72 720 Td (Mylo worker regression test) Tj ET
endstream
endobj
xref
0 6
0000000000 65535 f
trailer
<< /Size 6 /Root 1 0 R >>
startxref
0
%%EOF
`);

test("extractPdfPages configures the packaged worker and extracts text", async () => {
  const pages = await extractPdfPages(testPdf);
  assert.equal(pages.length, 1);
  assert.equal(pages[0].pageNumber, 1);
  assert.match(pages[0].text, /Mylo worker regression test/);
});

test("extractPdfPages rejects data without a PDF signature", async () => {
  await assert.rejects(
    () => extractPdfPages(Buffer.from("not a pdf")),
    /not a valid PDF/i,
  );
});
