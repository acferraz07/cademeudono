-- AlterTable
ALTER TABLE "pet_health" ADD COLUMN     "pet_shop" TEXT;

-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "behavior" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "is_lost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_urgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "last_seen_at" TIMESTAMP(3),
ADD COLUMN     "last_seen_location" TEXT,
ADD COLUMN     "lost_notes" TEXT,
ADD COLUMN     "secret_mark" TEXT;
