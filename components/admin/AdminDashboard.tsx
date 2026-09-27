"use client";

import { useCallback, useEffect, useState } from "react";
import { DocumentTable } from "@/components/admin/DocumentTable";
import { DocumentUploadForm } from "@/components/admin/DocumentUploadForm";
import { deleteAdminDocument, fetchAdminDocuments, uploadAdminDocument, type AdminDocumentSummary } from "@/services/admin/documents";

export function AdminDashboard() {
  const [documents, setDocuments] = useState<AdminDocumentSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const refreshDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const list = await fetchAdminDocuments();
      setDocuments(list);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refreshDocuments();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [refreshDocuments]);

  useEffect(() => {
    const hasActiveProcessing = documents.some((document) => document.processingStatus === "PENDING" || document.processingStatus === "PROCESSING");
    if (!hasActiveProcessing) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void refreshDocuments();
    }, 4000);

    return () => window.clearInterval(timer);
  }, [documents, refreshDocuments]);

  const handleUpload = async (file: File, chunkCount: number) => {
    setUploading(true);
    setUploadError(null);

    try {
      const uploadedDocument = await uploadAdminDocument(file, chunkCount);
      setDocuments((current) => [uploadedDocument, ...current]);
      await refreshDocuments();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to upload the document.");
      // Processing failures persist a FAILED record; reload so its status and details are visible.
      await refreshDocuments();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const target = documents.find((document) => document.id === id);
    const confirmed = window.confirm(`Delete "${target?.filename ?? "this document"}"? This action cannot be undone.`);
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteAdminDocument(id);
      setDocuments((current) => current.filter((document) => document.id !== id));
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Unable to delete the document.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f4] px-4 py-10 text-slate-900 md:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-violet-600">Admin panel</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Knowledge base dashboard</h1>
          </div>

          <button
            type="button"
            onClick={() => void refreshDocuments()}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-violet-300 hover:text-violet-700"
          >
            {loading ? "Refreshing…" : "Refresh list"}
          </button>
        </header>

        <div className="grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <DocumentUploadForm onUpload={handleUpload} isUploading={uploading} error={uploadError} />
          <div className="space-y-4">
            <DocumentTable documents={documents} onDelete={handleDelete} deletingId={deletingId} isRefreshing={loading} />
          </div>
        </div>
      </div>
    </main>
  );
}
