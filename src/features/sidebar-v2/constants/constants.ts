import {
  User,
  Building,
  Package,
  Settings,
  Users,
  LayoutDashboard,
  Folder,
  UserCog,
  BedIcon,
  Plus,
  Zap,
  ShoppingCart,
  Send,
  FileText,
  TrendingUp,
  Star,
  Shield,
  Wallet,
  PackagePlus,
} from "lucide-react";

export const headerData = {
  name: "Eminent Defence Academy",
  logo: Building,
  description: "Super Admin Panel",
};
export const navStaffheaderData = {
  name: "Eminent Defence Academy",
  logo: Building,
  description: "Staff Panel",
};

export const superAdminSidebarLinks = {
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

export const adminSidebarLinks = {
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
          items: [
            {
              title: "Overall Summary",
              url: "/admin/categories/ledger/summary",
            },
          ],
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
          title: "Issuances",
          url: "/admin/inventory/issuances",
          icon: Send,
          items: [
            {
              title: "Issue Items",
              url: "/admin/inventory/issuances/issue-items",
            },
            {
              title: "Issue Payments",
              url: "/admin/inventory/issuances/issue-payments",
            },
          ],
        },
        {
          title: "Utilities & Expenses",
          url: "/admin/inventory/billing",
          icon: Zap,
        },
        {
          title: "Categories",
          url: "/admin/inventory/categories",
          icon: Folder,
        },
        {
          title: "Reports",
          url: "/admin/inventory/reports",
          icon: FileText,
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
      title: "Settings",
      url: "/admin/settings",
      icon: Settings,
    },
  ],
};

export const staffSidebarLinks = {
  items: [
    {
      title: "Dashboard",
      url: "/staff",
      icon: LayoutDashboard,
    },
    {
      title: "Ledger",
      url: "/staff/ledger",
      icon: TrendingUp,
      items: [
        {
          title: "Student Ledger",
          url: "/staff/ledger/students",
        },
        {
          title: "Invoices",
          url: "/staff/ledger/invoices",
        },
      ],
    },
    {
      title: "Students",
      url: "/staff/students",
      icon: Users,
      items: [
        {
          title: "Registration",
          url: "/staff/students/registration",
          icon: Plus,
        },
        {
          title: "Selected Students",
          url: "/staff/students/selected",
          icon: Star,
        },
      ],
    },
    {
      title: "Categories",
      url: "/staff/categories",
      icon: Shield,
      items: [
        {
          title: "Manage Categories",
          url: "/staff/categories/manage-categories",
          icon: Folder,
        },
        {
          title: "Category Assignments",
          url: "/staff/categories/category-assignments",
          icon: UserCog,
        },
        {
          title: "Payments",
          url: "/staff/categories/payments",
          icon: UserCog,
        },
      ],
    },
    {
      title: "Inventory",
      url: "/staff/inventory",
      icon: Package,
      items: [
        {
          title: "Vendors",
          url: "/staff/inventory/vendors",
          icon: Building,
        },
        {
          title: "Items",
          url: "/staff/inventory/items",
          icon: Package,
        },
        {
          title: "Orders",
          url: "/staff/inventory/orders",
          icon: ShoppingCart,
        },
        {
          title: "Categories",
          url: "/staff/inventory/categories",
          icon: Folder,
        },
      ],
    },
    {
      title: "Student Issuances",
      url: "/staff/student-issuances",
      icon: PackagePlus,
      items: [
        {
          title: "Issue Items",
          url: "/staff/student-issuances/issue-item",
        },
        {
          title: "Payments",
          url: "/staff/student-issuances/payments",
        },
      ],
    },
    {
      title: "Billing & Utilities",
      url: "/staff/billing",
      icon: Wallet,
      items: [
        {
          title: "Expenses",
          url: "/staff/billing/expenses",
        },
        {
          title: "Categories",
          url: "/staff/billing/categories",
        },
      ],
    },
    {
      title: "Hostel",
      url: "/staff/hostel",
      icon: BedIcon,
      items: [
        {
          title: "Rooms",
          url: "/staff/hostel/rooms",
        },
        {
          title: "Allocations",
          url: "/staff/hostel/allocations",
        },
        {
          title: "Payments",
          url: "/staff/hostel/payments",
        },
      ],
    },
    {
      title: "Settings",
      url: "/staff/settings",
      icon: Settings,
    },
  ],
};
