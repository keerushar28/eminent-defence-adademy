'use client'

import { useState } from "react"
import { Button } from "@/features/core/components/button"
import { Input } from "@/features/core/components/input"
import { Badge } from "@/features/core/components/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/features/core/components/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/features/core/components/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/features/core/components/alert-dialog"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  FolderPlus,
  Loader2,
  FolderOpen
} from "lucide-react"
import { toast } from "sonner"
import { ICategory, ISubCategory } from "../types/types"
import { deleteCategory, deleteSubCategory } from "../actions/category-actions"
import { useRouter } from "next/navigation"
import AddCategory from "./AddCategory"
import AddSubCategory from "./AddSubCategory"
import EditCategory from "./EditCategory"
import EditSubCategory from "./EditSubCategory"
import EmptyState from "../../inventory/components/shared/EmptyState"

interface CategoriesDataTableProps {
  categories?: ICategory[]
}

export default function CategoriesDataTable({ categories }: CategoriesDataTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const router = useRouter()
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showAddSubCategory, setShowAddSubCategory] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(undefined)
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null)
  const [editingSubCategory, setEditingSubCategory] = useState<ISubCategory | null>(null)
  const [deletingItem, setDeletingItem] = useState<{ type: 'category' | 'subcategory', id: string, name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter categories based on search term
  const filteredCategories = categories?.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.subCategories?.some(sub =>
      sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  const handleAddSubCategory = (categoryId?: string) => {
    setSelectedCategoryId(categoryId)
    setShowAddSubCategory(true)
  }

  const handleCloseAddSubCategory = () => {
    setShowAddSubCategory(false)
    setSelectedCategoryId(undefined)
  }

  const handleDelete = async () => {
    if (!deletingItem) return

    setIsDeleting(true)
    try {
      let result
      if (deletingItem.type === 'category') {
        result = await deleteCategory(deletingItem.id)
      } else {
        result = await deleteSubCategory(deletingItem.id)
      }

      if (result.success) {
        toast.success(`${deletingItem.type === 'category' ? 'Category' : 'Subcategory'} Deleted Successfully! 🗑️`, {
          description: `"${deletingItem.name}" has been removed.`,
          duration: 5000,
        })
      } else {
        toast.error(`Failed to Delete ${deletingItem.type === 'category' ? 'Category' : 'Subcategory'} ❌`, {
          description: result.error || "Something went wrong. Please try again.",
          duration: 5000,
        })
      }
    } catch (error) {
      console.error("Delete error:", error)
      toast.error("Delete Error ❌", {
        description: "An unexpected error occurred. Please try again.",
        duration: 5000,
      })
    } finally {
      setIsDeleting(false)
      setDeletingItem(null)
    }
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Categories & Subcategories</h1>
          <p className="text-muted-foreground">
            Manage categories and their subcategories with fees
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => handleAddSubCategory()} variant="outline">
            <FolderPlus className="h-4 w-4 mr-2" />
            Add Subcategory
          </Button>
          <Button onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search categories or subcategories..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories Grid */}
      <div className="grid gap-6">
        {filteredCategories?.length === 0 ? (
          <div className="rounded-md border">
            <EmptyState
              icon={FolderOpen}
              title="No categories found"
              description="Start organizing your students assignments by creating categories."
            />
          </div>
        ) : (
          filteredCategories?.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{category.name}</CardTitle>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      {category.subCategories?.length || 0} subcategories
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleAddSubCategory(category.id)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Subcategory
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Category
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingItem({ type: 'category', id: category.id, name: category.name })}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Category
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>

              {category.subCategories && category.subCategories.length > 0 && (
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subcategory</TableHead>
                        <TableHead>Fee (NPR)</TableHead>
                        <TableHead className="w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {category.subCategories.map((subCategory) => (
                        <TableRow key={subCategory.id}>
                          <TableCell className="font-medium">
                            {subCategory.name}
                          </TableCell>
                          <TableCell>
                            NPR {Number(subCategory.fee).toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => setEditingSubCategory(subCategory)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setDeletingItem({ type: 'subcategory', id: subCategory.id, name: subCategory.name })}
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      <AddCategory
        isOpen={showAddCategory}
        onClose={() => setShowAddCategory(false)}
        onSuccess={() => {
          setShowAddCategory(false)
          router.refresh()
        }}
      />

      <AddSubCategory
        isOpen={showAddSubCategory}
        onClose={handleCloseAddSubCategory}
        onSuccess={() => {
          handleCloseAddSubCategory()
          router.refresh()
        }}
        categories={categories || []}
        preselectedCategoryId={selectedCategoryId}
      />

      {editingCategory && (
        <EditCategory
          category={editingCategory}
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {editingSubCategory && (
        <EditSubCategory
          subCategory={editingSubCategory}
          isOpen={!!editingSubCategory}
          onClose={() => setEditingSubCategory(null)}
          categories={categories || []}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deletingItem?.type === 'category' ? 'Category' : 'Subcategory'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deletingItem?.name}&quot;? This action cannot be undone.
              {deletingItem?.type === 'category' && " All subcategories in this category will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}