"use client";

import { useRouter, usePathname } from "next/navigation";
import { Building2, Users, Plug } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSession } from "@/lib/session";
import type { MobileSettingsDrawerProps } from "./types";

// Drawer de configurações para mobile
export function MobileSettingsDrawer({
  open,
  onOpenChange,
}: MobileSettingsDrawerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { hasPermission } = useSession();

  const canViewMembers = hasPermission("MEMBERS_READ");
  const canManageOrg = hasPermission("ORGANIZATION_MANAGE");

  const handleOrganizationClick = () => {
    router.push("/settings");
    onOpenChange(false);
  };

  const handleProvidersClick = () => {
    router.push("/settings/providers");
    onOpenChange(false);
  };

  const handleMembersClick = () => {
    router.push("/settings/members");
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="p-0 w-72">
        <SheetHeader className="sr-only">
          <SheetTitle>Configurações</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col h-full bg-muted/40">
          <div className="p-4 pt-14 border-b">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Configurações
            </h2>
          </div>

          <nav className="p-2">
            <ul className="space-y-1">
              {canManageOrg && (
                <>
                  <li>
                    <button
                      onClick={handleOrganizationClick}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                        pathname === "/settings"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span>Organização</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={handleProvidersClick}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                        pathname === "/settings/providers"
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Plug className="h-4 w-4 shrink-0" />
                      <span>Provedores</span>
                    </button>
                  </li>
                </>
              )}
              {canViewMembers && (
                <li>
                  <button
                    onClick={handleMembersClick}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                      pathname === "/settings/members"
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    )}
                  >
                    <Users className="h-4 w-4 shrink-0" />
                    <span>Membros</span>
                  </button>
                </li>
              )}
            </ul>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}
