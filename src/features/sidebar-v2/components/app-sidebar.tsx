// Updated AppSidebar component
"use client";
import DefaultImage from "@/../public/uploads/default.jpg";
import {
  Sidebar, SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "../../core/components/sidebar";
import { NavMain } from "./nav-main";
import { SidebarHeaderComponent } from "./sidebar-header";
import { NavUser } from "./nav-user";
import { IHeaderData, ISidebarLinks } from "../types/types";


interface IUserData {
  name?: string;
  email: string;
  id?: string;
  userId?: string;
  isVerified?: boolean;
  role?: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  headerData: IHeaderData;
  userData: IUserData;
  sidebarLinks: ISidebarLinks;
}

export function AppSidebar({
  headerData,
  userData,
  sidebarLinks,
  ...props
}: AppSidebarProps) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarHeaderComponent team={headerData} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={sidebarLinks.items} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: userData.name || "Anonymous User",
            email: userData.email,
            avatar: DefaultImage.src, // fallback avatar
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
