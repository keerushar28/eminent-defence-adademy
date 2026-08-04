"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/features/core/lib/auth";

export async function createDeletionRequest(
  studentId: string,
  studentName: string,
  reason?: string
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    const deletionRequest = await prisma.studentDeletionRequest.create({
      data: {
        studentId,
        studentName,
        requestedBy: session.user.id,
        requestedByRole: (session.user as any).role || "STAFF",
        reason,
      },
    });

    revalidatePath("/admin/students");
    revalidatePath("/staff/students");
    return { success: true, deletionRequest };
  } catch (error) {
    console.error("Error creating deletion request:", error);
    return { success: false, error: "Failed to create deletion request" };
  }
}

export async function getPendingDeletionRequests() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return [];
    }

    const requests = await prisma.studentDeletionRequest.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
    });

    // Fetch requester information for each request
    const requestsWithRequester = await Promise.all(
      requests.map(async (request) => {
        const requester = await prisma.user.findUnique({
          where: { id: request.requestedBy },
          select: {
            id: true,
            username: true,
            email: true,
            role: true,
          },
        });

        return {
          ...request,
          requester,
        };
      })
    );

    return requestsWithRequester;
  } catch (error) {
    console.error("Error fetching deletion requests:", error);
    throw new Error("Failed to fetch deletion requests");
  }
}

export async function approveDeletionRequest(
  requestId: string,
  studentId: string
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    // Update the deletion request status
    await prisma.studentDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
      },
    });

    // Delete the student and related records
    await prisma.hostelAllocation.deleteMany({
      where: { studentId },
    });

    await prisma.studentCategory.deleteMany({
      where: { studentId },
    });

    await prisma.studentIssuance.deleteMany({
      where: { studentId },
    });

    await prisma.student.delete({
      where: { id: studentId },
    });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    console.error("Error approving deletion request:", error);
    return { success: false, error: "Failed to approve deletion request" };
  }
}

export async function rejectDeletionRequest(
  requestId: string,
  reason?: string
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await prisma.studentDeletionRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        approvedBy: session.user.id,
        approvedAt: new Date(),
        reason,
      },
    });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    console.error("Error rejecting deletion request:", error);
    return { success: false, error: "Failed to reject deletion request" };
  }
}
