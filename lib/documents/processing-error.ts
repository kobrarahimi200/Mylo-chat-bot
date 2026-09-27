export class DocumentProcessingError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "INVALID_PDF"
      | "EMPTY_PDF"
      | "EXTRACTION_FAILED"
      | "EMBEDDING_FAILED"
      | "DATABASE_FAILED",
    public readonly documentId?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = "DocumentProcessingError";
  }
}
