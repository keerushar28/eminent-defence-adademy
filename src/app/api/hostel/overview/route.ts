import { NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";
import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    // Get total beds and their statuses
    const beds = await prisma.hostelBed.findMany({
      where: {
        isActive: true,
      },
      select: {
        status: true,
      },
    });

    const totalBeds = beds.length;
    const occupiedBeds = beds.filter((bed) => bed.status === "ALLOCATED").length;
    const availableBeds = beds.filter((bed) => bed.status === "AVAILABLE").length;
    const inactiveBeds = beds.filter((bed) => bed.status === "INACTIVE").length;
    const occupancyRate = totalBeds > 0 ? (occupiedBeds / totalBeds) * 100 : 0;

    // Get active students count
    const activeStudents = await prisma.hostelAllocation.count({
      where: {
        isActive: true,
      },
    });

    // Get current month revenue
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);

    const currentMonthPayments = await prisma.hostelPayment.aggregate({
      where: {
        paymentDate: {
          gte: currentMonthStart,
          lte: currentMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const currentMonthRevenue = currentMonthPayments._sum.amount?.toNumber() || 0;

    // Get last month revenue for comparison
    const lastMonthStart = startOfMonth(subMonths(today, 1));
    const lastMonthEnd = endOfMonth(subMonths(today, 1));

    const lastMonthPayments = await prisma.hostelPayment.aggregate({
      where: {
        paymentDate: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      _sum: {
        amount: true,
      },
    });

    const lastMonthRevenue = lastMonthPayments._sum.amount?.toNumber() || 0;
    const revenueTrend =
      lastMonthRevenue > 0
        ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
        : 0;

    // Get students with expiring payments (next 7 days)
    const expiringAllocations = await prisma.hostelAllocation.findMany({
      where: {
        isActive: true,
        paidUntil: {
          gte: today,
          lte: sevenDaysFromNow,
        },
      },
      include: {
        bed: true,
      },
    });

    const expiringCount = expiringAllocations.length;

    // Calculate pending amount for expiring allocations
    let pendingAmount = 0;
    expiringAllocations.forEach((allocation) => {
      const daysOverdue = Math.ceil(
        (today.getTime() - allocation.paidUntil.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysOverdue > 0) {
        pendingAmount += daysOverdue * allocation.bed.pricePerDay.toNumber();
      }
    });

    // Get revenue trend for last 6 months
    const revenueTrendData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);

      const monthPayments = await prisma.hostelPayment.aggregate({
        where: {
          paymentDate: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        _sum: {
          amount: true,
        },
      });

      revenueTrendData.push({
        month: format(monthDate, "MMM"),
        revenue: monthPayments._sum.amount?.toNumber() || 0,
      });
    }

    // Bed status distribution
    const bedStatusDistribution = [
      { name: "Occupied", value: occupiedBeds, status: "ALLOCATED" },
      { name: "Available", value: availableBeds, status: "AVAILABLE" },
      { name: "Inactive", value: inactiveBeds, status: "INACTIVE" },
    ].filter((item) => item.value > 0);

    return NextResponse.json({
      metrics: {
        totalBeds,
        occupiedBeds,
        availableBeds,
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        activeStudents,
        currentMonthRevenue,
        revenueTrend: Math.round(revenueTrend * 10) / 10,
        expiringCount,
        pendingAmount,
      },
      charts: {
        revenueTrend: revenueTrendData,
        bedStatusDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching hostel overview:", error);
    return NextResponse.json(
      { error: "Failed to fetch hostel overview data" },
      { status: 500 }
    );
  }
}
