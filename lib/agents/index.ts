import type { AgentDefinition, AgentConfig } from "./types";
import { basicAgent } from "./basic";

// Registry de agentes disponíveis
const agentRegistry = new Map<string, AgentDefinition>();

// Registrar agentes
agentRegistry.set(basicAgent.id, basicAgent);

// Funções de acesso ao registry
export function getAgent(id: string): AgentDefinition | undefined {
  return agentRegistry.get(id);
}

export function getAllAgents(): AgentDefinition[] {
  return Array.from(agentRegistry.values());
}

export function getDefaultAgent(): AgentDefinition {
  return basicAgent;
}

export function getDefaultAgentId(): string {
  return basicAgent.id;
}

export function getDefaultConfig(agentId: string): AgentConfig {
  const agent = getAgent(agentId);
  return agent?.defaultConfig ?? basicAgent.defaultConfig;
}

// Re-exportar tipos
export type { AgentDefinition, AgentConfig, AgentConfigField, AgentConfigFieldType } from "./types";
export type { BasicAgentConfig } from "./types";
