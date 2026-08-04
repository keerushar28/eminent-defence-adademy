"use client";

import { Button } from "@/features/core/components/button";
import { Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { Badge } from "@/features/core/components/badge";
import { useState } from "react";
import { IInventoryCategory } from "../types/inventory-types";
import AddCategory from "./AddCategory";
import EditCategory from "./EditCategory";
import DeleteCategory from "./DeleteCategory";
import EmptyState from "../components/shared/EmptyState";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";

interface CategoryListProps {
  categories: IInventoryCategory[];
  onUpdate: () => void;
  defaultIsBilling?: boolean;
}

export default function CategoryList({ categories, onUpdate, defaultIsBilling }: CategoryListProps) {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<IInventoryCategory | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<IInventoryCategory | null>(null);

  if (categories.length === 0) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-end mb-4">
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
        <div className="rounded-md border">
          <EmptyState
            icon={FolderOpen}
            title="No categories found"
            description="Start organizing your inventory by creating categories. Categories help you group similar items together."
            onAction={() => setIsAddOpen(true)}
          />
        </div>
        <AddCategory
          isOpen={isAddOpen}
          onClose={() => setIsAddOpen(false)}
          onSuccess={() => {
            setIsAddOpen(false);
            onUpdate();
          }}
          defaultIsBilling={defaultIsBilling}
        />
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {categories.length} {categories.length === 1 ? "category" : "categories"} total
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">#</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map((category, index) => (
              <TableRow key={category.id}>
                <TableCell className="text-center font-medium text-sm">
                  {index + 1}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{category.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {category.description || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {category.isBilling ? (
                    <Badge variant="default" className="bg-blue-600">
                      Billing
                    </Badge>
                  ) : (
                    <Badge variant="outline">Inventory</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {formatNepaliDateFromDate(new Date(category.createdAt))}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(category.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AddCategory
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={() => {
          setIsAddOpen(false);
          onUpdate();
        }}
        defaultIsBilling={defaultIsBilling}
      />

      {editingCategory && (
        <EditCategory
          category={editingCategory}
          isOpen={!!editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null);
            onUpdate();
          }}
        />
      )}

      {deletingCategory && (
        <DeleteCategory
          category={deletingCategory}
          isOpen={!!deletingCategory}
          onClose={() => setDeletingCategory(null)}
          onSuccess={() => {
            setDeletingCategory(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}
