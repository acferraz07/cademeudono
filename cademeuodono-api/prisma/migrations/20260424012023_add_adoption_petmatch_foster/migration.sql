-- AlterTable
ALTER TABLE "pets" ADD COLUMN     "accepts_crossbreeding" BOOLEAN,
ADD COLUMN     "adopted_at" TIMESTAMP(3),
ADD COLUMN     "adoption_reason" TEXT,
ADD COLUMN     "adoption_requirements" TEXT,
ADD COLUMN     "adoption_story" TEXT,
ADD COLUMN     "adoption_urgency" TEXT NOT NULL DEFAULT 'normal',
ADD COLUMN     "is_adopted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_for_adoption" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_for_pet_match" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_in_foster_home" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "is_ong" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ong_name" TEXT,
ADD COLUMN     "pet_match_objective" TEXT,
ADD COLUMN     "pet_match_observations" TEXT,
ADD COLUMN     "pet_match_preferences" TEXT;

-- CreateTable
CREATE TABLE "foster_volunteers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "housing_type" TEXT NOT NULL,
    "has_other_pets" BOOLEAN NOT NULL,
    "accepts_dogs" BOOLEAN NOT NULL,
    "accepts_cats" BOOLEAN NOT NULL,
    "accepted_sizes" TEXT[],
    "max_pets" INTEGER NOT NULL DEFAULT 1,
    "availability" TEXT NOT NULL,
    "experience" TEXT,
    "observations" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "foster_volunteers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "foster_volunteers_user_id_key" ON "foster_volunteers"("user_id");

-- CreateIndex
CREATE INDEX "foster_volunteers_state_city_idx" ON "foster_volunteers"("state", "city");

-- AddForeignKey
ALTER TABLE "foster_volunteers" ADD CONSTRAINT "foster_volunteers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
