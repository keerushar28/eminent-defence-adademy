"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";



/**
 * Get subcategories that a student is selected for (not allocations)
 */
export async function getStudentSelectedSubCategories(studentId: string) {
  try {
    const selections = await prisma.subCategorySelection.findMany({
      where: { studentId },
      select: {
        subCategoryId: true,
      },
    });

    return selections.map((s) => s.subCategoryId);
  } catch (error) {
    console.error("Error fetching student selected subcategories:", error);
    return [];
  }
}

/**
 * Update student subcategory selections (replace all)
 */
export async function updateStudentSubCategorySelections(
  studentId: string,
  subCategoryIds: string[]
) {
  try {
    // Delete all existing selections
    await prisma.subCategorySelection.deleteMany({
      where: { studentId },
    });

    // Create new selections
    if (subCategoryIds.length > 0) {
      await prisma.subCategorySelection.createMany({
        data: subCategoryIds.map((subCategoryId) => ({
          studentId,
          subCategoryId,
        })),
      });
    }

    revalidatePath("/admin/students");
    revalidatePath("/admin/students/selected");

    return {
      success: true,
      message: `Updated selections for ${subCategoryIds.length} subcategory(ies)`,
    };
  } catch (error) {
    console.error("Error updating subcategory selections:", error);
    return { success: false, error: "Failed to update subcategory selections" };
  }
}
