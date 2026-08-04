"use client"
import { ReusableSidebarLayout } from "@/features/sidebar-v2/AdminSidebarLayout";
import { navStaffheaderData, staffSidebarLinks } from "@/features/sidebar-v2/constants/constants";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <ReusableSidebarLayout sidebarLinks={staffSidebarLinks} navHeaderData={navStaffheaderData}>
        {children}
    </ReusableSidebarLayout>;
}