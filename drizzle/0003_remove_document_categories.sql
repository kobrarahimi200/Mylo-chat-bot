UPDATE "document_chunks"
SET "metadata" = "metadata" - 'category'
WHERE "metadata" ? 'category';--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN "category";--> statement-breakpoint
DROP TYPE "public"."document_category";
