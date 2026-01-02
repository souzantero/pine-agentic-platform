/*
  Warnings:

  - You are about to drop the column `default_llm_provider` on the `organizations` table. All the data in the column will be lost.
  - You are about to drop the `organization_llm_providers` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "ModelProvider" AS ENUM ('OPENAI', 'OPENROUTER', 'ANTHROPIC', 'GOOGLE');

-- DropForeignKey
ALTER TABLE "organization_llm_providers" DROP CONSTRAINT "organization_llm_providers_organization_id_fkey";

-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "default_llm_provider",
ADD COLUMN     "default_model_provider" "ModelProvider";

-- DropTable
DROP TABLE "organization_llm_providers";

-- DropEnum
DROP TYPE "LLMProvider";

-- CreateTable
CREATE TABLE "organization_model_providers" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "provider" "ModelProvider" NOT NULL,
    "api_key" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organization_model_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organization_model_providers_organization_id_provider_key" ON "organization_model_providers"("organization_id", "provider");

-- AddForeignKey
ALTER TABLE "organization_model_providers" ADD CONSTRAINT "organization_model_providers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
