"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireInventoryAccess } from "../lib/auth-utils";

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  isBilling: z.boolean().default(false),
});

export async function updateCategory(id: string, formData: FormData) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) updating category ${id}`);

    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string | null) || undefined,
      isBilling: formData.get("isBilling") === "true",
    };

    const validatedData = categorySchema.parse(data);

    const category = await prisma.inventoryCategory.update({
      where: { id },
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        isBilling: validatedData.isBilling,
      },
    });

    revalidatePath("/admin/inventory/items");
    revalidatePath("/admin/inventory/categories");
    revalidatePath("/admin/inventory/billing");
    return { success: true, data: category };
  } catch (error) {
    console.error("Error updating category:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return {
          success: false,
          error: "A category with this name already exists",
        };
      }
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Category not found",
        };
      }
    }

    return { success: false, error: "Failed to update category" };
  }
}

export async function deleteCategory(id: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) deleting category ${id}`);

    await prisma.inventoryCategory.delete({
      where: { id },
    });

    revalidatePath("/admin/inventory/items");
    revalidatePath("/admin/inventory/categories");
    revalidatePath("/admin/inventory/billing");
    return { success: true };
  } catch (error) {
    console.error("Error deleting category:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Category not found",
        };
      }
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Cannot delete category with associated items or bills",
        };
      }
    }

    return { success: false, error: "Failed to delete category" };
  }
}

export async function getBillingCategories(excludeNames?: string[]) {
  try {
    await requireInventoryAccess();

    const categories = await prisma.inventoryCategory.findMany({
      where: {
        isBilling: true,
        ...(excludeNames?.length ? { name: { notIn: excludeNames } } : {}),
      },
      orderBy: { name: "asc" },
    });

    return categories;
  } catch (error) {
    console.error("Error fetching billing categories:", error);
    throw new Error("Failed to fetch billing categories");
  }
}
