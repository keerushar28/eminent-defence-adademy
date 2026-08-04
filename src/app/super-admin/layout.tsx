import { SuperAdminSidebarLayout } from "@/features/super-admin/components/SuperAdminSidebarLayout";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SuperAdminSidebarLayout>{children}</SuperAdminSidebarLayout>;
}