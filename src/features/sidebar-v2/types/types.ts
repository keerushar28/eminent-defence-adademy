import { LucideIcon } from "lucide-react";
import { ElementType } from "react";

export interface IHeaderData {
  name: string;
  logo: ElementType;
  description: string;
}

export interface ISidebarLinks {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}
