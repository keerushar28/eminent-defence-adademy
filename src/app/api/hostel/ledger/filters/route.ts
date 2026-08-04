import { NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get unique room numbers
    const rooms = await prisma.hostelRoom.findMany({
      select: { roomNumber: true },
      distinct: ["roomNumber"],
      orderBy: { roomNumber: "asc" },
    });

    // Get categories with their subcategories
    const categoriesWithSubs = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        subCategories: {
          select: {
            id: true,
            name: true,
            categoryId: true,
          },
          orderBy: { name: "asc" },
        },
      },
      orderBy: { name: "asc" },
    });

    // Get unique payment methods from hostel payments
    const paymentMethods = await prisma.hostelPayment.findMany({
      select: { paymentMethod: true },
      distinct: ["paymentMethod"],
    });

    // Flatten subcategories for easier consumption
    const subcategories = categoriesWithSubs.flatMap((cat) =>
      cat.subCategories.map((sub) => ({
        id: sub.id,
        name: sub.name,
        categoryId: cat.id,
      }))
    );

    return NextResponse.json({
      rooms: rooms.map((r: { roomNumber: string }) => r.roomNumber),
      categories: categoriesWithSubs.map((c: { id: string; name: string }) => ({
        id: c.id,
        name: c.name,
      })),
      subcategories,
      paymentMethods: paymentMethods.map((p: { paymentMethod: string }) => p.paymentMethod),
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
