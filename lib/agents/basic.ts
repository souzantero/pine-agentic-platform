import type { AgentDefinition, BasicAgentConfig } from "./types";

export const basicAgent: AgentDefinition = {
  id: "basic",
  name: "Assistente",
  description: "Agente básico configurável com modelo, prompt e temperatura",
  icon: "Bot",
  configSchema: [
    {
      key: "provider",
      type: "provider",
      label: "Provedor",
      description: "Provedor de IA a ser utilizado",
      required: true,
    },
    {
      key: "model",
      type: "model",
      label: "Modelo",
      description: "Modelo de linguagem a ser utilizado",
      required: true,
    },
    {
      key: "systemPromptId",
      type: "prompt",
      label: "System Prompt",
      description: "Define o comportamento e contexto inicial do assistente",
      required: false,
    },
    {
      key: "temperature",
      type: "temperature",
      label: "Temperatura",
      description: "Valores baixos = respostas mais focadas. Valores altos = mais criatividade.",
      required: false,
      min: 0,
      max: 2,
      step: 0.1,
    },
  ],
  defaultConfig: {
    provider: null,
    model: "",
    systemPromptId: null,
    temperature: 0.1,
  } as BasicAgentConfig,
};
