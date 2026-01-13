// DTOs de entrada para operações de criação e atualização

// ============================================
// Prompts
// ============================================

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

// ============================================
// Organization
// ============================================

export interface CreateOrganizationData {
  name: string;
  slug: string;
}

export interface UpdateOrganizationData {
  name: string;
  slug: string;
}
