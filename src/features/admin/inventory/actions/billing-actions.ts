"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { requireInventoryAccess } from "../lib/auth-utils";

const billSchema = z.object({
    categoryId: z.string().min(1, "Category is required"),
    billingTitle: z.string().min(1, "Billing title is required").max(100, "Billing title cannot exceed 100 characters"),
    periodStartDate: z.string().min(1, "Period start date is required"),
    periodEndDate: z.string().min(1, "Period end date is required"),
    amount: z.number().min(0, "Amount must be positive"),
    units: z.number().min(0, "Units must be positive").optional(),
    billDate: z.string().min(1, "Bill date is required"),
    description: z.string().optional(),
});

export async function getBills(filters?: {
    categoryId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    page?: number;
    limit?: number;
    dateFilterType?: "period" | "billDate";
    excludeCategoryNames?: string[];
}) {
    try {
        await requireInventoryAccess();

        const page = filters?.page || 1;
        const limit = filters?.limit || 20;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};

        if (filters?.categoryId) {
            where.categoryId = filters.categoryId;
        }

        if (filters?.excludeCategoryNames?.length) {
            where.category = {
                name: { notIn: filters.excludeCategoryNames },
            };
        }

        // Date filtering - support both period dates and bill date
        const dateFilterType = filters?.dateFilterType || "period";
        
        if (filters?.dateFrom || filters?.dateTo) {
            if (dateFilterType === "billDate") {
                // Filter by bill date
                const billDateFilter: Record<string, Date> = {};
                if (filters.dateFrom) {
                    billDateFilter.gte = new Date(filters.dateFrom);
                }
                if (filters.dateTo) {
                    billDateFilter.lte = new Date(filters.dateTo);
                }
                where.billDate = billDateFilter;
            } else {
                // Filter by period dates (default)
                if (filters.dateFrom && filters.dateTo) {
                    where.OR = [
                        {
                            periodStartDate: {
                                gte: new Date(filters.dateFrom),
                                lte: new Date(filters.dateTo),
                            }
                        },
                        {
                            periodEndDate: {
                                gte: new Date(filters.dateFrom),
                                lte: new Date(filters.dateTo),
                            }
                        }
                    ];
                } else if (filters.dateFrom) {
                    where.periodEndDate = {
                        gte: new Date(filters.dateFrom),
                    };
                } else if (filters.dateTo) {
                    where.periodStartDate = {
                        lte: new Date(filters.dateTo),
                    };
                }
            }
        }

        // Search in description and billingTitle
        if (filters?.search) {
            where.OR = [
                {
                    description: {
                        contains: filters.search,
                        mode: "insensitive",
                    }
                },
                {
                    billingTitle: {
                        contains: filters.search,
                        mode: "insensitive",
                    }
                }
            ];
        }

        const [bills, total] = await Promise.all([
            prisma.inventoryBill.findMany({
                where,
                include: {
                    category: true,
                },
                orderBy: { billDate: "desc" },
                skip,
                take: limit,
            }),
            prisma.inventoryBill.count({ where }),
        ]);

        const totalPages = Math.ceil(total / limit);

        return {
            bills: bills.map(bill => ({
                ...bill,
                amount: Number(bill.amount),
                units: bill.units ? Number(bill.units) : null
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
    } catch (error) {
        console.error("Error fetching bills:", error);
        throw new Error("Failed to fetch bills");
    }
}

export async function createBill(formData: FormData) {
    try {
        const user = await requireInventoryAccess();

        const descriptionValue = formData.get("description") as string | null;
        
        const data = {
            categoryId: formData.get("categoryId") as string,
            billingTitle: formData.get("billingTitle") as string,
            periodStartDate: formData.get("periodStartDate") as string,
            periodEndDate: formData.get("periodEndDate") as string,
            amount: parseFloat(formData.get("amount") as string),
            units: formData.get("units") ? parseFloat(formData.get("units") as string) : undefined,
            billDate: formData.get("billDate") as string,
            description: descriptionValue && descriptionValue.trim() ? descriptionValue.trim() : undefined,
        };

        const validatedData = billSchema.parse(data);

        // Convert YYYY-MM-DD strings to Date objects for Prisma
        const periodStartDate = new Date(validatedData.periodStartDate);
        const periodEndDate = new Date(validatedData.periodEndDate);
        const billDate = new Date(validatedData.billDate);

        const bill = await prisma.inventoryBill.create({
            data: {
                categoryId: validatedData.categoryId,
                billingTitle: validatedData.billingTitle,
                periodStartDate,
                periodEndDate,
                amount: new Prisma.Decimal(validatedData.amount),
                units: validatedData.units ? new Prisma.Decimal(validatedData.units) : undefined,
                billDate,
                description: validatedData.description,
                createdBy: user.id,
            },
            include: {
                category: true,
            },
        });

        revalidatePath("/admin/inventory/billing");
        return { success: true, data: bill };
    } catch (error) {
        console.error("Error creating bill:", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        return { success: false, error: "Failed to create bill" };
    }
}

export async function deleteBill(id: string) {
    try {
        const user = await requireInventoryAccess(["ADMIN", "SUPER_ADMIN"]);
        await prisma.inventoryBill.delete({ where: { id } });
        revalidatePath("/admin/inventory/billing");
        return { success: true };
    } catch (error) {
        console.error("Error deleting bill:", error);
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return { success: false, error: "Only admins can delete bills" };
        }
        return { success: false, error: "Failed to delete bill" };
    }
}

export async function updateBill(id: string, formData: FormData) {
    try {
        const user = await requireInventoryAccess(["ADMIN", "SUPER_ADMIN"]);

        const descriptionValue = formData.get("description") as string | null;
        
        const data = {
            categoryId: formData.get("categoryId") as string,
            billingTitle: formData.get("billingTitle") as string,
            periodStartDate: formData.get("periodStartDate") as string,
            periodEndDate: formData.get("periodEndDate") as string,
            amount: parseFloat(formData.get("amount") as string),
            units: formData.get("units") ? parseFloat(formData.get("units") as string) : undefined,
            billDate: formData.get("billDate") as string,
            description: descriptionValue && descriptionValue.trim() ? descriptionValue.trim() : undefined,
        };

        const validatedData = billSchema.parse(data);

        // Convert YYYY-MM-DD strings to Date objects for Prisma
        const periodStartDate = new Date(validatedData.periodStartDate);
        const periodEndDate = new Date(validatedData.periodEndDate);
        const billDate = new Date(validatedData.billDate);

        const bill = await prisma.inventoryBill.update({
            where: { id },
            data: {
                categoryId: validatedData.categoryId,
                billingTitle: validatedData.billingTitle,
                periodStartDate,
                periodEndDate,
                amount: new Prisma.Decimal(validatedData.amount),
                units: validatedData.units ? new Prisma.Decimal(validatedData.units) : undefined,
                billDate,
                description: validatedData.description,
            },
            include: {
                category: true,
            },
        });

        revalidatePath("/admin/inventory/billing");
        return { success: true, data: bill };
    } catch (error) {
        console.error("Error updating bill:", error);
        if (error instanceof z.ZodError) {
            return { success: false, error: error.issues[0].message };
        }
        if (error instanceof Error && error.message.includes("Unauthorized")) {
            return { success: false, error: "Only admins can update bills" };
        }
        return { success: false, error: "Failed to update bill" };
    }
}
