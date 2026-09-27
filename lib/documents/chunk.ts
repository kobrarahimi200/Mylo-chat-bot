export type ChunkingOptions = {
  chunkSize?: number;
  overlap?: number;
};

export type TextChunk = {
  content: string;
  chunkIndex: number;
};

export const DEFAULT_CHUNKING_OPTIONS = {
  chunkSize: 1600,
  overlap: 240,
} satisfies Required<ChunkingOptions>;

export function cleanExtractedText(text: string): string {
  return text
    .replace(/\u00a0/g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function chunkText(text: string, options: ChunkingOptions = {}): TextChunk[] {
  const chunkSize = options.chunkSize ?? DEFAULT_CHUNKING_OPTIONS.chunkSize;
  const overlap = options.overlap ?? DEFAULT_CHUNKING_OPTIONS.overlap;

  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new Error("chunkSize must be a positive integer.");
  }
  if (!Number.isInteger(overlap) || overlap < 0 || overlap >= chunkSize) {
    throw new Error("overlap must be an integer between zero and chunkSize - 1.");
  }

  const cleaned = cleanExtractedText(text);
  if (!cleaned) return [];

  const units = splitIntoMeaningfulUnits(cleaned);
  const chunks: TextChunk[] = [];
  let current = "";

  for (const unit of units) {
    if (!current) {
      current = unit;
      continue;
    }

    const candidate = `${current} ${unit}`;
    if (candidate.length <= chunkSize) {
      current = candidate;
      continue;
    }

    chunks.push({ content: current.trim(), chunkIndex: chunks.length });
    const carried = takeOverlap(current, overlap);
    current = carried ? `${carried} ${unit}`.trim() : unit;

    if (current.length > chunkSize) {
      const pieces = splitLongUnit(current, chunkSize);
      current = pieces.pop() ?? "";
      for (const piece of pieces) {
        chunks.push({ content: piece, chunkIndex: chunks.length });
      }
    }
  }

  if (current.trim()) {
    chunks.push({ content: current.trim(), chunkIndex: chunks.length });
  }

  return chunks;
}

function splitIntoMeaningfulUnits(text: string): string[] {
  return text
    .split(/\n{2,}|(?<=[.!?؟])\s+(?=[\p{Lu}\p{L}\d])/u)
    .map((unit) => unit.trim())
    .filter(Boolean);
}

function splitLongUnit(text: string, chunkSize: number): string[] {
  const words = text.split(/\s+/);
  const pieces: string[] = [];
  let current = "";

  for (const word of words) {
    if (!current) {
      current = word;
    } else if (`${current} ${word}`.length <= chunkSize) {
      current += ` ${word}`;
    } else {
      pieces.push(current);
      current = word;
    }
  }
  if (current) pieces.push(current);
  return pieces;
}

function takeOverlap(text: string, overlap: number): string {
  if (!overlap) return "";
  const words = text.split(/\s+/);
  let result = "";
  for (let index = words.length - 1; index >= 0; index -= 1) {
    const candidate = result ? `${words[index]} ${result}` : words[index];
    if (candidate.length > overlap) break;
    result = candidate;
  }
  return result;
}
