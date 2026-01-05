"use client";

import { Settings, PanelRightClose, PanelRight, Bot, Database, Search, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getAgent } from "@/lib/agents";
import type { AgentConfigField } from "@/lib/agents";
import type { LucideIcon } from "lucide-react";

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
}

export interface ModelOption {
  id: string;
  name: string;
  description?: string;
}

export interface ProviderOption {
  value: string;
  label: string;
}

// Mapeamento de nomes de provedores para labels amigaveis
const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: "OpenAI",
  OPENROUTER: "OpenRouter",
  ANTHROPIC: "Anthropic",
  GOOGLE: "Google AI",
};

// Mapeamento de ícones
const iconMap: Record<string, LucideIcon> = {
  Bot: Bot,
  Database: Database,
  Search: Search,
  FileText: FileText,
};

interface SettingsContentProps {
  agentId: string;
  agentConfig: Record<string, unknown>;
  onConfigChange: (key: string, value: unknown) => void;
  availableModels: ModelOption[];
  systemPrompts: SystemPrompt[];
  selectedProvider: string | null;
  configuredProviders: string[];
  onProviderChange: (provider: string) => void;
}

// Componente para renderizar campo de provedor
function ProviderField({
  value,
  onChange,
  configuredProviders,
}: {
  value: string | null;
  onChange: (value: string) => void;
  configuredProviders: string[];
}) {
  if (configuredProviders.length === 0) return null;

  return (
    <>
      <div className="space-y-2">
        <label className="text-sm font-medium">Provedor</label>
        <Select value={value ?? ""} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um provedor" />
          </SelectTrigger>
          <SelectContent>
            {configuredProviders.map((provider) => (
              <SelectItem key={provider} value={provider}>
                {PROVIDER_LABELS[provider] || provider}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Separator />
    </>
  );
}

// Componente para renderizar campo de modelo
function ModelField({
  value,
  onChange,
  availableModels,
}: {
  value: string;
  onChange: (value: string) => void;
  availableModels: ModelOption[];
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Modelo</label>
      {availableModels.length > 0 ? (
        <Select value={value} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent>
            {availableModels.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                <div className="flex flex-col">
                  <span>{m.name}</span>
                  {m.description && (
                    <span className="text-xs text-muted-foreground">{m.description}</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <p className="text-sm text-muted-foreground py-2">
          Configure um provedor de IA nas configurações da organização
        </p>
      )}
    </div>
  );
}

// Componente para renderizar campo de prompt
function PromptField({
  value,
  onChange,
  systemPrompts,
  description,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  systemPrompts: SystemPrompt[];
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">System Prompt</label>
      <Select
        value={value ?? "none"}
        onValueChange={(v) => onChange(v === "none" ? null : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Selecione um prompt" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Nenhum</SelectItem>
          {systemPrompts.map((prompt) => (
            <SelectItem key={prompt.id} value={prompt.id}>
              {prompt.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

// Componente para renderizar campo de temperatura
function TemperatureField({
  value,
  onChange,
  field,
}: {
  value: number;
  onChange: (value: number) => void;
  field: AgentConfigField;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">{field.label}</label>
        <span className="text-sm text-muted-foreground">{value.toFixed(1)}</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={field.min ?? 0}
        max={field.max ?? 2}
        step={field.step ?? 0.1}
        className="w-full"
      />
      {field.description && (
        <p className="text-xs text-muted-foreground">{field.description}</p>
      )}
    </div>
  );
}

// Conteúdo compartilhado das configurações
function SettingsContent({
  agentId,
  agentConfig,
  onConfigChange,
  availableModels,
  systemPrompts,
  selectedProvider,
  configuredProviders,
  onProviderChange,
}: SettingsContentProps) {
  const agent = getAgent(agentId);
  const AgentIcon = agent ? iconMap[agent.icon] ?? Bot : Bot;

  if (!agent) {
    return (
      <div className="p-4">
        <p className="text-sm text-muted-foreground">Agente não encontrado</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header com info do agente */}
      <div className="flex items-center gap-2 text-sm">
        <AgentIcon className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{agent.name}</span>
      </div>
      <Separator />

      {/* Renderizar campos baseado no schema do agente */}
      {agent.configSchema.map((field, index) => {
        const isLast = index === agent.configSchema.length - 1;

        return (
          <div key={field.key}>
            {field.type === "provider" && (
              <ProviderField
                value={selectedProvider}
                onChange={onProviderChange}
                configuredProviders={configuredProviders}
              />
            )}

            {field.type === "model" && (
              <ModelField
                value={(agentConfig[field.key] as string) ?? ""}
                onChange={(value) => onConfigChange(field.key, value)}
                availableModels={availableModels}
              />
            )}

            {field.type === "prompt" && (
              <PromptField
                value={(agentConfig[field.key] as string | null) ?? null}
                onChange={(value) => onConfigChange(field.key, value)}
                systemPrompts={systemPrompts}
                description={field.description}
              />
            )}

            {field.type === "temperature" && (
              <TemperatureField
                value={(agentConfig[field.key] as number) ?? 0.7}
                onChange={(value) => onConfigChange(field.key, value)}
                field={field}
              />
            )}

            {!isLast && field.type !== "provider" && <Separator className="mt-4" />}
          </div>
        );
      })}
    </div>
  );
}

interface ChatSettingsProps extends SettingsContentProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

// Desktop Settings Panel
export function ChatSettings({
  agentId,
  agentConfig,
  onConfigChange,
  availableModels,
  systemPrompts,
  selectedProvider,
  configuredProviders,
  onProviderChange,
  expanded,
  onExpandedChange,
}: ChatSettingsProps) {
  return (
    <aside
      className={cn(
        "border-l bg-muted/20 flex flex-col h-full transition-all duration-300",
        expanded ? "w-64" : "w-12"
      )}
    >
      <div className={cn("p-2 border-b", expanded ? "flex justify-between items-center" : "flex justify-center")}>
        {expanded && (
          <div className="flex items-center gap-2 text-sm font-medium px-2">
            <Settings className="h-4 w-4" />
            <span>Configurações</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onExpandedChange(!expanded)}
          title={expanded ? "Esconder painel" : "Mostrar configurações"}
        >
          {expanded ? (
            <PanelRightClose className="h-5 w-5" />
          ) : (
            <PanelRight className="h-5 w-5" />
          )}
        </Button>
      </div>

      {expanded && (
        <div className="flex-1 overflow-y-auto">
          <SettingsContent
            agentId={agentId}
            agentConfig={agentConfig}
            onConfigChange={onConfigChange}
            availableModels={availableModels}
            systemPrompts={systemPrompts}
            selectedProvider={selectedProvider}
            configuredProviders={configuredProviders}
            onProviderChange={onProviderChange}
          />
        </div>
      )}

      {!expanded && (
        <div className="flex-1 flex flex-col items-center pt-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onExpandedChange(true)}
            title="Mostrar configurações"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      )}
    </aside>
  );
}

interface MobileChatSettingsProps extends SettingsContentProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Mobile Settings (Sheet/Drawer)
export function MobileChatSettings({
  agentId,
  agentConfig,
  onConfigChange,
  availableModels,
  systemPrompts,
  selectedProvider,
  configuredProviders,
  onProviderChange,
  open,
  onOpenChange,
}: MobileChatSettingsProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </SheetTitle>
        </SheetHeader>
        <SettingsContent
          agentId={agentId}
          agentConfig={agentConfig}
          onConfigChange={onConfigChange}
          availableModels={availableModels}
          systemPrompts={systemPrompts}
          selectedProvider={selectedProvider}
          configuredProviders={configuredProviders}
          onProviderChange={onProviderChange}
        />
      </SheetContent>
    </Sheet>
  );
}
