-- Atualizar os dados existentes para usar os novos valores
UPDATE "role_permissions" SET permission = 'THREADS_READ' WHERE permission = 'CONVERSATIONS_READ';
UPDATE "role_permissions" SET permission = 'THREADS_WRITE' WHERE permission = 'CONVERSATIONS_WRITE';
UPDATE "role_permissions" SET permission = 'THREADS_DELETE' WHERE permission = 'CONVERSATIONS_DELETE';

-- Recriar o enum sem os valores antigos
ALTER TYPE "Permission" RENAME TO "Permission_old";

CREATE TYPE "Permission" AS ENUM (
  'THREADS_READ',
  'THREADS_WRITE',
  'THREADS_DELETE',
  'AGENTS_READ',
  'AGENTS_WRITE',
  'AGENTS_DELETE',
  'MEMBERS_READ',
  'MEMBERS_INVITE',
  'MEMBERS_MANAGE',
  'ROLES_READ',
  'ROLES_MANAGE',
  'ORGANIZATION_MANAGE',
  'PLATFORM_MANAGE'
);

-- Alterar a coluna para usar o novo enum
ALTER TABLE "role_permissions"
  ALTER COLUMN "permission" TYPE "Permission"
  USING ("permission"::text::"Permission");

-- Remover o enum antigo
DROP TYPE "Permission_old";
