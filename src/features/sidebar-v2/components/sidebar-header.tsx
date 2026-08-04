"use client";
import * as React from "react";
import {
  SidebarMenu, SidebarMenuButton,
  SidebarMenuItem,
} from "../../core/components/sidebar";
export function SidebarHeaderComponent({
  team,
}: {
  team: {
    name: string;
    logo: React.ElementType;
    description: string;
  };
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <team.logo className="size-4 " />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium text-foreground">{team.name}</span>
            <span className="truncate text-xs">{team.description}</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
