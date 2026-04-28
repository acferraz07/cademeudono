-- Fix: corrigir smart_tags_new para compatibilidade com o Prisma schema
-- 1. Adicionar updated_at (exigido por @updatedAt no schema Prisma)
ALTER TABLE "smart_tags_new" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- 2. Converter status de text para tag_status enum (Prisma gera comparações tipadas)
ALTER TABLE "smart_tags_new" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "smart_tags_new" ALTER COLUMN "status" TYPE tag_status USING "status"::tag_status;
ALTER TABLE "smart_tags_new" ALTER COLUMN "status" SET DEFAULT 'AVAILABLE'::tag_status;
