"use client";

import { useState } from "react";
import { MessageSquare, PanelLeftClose, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  href: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  {
    icon: <MessageSquare className="h-5 w-5" />,
    label: "Conversas",
    href: "/",
    active: true,
  },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(true);

  return (
    <aside
      className={cn(
        "border-r bg-muted/40 flex flex-col transition-all duration-300",
        expanded ? "w-64" : "w-16"
      )}
    >
      <div className={cn("p-2", expanded ? "flex justify-end" : "flex justify-center")}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setExpanded(!expanded)}
          title={expanded ? "Encolher menu" : "Expandir menu"}
        >
          {expanded ? (
            <PanelLeftClose className="h-5 w-5" />
          ) : (
            <PanelLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <nav className="flex-1 p-2">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                title={!expanded ? item.label : undefined}
                className={cn(
                  "flex items-center rounded-md text-sm font-medium transition-colors",
                  expanded ? "gap-3 px-3 py-2" : "justify-center p-2",
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {item.icon}
                {expanded && <span>{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
