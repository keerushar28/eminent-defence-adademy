"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/features/core/components/breadcrumb";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/features/core/components/sidebar";
import { Separator } from "@/features/core/components/separator";
import { AppSidebar } from "../../sidebar/components/app-sidebar";
import { AdminHeaderData, AdminSidebarLinks } from "../constants/constants";
import { useAdminUserData } from "../hooks/useAdminUserData";
import { outfit } from "@/fonts/outfit";

export function AdminSidebarLayout({ children }: { children: React.ReactNode }) {

    const pathname = usePathname();

    const userData = useAdminUserData();

    return (
        <SidebarProvider className={outfit.className}>
            <AppSidebar
                headerData={AdminHeaderData}
                userData={userData}
                navData={AdminSidebarLinks}
            />
            <SidebarInset>
                <header className="flex border-b h-12 w-full top-0 fixed bg-background shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" variant="secondary" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <Link href="/admin" className="hover:text-foreground">
                                        Home
                                    </Link>
                                </BreadcrumbItem>
                                {pathname !== "/admin" && (
                                    <>
                                        {pathname.split("/").filter(Boolean).slice(1).map((segment, index, arr) => {
                                            const href = "/admin/" + arr.slice(0, index + 1).join("/");
                                            const isLast = index === arr.length - 1;
                                            const label = segment
                                                .split("-")
                                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                                .join(" ");

                                            return (
                                                <div key={segment} className="flex items-center gap-2">
                                                    <BreadcrumbSeparator className="hidden md:block" />
                                                    <BreadcrumbItem>
                                                        {isLast ? (
                                                            <BreadcrumbLink className="dark:text-white text-black font-medium">
                                                                {label}
                                                            </BreadcrumbLink>
                                                        ) : (
                                                            <Link href={href} className="hover:text-foreground">
                                                                {label}
                                                            </Link>
                                                        )}
                                                    </BreadcrumbItem>
                                                </div>
                                            );
                                        })}
                                    </>
                                )}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4  pt-10">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}