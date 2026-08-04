import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    
    // Pagination
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    // Filters
    const search = searchParams.get("search") || "";
    const gender = searchParams.get("gender") || "ALL";
    const categoryId = searchParams.get("categoryId") || "";
    const subCategoryId = searchParams.get("subCategoryId") || "";

    // Build where clause
    const whereClause: Record<string, unknown> = {};

    // Search filter
    if (search) {
      whereClause.OR = [
        { fullname: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { contact_number_student: { contains: search, mode: "insensitive" } },
        { contact_number_parent: { contains: search, mode: "insensitive" } },
      ];
    }

    // Gender filter
    if (gender !== "ALL") {
      whereClause.gender = gender;
    }

    // Category filter
    if (categoryId) {
      whereClause.studentCategories = {
        some: {
          subCategory: {
            categoryId: categoryId,
          },
          isActive: true,
        },
      };
    }

    // SubCategory filter
    if (subCategoryId) {
      whereClause.studentCategories = {
        some: {
          subCategoryId: subCategoryId,
          isActive: true,
        },
      };
    }

    // Get total count for pagination
    const totalCount = await prisma.student.count({
      where: whereClause,
    });

    // Fetch students with pagination
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        studentCategories: {
          where: {
            isActive: true,
          },
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: limit,
    });

    // Transform data
    const formattedStudents = students.map((student) => ({
      ...student,
      studentCategories: student.studentCategories.map((sc) => ({
        ...sc,
        discountAmount: sc.discountAmount.toNumber(),
        finalFee: sc.finalFee.toNumber(),
        totalPaid: sc.totalPaid.toNumber(),
        subCategory: sc.subCategory
          ? {
              ...sc.subCategory,
              fee: sc.subCategory.fee.toNumber(),
            }
          : undefined,
      })),
    }));

    return NextResponse.json({
      students: formattedStudents,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No student IDs provided" },
        { status: 400 }
      );
    }

    // Delete students
    const result = await prisma.student.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
    });
  } catch (error) {
    console.error("Error deleting students:", error);
    return NextResponse.json(
      { error: "Failed to delete students" },
      { status: 500 }
    );
  }
}
