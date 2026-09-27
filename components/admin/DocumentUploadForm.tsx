import { useState } from "react";

type DocumentUploadFormProps = {
  onUpload: (
    file: File,
    chunkCount: number,
  ) => Promise<void>;
  isUploading: boolean;
  error: string | null;
};

export function DocumentUploadForm({ onUpload, isUploading, error }: DocumentUploadFormProps) {
  const [chunkCount, setChunkCount] = useState("5");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedFile) {
      setLocalError("Please choose a PDF file before uploading.");
      return;
    }

    const parsedChunkCount = Number(chunkCount);
    if (!Number.isInteger(parsedChunkCount) || parsedChunkCount < 1 || parsedChunkCount > 1000) {
      setLocalError("Number of chunks must be an integer between 1 and 1000.");
      return;
    }

    setLocalError(null);
    await onUpload(selectedFile, parsedChunkCount);
  };

  const fileName = selectedFile ? selectedFile.name : "Choose PDF";

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Upload</p>
        <h2 className="mt-2 text-2xl font-semibold text-slate-900">Add knowledge source</h2>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="chunk-count" className="mb-2 block text-sm font-medium text-slate-700">
            Number of chunks
          </label>
          <input
            id="chunk-count"
            type="number"
            min="1"
            max="1000"
            step="1"
            value={chunkCount}
            onChange={(event) => setChunkCount(event.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-slate-900 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
            disabled={isUploading}
          />
          <p className="mt-1 text-xs text-slate-500">The processor will target this many chunks for the PDF.</p>
        </div>

        <div>
          <label htmlFor="pdf-upload" className="mb-2 block text-sm font-medium text-slate-700">
            Choose PDF
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3">
            <input
              id="pdf-upload"
              type="file"
              accept="application/pdf"
              onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              className="hidden"
              disabled={isUploading}
            />
            <label
              htmlFor="pdf-upload"
              className="inline-flex cursor-pointer items-center rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Browse
            </label>
            <span className="truncate text-sm text-slate-600">{fileName}</span>
          </div>
        </div>

        {(error || localError) && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error ?? localError}
          </div>
        )}

        <button
          type="submit"
          disabled={isUploading || !selectedFile}
          className="inline-flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:bg-violet-300"
        >
          {isUploading ? "Uploading…" : "Upload & Process"}
        </button>
      </form>
    </section>
  );
}
