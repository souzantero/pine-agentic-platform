// Tipos de campos de configuração suportados
export type AgentConfigFieldType =
  | "provider"
  | "model"
  | "prompt"
  | "temperature"
  | "text"
  | "number"
  | "select";

// Definição de um campo de configuração do agente
export interface AgentConfigField {
  key: string;
  type: AgentConfigFieldType;
  label: string;
  description?: string;
  required?: boolean;
  // Para tipo 'select'
  options?: { value: string; label: string }[];
  // Para tipo 'number'
  min?: number;
  max?: number;
  step?: number;
}

// Configuração do agente básico
export interface BasicAgentConfig {
  provider: string | null;
  model: string;
  systemPromptId: string | null;
  temperature: number;
}

// Configuração genérica de agente (union de todos os tipos)
export type AgentConfig = BasicAgentConfig | Record<string, unknown>;

// Definição de um agente
export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  icon: string; // Nome do ícone Lucide
  configSchema: AgentConfigField[];
  defaultConfig: AgentConfig;
}

// Agente com configuração atual
export interface AgentInstance {
  agentId: string;
  config: AgentConfig;
}
