"use client";

import { useState } from "react";
import { useSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Building2, Check, ChevronsUpDown } from "lucide-react";

export function OrgSwitcher() {
  const { memberships, currentMembership, switchOrganization } = useSession();
  const [switching, setSwitching] = useState(false);

  const handleSwitch = async (organizationId: string) => {
    if (organizationId === currentMembership?.organizationId) return;

    setSwitching(true);
    await switchOrganization(organizationId);
    setSwitching(false);
  };

  if (!currentMembership) {
    return null;
  }

  // Se só tem uma org, mostrar apenas o nome sem dropdown
  if (memberships.length === 1) {
    return (
      <h1 className="text-lg md:text-xl font-semibold truncate max-w-[200px] md:max-w-[300px]">
        {currentMembership.organization.name}
      </h1>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="gap-2 px-2 h-auto py-1"
          disabled={switching}
        >
          <span className="text-lg md:text-xl font-semibold truncate max-w-[150px] md:max-w-[250px]">
            {currentMembership.organization.name}
          </span>
          <ChevronsUpDown className="h-4 w-4 opacity-50 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        <DropdownMenuLabel>Organizações</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.id}
            onClick={() => handleSwitch(membership.organizationId)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col">
                <span className="truncate">{membership.organization.name}</span>
                <span className="text-xs text-muted-foreground">
                  {membership.role.name}
                </span>
              </div>
              {membership.organizationId === currentMembership.organizationId && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
