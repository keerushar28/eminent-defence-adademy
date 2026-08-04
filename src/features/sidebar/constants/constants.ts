// constants.ts
import { Building, Settings, User } from "lucide-react";

export const headerData = {
  name: "Eminent Defence Academy",
  logo: Building,
  description: "Super Admin Panel",
};

export const navMainData = {
  items: [
    {
      title: "Users",
      url: "/super-admin",
      icon: User,
    },
    {
      title: "Settings",
      url: "/super-admin/settings",
      icon: Settings,
    },
  ],
};
