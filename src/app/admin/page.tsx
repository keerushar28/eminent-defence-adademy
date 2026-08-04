import { Suspense } from "react";
import Link from "next/link";
import NepaliDate from "nepali-date-converter";

export const dynamic = "force-dynamic";
import {
  getDashboardStats,
  getCategoryDistribution,
  getInventoryCategoryStats,
  getHostelOccupancy,
  getRecentPayments,
  getMonthlyRevenue,
  getUtilityBills,
} from "./actions/dashboard-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { Badge } from "@/features/core/components/badge";
import { Skeleton } from "@/features/core/components/skeleton";
import { Button } from "@/features/core/components/button";
import { Users, FolderTree, Package, Building2, ShoppingCart, ArrowRight } from "lucide-react";
import { DashboardCharts } from "./components/dashboard-charts";

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = "default",
  href,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  variant?: "default" | "warning" | "success";
  href?: string;
}) {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    warning: "bg-orange-500/10 text-orange-500",
    success: "bg-green-500/10 text-green-500",
  };

  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${variantStyles[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card className="cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all">
          {content}
        </Card>
      </Link>
    );
  }

  return <Card>{content}</Card>;
}

async function StatsCards() {
  const stats = await getDashboardStats();
  const occupancyRate = stats.hostel.beds > 0 
    ? Math.round((stats.hostel.occupied / stats.hostel.beds) * 100) 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <StatCard
        title="Total Students"
        value={stats.students.total}
        subtitle={`${stats.students.selected} selected`}
        icon={Users}
        href="/admin/students"
      />
      <StatCard
        title="Categories"
        value={stats.categories.total}
        subtitle={`${stats.categories.subCategories} subcategories`}
        icon={FolderTree}
        href="/admin/categories"
      />
      <StatCard
        title="Inventory Items"
        value={stats.inventory.total}
        subtitle={stats.inventory.lowStock > 0 ? `${stats.inventory.lowStock} low stock` : "Stock OK"}
        icon={Package}
        variant={stats.inventory.lowStock > 0 ? "warning" : "default"}
        href="/admin/inventory"
      />
      <StatCard
        title="Hostel Rooms"
        value={stats.hostel.rooms}
        subtitle={`${stats.hostel.beds} beds total`}
        icon={Building2}
        href="/admin/hostel"
      />
      <StatCard
        title="Bed Occupancy"
        value={`${occupancyRate}%`}
        subtitle={`${stats.hostel.occupied}/${stats.hostel.beds} occupied`}
        icon={Building2}
        href="/admin/hostel"
        variant={occupancyRate > 80 ? "warning" : "success"}
      />
      <StatCard
        title="Orders"
        value={stats.orders.total}
        subtitle={stats.orders.pending > 0 ? `${stats.orders.pending} pending` : "All processed"}
        icon={ShoppingCart}
        variant={stats.orders.pending > 0 ? "warning" : "default"}
        href="/admin/inventory/orders"
      />
    </div>
  );
}

async function RecentPaymentsTable() {
  const payments = await getRecentPayments();

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>Latest payment transactions</CardDescription>
        </div>
        <Link href="/admin/payments">
          <Button variant="outline" size="sm" className="gap-2">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  No recent payments
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium">{payment.student}</TableCell>
                  <TableCell>
                    <Badge variant={payment.type === "Category" ? "default" : "secondary"}>
                      {payment.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell className="text-right">Rs. {payment.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

async function UtilityBillsTable() {
  const bills = await getUtilityBills();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Recent Utility Bills</CardTitle>
          <CardDescription>Latest utility expenses</CardDescription>
        </div>
        <Link href="/admin/inventory/bills">
          <Button variant="outline" size="sm" className="gap-2">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Category</TableHead>
              <TableHead>Period</TableHead>
              <TableHead>Units</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No utility bills recorded
                </TableCell>
              </TableRow>
            ) : (
              bills.map((bill) => (
                <TableRow key={bill.id}>
                  <TableCell className="font-medium">{bill.category}</TableCell>
                  <TableCell className="text-sm">
                    {new NepaliDate(bill.periodStartDate).format("YYYY MMMM DD")} - {new NepaliDate(bill.periodEndDate).format("YYYY MMMM DD")}
                  </TableCell>
                  <TableCell>{bill.units ?? "-"}</TableCell>
                  <TableCell className="text-right">NPR {bill.amount.toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

async function ChartsSection() {
  const [categoryData, inventoryData, hostelData, revenueData] = await Promise.all([
    getCategoryDistribution(),
    getInventoryCategoryStats(),
    getHostelOccupancy(),
    getMonthlyRevenue(),
  ]);

  return (
    <DashboardCharts
      categoryData={categoryData}
      inventoryData={inventoryData}
      hostelData={hostelData}
      revenueData={revenueData}
    />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-20 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your hostel management system</p>
      </div>

      <Suspense fallback={<LoadingSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={<div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-[400px]" /><Skeleton className="h-[400px]" /></div>}>
        <ChartsSection />
      </Suspense>

      <div className="grid gap-4 lg:grid-cols-3">
        <Suspense fallback={<Skeleton className="h-[400px] col-span-2" />}>
          <RecentPaymentsTable />
        </Suspense>
        <Suspense fallback={<Skeleton className="h-[400px]" />}>
          <UtilityBillsTable />
        </Suspense>
      </div>
    </div>
  );
}
