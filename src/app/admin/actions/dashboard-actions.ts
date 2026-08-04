"use server";

import { prisma } from "@/features/core/lib/prisma";

export async function getDashboardStats() {
  const [
    totalStudents,
    selectedStudents,
    totalCategories,
    totalSubCategories,
    totalInventoryItems,
    lowStockCount,
    totalRooms,
    totalBeds,
    occupiedBeds,
    totalOrders,
    pendingOrders,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.student.count({ where: { isSelected: true } }),
    prisma.category.count(),
    prisma.subCategory.count(),
    prisma.inventoryItem.count(),
    prisma.$queryRaw<[{ count: bigint }]>`
      SELECT COUNT(*) as count FROM "InventoryItem" WHERE "currentStock" <= "minStockThreshold"
    `.then((r) => Number(r[0]?.count ?? 0)),
    prisma.hostelRoom.count(),
    prisma.hostelBed.count(),
    prisma.hostelBed.count({ where: { status: "ALLOCATED" } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
  ]);

  return {
    students: { total: totalStudents, selected: selectedStudents },
    categories: { total: totalCategories, subCategories: totalSubCategories },
    inventory: { total: totalInventoryItems, lowStock: lowStockCount },
    hostel: { rooms: totalRooms, beds: totalBeds, occupied: occupiedBeds },
    orders: { total: totalOrders, pending: pendingOrders },
  };
}

export async function getCategoryDistribution() {
  const categories = await prisma.category.findMany({
    include: {
      subCategories: {
        include: {
          _count: { select: { studentCategories: true } },
        },
      },
    },
  });

  return categories.map((cat) => ({
    name: cat.name,
    students: cat.subCategories.reduce((sum, sub) => sum + sub._count.studentCategories, 0),
  }));
}

export async function getInventoryCategoryStats() {
  const categories = await prisma.inventoryCategory.findMany({
    include: {
      items: { select: { currentStock: true, unitPrice: true } },
    },
  });

  return categories.map((cat) => ({
    name: cat.name,
    itemCount: cat.items.length,
    totalStock: cat.items.reduce((sum, item) => sum + item.currentStock, 0),
  }));
}

export async function getHostelOccupancy() {
  const rooms = await prisma.hostelRoom.findMany({
    include: {
      beds: { select: { status: true } },
    },
  });

  return rooms.map((room) => ({
    room: room.roomNumber,
    total: room.beds.length,
    occupied: room.beds.filter((b) => b.status === "ALLOCATED").length,
    available: room.beds.filter((b) => b.status === "AVAILABLE").length,
  }));
}

export async function getRecentPayments() {
  const [categoryPayments, hostelPayments] = await Promise.all([
    prisma.categoryPayment.findMany({
      take: 5,
      orderBy: { paymentDate: "desc" },
      include: {
        studentCategory: {
          include: {
            student: { select: { fullname: true } },
            subCategory: { select: { name: true } },
          },
        },
      },
    }),
    prisma.hostelPayment.findMany({
      take: 5,
      orderBy: { paymentDate: "desc" },
      include: {
        allocation: {
          include: {
            student: { select: { fullname: true } },
            bed: { include: { room: { select: { roomNumber: true } } } },
          },
        },
      },
    }),
  ]);

  const payments = [
    ...categoryPayments.map((p) => ({
      id: p.id,
      student: p.studentCategory.student.fullname,
      type: "Category" as const,
      description: p.studentCategory.subCategory.name,
      amount: Number(p.amount),
      date: p.paymentDate,
      method: p.paymentMethod,
    })),
    ...hostelPayments.map((p) => ({
      id: p.id,
      student: p.allocation.student.fullname,
      type: "Hostel" as const,
      description: `Room ${p.allocation.bed.room.roomNumber}`,
      amount: Number(p.amount),
      date: p.paymentDate,
      method: p.paymentMethod,
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10);

  return payments;
}

export async function getMonthlyRevenue() {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const [categoryPayments, hostelPayments] = await Promise.all([
    prisma.categoryPayment.findMany({
      where: { paymentDate: { gte: sixMonthsAgo } },
      select: { amount: true, paymentDate: true },
    }),
    prisma.hostelPayment.findMany({
      where: { paymentDate: { gte: sixMonthsAgo } },
      select: { amount: true, paymentDate: true },
    }),
  ]);

  const monthlyData: Record<string, { category: number; hostel: number }> = {};
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Initialize last 6 months
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${months[d.getMonth()]} ${d.getFullYear()}`;
    monthlyData[key] = { category: 0, hostel: 0 };
  }

  categoryPayments.forEach((p) => {
    const key = `${months[p.paymentDate.getMonth()]} ${p.paymentDate.getFullYear()}`;
    if (monthlyData[key]) monthlyData[key].category += Number(p.amount);
  });

  hostelPayments.forEach((p) => {
    const key = `${months[p.paymentDate.getMonth()]} ${p.paymentDate.getFullYear()}`;
    if (monthlyData[key]) monthlyData[key].hostel += Number(p.amount);
  });

  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    category: data.category,
    hostel: data.hostel,
    total: data.category + data.hostel,
  }));
}

export async function getUtilityBills() {
  const bills = await prisma.inventoryBill.findMany({
    take: 10,
    orderBy: { billDate: "desc" },
    include: { category: { select: { name: true } } },
  });

  return bills.map((b) => ({
    id: b.id,
    category: b.category.name,
    amount: Number(b.amount),
    units: b.units ? Number(b.units) : null,
    billDate: b.billDate,
    periodStartDate: b.periodStartDate,
    periodEndDate: b.periodEndDate,
  }));
}
