import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { documents } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  try {
    const skills = await getDb()
      .select({
        id: documents.id,
        filename: documents.filename,
      })
      .from(documents)
      .where(eq(documents.processingStatus, "COMPLETED"))
      .orderBy(asc(documents.filename));

    return NextResponse.json(skills);
  } catch (error) {
    console.error("Document skill list API error:", error);
    return NextResponse.json({ error: "Unable to load available documents." }, { status: 500 });
  }
}
