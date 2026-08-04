"use server";
import { revalidatePath } from "next/cache";
import { uploadFiles, UploadConfig } from "@/features/core/hooks/uploadFiles";
import { IStudent } from "../types/types";
import { prisma } from "@/features/core/lib/prisma";

// Student registration image upload configuration
const STUDENT_IMAGE_CONFIG: UploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: {
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
  },
  uploadPath: "public/uploads/students",
  maxFiles: 1,
};

export interface RegisterStudentResult {
  success: boolean;
  message: string;
  student?: {
    id: string;
    fullname: string;
    email: string;
  };
  errors?: string[];
}

export async function registerStudent(
  data: IStudent,
  imageFile?: File
): Promise<RegisterStudentResult> {
  try {
    // Validate required fields
    if (!data.fullname || !data.email || !data.gender || !data.dob) {
      return {
        success: false,
        message: "Missing required fields",
        errors: ["Full name, email, gender, and date of birth are required"],
      };
    }

    // Check if email already exists
    const existingStudent = await prisma.student.findUnique({
      where: { email: data.email },
    });

    if (existingStudent) {
      return {
        success: false,
        message: "Student with this email already exists",
        errors: ["Email address is already registered"],
      };
    }

    // Handle image upload if provided
    let student_image = "/uploads/default.jpg";
    if (imageFile) {
      const uploadResult = await uploadFiles([imageFile], STUDENT_IMAGE_CONFIG);

      if (uploadResult.success && uploadResult.files.length > 0) {
        student_image = `/uploads/students/${uploadResult.files[0]}`;
      } else {
        console.warn("Image upload failed:", uploadResult.errors);
      }
    }

    // Create student record
    const student = await prisma.student.create({
      data: {
        student_image,
        fullname: data.fullname,
        gender: data.gender,
        dob: new Date(data.dob),
        parentName: data.parentName,
        dress: data.dress,
        citizenship_number: data.citizenship_number,
        blood_group: data.blood_group,
        permanent_address: data.permanent_address,
        temporary_address: data.temporary_address,
        contact_number_student: data.contact_number_student,
        contact_number_parent: data.contact_number_parent,
        height: data.height,
        weight: data.weight,
        email: data.email,
      },
    });

    // Assign subcategories if provided
    if (data.subCategoryIds && data.subCategoryIds.length > 0) {
      const subCategories = await prisma.subCategory.findMany({
        where: {
          id: { in: data.subCategoryIds },
        },
      });

      if (subCategories.length > 0) {
        await prisma.studentCategory.createMany({
          data: subCategories.map((subCategory) => ({
            studentId: student.id,
            subCategoryId: subCategory.id,
            assignedFee: subCategory.fee,
          })),
        });
      }
    }

    // Revalidate the students page to show updated data
    revalidatePath("/admin/students");

    return {
      success: true,
      message: "Student registered successfully",
      student: {
        id: student.id,
        fullname: student.fullname,
        email: student.email,
      },
    };
  } catch (error) {
    console.error("Error registering student:", error);

    return {
      success: false,
      message: "Failed to register student",
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
    };
  } finally {
    await prisma.$disconnect();
  }
}
