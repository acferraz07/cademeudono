-- CreateEnum
CREATE TYPE "role" AS ENUM ('USER', 'ADMIN', 'PARTNER');

-- CreateEnum
CREATE TYPE "species" AS ENUM ('DOG', 'CAT', 'OTHER');

-- CreateEnum
CREATE TYPE "pet_size" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'GIANT');

-- CreateEnum
CREATE TYPE "pet_sex" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "announcement_type" AS ENUM ('LOST', 'FOUND');

-- CreateEnum
CREATE TYPE "announcement_status" AS ENUM ('ACTIVE', 'RESOLVED', 'RETURNED_TO_OWNER', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "tag_status" AS ENUM ('AVAILABLE', 'SOLD', 'ACTIVATION_PENDING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "gps_device_status" AS ENUM ('AVAILABLE', 'SOLD', 'ACTIVATION_PENDING', 'ACTIVE', 'INACTIVE');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone_primary" TEXT,
    "phone_secondary" TEXT,
    "avatar_url" TEXT,
    "city" TEXT,
    "state" TEXT,
    "address" TEXT,
    "neighborhood" TEXT,
    "postal_code" TEXT,
    "role" "role" NOT NULL DEFAULT 'USER',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pets" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "species" "species" NOT NULL,
    "breed" TEXT,
    "birth_date" DATE,
    "age_estimate" TEXT,
    "sex" "pet_sex",
    "size" "pet_size",
    "weight_kg" DECIMAL(5,2),
    "coat_color" TEXT[],
    "eye_color" TEXT,
    "coat_type" TEXT,
    "specific_marks" TEXT,
    "is_castrated" BOOLEAN,
    "microchip_number" TEXT,
    "pedigree_number" TEXT,
    "kennel_name" TEXT,
    "profile_photo_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_health" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "vaccination_status" TEXT,
    "last_vaccination_date" DATE,
    "deworming_status" TEXT,
    "last_deworming_date" DATE,
    "preexisting_conditions" TEXT[],
    "continuous_medications" TEXT,
    "allergies" TEXT,
    "special_care" TEXT,
    "vet_name" TEXT,
    "vet_phone" TEXT,
    "vet_clinic" TEXT,
    "blood_type" TEXT,
    "general_observations" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pet_health_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pet_media" (
    "id" UUID NOT NULL,
    "pet_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'photo',
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pet_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "pet_id" UUID,
    "type" "announcement_type" NOT NULL,
    "status" "announcement_status" NOT NULL DEFAULT 'ACTIVE',
    "pet_name" TEXT,
    "species" "species" NOT NULL,
    "breed" TEXT,
    "size" "pet_size",
    "coat_color" TEXT[],
    "eye_color" TEXT,
    "specific_marks" TEXT,
    "pet_photo_url" TEXT,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "block" TEXT,
    "street" TEXT,
    "location_notes" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "event_date" DATE NOT NULL,
    "contact_phone" TEXT NOT NULL,
    "contact_name" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "views_count" INTEGER NOT NULL DEFAULT 0,
    "matched_with_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_images" (
    "id" UUID NOT NULL,
    "announcement_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcement_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "smart_tags" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "status" "tag_status" NOT NULL DEFAULT 'AVAILABLE',
    "pet_id" UUID,
    "owner_id" UUID,
    "batch_number" TEXT,
    "activated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "smart_tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tag_scan_logs" (
    "id" UUID NOT NULL,
    "tag_code" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tag_scan_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_devices" (
    "id" UUID NOT NULL,
    "device_code" TEXT NOT NULL,
    "serial_number" TEXT,
    "firmware_version" TEXT,
    "status" "gps_device_status" NOT NULL DEFAULT 'AVAILABLE',
    "pet_id" UUID,
    "owner_id" UUID,
    "battery_level" INTEGER,
    "signal_strength" INTEGER,
    "last_seen_at" TIMESTAMP(3),
    "activated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gps_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gps_locations" (
    "id" BIGSERIAL NOT NULL,
    "device_id" UUID NOT NULL,
    "pet_id" UUID,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION,
    "altitude" DOUBLE PRECISION,
    "speed" DOUBLE PRECISION,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gps_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "pet_health_pet_id_key" ON "pet_health"("pet_id");

-- CreateIndex
CREATE INDEX "announcements_status_type_idx" ON "announcements"("status", "type");

-- CreateIndex
CREATE INDEX "announcements_city_state_idx" ON "announcements"("city", "state");

-- CreateIndex
CREATE INDEX "announcements_species_size_idx" ON "announcements"("species", "size");

-- CreateIndex
CREATE UNIQUE INDEX "smart_tags_code_key" ON "smart_tags"("code");

-- CreateIndex
CREATE INDEX "smart_tags_pet_id_idx" ON "smart_tags"("pet_id");

-- CreateIndex
CREATE INDEX "tag_scan_logs_tag_code_scanned_at_idx" ON "tag_scan_logs"("tag_code", "scanned_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "gps_devices_device_code_key" ON "gps_devices"("device_code");

-- CreateIndex
CREATE INDEX "gps_locations_device_id_recorded_at_idx" ON "gps_locations"("device_id", "recorded_at" DESC);

-- AddForeignKey
ALTER TABLE "pets" ADD CONSTRAINT "pets_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_health" ADD CONSTRAINT "pet_health_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pet_media" ADD CONSTRAINT "pet_media_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_images" ADD CONSTRAINT "announcement_images_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "smart_tags" ADD CONSTRAINT "smart_tags_pet_id_fkey" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tag_scan_logs" ADD CONSTRAINT "tag_scan_logs_tag_code_fkey" FOREIGN KEY ("tag_code") REFERENCES "smart_tags"("code") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gps_locations" ADD CONSTRAINT "gps_locations_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "gps_devices"("id") ON DELETE CASCADE ON UPDATE CASCADE;
