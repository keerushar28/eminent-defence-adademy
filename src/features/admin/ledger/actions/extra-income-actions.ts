"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/core/lib/auth";
import { Prisma, PaymentMethod } from "@prisma/client";
import { PayerType } from "../types";

export interface CreateExtraIncomeInput {
  amount: number;
  incomeDate: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  title: string;
  category: string;
  payerType: PayerType;
  payerName?: string;
  payerContact?: string;
  referenceNumber?: string;
  notes?: string;
  itemId?: string;
  quantity?: number;
}

export async function addExtraIncome(input: CreateExtraIncomeInput): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized: No valid session found" };
    }

    const role = (session.user as { role?: string }).role || "STAFF";
    if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return { success: false, error: "Only admins can record extra income" };
    }

    const amount = Number(input.amount);
    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: "Please enter a valid income amount" };
    }

    if (!input.title?.trim()) {
      return { success: false, error: "Please enter a title / description" };
    }

    const parsedDate = new Date(input.incomeDate);
    if (isNaN(parsedDate.getTime())) {
      return { success: false, error: "Invalid income date" };
    }

    const quantity = Math.max(1, Number(input.quantity) || 1);

    await prisma.$transaction(async (tx) => {
      const qtyNote =
        input.quantity && Number(input.quantity) > 1
          ? `${input.notes || ""} [Qty: ${Number(input.quantity)}]`.trim()
          : input.notes || null;

      const createdEntry = await tx.ledgerEntry.create({
        data: {
          type: "INCOME",
          category: "EXTRA_INCOME",
          description: `${input.title.trim()}${input.category?.trim() ? ` - ${input.category.trim()}` : ""}`,
          amount: new Prisma.Decimal(amount),
          paymentMethod: input.paymentMethod,
          referenceNumber: input.referenceNumber || null,
          referenceId: input.itemId || null,
          referenceType: "EXTRA_INCOME",
          recordedBy: session.user.id,
          recordedDate: parsedDate,
          notes: qtyNote,
          payerName: input.payerName || null,
          payerType: input.payerType,
          payerContact: input.payerContact || null,
        },
      });

      // Optional inventory item sale: verify stock and decrement it
      if (input.itemId) {
        const item = await tx.inventoryItem.findUnique({
          where: { id: input.itemId },
        });

        if (!item || !item.isActive || item.isDeleted) {
          throw new Error("Selected inventory item is not available");
        }

        if (item.currentStock < quantity) {
          throw new Error(
            `Insufficient stock for ${item.name}. Available: ${item.currentStock} ${item.unit}`
          );
        }

        const updatedItem = await tx.inventoryItem.update({
          where: { id: input.itemId },
          data: {
            currentStock: {
              decrement: quantity,
            },
          },
        });

        await tx.stockTransaction.create({
          data: {
            itemId: input.itemId,
            transactionType: "STOCK_OUT",
            quantity,
            balanceAfter: updatedItem.currentStock,
            reason: `Extra income sale: ${input.title.trim()}`,
            referenceId: createdEntry.id,
            referenceType: "EXTRA_INCOME",
            performedBy: session.user.id,
            notes: `Sold via extra income${input.payerName ? ` to ${input.payerName}` : ""}`,
          },
        });
      }

      return createdEntry;
    });

    revalidatePath("/admin/ledger/income");
    revalidatePath("/admin/ledger/overall-summary");
    revalidatePath("/admin/inventory");

    return { success: true };
  } catch (error) {
    console.error("Error adding extra income:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "Failed to add extra income" };
  }
}
