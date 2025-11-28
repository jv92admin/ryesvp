-- AlterTable (LLM enrichment fields)
ALTER TABLE "Enrichment" ADD COLUMN "llmCategory" "EventCategory";
ALTER TABLE "Enrichment" ADD COLUMN "llmConfidence" TEXT;
ALTER TABLE "Enrichment" ADD COLUMN "llmDescription" TEXT;
ALTER TABLE "Enrichment" ADD COLUMN "llmPerformer" TEXT;

