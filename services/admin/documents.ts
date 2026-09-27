export type AdminDocumentStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export type AdminDocumentSummary = {
  id: string;
  filename: string;
  processingStatus: AdminDocumentStatus;
  createdAt: string | null;
  chunkCount: number;
  errorMessage: string | null;
};

export async function fetchAdminDocuments(): Promise<AdminDocumentSummary[]> {
  const response = await fetch("/api/admin/documents", { method: "GET", cache: "no-store" });
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(typeof payload.error === "string" ? payload.error : "Unable to load documents.");
  }

  return response.json() as Promise<AdminDocumentSummary[]>;
}

export async function uploadAdminDocument(file: File, chunkCount: number): Promise<AdminDocumentSummary> {
  const formData = new FormData();
  formData.set("file", file);
  formData.set("chunkCount", String(chunkCount));

  const response = await fetch("/api/admin/documents", {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "Unable to upload the document.");
  }

  return payload as AdminDocumentSummary;
}

export async function deleteAdminDocument(id: string): Promise<{ id: string; deleted: true }> {
  const response = await fetch(`/api/admin/documents/${id}`, { method: "DELETE" });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(typeof payload.error === "string" ? payload.error : "Unable to delete the document.");
  }

  return payload as { id: string; deleted: true };
}
