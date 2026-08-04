"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import {
  IVendor,
  IVendorPayment,
  PaymentMethod,
} from "../types/inventory-types";
import { requireInventoryAccess } from "../lib/auth-utils";

// Validation Schemas (internal use only)
const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters"),
  contactPerson: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  address: z.string().optional(),
  isActive: z.boolean().default(true),
});

const vendorPaymentSchema = z.object({
  vendorId: z.string().min(1, "Vendor is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.date(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "ONLINE", "CARD"]),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Vendor CRUD Actions
export async function getVendors(): Promise<IVendor[]> {
  try {
    // Check access control
    await requireInventoryAccess();

    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
    });

    return vendors as IVendor[];
  } catch (error) {
    console.error("Error fetching vendors:", error);
    throw new Error("Failed to fetch vendors");
  }
}

export async function getVendorById(id: string): Promise<IVendor | null> {
  try {
    // Check access control
    await requireInventoryAccess();

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true,
              },
            },
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        orders: {
          orderBy: { orderDate: "desc" },
        },
      },
    });

    if (!vendor) {
      return null;
    }

    // Convert Decimal fields to numbers for Client Components
    return {
      ...vendor,
      items: vendor.items?.map((vi) => ({
        ...vi,
        item: vi.item ? {
          ...vi.item,
          unitPrice: vi.item.unitPrice ? Number(vi.item.unitPrice) : null,
        } : undefined,
      })),
      payments: vendor.payments?.map((p) => ({
        ...p,
        amount: Number(p.amount),
      })),
      orders: vendor.orders?.map((o) => ({
        ...o,
        totalAmount: Number(o.totalAmount),
      })),
    } as unknown as IVendor;
  } catch (error) {
    console.error("Error fetching vendor:", error);
    throw new Error("Failed to fetch vendor");
  }
}

export async function createVendor(formData: FormData) {
  try {
    // Check access control
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) creating vendor`);

    const data = {
      name: formData.get("name") as string,
      contactPerson: formData.get("contactPerson") as string | undefined,
      email: formData.get("email") as string | undefined,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string | undefined,
      isActive: formData.get("isActive") === "true",
    };

    // Validate data
    const validatedData = vendorSchema.parse(data);

    // Create vendor
    const vendor = await prisma.vendor.create({
      data: {
        name: validatedData.name,
        contactPerson: validatedData.contactPerson || null,
        email: validatedData.email || null,
        phone: validatedData.phone,
        address: validatedData.address || null,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/admin/inventory/vendors");
    return { success: true, data: vendor };
  } catch (error) {
    console.error("Error creating vendor:", error);

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
          error: "A vendor with this information already exists",
        };
      }
    }

    return { success: false, error: "Failed to create vendor" };
  }
}

export async function updateVendor(id: string, formData: FormData) {
  try {
    // Check access control
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) updating vendor ${id}`);

    const data = {
      name: formData.get("name") as string,
      contactPerson: formData.get("contactPerson") as string | undefined,
      email: formData.get("email") as string | undefined,
      phone: formData.get("phone") as string,
      address: formData.get("address") as string | undefined,
      isActive: formData.get("isActive") === "true",
    };

    // Validate data
    const validatedData = vendorSchema.parse(data);

    // Update vendor
    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        name: validatedData.name,
        contactPerson: validatedData.contactPerson || null,
        email: validatedData.email || null,
        phone: validatedData.phone,
        address: validatedData.address || null,
        isActive: validatedData.isActive,
      },
    });

    revalidatePath("/admin/inventory/vendors");
    revalidatePath(`/admin/inventory/vendors/${id}`);
    return { success: true, data: vendor };
  } catch (error) {
    console.error("Error updating vendor:", error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      };
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Vendor not found",
        };
      }
    }

    return { success: false, error: "Failed to update vendor" };
  }
}

export async function deleteVendor(id: string) {
  try {
    // Check access control
    const user = await requireInventoryAccess();
    console.log(`[AUDIT] User ${user.id} (${user.email}) deleting vendor ${id}`);

    // Soft delete by setting isActive to false
    await prisma.vendor.update({
      where: { id },
      data: { isActive: false },
    });

    revalidatePath("/admin/inventory/vendors");
    return { success: true };
  } catch (error) {
    console.error("Error deleting vendor:", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return {
          success: false,
          error: "Vendor not found",
        };
      }
    }

    return { success: false, error: "Failed to delete vendor" };
  }
}

// Vendor Payment Actions
export async function createVendorPayment(
  formData: FormData,
  createdBy?: string
) {
  try {
    // Check access control and get user
    const user = await requireInventoryAccess();
    const performingUserId = createdBy || user.id;
    console.log(`[AUDIT] User ${user.id} (${user.email}) creating vendor payment`);

    const data = {
      vendorId: formData.get("vendorId") as string,
      amount: parseFloat(formData.get("amount") as string),
      paymentDate: new Date(formData.get("paymentDate") as string),
      paymentMethod: formData.get("paymentMethod") as PaymentMethod,
      referenceNumber: formData.get("referenceNumber") as string | undefined,
      notes: formData.get("notes") as string | undefined,
    };

    // Validate data
    const validatedData = vendorPaymentSchema.parse(data);

    // Create payment record
    const payment = await prisma.vendorPayment.create({
      data: {
        vendorId: validatedData.vendorId,
        amount: validatedData.amount,
        paymentDate: validatedData.paymentDate,
        paymentMethod: validatedData.paymentMethod,
        referenceNumber: validatedData.referenceNumber || null,
        notes: validatedData.notes || null,
        createdBy: performingUserId,
      },
      include: {
        vendor: true,
      },
    });

    revalidatePath("/admin/inventory/vendors");
    revalidatePath(`/admin/inventory/vendors/${validatedData.vendorId}`);
    return { success: true, data: payment };
  } catch (error) {
    console.error("Error creating vendor payment:", error);

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
          error: "Vendor not found",
        };
      }
    }

    return { success: false, error: "Failed to create payment record" };
  }
}

export async function getVendorPayments(
  vendorId: string
): Promise<IVendorPayment[]> {
  try {
    // Check access control
    await requireInventoryAccess();

    const payments = await prisma.vendorPayment.findMany({
      where: { vendorId },
      include: {
        vendor: true,
      },
      orderBy: { paymentDate: "desc" },
    });

    return payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount),
    })) as IVendorPayment[];
  } catch (error) {
    console.error("Error fetching vendor payments:", error);
    throw new Error("Failed to fetch vendor payments");
  }
}
