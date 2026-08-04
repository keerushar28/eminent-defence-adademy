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
import { useUserData } from "@/features/sidebar/hooks/useUserData";
import { headerData, navMainData } from "@/features/sidebar/constants/constants";

export function SuperAdminSidebarLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const userData = useUserData();

    return (
        <SidebarProvider>
            <AppSidebar
                headerData={headerData}
                userData={userData}
                navData={navMainData}
            />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" variant="secondary" />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <Link href="/admin">Home</Link>
                                </BreadcrumbItem>
                                <>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink className="text-primary-foreground">
                                            {pathname === "/admin"
                                                ? "users"
                                                : pathname.split("/")[2]}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">{children}</div>
            </SidebarInset>
        </SidebarProvider>
    );
}