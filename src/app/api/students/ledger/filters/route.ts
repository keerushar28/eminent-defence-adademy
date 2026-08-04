import { NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get unique categories
    const categories = await prisma.category.findMany({
      select: {
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get all sub categories
    const subCategories = await prisma.subCategory.findMany({
      select: {
        id: true,
        name: true,
        categoryId: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    // Get unique payment methods from payments
    const paymentMethods = await prisma.categoryPayment.findMany({
      select: {
        paymentMethod: true,
      },
      distinct: ["paymentMethod"],
    });

    return NextResponse.json({
      categories: categories.map((c) => c.name),
      subCategories,
      paymentMethods: paymentMethods.map((p) => p.paymentMethod),
    });
  } catch (error) {
    console.error("Error fetching filters:", error);
    return NextResponse.json(
      { error: "Failed to fetch filters" },
      { status: 500 }
    );
  }
}
