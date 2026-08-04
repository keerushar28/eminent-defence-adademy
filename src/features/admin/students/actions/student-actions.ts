"use server";

import { prisma } from "@/features/core/lib/prisma";
import { revalidatePath } from "next/cache";
import { IStudent } from "../types/types";

export async function getStudents(): Promise<IStudent[]> {
  try {
    const students = await prisma.student.findMany({
      include: {
        studentCategories: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Convert Decimal fields to numbers for client components
    return students.map(student => ({
      ...student,
      studentCategories: student.studentCategories?.map(sc => ({
        ...sc,
        discountAmount: sc.discountAmount.toNumber(),
        finalFee: sc.finalFee.toNumber(),
        totalPaid: sc.totalPaid.toNumber(),
        subCategory: sc.subCategory ? {
          ...sc.subCategory,
          fee: sc.subCategory.fee.toNumber(),
        } : undefined,
      })),
    })) as IStudent[];
  } catch (error) {
    console.error("Error fetching students:", error);
    throw new Error("Failed to fetch students");
  }
}

export async function getStudentById(id: string): Promise<IStudent | null> {
  try {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        studentCategories: {
          include: {
            subCategory: {
              include: {
                category: true,
              },
            },
          },
        },
        hostelAllocations: {
          include: {
            bed: {
              include: {
                room: true,
              },
            },
            payments: {
              orderBy: { paymentDate: "desc" },
            },
          },
        },
      },
    });

    if (!student) {
      return null;
    }

    // Convert Decimal fields to numbers for client components
    return {
      ...student,
      studentCategories: student.studentCategories?.map(sc => ({
        ...sc,
        discountAmount: sc.discountAmount.toNumber(),
        finalFee: sc.finalFee.toNumber(),
        totalPaid: sc.totalPaid.toNumber(),
        subCategory: sc.subCategory ? {
          ...sc.subCategory,
          fee: sc.subCategory.fee.toNumber(),
        } : undefined,
      })),
      hostelAllocations: student.hostelAllocations?.map(ha => ({
        ...ha,
        creditBalance: ha.creditBalance.toNumber(),
        bed: ha.bed ? {
          ...ha.bed,
          pricePerDay: ha.bed.pricePerDay ? (typeof ha.bed.pricePerDay === 'object' ? (ha.bed.pricePerDay as any).toNumber() : ha.bed.pricePerDay) : undefined,
        } : undefined,
        payments: ha.payments?.map(p => ({
          ...p,
          amount: typeof p.amount === 'object' ? (p.amount as any).toNumber() : p.amount,
        })) || [],
      })) || [],
    } as IStudent;
  } catch (error) {
    console.error("Error fetching student:", error);
    throw new Error("Failed to fetch student");
  }
}

export async function createStudent(formData: FormData) {
  try {
    const fullname = formData.get("fullname") as string;
    const email = formData.get("email") as string;
    const gender = formData.get("gender") as "MALE" | "FEMALE";
    // Convert YYYY-MM-DD string to UTC Date to avoid timezone issues
    const dobString = formData.get("dob") as string;
    
    if (!dobString || dobString.trim() === "") {
      return { success: false, error: "Date of birth is required" };
    }
    
    const dob = new Date(`${dobString}T00:00:00Z`);
    
    if (isNaN(dob.getTime())) {
      return { success: false, error: "Invalid date of birth format" };
    }

    // Handle registration date (createdAt)
    const createdAtString = formData.get("createdAt") as string;
    let createdAt = new Date();
    
    if (createdAtString && createdAtString.trim() !== "") {
      createdAt = new Date(`${createdAtString}T00:00:00Z`);
      if (isNaN(createdAt.getTime())) {
        return { success: false, error: "Invalid registration date format" };
      }
    }

    const blood_group = formData.get("blood_group") as
      | "A_POSITIVE"
      | "A_NEGATIVE"
      | "B_POSITIVE"
      | "B_NEGATIVE"
      | "AB_POSITIVE"
      | "AB_NEGATIVE"
      | "O_POSITIVE"
      | "O_NEGATIVE";
    const contact_number_student = formData.get(
      "contact_number_student"
    ) as string;
    const contact_number_parent = formData.get(
      "contact_number_parent"
    ) as string;
    const permanent_address = formData.get("permanent_address") as string;
    const temporary_address = formData.get("temporary_address") as string;
    const parentName = formData.get("parentName") as string;
    const guardianName = (formData.get("guardianName") as string) || undefined;
    const citizenship_number = formData.get("citizenship_number") as string;
    const height = formData.get("height") as string;
    const weight = formData.get("weight") as string;
    const dress = formData.get("dress") === "true";
    const books = formData.get("books") === "true";
    const hostel = formData.get("hostel") === "true";
    const qualificationsStr = formData.get("qualifications") as string;
    const qualifications = qualificationsStr ? JSON.parse(qualificationsStr) : [];

    // Handle image upload
    let student_image = "/uploads/default.jpg";
    const imageFile = formData.get("student_image") as File;

    if (imageFile && imageFile.size > 0) {
      // Import the uploadSingleFile function
      const { uploadSingleFile } = await import(
        "@/features/core/hooks/uploadFiles"
      );

      // Upload the image
      const uploadResult = await uploadSingleFile(imageFile, {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: {
          "image/jpeg": [".jpg", ".jpeg"],
          "image/png": [".png"],
          "image/webp": [".webp"],
        },
        uploadPath: "public/uploads",
      });

      if (uploadResult.success && uploadResult.files.length > 0) {
        student_image = `/uploads/${uploadResult.files[0]}`;
      } else {
        console.error("Image upload failed:", uploadResult.errors);
        // Continue with default image if upload fails
      }
    }

    // Handle attachments upload
    let attachments: string[] = [];
    const attachmentFiles = formData.getAll("attachments") as File[];

    if (attachmentFiles && attachmentFiles.length > 0) {
      // Filter out empty files
      const validFiles = attachmentFiles.filter(
        (file) => file && file.size > 0
      );

      if (validFiles.length > 0) {
        // Import the uploadFiles function
        const { uploadFiles } = await import(
          "@/features/core/hooks/uploadFiles"
        );

        // Upload the attachments
        const uploadResult = await uploadFiles(validFiles, {
          maxFileSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/gif": [".gif"],
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [".docx"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
            "application/vnd.ms-powerpoint": [".ppt"],
            "application/vnd.openxmlformats-officedocument.presentationml.presentation":
              [".pptx"],
          },
          uploadPath: "public/uploads",
          maxFiles: 10,
        });

        if (uploadResult.success) {
          attachments = uploadResult.files.map(
            (filename) => `/uploads/${filename}`
          );
        } else {
          console.error("Attachments upload failed:", uploadResult.errors);
          // Continue without attachments if upload fails
        }
      }
    }

    const student = await prisma.student.create({
      data: {
        fullname,
        email,
        gender,
        dob,
        blood_group,
        contact_number_student,
        contact_number_parent,
        permanent_address,
        temporary_address,
        parentName,
        guardianName,
        citizenship_number,
        height,
        weight,
        dress,
        books,
        hostel,
        qualifications,
        student_image,
        images: attachments,
        createdAt,
      },
    });

    revalidatePath("/admin/students");
    return { success: true, student };
  } catch (error) {
    console.error("Error creating student:", error);
    return { success: false, error: "Failed to create student" };
  }
}

export async function updateStudent(id: string, formData: FormData) {
  try {
    const fullname = formData.get("fullname") as string;
    const email = formData.get("email") as string;
    const gender = formData.get("gender") as "MALE" | "FEMALE";
    // Convert YYYY-MM-DD string to UTC Date to avoid timezone issues
    const dobString = formData.get("dob") as string;
    
    if (!dobString || dobString.trim() === "") {
      return { success: false, error: "Date of birth is required" };
    }
    
    const dob = new Date(`${dobString}T00:00:00Z`);
    
    if (isNaN(dob.getTime())) {
      return { success: false, error: "Invalid date of birth format" };
    }

    // Handle registration date (createdAt)
    const createdAtString = formData.get("createdAt") as string;
    let createdAt: Date | undefined = undefined;
    
    if (createdAtString && createdAtString.trim() !== "") {
      createdAt = new Date(`${createdAtString}T00:00:00Z`);
      if (isNaN(createdAt.getTime())) {
        return { success: false, error: "Invalid registration date format" };
      }
    }

    const blood_group = formData.get("blood_group") as
      | "A_POSITIVE"
      | "A_NEGATIVE"
      | "B_POSITIVE"
      | "B_NEGATIVE"
      | "AB_POSITIVE"
      | "AB_NEGATIVE"
      | "O_POSITIVE"
      | "O_NEGATIVE";
    const contact_number_student = formData.get(
      "contact_number_student"
    ) as string;
    const contact_number_parent = formData.get(
      "contact_number_parent"
    ) as string;
    const permanent_address = formData.get("permanent_address") as string;
    const temporary_address = formData.get("temporary_address") as string;
    const parentName = formData.get("parentName") as string;
    const guardianName = (formData.get("guardianName") as string) || undefined;
    const citizenship_number = formData.get("citizenship_number") as string;
    const height = formData.get("height") as string;
    const weight = formData.get("weight") as string;
    const dress = formData.get("dress") === "true";
    const books = formData.get("books") === "true";
    const hostel = formData.get("hostel") === "true";
    const qualificationsStr = formData.get("qualifications") as string;
    const qualifications = qualificationsStr ? JSON.parse(qualificationsStr) : [];

    // Get current student to preserve existing image and attachments if no new ones are provided
    const currentStudent = await prisma.student.findUnique({
      where: { id },
      select: { student_image: true, images: true },
    });

    if (!currentStudent) {
      return { success: false, error: "Student not found" };
    }

    let student_image = currentStudent.student_image;
    const imageFile = formData.get("student_image") as File;
    const imageRemovalFlag = formData.get("removeImage") as string;

    // Check if image was explicitly removed
    if (imageRemovalFlag === "true") {
      student_image = "/uploads/default.jpg";
    } else if (imageFile && imageFile.size > 0) {
      // Import the uploadSingleFile function
      const { uploadSingleFile } = await import(
        "@/features/core/hooks/uploadFiles"
      );

      // Upload the new image
      const uploadResult = await uploadSingleFile(imageFile, {
        maxFileSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: {
          "image/jpeg": [".jpg", ".jpeg"],
          "image/png": [".png"],
          "image/webp": [".webp"],
        },
        uploadPath: "public/uploads",
      });

      if (uploadResult.success && uploadResult.files.length > 0) {
        student_image = `/uploads/${uploadResult.files[0]}`;
      } else {
        console.error("Image upload failed:", uploadResult.errors);
        // Continue with existing image if upload fails
      }
    }

    // Get current student to preserve existing attachments
    const currentAttachments = currentStudent.images || [];

    // Handle attachments upload
    let newAttachments: string[] = [];
    const attachmentFiles = formData.getAll("attachments") as File[];

    if (attachmentFiles && attachmentFiles.length > 0) {
      // Filter out empty files
      const validFiles = attachmentFiles.filter(
        (file) => file && file.size > 0
      );

      if (validFiles.length > 0) {
        // Import the uploadFiles function
        const { uploadFiles } = await import(
          "@/features/core/hooks/uploadFiles"
        );

        // Upload the new attachments
        const uploadResult = await uploadFiles(validFiles, {
          maxFileSize: 5 * 1024 * 1024, // 5MB
          allowedTypes: {
            "image/jpeg": [".jpg", ".jpeg"],
            "image/png": [".png"],
            "image/webp": [".webp"],
            "image/gif": [".gif"],
            "application/pdf": [".pdf"],
            "application/msword": [".doc"],
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
              [".docx"],
            "application/vnd.ms-excel": [".xls"],
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
              [".xlsx"],
            "application/vnd.ms-powerpoint": [".ppt"],
            "application/vnd.openxmlformats-officedocument.presentationml.presentation":
              [".pptx"],
          },
          uploadPath: "public/uploads",
          maxFiles: 10,
        });

        if (uploadResult.success) {
          newAttachments = uploadResult.files.map(
            (filename) => `/uploads/${filename}`
          );
        } else {
          console.error("Attachments upload failed:", uploadResult.errors);
          // Continue without new attachments if upload fails
        }
      }
    }

    // Handle deleted attachments
    const deletedAttachments = formData.get("deletedAttachments") as string;
    const parsedDeletedAttachments = deletedAttachments
      ? JSON.parse(deletedAttachments)
      : [];

    // Remove deleted attachments from current attachments
    const remainingAttachments = currentAttachments.filter(
      (attachment: string) => !parsedDeletedAttachments.includes(attachment)
    );

    // Combine remaining and new attachments
    const finalAttachments = [...remainingAttachments, ...newAttachments];

    // Delete files from disk if any were marked for deletion
    if (parsedDeletedAttachments.length > 0) {
      try {
        const { deleteFiles } = await import(
          "@/features/core/hooks/uploadFiles"
        );
        await deleteFiles(parsedDeletedAttachments);
      } catch (error) {
        console.error("Error deleting files:", error);
        // Continue even if file deletion fails
      }
    }

    const student = await prisma.student.update({
      where: { id },
      data: {
        fullname,
        email,
        gender,
        dob,
        blood_group,
        contact_number_student,
        contact_number_parent,
        permanent_address,
        temporary_address,
        parentName,
        guardianName,
        citizenship_number,
        height,
        weight,
        dress,
        books,
        hostel,
        qualifications,
        student_image,
        images: finalAttachments,
        ...(createdAt && { createdAt }),
      },
    });

    revalidatePath("/admin/students");
    return { success: true, student };
  } catch (error) {
    console.error("Error updating student:", error);
    return { success: false, error: "Failed to update student" };
  }
}

export async function deleteStudent(id: string) {
  try {
    // Delete related records first to avoid foreign key constraint violations
    await prisma.hostelAllocation.deleteMany({
      where: { studentId: id },
    });

    await prisma.studentCategory.deleteMany({
      where: { studentId: id },
    });

    await prisma.studentIssuance.deleteMany({
      where: { studentId: id },
    });

    await prisma.student.delete({
      where: { id },
    });

    revalidatePath("/admin/students");
    return { success: true };
  } catch (error) {
    console.error("Error deleting student:", error);
    return { success: false, error: "Failed to delete student" };
  }
}

export async function deleteMultipleStudents(ids: string[]) {
  try {
    if (!ids || ids.length === 0) {
      return { success: false, error: "No students selected" };
    }

    // Delete related records first to avoid foreign key constraint violations
    await prisma.hostelAllocation.deleteMany({
      where: { studentId: { in: ids } },
    });

    await prisma.studentCategory.deleteMany({
      where: { studentId: { in: ids } },
    });

    await prisma.studentIssuance.deleteMany({
      where: { studentId: { in: ids } },
    });

    const result = await prisma.student.deleteMany({
      where: {
        id: {
          in: ids,
        },
      },
    });

    revalidatePath("/admin/students");
    return { success: true, deletedCount: result.count };
  } catch (error) {
    console.error("Error deleting students:", error);
    return { success: false, error: "Failed to delete students" };
  }
}
