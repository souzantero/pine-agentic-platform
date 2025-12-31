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
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

export type AIModel = "gpt-4" | "gpt-3.5" | "claude-3" | "claude-2" | "gemini-pro" | "gemini-flash";

export interface SystemPrompt {
  id: string;
  name: string;
  content: string;
}

interface ModelOption {
  value: AIModel;
  label: string;
  provider: string;
}

const models: ModelOption[] = [
  { value: "gpt-4", label: "GPT-4", provider: "OpenAI" },
  { value: "gpt-3.5", label: "GPT-3.5 Turbo", provider: "OpenAI" },
  { value: "claude-3", label: "Claude 3 Opus", provider: "Anthropic" },
  { value: "claude-2", label: "Claude 2", provider: "Anthropic" },
  { value: "gemini-pro", label: "Gemini Pro", provider: "Google" },
  { value: "gemini-flash", label: "Gemini Flash", provider: "Google" },
];

interface SettingsContentProps {
  model: AIModel;
  onModelChange: (model: AIModel) => void;
  temperature: number;
  onTemperatureChange: (temperature: number) => void;
  systemPrompts: SystemPrompt[];
  selectedPromptId: string | null;
  onPromptChange: (promptId: string | null) => void;
}

// Conteúdo compartilhado das configurações
function SettingsContent({ model, onModelChange, temperature, onTemperatureChange, systemPrompts, selectedPromptId, onPromptChange }: SettingsContentProps) {
  return (
    <div className="p-4 space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Modelo</label>
        <Select value={model} onValueChange={(value) => onModelChange(value as AIModel)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione um modelo" />
          </SelectTrigger>
          <SelectContent>
            {models.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                <div className="flex flex-col">
                  <span>{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.provider}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Temperatura</label>
          <span className="text-sm text-muted-foreground">{temperature.toFixed(1)}</span>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={(value) => onTemperatureChange(value[0])}
          min={0}
          max={2}
          step={0.1}
          className="w-full"
        />
        <p className="text-xs text-muted-foreground">
          Valores baixos = respostas mais focadas. Valores altos = mais criatividade.
        </p>
      </div>

      <Separator />

      <div className="space-y-2">
        <label className="text-sm font-medium">System Prompt</label>
        <Select
          value={selectedPromptId ?? "none"}
          onValueChange={(value) => onPromptChange(value === "none" ? null : value)}
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
        <p className="text-xs text-muted-foreground">
          Define o comportamento e contexto inicial do assistente.
        </p>
      </div>
    </div>
  );
}

interface ChatSettingsProps extends SettingsContentProps {
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
}

// Desktop Settings Panel
export function ChatSettings({ model, onModelChange, temperature, onTemperatureChange, systemPrompts, selectedPromptId, onPromptChange, expanded, onExpandedChange }: ChatSettingsProps) {
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
            model={model}
            onModelChange={onModelChange}
            temperature={temperature}
            onTemperatureChange={onTemperatureChange}
            systemPrompts={systemPrompts}
            selectedPromptId={selectedPromptId}
            onPromptChange={onPromptChange}
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
export function MobileChatSettings({ model, onModelChange, temperature, onTemperatureChange, systemPrompts, selectedPromptId, onPromptChange, open, onOpenChange }: MobileChatSettingsProps) {
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
          model={model}
          onModelChange={onModelChange}
          temperature={temperature}
          onTemperatureChange={onTemperatureChange}
          systemPrompts={systemPrompts}
          selectedPromptId={selectedPromptId}
          onPromptChange={onPromptChange}
        />
      </SheetContent>
    </Sheet>
  );
}
