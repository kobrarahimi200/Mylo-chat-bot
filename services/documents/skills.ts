export type DocumentSkill = {
  id: string;
  filename: string;
};

export async function fetchDocumentSkills(): Promise<DocumentSkill[]> {
  const response = await fetch("/api/documents/skills", { cache: "no-store" });
  const result: unknown = await response.json();

  if (!response.ok) {
    const message =
      result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : "Unable to load available documents.";
    throw new Error(message);
  }

  if (
    !Array.isArray(result) ||
    !result.every((skill) =>
      skill &&
      typeof skill === "object" &&
      "id" in skill &&
      typeof skill.id === "string" &&
      "filename" in skill &&
      typeof skill.filename === "string"
    )
  ) {
    throw new Error("The available document list has an invalid response.");
  }

  return result as DocumentSkill[];
}
