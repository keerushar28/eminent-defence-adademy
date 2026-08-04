import { NextResponse } from "next/server";
import { prisma } from "@/features/core/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Get all students with their categories for summary calculation
    const students = await prisma.student.findMany({
      include: {
        studentCategories: {
          // Include ALL allocations (active and inactive) for correct totals
          select: {
            finalFee: true,
            totalPaid: true,
          },
        },
      },
    });

    // Calculate summary
    let fullyPaid = 0;
    let pending = 0;
    let unpaid = 0;
    let noAllocation = 0;
    let totalFeesCollected = 0;
    let totalPendingFees = 0;

    students.forEach((student) => {
      const totalFee = student.studentCategories.reduce(
        (sum, sc) => sum + sc.finalFee.toNumber(),
        0
      );
      const totalPaid = student.studentCategories.reduce(
        (sum, sc) => sum + sc.totalPaid.toNumber(),
        0
      );
      const pendingAmount = totalFee - totalPaid;

      totalFeesCollected += totalPaid;
      totalPendingFees += pendingAmount;

      // If no categories allocated or total fee is 0
      if (student.studentCategories.length === 0 || totalFee === 0) {
        noAllocation++;
      } else if (pendingAmount <= 0) {
        // Fully paid
        fullyPaid++;
      } else if (totalPaid === 0) {
        // No payment made yet - UNPAID
        unpaid++;
      } else {
        // Partial payment made - PENDING
        pending++;
      }
    });

    const summary = {
      totalStudents: students.length,
      fullyPaid,
      pending,
      unpaid,
      noAllocation,
      totalFeesCollected,
      totalPendingFees,
    };

    return NextResponse.json(summary);
  } catch (error) {
    console.error("Error fetching summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
