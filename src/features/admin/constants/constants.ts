// constants.ts
import {
  Building,
  Package,
  Settings,
  Users,
  LayoutDashboard,
  Folder,
  UserCog,
  BedIcon,
  Plus,
  ShoppingCart,
  TrendingUp,
  Star,
  Shield,
  Wallet,
  PackagePlus,
} from "lucide-react";

export const StudentsNavData = {
  section: "Students",
  baseUrl: "/admin/students",
  icon: Users,
  items: [
    {
      title: "Overview",
      url: "/admin/students",
      icon: LayoutDashboard,
    },
    {
      title: "Categories",
      url: "/admin/students/categories",
      icon: Folder,
    },
    {
      title: "Category Assignments",
      url: "/admin/students/category-assignments",
      icon: UserCog,
    },
  ],
};

export const AdminHeaderData = {
  name: "Eminent Defence Academy",
  logo: Building,
  description: "Admin Panel",
};

export const AdminSidebarLinks = {
  items: [
    {
      title: "Dashboard",
      url: "/admin",
      icon: LayoutDashboard,
    },
    {
      title: "Ledger",
      url: "/admin/ledger",
      icon: TrendingUp,
      items: [
        {
          title: "Student Ledger",
          url: "/admin/ledger/students",
        },
        {
          title: "Income Ledger",
          url: "/admin/ledger/income",
        },
        {
          title: "Expense Ledger",
          url: "/admin/ledger/expense",
        },
        {
          title: "Invoices",
          url: "/admin/ledger/invoices",
        },
        {
          title: "Overall Summary",
          url: "/admin/ledger/overall-summary",
        },
      ],
    },
    {
      title: "Students",
      url: "/admin/students",
      icon: Users,
      items: [
        {
          title: "Registration",
          url: "/admin/students/registration",
          icon: Plus,
        },
        {
          title: "Selected Students",
          url: "/admin/students/selected",
          icon: Star,
        },
        {
          title: "Deletion Requests",
          url: "/admin/students/deletion-requests",
          icon: Shield,
        },
      ],
    },
    {
      title: "Categories",
      url: "/admin/categories",
      icon: Shield,
      items: [
        {
          title: "Manage Categories",
          url: "/admin/categories/manage-categories",
          icon: Folder,
        },
        {
          title: "Category Assignments",
          url: "/admin/categories/category-assignments",
          icon: UserCog,
        },
        {
          title: "Payments",
          url: "/admin/categories/payments",
          icon: UserCog,
        },
        {
          title: "Ledger",
          url: "/admin/categories/ledger",
          icon: UserCog,
        },
      ],
    },
    {
      title: "Inventory",
      url: "/admin/inventory",
      icon: Package,
      items: [
        {
          title: "Overview",
          url: "/admin/inventory",
          icon: LayoutDashboard,
        },
        {
          title: "Vendors",
          url: "/admin/inventory/vendors",
          icon: Building,
        },
        {
          title: "Items",
          url: "/admin/inventory/items",
          icon: Package,
        },
        {
          title: "Orders",
          url: "/admin/inventory/orders",
          icon: ShoppingCart,
        },
        {
          title: "Categories",
          url: "/admin/inventory/categories",
          icon: Folder,
        },
      ],
    },
    {
      title: "Student Issuances",
      url: "/admin/student-issuances",
      icon: PackagePlus,
      items: [
        {
          title: "Issue Items",
          url: "/admin/student-issuances/issue-item",
        },
        {
          title: "Payments",
          url: "/admin/student-issuances/payments",
        },
      ],
    },
    {
      title: "Billing & Utilities",
      url: "/admin/billing",
      icon: Wallet,
      items: [
        {
          title: "Expenses",
          url: "/admin/billing/expenses",
        },
        {
          title: "Categories",
          url: "/admin/billing/categories",
        },
      ],
    },
    {
      title: "Hostel",
      url: "/admin/hostel",
      icon: BedIcon,
      items: [
        {
          title: "Overview",
          url: "/admin/hostel",
        },
        {
          title: "Rooms",
          url: "/admin/hostel/rooms",
        },
        {
          title: "Allocations",
          url: "/admin/hostel/allocations",
        },
        {
          title: "Payments",
          url: "/admin/hostel/payments",
        },
        {
          title: "Ledger",
          url: "/admin/hostel/ledger",
        },
      ],
    },
    {
      title: "Settlements",
      url: "/admin/settlements",
      icon: Wallet,
    },
    {
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};
