"use client";

import { Bot, ChevronDown, Database, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getAllAgents, getAgent } from "@/lib/agents";
import type { LucideIcon } from "lucide-react";

// Mapeamento de nomes de ícones para componentes
const iconMap: Record<string, LucideIcon> = {
  Bot: Bot,
  Database: Database,
  Search: Search,
  FileText: FileText,
};

function getIconComponent(iconName: string): LucideIcon {
  return iconMap[iconName] ?? Bot;
}

interface AgentSelectorProps {
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
  disabled?: boolean;
}

export function AgentSelector({
  selectedAgentId,
  onAgentChange,
  disabled,
}: AgentSelectorProps) {
  const agents = getAllAgents();
  const selectedAgent = getAgent(selectedAgentId);
  const IconComponent = getIconComponent(selectedAgent?.icon ?? "Bot");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 h-[44px] px-3 shrink-0"
          disabled={disabled}
        >
          <IconComponent className="h-4 w-4" />
          <span className="hidden sm:inline max-w-[80px] truncate">
            {selectedAgent?.name ?? "Agente"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {agents.map((agent) => {
          const AgentIcon = getIconComponent(agent.icon);
          return (
            <DropdownMenuItem
              key={agent.id}
              onClick={() => onAgentChange(agent.id)}
              className="flex items-start gap-3 py-2"
            >
              <AgentIcon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex flex-col">
                <span className="font-medium">{agent.name}</span>
                <span className="text-xs text-muted-foreground">
                  {agent.description}
                </span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
