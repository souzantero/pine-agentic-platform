// Tipos centralizados para o frontend do PineChat
// Estes tipos são usados pelos hooks e componentes

import type { AgentConfig } from "@/lib/agents";

// ============================================
// Tipos de resposta da API (camelCase do backend)
// ============================================

export interface ApiThread {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  };
}

export interface ApiPrompt {
  id: string;
  name: string;
  content: string;
  role: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiMember {
  id: string;
  isOwner: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

export interface ApiInvite {
  id: string;
  token: string;
  inviteLink: string;
  expiresAt: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ApiRole {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}

export interface ApiOrganization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface ApiModelProvider {
  id: string;
  provider: ModelProviderType;
  isActive: boolean;
}

export interface ApiModelsResponse {
  models: ModelOption[];
  selectedProvider: string | null;
  configuredProviders: string[];
}

export interface ApiModelProvidersResponse {
  providers: ApiModelProvider[];
  defaultProvider: ModelProviderType | null;
}

// Resposta de convite público (estrutura completa da API)
export interface ApiPublicInvite {
  organization: {
    name: string;
    slug: string;
  };
  role: {
    name: string;
  };
  createdBy: {
    name: string;
  };
  expiresAt: string;
  isExpired: boolean;
  isUsed: boolean;
}

// ============================================
// Tipos do Frontend
// ============================================

// Threads e Mensagens
export interface Thread {
  id: string;
  title: string;
  updatedAt: Date;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ThreadWithMessages extends Thread {
  messages: Message[];
  agentId: string;
  agentConfig: AgentConfig;
}

// Prompts
export type PromptRole = "SYSTEM" | "USER" | "ASSISTANT";

export interface Prompt {
  id: string;
  name: string;
  content: string;
  role: PromptRole;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    user: {
      id: string;
      name: string;
    };
  };
}

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
}

export interface CreatePromptData {
  name: string;
  content: string;
  role: string;
}

export interface UpdatePromptData {
  name: string;
  content: string;
  role: string;
}

// Members
export interface Member {
  id: string;
  isOwner: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  role: {
    id: string;
    name: string;
    description: string | null;
  };
}

// Invites
export interface Invite {
  id: string;
  token: string;
  inviteLink: string;
  expiresAt: string;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PublicInviteInfo {
  organizationName: string;
  roleName: string;
  expiresAt: string;
  isValid: boolean;
}

// Roles
export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}

// Organization
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

export interface UpdateOrganizationData {
  name: string;
  slug: string;
}

export interface CreateOrganizationData {
  name: string;
  slug: string;
}

export interface CreateOrganizationResult extends MutationResult {
  organization?: Organization;
}

// Model Providers
export type ModelProviderType = "OPENAI" | "OPENROUTER" | "ANTHROPIC" | "GOOGLE";

export interface ModelProviderConfig {
  id: string;
  provider: ModelProviderType;
  isActive: boolean;
}

export interface ModelProviderInfo {
  value: ModelProviderType;
  label: string;
  placeholder: string;
}

export const MODEL_PROVIDERS: ModelProviderInfo[] = [
  { value: "OPENAI", label: "OpenAI", placeholder: "sk-..." },
  { value: "OPENROUTER", label: "OpenRouter", placeholder: "sk-or-..." },
  { value: "ANTHROPIC", label: "Anthropic", placeholder: "sk-ant-..." },
  { value: "GOOGLE", label: "Google AI", placeholder: "AIza..." },
];

// Models
export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

// ============================================
// Tipos de retorno dos Hooks
// ============================================

export interface MutationResult {
  error?: string;
}

export interface CreateInviteResult extends MutationResult {
  inviteLink?: string;
}
