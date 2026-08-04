"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { IInventoryItem, IInventoryCategory, ItemFilters, DashboardStats } from "../types/inventory-types";
import { VALIDATION_CONSTANTS } from "../constants/inventory-constants";
import { requireInventoryAccess } from "../lib/auth-utils";

// Validation Schemas (internal use only)
const itemSchema = z.object({
  name: z
    .string()
    .min(VALIDATION_CONSTANTS.ITEM_NAME_MIN_LENGTH, `Item name must be at least ${VALIDATION_CONSTANTS.ITEM_NAME_MIN_LENGTH} characters`)
    .max(VALIDATION_CONSTANTS.ITEM_NAME_MAX_LENGTH, `Item name must not exceed ${VALIDATION_CONSTANTS.ITEM_NAME_MAX_LENGTH} characters`),
  description: z
    .string()
    .max(VALIDATION_CONSTANTS.ITEM_DESCRIPTION_MAX_LENGTH, `Description must not exceed ${VALIDATION_CONSTANTS.ITEM_DESCRIPTION_MAX_LENGTH} characters`)
    .optional(),
  categoryId: z.string().min(1, "Category is required"),
  sku: z
    .string()
    .min(VALIDATION_CONSTANTS.ITEM_SKU_MIN_LENGTH, `SKU must be at least ${VALIDATION_CONSTANTS.ITEM_SKU_MIN_LENGTH} characters`)
    .max(VALIDATION_CONSTANTS.ITEM_SKU_MAX_LENGTH, `SKU must not exceed ${VALIDATION_CONSTANTS.ITEM_SKU_MAX_LENGTH} characters`)
    .regex(VALIDATION_CONSTANTS.ITEM_SKU_PATTERN, "SKU must contain only uppercase letters, numbers, and hyphens"),
  unit: z.string().min(1, "Unit is required"),
  minStockThreshold: z
    .number()
    .min(VALIDATION_CONSTANTS.MIN_STOCK_THRESHOLD_MIN, `Minimum stock threshold must be at least ${VALIDATION_CONSTANTS.MIN_STOCK_THRESHOLD_MIN}`)
    .max(VALIDATION_CONSTANTS.MIN_STOCK_THRESHOLD_MAX, `Minimum stock threshold must not exceed ${VALIDATION_CONSTANTS.MIN_STOCK_THRESHOLD_MAX}`),
  unitPrice: z
    .number()
    .min(VALIDATION_CONSTANTS.UNIT_PRICE_MIN, `Unit price must be at least ${VALIDATION_CONSTANTS.UNIT_PRICE_MIN}`)
    .max(VALIDATION_CONSTANTS.UNIT_PRICE_MAX, `Unit price must not exceed ${VALIDATION_CONSTANTS.UNIT_PRICE_MAX}`)
    .optional(),
  isActive: z.boolean().default(true),
  vendorIds: z.array(z.string()).optional(),
});

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  description: z.string().optional(),
  isBilling: z.boolean().default(false),
});

// Category Management Actions
export async function getCategories(isBilling?: boolean): Promise<IInventoryCategory[]> {
  try {
    // Check access control
    await requireInventoryAccess();

    const categories = await prisma.inventoryCategory.findMany({
      where: isBilling !== undefined ? { isBilling } : undefined,
      orderBy: { name: "asc" },
    });

    return categories as IInventoryCategory[];
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function createCategory(formData: FormData) {
  try {
    // Check access control
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) creating category`);

    const data = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string | null) || undefined,
      isBilling: formData.get("isBilling") === "true",
    };

    // Validate data
    const validatedData = categorySchema.parse(data);

    // Create category
    const category = await prisma.inventoryCategory.create({
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
    console.error("Error creating category:", error);

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
    }

    return { success: false, error: "Failed to create category" };
  }
}

// Item CRUD Actions
export async function getItems(filters?: ItemFilters): Promise<IInventoryItem[]> {
  try {
    // Check access control
    await requireInventoryAccess();

    const where: Prisma.InventoryItemWhereInput = {
      isDeleted: false,
    };

    if (filters) {
      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }

      if (filters.lowStock) {
        where.currentStock = {
          lte: prisma.inventoryItem.fields.minStockThreshold,
        };
      }

      if (filters.searchQuery) {
        where.OR = [
          { name: { contains: filters.searchQuery, mode: "insensitive" } },
          { sku: { contains: filters.searchQuery, mode: "insensitive" } },
          { description: { contains: filters.searchQuery, mode: "insensitive" } },
        ];
      }
    }

    const items = await prisma.inventoryItem.findMany({
      where,
      include: {
        category: true,
        vendors: {
          include: {
            vendor: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
    })) as IInventoryItem[];
  } catch (error) {
    console.error("Error fetching items:", error);
    throw new Error("Failed to fetch items");
  }
}

export async function getItemById(id: string): Promise<IInventoryItem | null> {
  try {
    // Check access control
    await requireInventoryAccess();

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
        vendors: {
          include: {
            vendor: true,
          },
        },
        transactions: {
          orderBy: { transactionDate: "desc" },
          take: 20,
        },
        issuances: {
          include: {
            student: true,
          },
          orderBy: { issuedDate: "desc" },
          take: 10,
        },
      },
    });

    if (!item) {
      return null;
    }

    return {
      ...item,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
    } as unknown as IInventoryItem;
  } catch (error) {
    console.error("Error fetching item:", error);
    throw new Error("Failed to fetch item");
  }
}

export async function createItem(formData: FormData) {
  try {
    // Check access control
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) creating item`);

    const vendorIdsString = formData.get("vendorIds") as string;
    const vendorIds = vendorIdsString ? JSON.parse(vendorIdsString) : [];

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string | undefined,
      categoryId: formData.get("categoryId") as string,
      sku: formData.get("sku") as string,
      unit: formData.get("unit") as string,
      minStockThreshold: parseInt(formData.get("minStockThreshold") as string),
      unitPrice: formData.get("unitPrice") ? parseFloat(formData.get("unitPrice") as string) : undefined,
      isActive: formData.get("isActive") === "true",
      vendorIds,
    };

    // Validate data
    const validatedData = itemSchema.parse(data);

    // Create item with vendor associations
    const item = await prisma.inventoryItem.create({
      data: {
        name: validatedData.name,
        description: validatedData.description || null,
        categoryId: validatedData.categoryId,
        sku: validatedData.sku,
        unit: validatedData.unit,
        minStockThreshold: validatedData.minStockThreshold,
        unitPrice: validatedData.unitPrice || null,
        isActive: validatedData.isActive,
        currentStock: 0,
        vendors: validatedData.vendorIds && validatedData.vendorIds.length > 0
          ? {
              create: validatedData.vendorIds.map((vendorId) => ({
                vendorId,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        vendors: {
          include: {
            vendor: true,
          },
        },
      },
    });

    revalidatePath("/admin/inventory/items");
    return { success: true, data: item };
  } catch (error) {
    console.error("Error creating item:", error);

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
          error: "An item with this SKU already exists",
        };
      }
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Invalid category or vendor selected",
        };
      }
    }

    return { success: false, error: "Failed to create item" };
  }
}

export async function updateItem(id: string, formData: FormData) {
  try {
    // Check access control
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) updating item ${id}`);

    const vendorIdsString = formData.get("vendorIds") as string;
    const vendorIds = vendorIdsString ? JSON.parse(vendorIdsString) : [];

    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string | undefined,
      categoryId: formData.get("categoryId") as string,
      sku: formData.get("sku") as string,
      unit: formData.get("unit") as string,
      minStockThreshold: parseInt(formData.get("minStockThreshold") as string),
      unitPrice: formData.get("unitPrice") ? parseFloat(formData.get("unitPrice") as string) : undefined,
      isActive: formData.get("isActive") === "true",
      vendorIds,
    };

    // Validate data
    const validatedData = itemSchema.parse(data);

    // Update item and vendor associations
    const item = await prisma.$transaction(async (tx) => {
      // Delete existing vendor associations
      await tx.vendorItem.deleteMany({
        where: { itemId: id },
      });

      // Update item with new vendor associations
      return tx.inventoryItem.update({
        where: { id },
        data: {
          name: validatedData.name,
          description: validatedData.description || null,
          categoryId: validatedData.categoryId,
          sku: validatedData.sku,
          unit: validatedData.unit,
          minStockThreshold: validatedData.minStockThreshold,
          unitPrice: validatedData.unitPrice || null,
          isActive: validatedData.isActive,
          vendors: validatedData.vendorIds && validatedData.vendorIds.length > 0
            ? {
                create: validatedData.vendorIds.map((vendorId) => ({
                  vendorId,
                })),
              }
            : undefined,
        },
        include: {
          category: true,
          vendors: {
            include: {
              vendor: true,
            },
          },
        },
      });
    });

    revalidatePath("/admin/inventory/items");
    revalidatePath(`/admin/inventory/items/${id}`);
    return { success: true, data: item };
  } catch (error) {
    console.error("Error updating item:", error);

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
          error: "An item with this SKU already exists",
        };
      }
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Item not found",
        };
      }
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Invalid category or vendor selected",
        };
      }
    }

    return { success: false, error: "Failed to update item" };
  }
}

// Soft Delete Item Action
export async function deleteItem(id: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) soft-deleting item ${id}`);

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, name: true, isDeleted: true },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (item.isDeleted) {
      return { success: false, error: "Item is already in trash" };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    revalidatePath("/admin/inventory/items");
    return { success: true };
  } catch (error) {
    console.error("Error soft-deleting item:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Item not found" };
      }
    }

    return { success: false, error: "Failed to delete item" };
  }
}

// Get Deleted Items Action
export async function getDeletedItems(): Promise<IInventoryItem[]> {
  try {
    await requireInventoryAccess();

    const items = await prisma.inventoryItem.findMany({
      where: { isDeleted: true },
      include: {
        category: true,
        vendors: {
          include: { vendor: true },
        },
      },
      orderBy: { deletedAt: "desc" },
    });

    return items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
    })) as IInventoryItem[];
  } catch (error) {
    console.error("Error fetching deleted items:", error);
    throw new Error("Failed to fetch deleted items");
  }
}

// Restore Item Action
export async function restoreItem(id: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) restoring item ${id}`);

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, name: true, isDeleted: true, sku: true },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (!item.isDeleted) {
      return { success: false, error: "Item is not in trash" };
    }

    // Check if restoring would cause a SKU conflict with an active item
    const existingItem = await prisma.inventoryItem.findFirst({
      where: {
        sku: item.sku,
        isDeleted: false,
        id: { not: id },
      },
    });

    if (existingItem) {
      return {
        success: false,
        error: `Cannot restore: another active item with SKU "${item.sku}" already exists`,
      };
    }

    await prisma.inventoryItem.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    revalidatePath("/admin/inventory/items");
    return { success: true };
  } catch (error) {
    console.error("Error restoring item:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Item not found" };
      }
    }

    return { success: false, error: "Failed to restore item" };
  }
}

// Permanent Delete Item Action
export async function permanentDeleteItem(id: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) permanently deleting item ${id}`);

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      select: { id: true, name: true, isDeleted: true },
    });

    if (!item) {
      return { success: false, error: "Item not found" };
    }

    if (!item.isDeleted) {
      return { success: false, error: "Item must be in trash before permanent deletion" };
    }

    // Check for related records that prevent permanent deletion
    const relatedRecords = await prisma.inventoryItem.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            orderItems: true,
            issuances: true,
            transactions: true,
            vendors: true,
          },
        },
      },
    });

    const counts = relatedRecords?._count;
    if (counts && (counts.orderItems > 0 || counts.issuances > 0 || counts.transactions > 0)) {
      const reasons: string[] = [];
      if (counts.orderItems > 0) reasons.push(`${counts.orderItems} order(s)`);
      if (counts.issuances > 0) reasons.push(`${counts.issuances} issuance(s)`);
      if (counts.transactions > 0) reasons.push(`${counts.transactions} stock transaction(s)`);

      return {
        success: false,
        error: `Cannot permanently delete "${item.name}" because it has related records: ${reasons.join(", ")}. Restore the item instead.`,
      };
    }

    // Safe to delete — remove vendor associations first, then the item
    await prisma.$transaction(async (tx) => {
      await tx.vendorItem.deleteMany({ where: { itemId: id } });
      await tx.inventoryItem.delete({ where: { id } });
    });

    revalidatePath("/admin/inventory/items");
    return { success: true };
  } catch (error) {
    console.error("Error permanently deleting item:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Item not found" };
      }
    }

    return { success: false, error: "Failed to permanently delete item" };
  }
}

// Stock Validation Helper
export async function validateStockAvailability(itemId: string, requestedQuantity: number): Promise<{ valid: boolean; error?: string }> {
  try {
    // Check access control
    await requireInventoryAccess();

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
      select: { currentStock: true, name: true },
    });

    if (!item) {
      return { valid: false, error: "Item not found" };
    }

    if (item.currentStock < requestedQuantity) {
      return {
        valid: false,
        error: `Insufficient stock for ${item.name}. Available: ${item.currentStock}, Requested: ${requestedQuantity}`,
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("Error validating stock:", error);
    return { valid: false, error: "Failed to validate stock availability" };
  }
}

// Get low stock items
export async function getLowStockItems(): Promise<IInventoryItem[]> {
  try {
    // Check access control
    await requireInventoryAccess();

    const items = await prisma.$queryRaw<IInventoryItem[]>`
      SELECT * FROM "InventoryItem"
      WHERE "currentStock" <= "minStockThreshold"
      AND "isActive" = true
      AND "isDeleted" = false
      ORDER BY ("currentStock"::float / NULLIF("minStockThreshold", 0)) ASC
    `;

    return items.map((item) => ({
      ...item,
      unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
    })) as IInventoryItem[];
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    throw new Error("Failed to fetch low stock items");
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  await requireInventoryAccess();

  const [allItems, recentTransactions, pendingOrdersList] = await Promise.all([
    prisma.inventoryItem.findMany({
      where: { isActive: true, isDeleted: false },
      include: { category: true },
    }),
    prisma.stockTransaction.findMany({
      orderBy: { transactionDate: "desc" },
      take: 10,
      include: { item: { include: { category: true } } },
    }),
    prisma.order.findMany({
      where: { status: { in: ["PENDING", "PARTIALLY_RECEIVED"] } },
      orderBy: { orderDate: "desc" },
      take: 5,
      include: { vendor: true, items: { include: { item: true } } },
    }),
  ]);

  const lowStockItems = allItems.filter((i) => i.currentStock <= i.minStockThreshold);
  const totalValue = allItems.reduce((sum, i) => sum + i.currentStock * (i.unitPrice?.toNumber() ?? 0), 0);

  const [pendingOrders, recentIssuances] = await Promise.all([
    prisma.order.count({ where: { status: { in: ["PENDING", "PARTIALLY_RECEIVED"] } } }),
    prisma.studentIssuance.count({
      where: { issuedDate: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);

  return {
    totalItems: allItems.length,
    lowStockCount: lowStockItems.length,
    pendingOrders,
    recentIssuances,
    totalValue,
    lowStockItems: lowStockItems.slice(0, 10) as unknown as IInventoryItem[],
    recentTransactions: recentTransactions as unknown as DashboardStats["recentTransactions"],
    pendingOrdersList: pendingOrdersList as unknown as DashboardStats["pendingOrdersList"],
  };
}
