"use client";

import { Settings, PanelRightClose, PanelRight } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import type { ChatConfig, ModelOption } from "@/lib/types";

// Mapeamento de nomes de provedores para labels amigaveis
const PROVIDER_LABELS: Record<string, string> = {
  OPENAI: "OpenAI",
  OPENROUTER: "OpenRouter",
  ANTHROPIC: "Anthropic",
  GOOGLE: "Google AI",
};

interface SettingsContentProps {
  config: ChatConfig;
  onConfigChange: (key: string, value: unknown) => void;
  availableModels: ModelOption[];
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

// Componente para toggle de streaming
function StreamModeField({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <>
      <Separator />
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="stream-mode" className="text-sm font-medium">
            Modo Streaming
          </Label>
          <p className="text-xs text-muted-foreground">
            Exibe a resposta em tempo real
          </p>
        </div>
        <Switch
          id="stream-mode"
          checked={value}
          onCheckedChange={onChange}
        />
      </div>
    </>
  );
}

// Conteúdo compartilhado das configurações
function SettingsContent({
  config,
  onConfigChange,
  availableModels,
  configuredProviders,
  onProviderChange,
}: SettingsContentProps) {
  return (
    <div className="p-4 space-y-4">
      <ProviderField
        value={config.provider}
        onChange={onProviderChange}
        configuredProviders={configuredProviders}
      />

      <ModelField
        value={config.model}
        onChange={(value) => onConfigChange("model", value)}
        availableModels={availableModels}
      />

      <StreamModeField
        value={config.streamMode}
        onChange={(value) => onConfigChange("streamMode", value)}
      />
    </div>
  );
}

interface ChatSettingsProps extends SettingsContentProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

// Desktop Settings Panel
export function ChatSettings({
  config,
  onConfigChange,
  availableModels,
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
            config={config}
            onConfigChange={onConfigChange}
            availableModels={availableModels}
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
  config,
  onConfigChange,
  availableModels,
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
          config={config}
          onConfigChange={onConfigChange}
          availableModels={availableModels}
          configuredProviders={configuredProviders}
          onProviderChange={onProviderChange}
        />
      </SheetContent>
    </Sheet>
  );
}
