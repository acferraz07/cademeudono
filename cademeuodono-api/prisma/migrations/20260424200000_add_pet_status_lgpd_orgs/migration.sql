-- Adiciona campos de status no pet
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "is_found" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "is_returned" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "pets" ADD COLUMN IF NOT EXISTS "is_urgent_foster" BOOLEAN NOT NULL DEFAULT false;

-- Adiciona LGPD no usuário
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "lgpd_accepted_at" TIMESTAMP(3);

-- Cria tabela de ONGs e Protetores
CREATE TABLE IF NOT EXISTS "org_protectors" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cnpj" TEXT,
    "description" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "state" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "neighborhood" TEXT,
    "address" TEXT,
    "donation_info" TEXT,
    "pix_key" TEXT,
    "logo_url" TEXT,
    "cover_url" TEXT,
    "acting_species" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "acting_cities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "org_protectors_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "org_protectors_user_id_key" ON "org_protectors"("user_id");
CREATE INDEX IF NOT EXISTS "org_protectors_state_city_idx" ON "org_protectors"("state", "city");

ALTER TABLE "org_protectors" ADD CONSTRAINT "org_protectors_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
