// Tipos de resposta da API (espelham o formato do backend)

import type { Provider, ProviderType } from "./enums";
import type { ModelOption } from "./entities";

// ============================================
// Threads
// ============================================

export interface ApiThread {
  id: string;
  title: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
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

// ============================================
// Members
// ============================================

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

// ============================================
// Invites
// ============================================

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
// Roles
// ============================================

export interface ApiRole {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}

// ============================================
// Organization
// ============================================

export interface ApiOrganization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

// ============================================
// Providers
// ============================================

export interface ApiProvider {
  id: string;
  type: ProviderType;
  provider: Provider;
  isActive: boolean;
}

export interface ApiProvidersResponse {
  providers: ApiProvider[];
}

// ============================================
// Models
// ============================================

export interface ApiModelsResponse {
  models: ModelOption[];
  configuredProviders: string[];
}

// ============================================
// Organization Configs
// ============================================

export interface ApiOrgConfig {
  id: string;
  type: string;
  key: string;
  isEnabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiOrgConfigsResponse {
  configs: ApiOrgConfig[];
}

// ============================================
// Agent Run (Invoke/Stream)
// ============================================

export interface RunConfig {
  provider: string;
  model: string;
}

export interface InvokePayload {
  input: {
    messages: { content: string }[];
  };
  config: RunConfig;
}

export interface AgentMessage {
  id: string;
  type: "human" | "ai" | "tool";
  content: string;
  responseMetadata?: Record<string, unknown>;
  toolCalls?: unknown[];
  additionalKwargs?: Record<string, unknown>;
  createdAt?: string;
}

export interface InvokeResponse {
  messages: AgentMessage[];
}
