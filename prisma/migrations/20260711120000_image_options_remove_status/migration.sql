-- Rename Image metadata field to match current model usage
ALTER TABLE "Image" RENAME COLUMN "variants" TO "options";

-- Remove obsolete generation status data
DROP INDEX IF EXISTS "Image_status_idx";
ALTER TABLE "Image" DROP COLUMN "status";
DROP TYPE "ImageStatus";
