import Link from "next/link";
import { Users, Layers, Grid3x3, DoorOpen, Bed, BarChart3 } from "lucide-react";
import { prisma } from "@/features/core/lib/prisma";
export const dynamic = "force-dynamic";

async function getStats() {
  const [totalStudents, totalCategories, totalSubcategories, totalRooms, totalBeds] = await Promise.all([
    prisma.student.count(),
    prisma.category.count(),
    prisma.subCategory.count(),
    prisma.hostelRoom.count(),
    prisma.hostelBed.count(),
  ]);

  return {
    totalStudents,
    totalCategories,
    totalSubcategories,
    totalRooms,
    totalBeds,
  };
}

export default async function StaffPage() {
  const stats = await getStats();

  const statCards = [
    {
      title: "Students",
      value: stats.totalStudents,
      icon: Users,
      href: "/staff/students/registration",
    },
    {
      title: "Categories",
      value: stats.totalCategories,
      icon: Layers,
      href: "/staff/categories/manage-categories",
    },
    {
      title: "Subcategories",
      value: stats.totalSubcategories,
      icon: Grid3x3,
      href: "/staff/categories/manage-categories",
    },
    {
      title: "Rooms",
      value: stats.totalRooms,
      icon: DoorOpen,
      href: "/staff/hostel/rooms",
    },
    {
      title: "Beds",
      value: stats.totalBeds,
      icon: Bed,
      href: "/staff/hostel/rooms",
    },
  ];

  const quickLinks = [
    { label: "Students", href: "/staff/students/registration", icon: Users },
    { label: "Categories", href: "/staff/categories/manage-categories", icon: Layers },
    { label: "Hostel", href: "/staff/hostel/rooms", icon: DoorOpen },
    { label: "Inventory", href: "/staff/inventory", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your institution</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} href={stat.href}>
                <div className="bg-card border border-border rounded-md p-4 hover:border-primary transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div className="text-2xl font-semibold text-foreground">{stat.value}</div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="bg-card border border-border rounded-md p-6">
          <h2 className="text-sm font-semibold text-foreground mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link key={link.label} href={link.href}>
                  <div className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-muted transition-colors cursor-pointer">
                    <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm font-medium text-foreground">{link.label}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}