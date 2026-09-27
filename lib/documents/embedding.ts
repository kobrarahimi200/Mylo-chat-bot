const DEFAULT_EMBEDDING_MODEL = "gemini-embedding-001";

export type EmbedText = (content: string) => Promise<number[]>;

export function createGeminiEmbedder(): EmbedText {
  return async (content) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === "your_api_key_here") {
      throw new Error("GEMINI_API_KEY is missing.");
    }
    const model = process.env.GEMINI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:embedContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: { parts: [{ text: content }] } }),
      },
    );
    const result: unknown = await response.json();
    if (!response.ok) throw new Error(extractApiError(result) ?? "Gemini embedding request failed.");
    if (
      !result ||
      typeof result !== "object" ||
      !("embedding" in result) ||
      !result.embedding ||
      typeof result.embedding !== "object" ||
      !("values" in result.embedding) ||
      !Array.isArray(result.embedding.values)
    ) {
      throw new Error("Gemini returned an invalid embedding response.");
    }
    return result.embedding.values.filter((value): value is number => typeof value === "number");
  };
}

function extractApiError(value: unknown): string | undefined {
  if (
    !value ||
    typeof value !== "object" ||
    !("error" in value) ||
    !value.error ||
    typeof value.error !== "object" ||
    !("message" in value.error)
  ) {
    return undefined;
  }
  return typeof value.error.message === "string" ? value.error.message : undefined;
}
