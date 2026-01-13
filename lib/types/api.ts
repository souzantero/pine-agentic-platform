// Tipos de resposta da API (espelham o formato do backend)

import type { ModelProviderType } from "./enums";
import type { ModelOption } from "./entities";

// ============================================
// Threads
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

// ============================================
// Prompts
// ============================================

export interface ApiPrompt {
  id: string;
  name: string;
  content: string;
  role: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
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
// Model Providers
// ============================================

export interface ApiModelProvider {
  id: string;
  provider: ModelProviderType;
  isActive: boolean;
}

export interface ApiModelProvidersResponse {
  providers: ApiModelProvider[];
  defaultProvider: ModelProviderType | null;
}

// ============================================
// Models
// ============================================

export interface ApiModelsResponse {
  models: ModelOption[];
  selectedProvider: string | null;
  configuredProviders: string[];
}
