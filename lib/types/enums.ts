// Enums e constantes do sistema

// Permissões do sistema RBAC
export type Permission =
  | "THREADS_READ"
  | "THREADS_WRITE"
  | "THREADS_DELETE"
  | "AGENTS_READ"
  | "AGENTS_WRITE"
  | "AGENTS_DELETE"
  | "MEMBERS_READ"
  | "MEMBERS_INVITE"
  | "MEMBERS_MANAGE"
  | "ROLES_READ"
  | "ROLES_MANAGE"
  | "ORGANIZATION_MANAGE"
  | "PLATFORM_MANAGE"
  | "PROMPTS_READ"
  | "PROMPTS_WRITE"
  | "PROMPTS_DELETE";

// Escopo de roles
export type RoleScope = "PLATFORM" | "ORGANIZATION";

// Roles de prompts
export type PromptRole = "SYSTEM" | "USER" | "ASSISTANT";

// Provedores de modelos de IA
export type ModelProviderType = "OPENAI" | "OPENROUTER" | "ANTHROPIC" | "GOOGLE";

// Informações de UI dos provedores
export interface ModelProviderInfo {
  value: ModelProviderType;
  label: string;
  placeholder: string;
}

// Constante com lista de provedores disponíveis
export const MODEL_PROVIDERS: ModelProviderInfo[] = [
  { value: "OPENAI", label: "OpenAI", placeholder: "sk-..." },
  { value: "OPENROUTER", label: "OpenRouter", placeholder: "sk-or-..." },
  { value: "ANTHROPIC", label: "Anthropic", placeholder: "sk-ant-..." },
  { value: "GOOGLE", label: "Google AI", placeholder: "AIza..." },
];
