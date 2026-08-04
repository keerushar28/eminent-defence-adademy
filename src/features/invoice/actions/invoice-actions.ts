"use server";

import { prisma } from "@/features/core/lib/prisma";
import { InvoiceOptions } from "../types/invoice";
import { requireInventoryAccess } from "@/features/admin/inventory/lib/auth-utils";
import {
  buildStudentInvoiceData,
  mapCategoryPaymentItem,
  mapHostelPaymentItem,
  mapIssuanceItem,
} from "../lib/invoice-data-builder";

export async function getStudentInvoiceData(studentId: string, options: InvoiceOptions) {
  try {
    await requireInventoryAccess();

    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        fullname: true,
        email: true,
        contact_number_student: true,
        studentCategories: {
          include: {
            subCategory: { include: { category: true } },
            payments: { orderBy: { paymentDate: "asc" } },
          },
          orderBy: { assignedDate: "asc" },
        },
        issuances: {
          include: {
            item: true,
            payments: { orderBy: { paymentDate: "asc" } },
          },
          orderBy: { issuedDate: "asc" },
        },
        hostelAllocations: {
          include: {
            bed: { include: { room: true } },
            payments: { orderBy: { paymentDate: "asc" } },
          },
          orderBy: { allocationDate: "asc" },
        },
      },
    });

    if (!student) {
      throw new Error("Student not found");
    }

    const categoryPayments = options.includeCategoryPayments
      ? student.studentCategories.map((sc) => mapCategoryPaymentItem(sc, student.fullname))
      : [];

    const inventoryIssuances = options.includeInventoryIssuances
      ? student.issuances.map((issuance) => mapIssuanceItem(issuance, student.fullname))
      : [];

    const hostelPayments =
      options.includeHostelPayments || options.includeAllocationsInfo
        ? student.hostelAllocations.map((allocation) =>
            mapHostelPaymentItem(allocation, student.fullname),
          )
        : [];

    return buildStudentInvoiceData({
      student,
      categoryPayments,
      inventoryIssuances,
      hostelPayments,
    });
  } catch (error) {
    console.error("Error fetching invoice data:", error);
    throw error;
  }
}

export async function getAllStudents() {
  try {
    await requireInventoryAccess();

    const students = await prisma.student.findMany({
      select: {
        id: true,
        fullname: true,
        email: true,
        contact_number_student: true,
      },
      orderBy: { fullname: "asc" },
    });

    return students;
  } catch (error) {
    console.error("Error fetching students:", error);
    throw error;
  }
}
