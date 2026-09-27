import { NextResponse } from "next/server";
import { createAdminDocumentUpload, listAdminDocuments } from "@/lib/admin/documents";
import { AdminDocumentError } from "@/lib/admin/documents";

// No auth layer exists in this repository yet. If one is introduced later, wrap these admin routes in the existing admin-only middleware.
export async function GET() {
  try {
    const documents = await listAdminDocuments();
    return NextResponse.json(documents, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load documents.";
    const status = error instanceof AdminDocumentError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const document = await createAdminDocumentUpload(formData);
    return NextResponse.json(document, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to upload the document.";
    const status = error instanceof AdminDocumentError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
