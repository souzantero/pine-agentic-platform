// Entidades de domínio do frontend

import type { AgentConfig } from "@/lib/agents";
import type {
  Permission,
  RoleScope,
  PromptRole,
  ModelProviderType,
} from "./enums";

// ============================================
// Usuário e Sessão
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

// ============================================
// Organização
// ============================================

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

// ============================================
// Roles
// ============================================

export interface Role {
  id: string;
  name: string;
  description: string | null;
  isSystemRole: boolean;
}

export interface RoleWithPermissions extends Role {
  scope: RoleScope;
  permissions: Permission[];
}

// ============================================
// Membership
// ============================================

export interface Membership {
  id: string;
  isOwner: boolean;
  createdAt: string;
  organizationId: string;
  organization: Organization;
  role: RoleWithPermissions;
}

// ============================================
// Members
// ============================================

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

// ============================================
// Invites
// ============================================

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

// ============================================
// Threads e Mensagens
// ============================================

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

// ============================================
// Prompts
// ============================================

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

// ============================================
// Model Providers e Models
// ============================================

export interface ModelProviderConfig {
  id: string;
  provider: ModelProviderType;
  isActive: boolean;
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}
