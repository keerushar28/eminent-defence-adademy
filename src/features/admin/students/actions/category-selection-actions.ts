"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleCategorySelection(studentId: string, subCategoryId: string) {
  try {
    const existing = await prisma.subCategorySelection.findUnique({
      where: {
        studentId_subCategoryId: { studentId, subCategoryId },
      },
    });

    if (existing) {
      await prisma.subCategorySelection.delete({
        where: { id: existing.id },
      });
    } else {
      await prisma.subCategorySelection.create({
        data: { studentId, subCategoryId },
      });
    }

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/selected");

    return {
      success: true,
      isSelected: !existing,
      message: existing ? "Deselected from category" : "Selected for category",
    };
  } catch (error) {
    console.error("Error toggling category selection:", error);
    return { success: false, error: "Failed to toggle selection" };
  }
}

export async function getStudentsByCategory(
  subCategoryId: string,
  searchQuery?: string,
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  limit: number = 20
) {
  try {
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, unknown> = {
      subCategoryId,
    };

    if (searchQuery) {
      where.student = {
        OR: [
          { fullname: { contains: searchQuery, mode: "insensitive" } },
          { email: { contains: searchQuery, mode: "insensitive" } },
          { citizenship_number: { contains: searchQuery, mode: "insensitive" } },
        ],
      };
    }

    if (startDate && endDate) {
      where.selectedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [selections, total] = await Promise.all([
      prisma.subCategorySelection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { selectedAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              email: true,
              student_image: true,
              citizenship_number: true,
              contact_number_student: true,
              dob: true,
              gender: true,
              createdAt: true,
            },
          },
          subCategory: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.subCategorySelection.count({ where }),
    ]);

    return {
      selections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching students by category:", error);
    throw error;
  }
}

export async function getSelectedStudentsByCategories(
  subCategoryIds?: string[],
  searchQuery?: string,
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  limit: number = 20
) {
  try {
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, unknown> = {};

    if (subCategoryIds && subCategoryIds.length > 0) {
      where.subCategoryId = { in: subCategoryIds };
    }

    if (searchQuery) {
      where.student = {
        OR: [
          { fullname: { contains: searchQuery, mode: "insensitive" } },
          { email: { contains: searchQuery, mode: "insensitive" } },
          { citizenship_number: { contains: searchQuery, mode: "insensitive" } },
        ],
      };
    }

    if (startDate && endDate) {
      where.selectedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [selections, total] = await Promise.all([
      prisma.subCategorySelection.findMany({
        where,
        skip,
        take: limit,
        orderBy: { selectedAt: "desc" },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              email: true,
              student_image: true,
              citizenship_number: true,
              contact_number_student: true,
              dob: true,
              gender: true,
              createdAt: true,
            },
          },
          subCategory: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.subCategorySelection.count({ where }),
    ]);

    return {
      selections,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching selected students by categories:", error);
    throw error;
  }
}

export async function getStudentCategorySelections(studentId: string) {
  try {
    const selections = await prisma.subCategorySelection.findMany({
      where: { studentId },
      include: {
        subCategory: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return selections.map((s: Record<string, unknown>) => (s.subCategory as Record<string, unknown>).id);
  } catch (error) {
    console.error("Error fetching student category selections:", error);
    return [];
  }
}

export async function clearCategorySelections(subCategoryId: string) {
  try {
    await prisma.subCategorySelection.deleteMany({
      where: { subCategoryId },
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/selected");

    return { success: true, message: "All selections cleared for this category" };
  } catch (error) {
    console.error("Error clearing category selections:", error);
    return { success: false, error: "Failed to clear selections" };
  }
}
