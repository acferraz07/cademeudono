-- AlterTable
ALTER TABLE "adoptions" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "breeds" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "device_batches" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "devices" ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "updated_at" DROP DEFAULT;

-- AlterTable
ALTER TABLE "otp_verifications" ALTER COLUMN "id" DROP DEFAULT;
