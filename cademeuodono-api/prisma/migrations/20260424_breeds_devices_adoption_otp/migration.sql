-- ─────────────────────────────────────────────────────────────
-- Novos enums
-- ─────────────────────────────────────────────────────────────

CREATE TYPE "device_type" AS ENUM ('SMART_TAG', 'GPS_TRACKER');
CREATE TYPE "device_status" AS ENUM ('AVAILABLE', 'SOLD', 'ACTIVATED', 'LOST', 'DISABLED');
CREATE TYPE "adoption_status" AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED');

-- ─────────────────────────────────────────────────────────────
-- Atualizar tabela users
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "whatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3);

-- Preencher updated_at para registros existentes
UPDATE "users" SET "updated_at" = "created_at" WHERE "updated_at" IS NULL;

-- ─────────────────────────────────────────────────────────────
-- Tabela de raças
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "breeds" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "species" "species" NOT NULL,
    "size" "pet_size",
    "group" TEXT,
    "is_mixed" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "breeds_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "breeds_name_species_key" ON "breeds"("name", "species");
CREATE INDEX "breeds_species_idx" ON "breeds"("species");

-- ─────────────────────────────────────────────────────────────
-- Atualizar tabela pets (breed estruturado)
-- ─────────────────────────────────────────────────────────────

ALTER TABLE "pets"
  ADD COLUMN IF NOT EXISTS "breed_id" UUID,
  ADD COLUMN IF NOT EXISTS "breed_name" TEXT;

CREATE INDEX IF NOT EXISTS "pets_breed_id_idx" ON "pets"("breed_id");
CREATE INDEX IF NOT EXISTS "pets_species_size_idx" ON "pets"("species", "size");

ALTER TABLE "pets"
  ADD CONSTRAINT "pets_breed_id_fkey"
  FOREIGN KEY ("breed_id") REFERENCES "breeds"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- Sistema profissional de dispositivos
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "device_batches" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "type" "device_type" NOT NULL,
    "batch_code" TEXT NOT NULL,
    "total_quantity" INTEGER NOT NULL,
    "generated_by" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_batches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "device_batches_batch_code_key" ON "device_batches"("batch_code");
CREATE INDEX "device_batches_type_idx" ON "device_batches"("type");

CREATE TABLE "devices" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" TEXT NOT NULL,
    "type" "device_type" NOT NULL,
    "batch_id" UUID NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "security_suffix" TEXT NOT NULL,
    "status" "device_status" NOT NULL DEFAULT 'AVAILABLE',
    "pet_id" UUID,
    "user_id" UUID,
    "activated_at" TIMESTAMP(3),
    "imei" TEXT,
    "sim_number" TEXT,
    "last_latitude" DOUBLE PRECISION,
    "last_longitude" DOUBLE PRECISION,
    "battery_level" INTEGER,
    "tracking_active" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "devices_code_key" ON "devices"("code");
CREATE INDEX "devices_code_idx" ON "devices"("code");
CREATE INDEX "devices_batch_id_idx" ON "devices"("batch_id");
CREATE INDEX "devices_pet_id_idx" ON "devices"("pet_id");

ALTER TABLE "devices"
  ADD CONSTRAINT "devices_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "device_batches"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "devices"
  ADD CONSTRAINT "devices_pet_id_fkey"
  FOREIGN KEY ("pet_id") REFERENCES "pets"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- Adoção com respaldo jurídico
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "adoptions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "cpf_hash" TEXT NOT NULL,
    "cpf_masked" TEXT NOT NULL,
    "status" "adoption_status" NOT NULL DEFAULT 'PENDING',
    "ip_address" TEXT,
    "pdf_url" TEXT,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "adoptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "adoptions_user_id_idx" ON "adoptions"("user_id");
CREATE INDEX "adoptions_pet_id_idx" ON "adoptions"("pet_id");

ALTER TABLE "adoptions"
  ADD CONSTRAINT "adoptions_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "adoptions"
  ADD CONSTRAINT "adoptions_pet_id_fkey"
  FOREIGN KEY ("pet_id") REFERENCES "pets"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ─────────────────────────────────────────────────────────────
-- OTP para login por telefone / WhatsApp
-- ─────────────────────────────────────────────────────────────

CREATE TABLE "otp_verifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "otp_verifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "otp_verifications_phone_expires_at_idx" ON "otp_verifications"("phone", "expires_at");
