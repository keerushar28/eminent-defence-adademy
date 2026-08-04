"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireInventoryAccess } from "../lib/auth-utils";

// Validation Schema
const paymentSchema = z.object({
  amount: z.number().positive("Amount must be greater than zero"),
  paymentDate: z.string().refine((date) => {
    // Accept both date (YYYY-MM-DD) and datetime formats
    const dateRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2})?/;
    return dateRegex.test(date);
  }, "Invalid date format"),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE", "CARD"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

export async function createIssuancePayment(
  issuanceId: string,
  formData: FormData,
  createdBy?: string
) {
  try {
    // Check access control and get user
    const user = await requireInventoryAccess();
    const performingUserId = createdBy || user.id;
    console.log(
      `[AUDIT] User ${user.id} (${user.email}) creating issuance payment`
    );

    const data = {
      amount: Number(formData.get("amount")),
      paymentDate: formData.get("paymentDate") as string,
      paymentMethod: formData.get("paymentMethod") as string,
      referenceNumber: formData.get("referenceNumber") as string | undefined,
      notes: formData.get("notes") as string | undefined,
    };

    // Validate data
    const validatedData = paymentSchema.parse(data);

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get the issuance
      const issuance = await tx.studentIssuance.findUnique({
        where: { id: issuanceId },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
          item: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
          payments: true,
        },
      });

      if (!issuance) {
        throw new Error("Issuance not found");
      }

      // Calculate total amount for the issuance
      const unitPrice = Number(issuance.unitPrice) || 0;
      const totalAmount = issuance.quantity * unitPrice;
      const currentPaid = Number(issuance.totalPaid) || 0;
      const newTotalPaid = currentPaid + validatedData.amount;

      // Validate payment doesn't exceed total amount
      if (newTotalPaid > totalAmount) {
        throw new Error(
          `Payment amount exceeds remaining balance. Remaining: NPR ${(
            totalAmount - currentPaid
          ).toFixed(2)}`
        );
      }

      // Create payment record
      const payment = await tx.issuancePayment.create({
        data: {
          issuanceId,
          amount: new Prisma.Decimal(validatedData.amount),
          paymentDate: new Date(validatedData.paymentDate),
          paymentMethod: validatedData.paymentMethod,
          referenceNumber: validatedData.referenceNumber || null,
          notes: validatedData.notes || null,
          createdBy: performingUserId,
        },
      });

      // Update issuance totalPaid
      const updatedIssuance = await tx.studentIssuance.update({
        where: { id: issuanceId },
        data: {
          totalPaid: new Prisma.Decimal(newTotalPaid),
        },
        include: {
          student: {
            select: {
              id: true,
              fullname: true,
              email: true,
            },
          },
          item: {
            select: {
              id: true,
              name: true,
              unit: true,
            },
          },
          payments: true,
        },
      });

      // Create ledger entry for income
      await tx.ledgerEntry.create({
        data: {
          type: "INCOME",
          category: "INVENTORY_ISSUANCE",
          description: `Payment received for ${issuance.quantity} ${issuance.item?.unit} of ${issuance.item?.name} issued to ${issuance.student?.fullname}`,
          amount: new Prisma.Decimal(validatedData.amount),
          paymentMethod: validatedData.paymentMethod,
          referenceNumber: validatedData.referenceNumber || null,
          referenceId: issuanceId,
          referenceType: "ISSUANCE_PAYMENT",
          recordedBy: performingUserId,
          recordedDate: new Date(validatedData.paymentDate),
          notes: validatedData.notes || null,
        },
      });

      return {
        payment,
        issuance: updatedIssuance,
      };
    });

    revalidatePath("/admin/inventory/issuances");
    revalidatePath(`/admin/inventory/issuances/${issuanceId}`);
    revalidatePath("/admin/ledger/income");

    return {
      success: true,
      data: result,
      message: "Payment recorded successfully",
    };
  } catch (error) {
    console.error("Error creating issuance payment:", error);

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

    return { success: false, error: "Failed to create payment" };
  }
}

export async function getIssuancePayments(issuanceId: string) {
  try {
    // Check access control
    await requireInventoryAccess();

    const payments = await prisma.issuancePayment.findMany({
      where: { issuanceId },
      orderBy: { paymentDate: "desc" },
    });

    return payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    }));
  } catch (error) {
    console.error("Error fetching issuance payments:", error);
    throw new Error("Failed to fetch payments");
  }
}

export async function getAllIssuancePayments(filters?: {
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  paymentMethod?: string;
}) {
  try {
    await requireInventoryAccess();

    const where: Prisma.IssuancePaymentWhereInput = {};

    if (filters?.paymentMethod && filters.paymentMethod !== "all") {
      where.paymentMethod = filters.paymentMethod;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) where.paymentDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.paymentDate.lte = new Date(filters.dateTo);
    }

    if (filters?.search) {
      where.issuance = {
        student: {
          fullname: { contains: filters.search, mode: "insensitive" },
        },
      };
    }

    const payments = await prisma.issuancePayment.findMany({
      where,
      include: {
        issuance: {
          include: {
            student: {
              select: { id: true, fullname: true, email: true },
            },
            item: {
              select: { id: true, name: true, unit: true, category: { select: { name: true } } },
            },
          },
        },
      },
      orderBy: { paymentDate: "desc" },
    });

    return payments.map((p) => ({
      ...p,
      amount: Number(p.amount),
    }));
  } catch (error) {
    console.error("Error fetching all issuance payments:", error);
    throw new Error("Failed to fetch payments");
  }
}

export async function deleteIssuancePayment(paymentId: string) {
  try {
    // Check access control and get user
    const user = await requireInventoryAccess();
    console.log(
      `[AUDIT] User ${user.id} (${user.email}) deleting issuance payment`
    );

    // Use Prisma transaction for atomicity
    const result = await prisma.$transaction(async (tx) => {
      // Get the payment
      const payment = await tx.issuancePayment.findUnique({
        where: { id: paymentId },
        include: {
          issuance: {
            select: {
              id: true,
              quantity: true,
              unitPrice: true,
              totalPaid: true,
            },
          },
        },
      });

      if (!payment) {
        throw new Error("Payment not found");
      }

      // Delete the payment
      await tx.issuancePayment.delete({
        where: { id: paymentId },
      });

      // Update issuance totalPaid
      const newTotalPaid = Math.max(
        0,
        Number(payment.issuance.totalPaid || 0) - Number(payment.amount)
      );

      const updatedIssuance = await tx.studentIssuance.update({
        where: { id: payment.issuanceId },
        data: {
          totalPaid: new Prisma.Decimal(newTotalPaid),
        },
      });

      // Delete corresponding ledger entry
      await tx.ledgerEntry.deleteMany({
        where: {
          referenceId: payment.issuanceId,
          referenceType: "ISSUANCE_PAYMENT",
          id: payment.id, // Match by payment ID if possible
        },
      });

      return updatedIssuance;
    });

    revalidatePath("/admin/inventory/issuances");
    revalidatePath(`/admin/inventory/issuances/${result.id}`);
    revalidatePath("/admin/ledger/income");

    return {
      success: true,
      message: "Payment deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting issuance payment:", error);

    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: false, error: "Failed to delete payment" };
  }
}
