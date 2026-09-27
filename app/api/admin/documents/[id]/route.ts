import { NextResponse } from "next/server";
import { deleteAdminDocument, getAdminDocumentById, AdminDocumentError } from "@/lib/admin/documents";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const document = await getAdminDocumentById(id);
    return NextResponse.json(document, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load the document.";
    const status = error instanceof AdminDocumentError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await deleteAdminDocument(id);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete the document.";
    const status = error instanceof AdminDocumentError ? error.statusCode : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
