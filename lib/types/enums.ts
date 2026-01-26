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
  | "PLATFORM_MANAGE";

// Escopo de roles
export type RoleScope = "PLATFORM" | "ORGANIZATION";

// Tipos de provedores
export type ProviderType = "LLM" | "WEB_SEARCH" | "STORAGE" | "EMBEDDING";

// Provedores disponíveis
export type Provider =
  | "OPENAI"
  | "OPENROUTER"
  | "ANTHROPIC"
  | "GOOGLE"
  | "TAVILY"
  | "AWS_S3";

// Informações de UI dos provedores
export interface ProviderInfo {
  value: Provider;
  label: string;
  placeholder: string;
}

// Informações de UI dos tipos de provedores
export interface ProviderTypeInfo {
  value: ProviderType;
  label: string;
  description: string;
  providers: ProviderInfo[];
}

// Constante com lista de tipos e seus provedores
export const PROVIDER_TYPES: ProviderTypeInfo[] = [
  {
    value: "LLM",
    label: "Modelos de IA",
    description: "Provedores de modelos de linguagem para o chat",
    providers: [
      { value: "OPENAI", label: "OpenAI", placeholder: "sk-..." },
      { value: "OPENROUTER", label: "OpenRouter", placeholder: "sk-or-..." },
    ],
  },
  {
    value: "WEB_SEARCH",
    label: "Busca na Web",
    description: "Provedores de busca na web para o agente",
    providers: [
      { value: "TAVILY", label: "Tavily", placeholder: "tvly-..." },
    ],
  },
  {
    value: "STORAGE",
    label: "Armazenamento",
    description: "Provedores de armazenamento de arquivos",
    providers: [
      { value: "AWS_S3", label: "Amazon S3", placeholder: "Secret Access Key" },
    ],
  },
  {
    value: "EMBEDDING",
    label: "Embeddings",
    description: "Provedores de vetorização de texto",
    providers: [
      { value: "OPENAI", label: "OpenAI Embeddings", placeholder: "sk-..." },
    ],
  },
];

// Helper para obter provedores de um tipo específico
export function getProvidersForType(type: ProviderType): ProviderInfo[] {
  const providerType = PROVIDER_TYPES.find((pt) => pt.value === type);
  return providerType?.providers || [];
}

// Tipos de configuração da organização
export type ConfigType = "TOOL" | "FEATURE";

// Chaves de configuração
export type ConfigKey = "WEB_SEARCH" | "WEB_FETCH" | "STORAGE";

// Informações de UI das ferramentas
export interface ToolInfo {
  key: ConfigKey;
  label: string;
  description: string;
  providers: Provider[]; // Provedores compatíveis com esta ferramenta
}

// Constante com lista de ferramentas disponíveis
export const TOOLS: ToolInfo[] = [
  {
    key: "WEB_SEARCH",
    label: "Busca na Web",
    description: "Permite ao agente buscar informações na internet",
    providers: ["TAVILY"],
  },
  {
    key: "WEB_FETCH",
    label: "Leitura de URLs",
    description: "Permite ao agente ler e extrair conteúdo de links compartilhados",
    providers: ["TAVILY"],
  },
];

// Helper para obter informações de uma ferramenta
export function getToolInfo(key: ConfigKey): ToolInfo | undefined {
  return TOOLS.find((t) => t.key === key);
}
