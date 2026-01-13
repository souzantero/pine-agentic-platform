// Tipos compartilhados dos componentes de sidebar

import type { Thread } from "@/lib/types";

export type NavSection = "threads" | "prompts" | "settings";

export interface SidebarProps {
  threads: Thread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onThreadsClick: () => void;
}

export interface MobileThreadsDrawerProps {
  threads: Thread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
