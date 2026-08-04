"use client";

import { type LucideIcon, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "../../core/components/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../core/components/collapsible";

interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  items?: NavItem[];
}

interface NavMainProps {
  items: NavItem[];
}

function NavItemRenderer({
  item,
  pathname,
  router,
  isSubItem = false,
}: {
  item: NavItem;
  pathname: string;
  router: ReturnType<typeof useRouter>;
  isSubItem?: boolean;
}) {
  const isActive = pathname === item.url;
  const hasSubItems = item.items && item.items.length > 0;
  const isSubItemActive = hasSubItems && item.items?.some((subItem) => pathname.startsWith(subItem.url));

  if (hasSubItems) {
    // For sub-items with children, return just the button without SidebarMenuItem wrapper
    if (isSubItem) {
      return (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={true}
          className="group/collapsible"
        >
          <div>
            <CollapsibleTrigger asChild>
              <SidebarMenuSubButton
                tooltip={item.title}
                className={clsx(
                  "cursor-pointer hover:bg-muted",
                  (isActive || isSubItemActive) && "bg-accent text-black dark:text-white"
                )}
              >
                <span>{item.title}</span>
                <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
              </SidebarMenuSubButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <NavItemRenderer
                      item={subItem}
                      pathname={pathname}
                      router={router}
                      isSubItem={true}
                    />
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </div>
        </Collapsible>
      );
    }

    // For top-level items with children
    return (
      <Collapsible
        key={item.title}
        asChild
        defaultOpen={true}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <CollapsibleTrigger asChild>
            <SidebarMenuButton
              tooltip={item.title}
              className={clsx(
                "cursor-pointer hover:bg-muted",
                (isActive || isSubItemActive) && "bg-accent text-black dark:text-white"
              )}
            >
              {item.icon && <item.icon />}
              <span>{item.title}</span>
              <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
            </SidebarMenuButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <SidebarMenuSub>
              {item.items?.map((subItem) => (
                <SidebarMenuSubItem key={subItem.title}>
                  <NavItemRenderer
                    item={subItem}
                    pathname={pathname}
                    router={router}
                    isSubItem={true}
                  />
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <SidebarMenuSubButton
      asChild
      className={clsx(
        "cursor-pointer hover:bg-muted",
        isActive && "bg-accent text-black dark:text-white"
      )}
    >
      <a onClick={() => router.push(item.url)}>
        <span>{item.title}</span>
      </a>
    </SidebarMenuSubButton>
  );
}

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Main</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname === item.url;
          const hasSubItems = item.items && item.items.length > 0;
          const isSubItemActive = hasSubItems && item.items?.some((subItem) => pathname.startsWith(subItem.url));

          if (hasSubItems) {
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={true}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={clsx(
                        "cursor-pointer hover:bg-muted",
                        (isActive || isSubItemActive) && "bg-accent text-black dark:text-white"
                      )}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <NavItemRenderer
                            item={subItem}
                            pathname={pathname}
                            router={router}
                            isSubItem={true}
                          />
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                className={clsx(
                  "cursor-pointer hover:bg-muted ",
                  isActive && "bg-accent text-black dark:text-white"
                )}
                onClick={() => {
                  router.push(item.url);
                }}
              >
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
