import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    // Build where clause for search
    const where = query
      ? {
          OR: [
            { fullname: { contains: query, mode: "insensitive" as const } },
            { email: { contains: query, mode: "insensitive" as const } },
            { contact_number_student: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {};

    // Fetch students with minimal data
    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        fullname: true,
        email: true,
        student_image: true,
        contact_number_student: true,
        studentCategories: {
          where: { isActive: true },
          select: {
            id: true,
            subCategory: {
              select: {
                id: true,
                name: true,
                category: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          take: 5, // Limit categories shown
        },
      },
      orderBy: {
        fullname: "asc",
      },
      take: limit,
    });

    return NextResponse.json({
      students,
      count: students.length,
      hasMore: students.length === limit,
    });
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json(
      { error: "Failed to search students" },
      { status: 500 }
    );
  }
}
