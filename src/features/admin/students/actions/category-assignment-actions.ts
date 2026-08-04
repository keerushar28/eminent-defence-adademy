"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { PaymentMethod } from "@prisma/client";

export interface CategoryAssignment {
  subCategoryId: string;
  discountAmount: number;
  assignedDate?: Date;
  durationMonths?: number;
  notes?: string;
}

export async function assignCategoriesToStudent(
  studentId: string,
  assignments: CategoryAssignment[]
) {
  try {
    const alreadyAssigned: string[] = [];
    const successfullyAssigned: string[] = [];

    // Process each assignment (always create new records for re-allocations)
    for (const assignment of assignments) {
      // Get the subcategory to calculate final fee
      const subCategory = await prisma.subCategory.findUnique({
        where: { id: assignment.subCategoryId },
      });

      if (!subCategory) {
        continue;
      }

      const originalFee = Number(subCategory.fee);
      const discount = assignment.discountAmount;
      const finalFee = Math.max(0, originalFee - discount);

      // Check if there's an active assignment
      const activeAssignment = await prisma.studentCategory.findFirst({
        where: {
          studentId,
          subCategoryId: assignment.subCategoryId,
          isActive: true,
        },
      });

      if (activeAssignment) {
        // Already has an active assignment for this subcategory
        alreadyAssigned.push(subCategory.name);
        continue;
      }

      // Create new assignment (even if inactive ones exist)
      // Convert Date to YYYY-MM-DD format to avoid timezone issues
      let assignedDateValue = new Date();
      if (assignment.assignedDate instanceof Date) {
        const year = assignment.assignedDate.getFullYear();
        const month = String(assignment.assignedDate.getMonth() + 1).padStart(2, '0');
        const day = String(assignment.assignedDate.getDate()).padStart(2, '0');
        assignedDateValue = new Date(`${year}-${month}-${day}`);
      }

      await prisma.studentCategory.create({
        data: {
          studentId,
          subCategoryId: assignment.subCategoryId,
          discountAmount: discount,
          finalFee,
          totalPaid: 0,
          assignedDate: assignedDateValue,
          durationMonths: assignment.durationMonths,
          notes: assignment.notes,
        },
      });
      successfullyAssigned.push(subCategory.name);
    }

    revalidatePath("/admin/students");
    
    return { 
      success: true,
      alreadyAssigned,
      successfullyAssigned,
      message: alreadyAssigned.length > 0 
        ? `${successfullyAssigned.length} assigned. ${alreadyAssigned.length} already assigned: ${alreadyAssigned.join(", ")}`
        : undefined
    };
  } catch (error) {
    console.error("Error assigning categories:", error);
    return { success: false, error: "Failed to assign categories" };
  }
}

export async function removeStudentCategory(studentCategoryId: string) {
  try {
    // Soft delete - mark as inactive instead of deleting
    await prisma.studentCategory.update({
      where: { id: studentCategoryId },
      data: {
        isActive: false,
        checkedOutAt: new Date(),
      },
    });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    console.error("Error removing category:", error);
    return { success: false, error: "Failed to remove category" };
  }
}

export async function getStudentCategoryAssignments(studentId: string) {
  try {
    const assignments = await prisma.studentCategory.findMany({
      where: { studentId },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
        payments: {
          orderBy: {
            paymentDate: "desc",
          },
        },
      },
      orderBy: [
        { isActive: "desc" }, // Active first, then inactive
        { assignedAt: "desc" },
      ],
    });

    // Convert Decimal fields to numbers for client components
    return assignments.map(assignment => ({
      ...assignment,
      discountAmount: assignment.discountAmount.toNumber(),
      finalFee: assignment.finalFee.toNumber(),
      totalPaid: assignment.totalPaid.toNumber(),
      subCategory: assignment.subCategory ? {
        ...assignment.subCategory,
        fee: assignment.subCategory.fee.toNumber(),
      } : undefined,
      payments: assignment.payments.map(payment => ({
        ...payment,
        amount: payment.amount.toNumber(),
      })),
      isActive: assignment.isActive,
      checkedOutAt: assignment.checkedOutAt,
    }));
  } catch (error) {
    console.error("Error fetching category assignments:", error);
    throw new Error("Failed to fetch category assignments");
  }
}

export async function addCategoryPayment(
  studentCategoryId: string,
  amount: number,
  paymentMethod: string,
  referenceNumber: string | null,
  notes: string | null,
  createdBy: string
) {
  try {
    // Create payment record
    await prisma.categoryPayment.create({
      data: {
        studentCategoryId,
        amount,
        paymentMethod: paymentMethod as string,
        referenceNumber,
        notes,
        createdBy,
      },
    });

    // Update total paid in student category
    const studentCategory = await prisma.studentCategory.findUnique({
      where: { id: studentCategoryId },
      include: {
        payments: true,
      },
    });

    if (studentCategory) {
      const totalPaid = studentCategory.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );

      await prisma.studentCategory.update({
        where: { id: studentCategoryId },
        data: {
          totalPaid,
        },
      });
    }

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    console.error("Error adding payment:", error);
    return { success: false, error: "Failed to add payment" };
  }
}

export interface TransferCategoryData {
  fromStudentCategoryId: string;
  toSubCategoryId: string;
  returnType?: string;
  notes?: string;
}

export async function transferStudentCategory(data: TransferCategoryData) {
  try {
    // Get the source category assignment with all payments
    const fromCategory = await prisma.studentCategory.findUnique({
      where: { id: data.fromStudentCategoryId },
      include: {
        student: true,
        subCategory: {
          include: {
            category: true,
          },
        },
        payments: true,
      },
    });

    if (!fromCategory) {
      return { success: false, error: "Source category assignment not found" };
    }

    // Get the target subcategory
    const toSubCategory = await prisma.subCategory.findUnique({
      where: { id: data.toSubCategoryId },
      include: {
        category: true,
      },
    });

    if (!toSubCategory) {
      return { success: false, error: "Target category not found" };
    }

    const totalPaid = Number(fromCategory.totalPaid);
    const newCategoryFee = Number(toSubCategory.fee);
    const overpayment = totalPaid - newCategoryFee;

    // Validate return type if there's overpayment
    if (overpayment > 0) {
      if (!data.returnType || data.returnType.trim() === "") {
        return {
          success: false,
          error: "Please specify the return type (e.g., CASH, BANK_TRANSFER, etc.)",
        };
      }
    }

    // Check if already has active assignment for target category
    const existingAssignment = await prisma.studentCategory.findFirst({
      where: {
        studentId: fromCategory.studentId,
        subCategoryId: data.toSubCategoryId,
        isActive: true,
      },
    });

    if (existingAssignment) {
      return {
        success: false,
        error: `Student already has an active assignment for ${toSubCategory.category.name} - ${toSubCategory.name}`,
      };
    }

    // Calculate amounts
    const returnAmount = Math.max(0, overpayment);
    const transferAmount = Math.min(totalPaid, newCategoryFee);

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // 1. Create new category assignment
      const newStudentCategory = await tx.studentCategory.create({
        data: {
          studentId: fromCategory.studentId,
          subCategoryId: data.toSubCategoryId,
          discountAmount: 0,
          finalFee: newCategoryFee,
          totalPaid: transferAmount,
          assignedDate: new Date(),
          notes: data.notes
            ? `Transferred from ${fromCategory.subCategory.category?.name} - ${fromCategory.subCategory.name}. ${fromCategory.payments.length} payment(s) transferred. ${returnAmount > 0 ? `Returned NPR ${returnAmount.toLocaleString()} to student.` : ''} ${data.notes}`.trim()
            : `Transferred from ${fromCategory.subCategory.category?.name} - ${fromCategory.subCategory.name}. ${fromCategory.payments.length} payment(s) transferred. ${returnAmount > 0 ? `Returned NPR ${returnAmount.toLocaleString()} to student.` : ''}`.trim(),
        },
      });

      // 2. Transfer all payment records to the new category
      if (fromCategory.payments.length > 0) {
        await tx.categoryPayment.updateMany({
          where: { studentCategoryId: data.fromStudentCategoryId },
          data: { 
            studentCategoryId: newStudentCategory.id,
          },
        });
      }

      // 3. Delete the old category assignment (since all payments are transferred)
      await tx.studentCategory.delete({
        where: { id: data.fromStudentCategoryId },
      });

      // 4. Record return payment as expense in ledger if applicable
      if (returnAmount > 0) {
        await tx.ledgerEntry.create({
          data: {
            type: "EXPENSE",
            category: "CATEGORY_REFUND",
            description: `Refund for category transfer: ${fromCategory.student.fullname} - ${fromCategory.subCategory.category?.name} - ${fromCategory.subCategory.name} to ${toSubCategory.category.name} - ${toSubCategory.name}`,
            amount: returnAmount,
            paymentMethod: data.returnType as any,
            referenceId: newStudentCategory.id,
            referenceType: "CATEGORY_TRANSFER_REFUND",
            recordedBy: "system",
            notes: data.notes || `Category transfer refund via ${data.returnType}. Amount: NPR ${returnAmount.toLocaleString()}`,
          },
        });
      }
    });

    revalidatePath("/admin/categories/category-assignments");
    revalidatePath("/admin/students");

    return {
      success: true,
      message: `Successfully transferred category with ${fromCategory.payments.length} payment record(s). ${returnAmount > 0 ? `Returned NPR ${returnAmount.toLocaleString()} to student via ${data.returnType}.` : ""} Transferred: NPR ${transferAmount.toLocaleString()}.`,
    };
  } catch (error) {
    console.error("Error transferring category:", error);
    return { success: false, error: "Failed to transfer category" };
  }
}

export interface UpdateCategoryAssignmentData {
  assignedDate?: Date;
  discountAmount?: number;
  notes?: string;
}

export async function updateCategoryAssignment(
  studentCategoryId: string,
  data: UpdateCategoryAssignmentData
) {
  try {
    const existing = await prisma.studentCategory.findUnique({
      where: { id: studentCategoryId },
      include: { subCategory: true },
    });

    if (!existing) {
      return { success: false, error: "Assignment not found" };
    }

    // Recalculate finalFee if discount changed
    const discountAmount =
      data.discountAmount !== undefined
        ? data.discountAmount
        : Number(existing.discountAmount);
    const originalFee = Number(existing.subCategory.fee);
    const finalFee = Math.max(0, originalFee - discountAmount);

    let assignedDateValue: Date | undefined;
    if (data.assignedDate instanceof Date) {
      const year = data.assignedDate.getFullYear();
      const month = String(data.assignedDate.getMonth() + 1).padStart(2, "0");
      const day = String(data.assignedDate.getDate()).padStart(2, "0");
      assignedDateValue = new Date(`${year}-${month}-${day}`);
    }

    await prisma.studentCategory.update({
      where: { id: studentCategoryId },
      data: {
        ...(assignedDateValue ? { assignedDate: assignedDateValue } : {}),
        discountAmount,
        finalFee,
        notes: data.notes ?? existing.notes,
      },
    });

    revalidatePath("/admin/categories/category-assignments");
    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    console.error("Error updating category assignment:", error);
    return { success: false, error: "Failed to update assignment" };
  }
}
