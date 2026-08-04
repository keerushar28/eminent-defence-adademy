import { NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";
import { calculateTotalPayableDays } from "@/features/admin/hostel/lib/calculations";

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
      const allocation = student.hostelAllocations[0];
      if (!allocation) return;

      const pricePerDay = allocation.bed.pricePerDay.toNumber();
      const allocationDate = allocation.allocationDate;
      const paidUntil = allocation.paidUntil;
      
      // Calculate days consumed using the same logic as AddHostelPaymentDialog
      const daysConsumed = calculateTotalPayableDays(allocationDate, today);
      
      // Calculate amount consumed
      const amountConsumed = daysConsumed * pricePerDay;
      
      // Calculate total paid
      const totalPaid = allocation.payments.reduce(
        (sum, payment) => sum + payment.amount.toNumber(),
        0
      );
      
      // Calculate balance (positive = overpaid, negative = pending)
      const balance = totalPaid - amountConsumed;
      
      // Calculate pending and overpaid amounts
      const pendingAmount = balance < 0 ? Math.abs(balance) : 0;
      const overpaidAmount = balance > 0 ? balance : 0;

      totalFeesCollected += totalPaid;
      totalPendingFees += pendingAmount;
      totalOverpaidAmount += overpaidAmount;

      // Determine status based on actual balance
      if (overpaidAmount > 0) {
        overpaid++;
      } else if (pendingAmount === 0) {
        // No pending fees and not overpaid = fully paid
        fullyPaid++;
      } else if (totalPaid > 0) {
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
