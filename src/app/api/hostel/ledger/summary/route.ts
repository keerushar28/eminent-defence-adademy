import { NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";
import {
  calculateTotalPayableDays,
  calculatePendingDays,
  calculatePendingAmount,
} from "@/features/admin/hostel/lib/calculations";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all students with active hostel allocations
    const students = await prisma.student.findMany({
      where: {
        hostelAllocations: {
          some: {
            isActive: true,
          },
        },
      },
      include: {
        hostelAllocations: {
          where: {
            isActive: true,
          },
          include: {
            bed: true,
            payments: true,
          },
        },
      },
    });

    // Calculate summary
    let fullyPaid = 0;
    let partial = 0;
    let pending = 0;
    let overpaid = 0;
    let totalFeesCollected = 0;
    let totalPendingFees = 0;
    let totalOverpaidAmount = 0;

    const today = new Date();

    students.forEach((student) => {
      // Aggregate across ALL active allocations for this student
      let studentTotalPaid = 0;
      let studentPending = 0;
      let studentOverpaid = 0;

      student.hostelAllocations.forEach((allocation) => {
        const pricePerDay = allocation.bed.pricePerDay.toNumber();
        const allocationDate = allocation.allocationDate;
        const paidUntil = allocation.paidUntil;

        const totalPaid = allocation.payments.reduce(
          (sum, payment) => sum + payment.amount.toNumber(),
          0
        );

        const daysConsumed = calculateTotalPayableDays(allocationDate, today);
        const amountConsumed = daysConsumed * pricePerDay;

        // Calculate pending using paidUntil-based logic (consistent with Student Ledger)
        const creditBalance = Number(allocation.creditBalance) || 0;
        const pendingDays = calculatePendingDays(paidUntil, today, allocationDate);
        let pendingAmount = calculatePendingAmount(pendingDays, pricePerDay);
        pendingAmount = Math.max(0, pendingAmount - creditBalance);

        // Overpaid is based on money paid exceeding the amount consumed
        const overpaidAmount = totalPaid > amountConsumed ? totalPaid - amountConsumed : 0;

        studentTotalPaid += totalPaid;
        studentPending += pendingAmount;
        studentOverpaid += overpaidAmount;
      });

      totalFeesCollected += studentTotalPaid;
      totalPendingFees += studentPending;
      totalOverpaidAmount += studentOverpaid;

      // Determine status based on aggregate balance for the student
      if (studentOverpaid > 0) {
        overpaid++;
      } else if (studentPending === 0) {
        // No pending fees and not overpaid = fully paid
        fullyPaid++;
      } else if (studentTotalPaid > 0) {
        // Has paid something but still has pending fees
        partial++;
      } else {
        // Has not paid anything
        pending++;
      }
    });

    const summary = {
      totalStudents: students.length,
      fullyPaid,
      partial,
      pending,
      overpaid,
      totalFeesCollected,
      totalPendingFees,
      totalOverpaidAmount,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching hostel summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch hostel summary" },
      { status: 500 }
    );
  }
}
