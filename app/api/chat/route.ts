import { NextResponse } from "next/server";
import { MYLO_LANGUAGE_INSTRUCTIONS, MYLO_SYSTEM_PROMPT } from "@/config/mylo";
import type { Message } from "@/lib/types";

export const runtime = "nodejs";

function isMessage(value: unknown): value is Message {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Message>;
  return (
    (candidate.role === "user" || candidate.role === "assistant") &&
    typeof candidate.content === "string" &&
    candidate.content.trim().length > 0
  );
}

function isLanguage(value: unknown): value is keyof typeof MYLO_LANGUAGE_INSTRUCTIONS {
  return value === "en" || value === "fa";
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    const messages = body && typeof body === "object" && "messages" in body
      ? (body as { messages?: unknown }).messages
      : undefined;
    const language = body && typeof body === "object" && "language" in body
      ? (body as { language?: unknown }).language
      : "en";

    if (!Array.isArray(messages) || messages.length === 0 || !messages.every(isMessage)) {
      return NextResponse.json({ error: "Please provide a valid conversation." }, { status: 400 });
    }
    if (!isLanguage(language)) {
      return NextResponse.json({ error: "Please provide a supported language." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is missing. Add a valid key to .env.local and restart the dev server." },
        { status: 503 },
      );
    }

    const model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
    const requestBody = JSON.stringify({
      systemInstruction: {
        parts: [{ text: `${MYLO_SYSTEM_PROMPT}\n\nLanguage preference:\n${MYLO_LANGUAGE_INSTRUCTIONS[language]}` }],
      },
      contents: messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
    });
    let response: Response | undefined;
    let result: unknown;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: requestBody,
        },
      );
      result = await response.json();
      if (response.ok || ![429, 500, 502, 503, 504].includes(response.status) || attempt === 2) break;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** attempt));
    }

    if (!response || !response.ok) {
      const errorMessage =
        result &&
        typeof result === "object" &&
        "error" in result &&
        result.error &&
        typeof result.error === "object" &&
        "message" in result.error &&
        typeof result.error.message === "string"
          ? result.error.message
          : "Gemini API request failed.";
      const temporary = response && [429, 500, 502, 503, 504].includes(response.status);
      return NextResponse.json(
        {
          error: temporary
            ? "Mylo is temporarily busy. Please try again in a moment."
            : errorMessage,
        },
        { status: response?.status ?? 502 },
      );
    }

    const content = extractGeminiText(result);
    if (!content) {
      return NextResponse.json({ error: "The AI returned an empty response." }, { status: 502 });
    }

    return NextResponse.json({ message: { id: "server-response", role: "assistant", content, createdAt: Date.now() } satisfies Message });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Something went wrong while contacting Mylo." }, { status: 500 });
  }
}

function extractGeminiText(value: unknown): string | undefined {
  if (!value || typeof value !== "object" || !("candidates" in value)) {
    return undefined;
  }

  const candidates = value.candidates;
  if (!Array.isArray(candidates)) {
    return undefined;
  }

  const candidate = candidates[0];
  if (!candidate || typeof candidate !== "object" || !("content" in candidate)) {
    return undefined;
  }

  const content = candidate.content;
  if (!content || typeof content !== "object" || !("parts" in content) || !Array.isArray(content.parts)) {
    return undefined;
  }

  const text = content.parts
    .filter((part: unknown): part is { text: string } =>
        part !== null &&
        Boolean(part) &&
        typeof part === "object" &&
        "text" in part &&
        typeof part.text === "string",
    )
    .map((part: { text: string }) => part.text)
    .join("")
    .trim();

  return text || undefined;
}
