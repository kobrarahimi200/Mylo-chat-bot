ALTER TYPE "public"."document_category" RENAME TO "document_category_old";--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('BANKS', 'POWER_PLANTS', 'TV_NETWORKS');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "category" TYPE "public"."document_category"
  USING CASE "category"::text
    WHEN 'source_1' THEN 'BANKS'::"public"."document_category"
    WHEN 'source_2' THEN 'POWER_PLANTS'::"public"."document_category"
    WHEN 'source_3' THEN 'TV_NETWORKS'::"public"."document_category"
  END;--> statement-breakpoint
DROP TYPE "public"."document_category_old";--> statement-breakpoint
ALTER TYPE "public"."document_processing_status" RENAME TO "document_processing_status_old";--> statement-breakpoint
CREATE TYPE "public"."document_processing_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "processing_status" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "processing_status" TYPE "public"."document_processing_status"
  USING CASE "processing_status"::text
    WHEN 'pending' THEN 'PENDING'::"public"."document_processing_status"
    WHEN 'processing' THEN 'PROCESSING'::"public"."document_processing_status"
    WHEN 'ready' THEN 'COMPLETED'::"public"."document_processing_status"
    WHEN 'failed' THEN 'FAILED'::"public"."document_processing_status"
  END;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "processing_status" SET DEFAULT 'PENDING';--> statement-breakpoint
DROP TYPE "public"."document_processing_status_old";