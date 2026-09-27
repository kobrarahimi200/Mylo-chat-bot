import { StatusBadge } from "@/components/admin/StatusBadge";
import type { AdminDocumentSummary } from "@/services/admin/documents";

type DocumentTableProps = {
  documents: AdminDocumentSummary[];
  onDelete: (id: string) => void;
  deletingId: string | null;
  isRefreshing: boolean;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function DocumentTable({ documents, onDelete, deletingId, isRefreshing }: DocumentTableProps) {
  if (documents.length === 0) {
    return (
      <section className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center shadow-sm">
        <p className="text-lg font-semibold text-slate-700">No documents uploaded yet</p>
        <p className="mt-2 text-sm text-slate-500">Upload a PDF to begin training the knowledge base.</p>
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Uploaded documents</h2>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          {isRefreshing && <span className="inline-flex items-center gap-2"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" /> Refreshing</span>}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm text-slate-700">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="px-5 py-3 font-semibold">Filename</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Chunks</th>
              <th className="px-5 py-3 font-semibold">Created</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id} className="border-t border-slate-200 align-top">
                <td className="px-5 py-4">
                  <div className="font-medium text-slate-900">{document.filename}</div>
                  {document.errorMessage && (
                    <div className="mt-1 max-w-xs text-xs text-red-600">{document.errorMessage}</div>
                  )}
                </td>
                <td className="px-5 py-4"><StatusBadge status={document.processingStatus} /></td>
                <td className="px-5 py-4">{document.chunkCount}</td>
                <td className="px-5 py-4">{formatDate(document.createdAt)}</td>
                <td className="px-5 py-4">
                  <button
                    type="button"
                    onClick={() => onDelete(document.id)}
                    disabled={deletingId === document.id}
                    className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingId === document.id ? "Deleting…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
