import { AdminSidebarLayout } from "@/features/admin/components/AdminSidebarLayout";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}