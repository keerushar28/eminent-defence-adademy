"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleStudentSelection(studentId: string) {
  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return { success: false, error: "Student not found" };
    }

    const updated = await prisma.student.update({
      where: { id: studentId },
      data: {
        isSelected: !student.isSelected,
        selectedAt: !student.isSelected ? new Date() : null,
      },
    });

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/selected");

    return {
      success: true,
      isSelected: updated.isSelected,
      message: updated.isSelected ? "Student selected" : "Student deselected",
    };
  } catch (error) {
    console.error("Error toggling student selection:", error);
    return { success: false, error: "Failed to toggle selection" };
  }
}

export async function getSelectedStudents(
  searchQuery?: string,
  subCategoryIds?: string[],
  startDate?: Date,
  endDate?: Date,
  page: number = 1,
  limit: number = 20
) {
  try {
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, unknown> = {
      isSelected: true,
    };

    if (searchQuery) {
      where.OR = [
        { fullname: { contains: searchQuery, mode: "insensitive" } },
        { email: { contains: searchQuery, mode: "insensitive" } },
        { citizenship_number: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Filter by subcategories (shows students selected for these subcategories)
    if (subCategoryIds && subCategoryIds.length > 0) {
      where.subCategorySelections = {
        some: {
          subCategoryId: { in: subCategoryIds },
        },
      };
    }

    if (startDate && endDate) {
      where.selectedAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: { selectedAt: "desc" },
        select: {
          id: true,
          fullname: true,
          email: true,
          student_image: true,
          citizenship_number: true,
          contact_number_student: true,
          dob: true,
          gender: true,
          selectedAt: true,
          createdAt: true,
          subCategorySelections: {
            select: {
              id: true,
              subCategory: {
                select: {
                  id: true,
                  name: true,
                  fee: true,
                  category: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.student.count({ where }),
    ]);

    // Convert Decimal to number for client component compatibility
    const serializedStudents = students.map((student) => ({
      ...student,
      subCategorySelections: student.subCategorySelections.map((selection) => ({
        ...selection,
        subCategory: {
          ...selection.subCategory,
          fee: Number(selection.subCategory.fee),
        },
      })),
    }));

    return {
      students: serializedStudents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error fetching selected students:", error);
    throw error;
  }
}

export async function getSelectedStudentsCount() {
  try {
    const count = await prisma.student.count({
      where: { isSelected: true },
    });
    return count;
  } catch (error) {
    console.error("Error fetching selected students count:", error);
    return 0;
  }
}
