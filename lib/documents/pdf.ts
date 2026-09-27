import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { PDFParse } from "pdf-parse";
import { cleanExtractedText } from "@/lib/documents/chunk";
import { DocumentProcessingError } from "@/lib/documents/processing-error";

let pdfWorkerConfigured = false;

export async function extractPdfPages(file: Buffer): Promise<Array<{ pageNumber: number; text: string }>> {
  if (file.subarray(0, 5).toString("ascii") !== "%PDF-") {
    throw new DocumentProcessingError(
      "The uploaded file is not a valid PDF. Please choose the original PDF file.",
      "INVALID_PDF",
    );
  }

  const parser = new PDFParse({ data: file });
  try {
    configurePdfWorker();
    const result = await parser.getText();
    return result.pages
      .map((page) => ({ pageNumber: page.num, text: cleanExtractedText(page.text) }))
      .filter((page) => page.text.length > 0);
  } catch (error) {
    const details = error instanceof Error && error.message ? ` ${error.message}` : "";
    throw new DocumentProcessingError(
      `Unable to extract text from the PDF.${details}`,
      "EXTRACTION_FAILED",
      undefined,
      { cause: error },
    );
  } finally {
    await parser.destroy();
  }
}

function configurePdfWorker(): void {
  if (pdfWorkerConfigured) return;

  const require = createRequire(join(process.cwd(), "package.json"));
  const pdfParseEntry = require.resolve("pdf-parse");
  const workerPath = join(dirname(pdfParseEntry), "pdf.worker.mjs");
  PDFParse.setWorker(pathToFileURL(workerPath).href);
  pdfWorkerConfigured = true;
}
