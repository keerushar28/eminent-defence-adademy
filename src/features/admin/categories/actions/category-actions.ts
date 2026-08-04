'use server'

import { PrismaClient } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { CreateCategoryData, CreateSubCategoryData, UpdateCategoryData, UpdateSubCategoryData } from '../types/types'

const prisma = new PrismaClient()

// Category Actions
export async function createCategory(data: CreateCategoryData) {
  try {
    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        subCategories: true,
      },
    })

    // Convert Decimal to number for client components
    const serializedCategory = {
      ...category,
      subCategories: category.subCategories?.map(sub => ({
        ...sub,
        fee: Number(sub.fee),
      })) || [],
    }

    revalidatePath('/admin/categories')
    return { success: true, data: serializedCategory }
  } catch (error: unknown) {
    console.error('Error creating category:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { success: false, error: 'Category name already exists' }
    }
    return { success: false, error: 'Failed to create category' }
  }
}

export async function getCategories() {
  try {
    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    })

    // Convert Decimal to number for client components
    const serializedCategories = categories.map(category => ({
      ...category,
      subCategories: category.subCategories?.map(sub => ({
        ...sub,
        fee: Number(sub.fee),
      })) || [],
    }))

    return { success: true, data: serializedCategories }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return { success: false, error: 'Failed to fetch categories' }
  }
}

export async function getCategoryById(id: string) {
  try {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subCategories: {
          orderBy: { name: 'asc' },
        },
      },
    })

    if (!category) return null

    // Convert Decimal to number for client components
    return {
      ...category,
      subCategories: category.subCategories?.map(sub => ({
        ...sub,
        fee: Number(sub.fee),
      })) || [],
    }
  } catch (error) {
    console.error('Error fetching category:', error)
    return null
  }
}

export async function updateCategory(id: string, data: UpdateCategoryData) {
  try {
    const category = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        subCategories: true,
      },
    })

    // Convert Decimal to number for client components
    const serializedCategory = {
      ...category,
      subCategories: category.subCategories?.map(sub => ({
        ...sub,
        fee: Number(sub.fee),
      })) || [],
    }

    revalidatePath('/admin/categories')
    return { success: true, data: serializedCategory }
  } catch (error: unknown) {
    console.error('Error updating category:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { success: false, error: 'Category name already exists' }
    }
    return { success: false, error: 'Failed to update category' }
  }
}

export async function deleteCategory(id: string) {
  try {
    // Check if category has subcategories
    const categoryWithSubs = await prisma.category.findUnique({
      where: { id },
      include: { subCategories: true },
    })

    if (categoryWithSubs?.subCategories.length) {
      return { success: false, error: 'Cannot delete category with subcategories' }
    }

    await prisma.category.delete({
      where: { id },
    })

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Error deleting category:', error)
    return { success: false, error: 'Failed to delete category' }
  }
}

// SubCategory Actions
export async function createSubCategory(data: CreateSubCategoryData) {
  try {
    const subCategory = await prisma.subCategory.create({
      data: {
        name: data.name,
        fee: data.fee,
        categoryId: data.categoryId,
      },
      include: {
        category: true,
      },
    })

    // Convert Decimal to number for client components
    const serializedSubCategory = {
      ...subCategory,
      fee: Number(subCategory.fee),
    }

    revalidatePath('/admin/categories')
    return { success: true, data: serializedSubCategory }
  } catch (error: unknown) {
    console.error('Error creating subcategory:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { success: false, error: 'Subcategory name already exists in this category' }
    }
    return { success: false, error: 'Failed to create subcategory' }
  }
}

export async function getSubCategories() {
  try {
    const subCategories = await prisma.subCategory.findMany({
      include: {
        category: true,
      },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' },
      ],
    })

    // Convert Decimal to number for client components
    const serializedSubCategories = subCategories.map(sub => ({
      ...sub,
      fee: Number(sub.fee),
    }))

    return { success: true, data: serializedSubCategories }
  } catch (error) {
    console.error('Error fetching subcategories:', error)
    return { success: false, error: 'Failed to fetch subcategories' }
  }
}

export async function getSubCategoryById(id: string) {
  try {
    const subCategory = await prisma.subCategory.findUnique({
      where: { id },
      include: {
        category: true,
      },
    })

    if (!subCategory) return null

    // Convert Decimal to number for client components
    return {
      ...subCategory,
      fee: Number(subCategory.fee),
    }
  } catch (error) {
    console.error('Error fetching subcategory:', error)
    return null
  }
}

export async function updateSubCategory(id: string, data: UpdateSubCategoryData) {
  try {
    const subCategory = await prisma.subCategory.update({
      where: { id },
      data: {
        name: data.name,
        fee: data.fee,
      },
      include: {
        category: true,
      },
    })

    // Convert Decimal to number for client components
    const serializedSubCategory = {
      ...subCategory,
      fee: Number(subCategory.fee),
    }

    revalidatePath('/admin/categories')
    return { success: true, data: serializedSubCategory }
  } catch (error: unknown) {
    console.error('Error updating subcategory:', error)
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
      return { success: false, error: 'Subcategory name already exists in this category' }
    }
    return { success: false, error: 'Failed to update subcategory' }
  }
}

export async function deleteSubCategory(id: string) {
  try {
    // Check if subcategory is assigned to any students
    const assignedStudents = await prisma.studentCategory.findMany({
      where: { subCategoryId: id },
    })

    if (assignedStudents.length > 0) {
      return { success: false, error: 'Cannot delete subcategory assigned to students' }
    }

    await prisma.subCategory.delete({
      where: { id },
    })

    revalidatePath('/admin/categories')
    return { success: true }
  } catch (error) {
    console.error('Error deleting subcategory:', error)
    return { success: false, error: 'Failed to delete subcategory' }
  }
}

// Student Category Assignment Actions
export async function assignStudentToSubCategories(studentId: string, subCategoryIds: string[]) {
  try {
    // Remove existing assignments
    await prisma.studentCategory.deleteMany({
      where: { studentId },
    })

    // Create new assignments
    if (subCategoryIds.length > 0) {
      const assignments = subCategoryIds.map(subCategoryId => ({
        studentId,
        subCategoryId,
        finalFee: 0,
      }))

      await prisma.studentCategory.createMany({
        data: assignments,
      })
    }

    revalidatePath('/admin/students')
    return { success: true }
  } catch (error) {
    console.error('Error assigning student to subcategories:', error)
    return { success: false, error: 'Failed to assign student to subcategories' }
  }
}

export async function getStudentCategories(studentId: string) {
  try {
    const studentCategories = await prisma.studentCategory.findMany({
      where: { studentId },
      include: {
        subCategory: {
          include: {
            category: true,
          },
        },
      },
    })

    // Convert Decimal to number for client components
    const serializedStudentCategories = studentCategories.map(sc => ({
      ...sc,
      discountAmount: sc.discountAmount.toNumber(),
      finalFee: sc.finalFee.toNumber(),
      totalPaid: sc.totalPaid.toNumber(),
      subCategory: sc.subCategory ? {
        ...sc.subCategory,
        fee: sc.subCategory.fee.toNumber(),
      } : undefined,
    }))

    return { success: true, data: serializedStudentCategories }
  } catch (error) {
    console.error('Error fetching student categories:', error)
    return { success: false, error: 'Failed to fetch student categories' }
  }
}