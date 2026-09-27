import type { AdminDocumentStatus } from "@/services/admin/documents";

const STATUS_STYLES: Record<AdminDocumentStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-amber-100 text-amber-700 ring-amber-200" },
  PROCESSING: { label: "Processing", className: "bg-sky-100 text-sky-700 ring-sky-200" },
  COMPLETED: { label: "Completed", className: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  FAILED: { label: "Failed", className: "bg-red-100 text-red-700 ring-red-200" },
};

export function StatusBadge({ status }: { status: AdminDocumentStatus }) {
  const style = STATUS_STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.className}`}>
      {style.label}
    </span>
  );
}
