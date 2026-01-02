-- CreateEnum
CREATE TYPE "LLMProvider" AS ENUM ('OPENAI', 'OPENROUTER', 'ANTHROPIC', 'GOOGLE');

-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "default_llm_provider" "LLMProvider";

-- CreateTable
CREATE TABLE "organization_llm_providers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider" "LLMProvider" NOT NULL,
    "api_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_llm_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_llm_providers_organization_id_provider_key" ON "organization_llm_providers"("organization_id", "provider");

-- AddForeignKey
ALTER TABLE "organization_llm_providers" ADD CONSTRAINT "organization_llm_providers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
