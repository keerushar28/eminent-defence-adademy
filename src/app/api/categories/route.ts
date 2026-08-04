import { NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const includeSubcategories = searchParams.get("includeSubcategories") === "true";

    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        ...(includeSubcategories && {
          subCategories: {
            select: {
              id: true,
              name: true,
              fee: true,
            },
            orderBy: {
              name: "asc",
            },
          },
        }),
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
