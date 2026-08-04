"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { IStudentIssuance, IssuanceStatus, IssuanceFilters } from "../types/inventory-types";
import { requireInventoryAccess } from "../lib/auth-utils";

// Validation Schemas
const issuanceSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  itemId: z.string().min(1, "Item is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  unitPrice: z.number().min(0, "Unit price must be a positive number").optional(),
  totalAmount: z.number().min(0, "Total amount must be a positive number").optional(),
  notes: z.string().optional(),
});

const returnIssuanceSchema = z.object({
  returnedQty: z.number().min(1, "Return quantity must be at least 1"),
  notes: z.string().optional(),
});

// Issuance CRUD Actions
export async function getIssuances(filters?: IssuanceFilters): Promise<IStudentIssuance[]> {
  try {
    // Check access control
    await requireInventoryAccess();

    const where: Prisma.StudentIssuanceWhereInput = {
      isDeleted: false,
    };

    if (filters) {
      if (filters.studentId) {
        where.studentId = filters.studentId;
      }

      if (filters.itemId) {
        where.itemId = filters.itemId;
      }

      if (filters.status) {
        where.status = filters.status;
      }

      if (filters.dateFrom || filters.dateTo) {
        where.issuedDate = {};
        if (filters.dateFrom) {
          where.issuedDate.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
          where.issuedDate.lte = filters.dateTo;
        }
      }
    }

    const issuances = await prisma.studentIssuance.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            student_image: true,
            email: true,
            contact_number_student: true,
          },
        },
        item: {
          include: {
            category: true,
          },
        },
      },
      orderBy: { issuedDate: "desc" },
    });

    return issuances.map((issuance) => ({
      ...issuance,
      unitPrice: issuance.unitPrice ? Number(issuance.unitPrice) : null,
      totalAmount: issuance.totalAmount ? Number(issuance.totalAmount) : null,
      totalPaid: issuance.totalPaid ? Number(issuance.totalPaid) : null,
      item: issuance.item ? {
        ...issuance.item,
        unitPrice: issuance.item.unitPrice ? Number(issuance.item.unitPrice) : null,
      } : undefined,
    })) as IStudentIssuance[];
  } catch (error) {
    console.error("Error fetching issuances:", error);
    throw new Error("Failed to fetch issuances");
  }
}

export async function getIssuanceById(id: string): Promise<IStudentIssuance | null> {
  try {
    // Check access control
    await requireInventoryAccess();

    const issuance = await prisma.studentIssuance.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            student_image: true,
            email: true,
            contact_number_student: true,
          },
        },
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!issuance) {
      return null;
    }

    return {
      ...issuance,
      unitPrice: issuance.unitPrice ? Number(issuance.unitPrice) : null,
      totalAmount: issuance.totalAmount ? Number(issuance.totalAmount) : null,
      totalPaid: issuance.totalPaid ? Number(issuance.totalPaid) : null,
      item: issuance.item ? {
        ...issuance.item,
        unitPrice: issuance.item.unitPrice ? Number(issuance.item.unitPrice) : null,
      } : undefined,
    } as IStudentIssuance;
  } catch (error) {
    console.error("Error fetching issuance:", error);
    throw new Error("Failed to fetch issuance");
  }
}

export async function createIssuance(formData: FormData, issuedBy?: string) {
  try {
    // Check access control and get user
    const user = await requireInventoryAccess();
    const performingUserId = issuedBy || user.id;
    console.log(`[AUDIT] User ${user.id} (${user.email}) creating issuance`);

    const data = {
      studentId: formData.get("studentId") as string,
      itemId: formData.get("itemId") as string,
      quantity: Number(formData.get("quantity")),
      unitPrice: Number(formData.get("unitPrice")) || 0,
      totalAmount: Number(formData.get("totalAmount")) || 0,
      notes: formData.get("notes") as string | undefined,
    };

    // Validate data
    const validatedData = issuanceSchema.parse(data);

    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: validatedData.studentId },
    });

    if (!student) {
      return {
        success: false,
        error: "Student not found",
      };
    }

    // Check if item exists and has sufficient stock
    const item = await prisma.inventoryItem.findUnique({
      where: { id: validatedData.itemId },
    });

    if (!item) {
      return {
        success: false,
        error: "Item not found",
      };
    }

    if (!item.isActive) {
      return {
        success: false,
        error: "Item is not active",
      };
    }

    if (item.currentStock < validatedData.quantity) {
      return {
        success: false,
        error: `Insufficient stock. Available: ${item.currentStock} ${item.unit}`,
      };
    }

    // Create issuance record (stock update will be handled by issueToStudent action)
    const issuance = await prisma.studentIssuance.create({
      data: {
        studentId: validatedData.studentId,
        itemId: validatedData.itemId,
        quantity: validatedData.quantity,
        issuedDate: new Date(),
        status: "ISSUED",
        issuedBy: performingUserId,
        notes: validatedData.notes || null,
      },
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            student_image: true,
            email: true,
            contact_number_student: true,
          },
        },
        item: {
          include: {
            category: true,
          },
        },
      },
    });

    revalidatePath("/admin/inventory/issuances");
    return { success: true, data: issuance };
  } catch (error) {
    console.error("Error creating issuance:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Invalid student or item selected",
        };
      }
    }

    return { success: false, error: "Failed to create issuance" };
  }
}

// Issue to Student Action with Stock Update
export async function issueToStudent(formData: FormData, issuedBy?: string) {
  try {
    // Check access control and get user
    const user = await requireInventoryAccess();
    const performingUserId = issuedBy || user.id;
    console.log(`[AUDIT] User ${user.id} (${user.email}) issuing item to student`);

    const data = {
      studentId: formData.get("studentId") as string,
      itemId: formData.get("itemId") as string,
      quantity: Number(formData.get("quantity")),
      unitPrice: Number(formData.get("unitPrice")) || 0,
      totalAmount: Number(formData.get("totalAmount")) || 0,
      notes: formData.get("notes") as string | undefined,
    };

    // Validate data
    const validatedData = issuanceSchema.parse(data);

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Check if student exists
      const student = await tx.student.findUnique({
        where: { id: validatedData.studentId },
        select: {
          id: true,
          fullname: true,
          student_image: true,
          email: true,
          contact_number_student: true,
        },
      });

      if (!student) {
        throw new Error("Student not found");
      }

      // Check if item exists and has sufficient stock
      const item = await tx.inventoryItem.findUnique({
        where: { id: validatedData.itemId },
        include: {
          category: true,
        },
      });

      if (!item) {
        throw new Error("Item not found");
      }

      if (!item.isActive) {
        throw new Error("Item is not active");
      }

      if (item.currentStock < validatedData.quantity) {
        throw new Error(
          `Insufficient stock. Available: ${item.currentStock} ${item.unit}`
        );
      }

      // Create issuance record
      const issuance = await tx.studentIssuance.create({
        data: {
          studentId: validatedData.studentId,
          itemId: validatedData.itemId,
          quantity: validatedData.quantity,
          unitPrice: new Prisma.Decimal(validatedData.unitPrice || 0),
          totalAmount: new Prisma.Decimal(validatedData.totalAmount || 0),
          issuedDate: new Date(),
          status: "ISSUED",
          issuedBy: performingUserId,
          notes: validatedData.notes || null,
        },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              student_image: true,
              email: true,
              contact_number_student: true,
            },
          },
          item: {
            include: {
              category: true,
            },
          },
        },
      });

      // Update item stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id: validatedData.itemId },
        data: {
          currentStock: {
            decrement: validatedData.quantity,
          },
        },
      });

      // Create stock transaction
      await tx.stockTransaction.create({
        data: {
          itemId: validatedData.itemId,
          transactionType: "STOCK_OUT",
          quantity: validatedData.quantity,
          balanceAfter: updatedItem.currentStock,
          reason: `Issued to student: ${student.fullname}`,
          referenceId: issuance.id,
          referenceType: "ISSUANCE",
          performedBy: performingUserId,
          notes: validatedData.notes || `Issued ${validatedData.quantity} ${item.unit} to ${student.fullname}`,
        },
      });

      return {
        issuance: {
          ...issuance,
          item: issuance.item ? {
            ...issuance.item,
            unitPrice: issuance.item.unitPrice ? Number(issuance.item.unitPrice) : null,
          } : undefined,
        },
      };
    });

    revalidatePath("/admin/inventory/issuances");
    revalidatePath("/admin/inventory/items");
    revalidatePath("/admin/inventory/transactions");
    revalidatePath(`/admin/students/${validatedData.studentId}`);

    return {
      success: true,
      data: result.issuance,
      message: `Item successfully issued to student`,
    };
  } catch (error) {
    console.error("Error issuing to student:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2003") {
        return {
          success: false,
          error: "Invalid student or item selected",
        };
      }
    }

    return { success: false, error: "Failed to issue item to student" };
  }
}

export async function returnIssuance(
  id: string,
  formData: FormData,
  performedBy?: string
) {
  try {
    // Check access control and get user
    const user = await requireInventoryAccess();
    const performingUserId = performedBy || user.id;
    console.log(`[AUDIT] User ${user.id} (${user.email}) returning issuance ${id}`);

    const data = {
      returnedQty: Number(formData.get("returnedQty")),
      notes: formData.get("notes") as string | undefined,
    };

    // Validate data
    const validatedData = returnIssuanceSchema.parse(data);

    // Get the issuance
    const issuance = await prisma.studentIssuance.findUnique({
      where: { id },
      include: {
        item: true,
        student: {
          select: {
            id: true,
            fullname: true,
            student_image: true,
            email: true,
            contact_number_student: true,
          },
        },
      },
    });

    if (!issuance) {
      return {
        success: false,
        error: "Issuance not found",
      };
    }

    if (issuance.status === "RETURNED") {
      return {
        success: false,
        error: "Issuance already fully returned",
      };
    }

    // Calculate total returned quantity
    const totalReturned = issuance.returnedQty + validatedData.returnedQty;

    if (totalReturned > issuance.quantity) {
      return {
        success: false,
        error: `Return quantity exceeds issued quantity. Issued: ${issuance.quantity}, Already returned: ${issuance.returnedQty}`,
      };
    }

    // Determine new status
    const newStatus: IssuanceStatus = 
      totalReturned === issuance.quantity ? "RETURNED" : "PARTIALLY_RETURNED";

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Update issuance record
      const updatedIssuance = await tx.studentIssuance.update({
        where: { id },
        data: {
          returnedQty: totalReturned,
          returnedDate: newStatus === "RETURNED" ? new Date() : issuance.returnedDate,
          status: newStatus,
          notes: validatedData.notes 
            ? `${issuance.notes || ""}\nReturn: ${validatedData.notes}`.trim()
            : issuance.notes,
        },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              student_image: true,
              email: true,
              contact_number_student: true,
            },
          },
          item: {
            include: {
              category: true,
            },
          },
        },
      });

      // Update item stock
      const updatedItem = await tx.inventoryItem.update({
        where: { id: issuance.itemId },
        data: {
          currentStock: {
            increment: validatedData.returnedQty,
          },
        },
      });

      // Create stock transaction
      await tx.stockTransaction.create({
        data: {
          itemId: issuance.itemId,
          transactionType: "RETURN",
          quantity: validatedData.returnedQty,
          balanceAfter: updatedItem.currentStock,
          reason: `Item returned from student: ${issuance.student?.fullname || "Unknown"}`,
          referenceId: id,
          referenceType: "ISSUANCE",
          performedBy: performingUserId,
          notes: validatedData.notes || `Returned ${validatedData.returnedQty} ${issuance.item.unit}`,
        },
      });

      return updatedIssuance;
    });

    revalidatePath("/admin/inventory/issuances");
    revalidatePath(`/admin/inventory/issuances/${id}`);
    revalidatePath("/admin/inventory/items");
    revalidatePath("/admin/inventory/transactions");

    return {
      success: true,
      data: result,
      message: `Item ${newStatus === "RETURNED" ? "fully" : "partially"} returned`,
    };
  } catch (error) {
    console.error("Error returning issuance:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Issuance not found",
        };
      }
    }

    return { success: false, error: "Failed to return issuance" };
  }
}

// Update Issuance Action (full edit with stock adjustment)
export async function updateIssuance(id: string, formData: FormData) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) updating issuance ${id}`);

    const issuance = await prisma.studentIssuance.findUnique({
      where: { id },
      include: {
        item: true,
      },
    });

    if (!issuance) {
      return { success: false, error: "Issuance not found" };
    }

    if (issuance.isDeleted) {
      return { success: false, error: "Cannot edit an issuance that is in trash" };
    }

    const newStudentId = formData.get("studentId") as string;
    const newItemId = formData.get("itemId") as string;
    const newQuantity = Number(formData.get("quantity"));
    const newUnitPrice = Number(formData.get("unitPrice")) || 0;
    const newStatus = formData.get("status") as string;
    const notes = formData.get("notes") as string | undefined;

    // Validate status
    const validStatuses = ["ISSUED", "PARTIALLY_RETURNED", "RETURNED"];
    if (!validStatuses.includes(newStatus)) {
      return { success: false, error: "Invalid status value" };
    }

    // Validate student exists
    const student = await prisma.student.findUnique({
      where: { id: newStudentId },
    });
    if (!student) {
      return { success: false, error: "Student not found" };
    }

    // Validate new item exists and is active
    const newItem = await prisma.inventoryItem.findUnique({
      where: { id: newItemId },
    });
    if (!newItem) {
      return { success: false, error: "Item not found" };
    }
    if (!newItem.isActive) {
      return { success: false, error: "Selected item is not active" };
    }

    // Quantity must be >= returnedQty
    if (newQuantity < issuance.returnedQty) {
      return {
        success: false,
        error: `Quantity cannot be less than already returned quantity (${issuance.returnedQty})`,
      };
    }

    const oldItemId = issuance.itemId;
    const oldQuantity = issuance.quantity;
    const itemChanged = oldItemId !== newItemId;
    const quantityChanged = oldQuantity !== newQuantity;

    // If item or quantity changed, check stock availability
    if (itemChanged || quantityChanged) {
      if (itemChanged) {
        if (newItem.currentStock < newQuantity) {
          return {
            success: false,
            error: `Insufficient stock for "${newItem.name}". Available: ${newItem.currentStock} ${newItem.unit}, Requested: ${newQuantity}`,
          };
        }
      } else {
        const qtyDiff = newQuantity - oldQuantity;
        if (qtyDiff > 0 && newItem.currentStock < qtyDiff) {
          return {
            success: false,
            error: `Insufficient stock. Need ${qtyDiff} more ${newItem.unit} but only ${newItem.currentStock} available.`,
          };
        }
      }
    }

    const totalAmount = newQuantity * newUnitPrice;

    // Use transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Handle stock adjustments
      if (itemChanged) {
        const updatedOldItem = await tx.inventoryItem.update({
          where: { id: oldItemId },
          data: { currentStock: { increment: oldQuantity } },
        });

        await tx.stockTransaction.create({
          data: {
            itemId: oldItemId,
            transactionType: "RETURN",
            quantity: oldQuantity,
            balanceAfter: updatedOldItem.currentStock,
            reason: `Issuance edited — item changed, returning ${oldQuantity} to stock`,
            referenceId: id,
            referenceType: "ISSUANCE",
            performedBy: user.id,
            notes: `Item changed from ${issuance.item?.name || oldItemId} to ${newItem.name}`,
          },
        });

        const updatedNewItem = await tx.inventoryItem.update({
          where: { id: newItemId },
          data: { currentStock: { decrement: newQuantity } },
        });

        await tx.stockTransaction.create({
          data: {
            itemId: newItemId,
            transactionType: "STOCK_OUT",
            quantity: newQuantity,
            balanceAfter: updatedNewItem.currentStock,
            reason: `Issuance edited — item changed, issuing ${newQuantity} from new item`,
            referenceId: id,
            referenceType: "ISSUANCE",
            performedBy: user.id,
            notes: `Item changed to ${newItem.name}`,
          },
        });
      } else if (quantityChanged) {
        const qtyDiff = newQuantity - oldQuantity;

        if (qtyDiff > 0) {
          const updatedItem = await tx.inventoryItem.update({
            where: { id: newItemId },
            data: { currentStock: { decrement: qtyDiff } },
          });

          await tx.stockTransaction.create({
            data: {
              itemId: newItemId,
              transactionType: "STOCK_OUT",
              quantity: qtyDiff,
              balanceAfter: updatedItem.currentStock,
              reason: `Issuance edited — quantity increased from ${oldQuantity} to ${newQuantity}`,
              referenceId: id,
              referenceType: "ISSUANCE",
              performedBy: user.id,
              notes: `Quantity changed: ${oldQuantity} → ${newQuantity}`,
            },
          });
        } else if (qtyDiff < 0) {
          const returnQty = Math.abs(qtyDiff);
          const updatedItem = await tx.inventoryItem.update({
            where: { id: newItemId },
            data: { currentStock: { increment: returnQty } },
          });

          await tx.stockTransaction.create({
            data: {
              itemId: newItemId,
              transactionType: "RETURN",
              quantity: returnQty,
              balanceAfter: updatedItem.currentStock,
              reason: `Issuance edited — quantity decreased from ${oldQuantity} to ${newQuantity}`,
              referenceId: id,
              referenceType: "ISSUANCE",
              performedBy: user.id,
              notes: `Quantity changed: ${oldQuantity} → ${newQuantity}`,
            },
          });
        }
      }

      // Update the issuance record
      const updatedIssuance = await tx.studentIssuance.update({
        where: { id },
        data: {
          studentId: newStudentId,
          itemId: newItemId,
          quantity: newQuantity,
          unitPrice: newUnitPrice,
          totalAmount: totalAmount,
          status: newStatus as any,
          notes: notes || null,
        },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              student_image: true,
              email: true,
              contact_number_student: true,
            },
          },
          item: {
            include: { category: true },
          },
        },
      });

      return updatedIssuance;
    });

    // Convert Decimal fields to plain numbers before returning
    const serializedResult = {
      ...result,
      unitPrice: result.unitPrice ? Number(result.unitPrice) : null,
      totalAmount: result.totalAmount ? Number(result.totalAmount) : null,
      totalPaid: result.totalPaid ? Number(result.totalPaid) : null,
      item: result.item
        ? {
            ...result.item,
            unitPrice: result.item.unitPrice ? Number(result.item.unitPrice) : null,
          }
        : undefined,
    };

    revalidatePath("/admin/student-issuances/issue-item");
    revalidatePath("/admin/inventory/items");
    revalidatePath("/admin/inventory/transactions");
    return { success: true, data: serializedResult };
  } catch (error) {
    console.error("Error updating issuance:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Issuance not found" };
      }
    }

    return { success: false, error: "Failed to update issuance" };
  }
}

// Soft Delete Issuance Action
export async function deleteIssuance(id: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) soft-deleting issuance ${id}`);

    const issuance = await prisma.studentIssuance.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });

    if (!issuance) {
      return { success: false, error: "Issuance not found" };
    }

    if (issuance.isDeleted) {
      return { success: false, error: "Issuance is already in trash" };
    }

    await prisma.studentIssuance.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    revalidatePath("/admin/student-issuances/issue-item");
    return { success: true };
  } catch (error) {
    console.error("Error soft-deleting issuance:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Issuance not found" };
      }
    }

    return { success: false, error: "Failed to delete issuance" };
  }
}

// Get Deleted Issuances Action
export async function getDeletedIssuances(): Promise<IStudentIssuance[]> {
  try {
    await requireInventoryAccess();

    const issuances = await prisma.studentIssuance.findMany({
      where: { isDeleted: true },
      include: {
        student: {
          select: {
            id: true,
            fullname: true,
            student_image: true,
            email: true,
            contact_number_student: true,
          },
        },
        item: {
          include: { category: true },
        },
      },
      orderBy: { deletedAt: "desc" },
    });

    return issuances.map((issuance) => ({
      ...issuance,
      unitPrice: issuance.unitPrice ? Number(issuance.unitPrice) : null,
      totalAmount: issuance.totalAmount ? Number(issuance.totalAmount) : null,
      totalPaid: issuance.totalPaid ? Number(issuance.totalPaid) : null,
      item: issuance.item ? {
        ...issuance.item,
        unitPrice: issuance.item.unitPrice ? Number(issuance.item.unitPrice) : null,
      } : undefined,
    })) as IStudentIssuance[];
  } catch (error) {
    console.error("Error fetching deleted issuances:", error);
    throw new Error("Failed to fetch deleted issuances");
  }
}

// Restore Issuance Action
export async function restoreIssuance(id: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) restoring issuance ${id}`);

    const issuance = await prisma.studentIssuance.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });

    if (!issuance) {
      return { success: false, error: "Issuance not found" };
    }

    if (!issuance.isDeleted) {
      return { success: false, error: "Issuance is not in trash" };
    }

    await prisma.studentIssuance.update({
      where: { id },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });

    revalidatePath("/admin/student-issuances/issue-item");
    return { success: true };
  } catch (error) {
    console.error("Error restoring issuance:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Issuance not found" };
      }
    }

    return { success: false, error: "Failed to restore issuance" };
  }
}

// Permanent Delete Issuance Action
export async function permanentDeleteIssuance(id: string) {
  try {
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) permanently deleting issuance ${id}`);

    const issuance = await prisma.studentIssuance.findUnique({
      where: { id },
      select: { id: true, isDeleted: true },
    });

    if (!issuance) {
      return { success: false, error: "Issuance not found" };
    }

    if (!issuance.isDeleted) {
      return { success: false, error: "Issuance must be in trash before permanent deletion" };
    }

    // Check for related payment records
    const paymentCount = await prisma.issuancePayment.count({
      where: { issuanceId: id },
    });

    if (paymentCount > 0) {
      return {
        success: false,
        error: `Cannot permanently delete this issuance because it has ${paymentCount} payment record(s). Restore the issuance instead.`,
      };
    }

    await prisma.studentIssuance.delete({
      where: { id },
    });

    revalidatePath("/admin/student-issuances/issue-item");
    return { success: true };
  } catch (error) {
    console.error("Error permanently deleting issuance:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return { success: false, error: "Issuance not found" };
      }
    }

    return { success: false, error: "Failed to permanently delete issuance" };
  }
}
