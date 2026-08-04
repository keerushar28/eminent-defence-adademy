"use client";

import { useState, useEffect } from "react";
import { getCategories } from "@/features/admin/inventory/actions/item-actions";
import CategoryList from "@/features/admin/inventory/categories/CategoryList";
import { IInventoryCategory } from "@/features/admin/inventory/types/inventory-types";
import { Loader2 } from "lucide-react";

const STAFF_HIDDEN_CATEGORIES = ["Regular Expenditure (A)"];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<IInventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await getCategories(true);
      setCategories(data.filter((c) => !STAFF_HIDDEN_CATEGORIES.includes(c.name)));
    } catch (error) {
      console.error("Error loading categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing Categories</h1>
        <p className="text-muted-foreground">
          Manage categories to organize your Billing Expenses
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <CategoryList categories={categories} onUpdate={loadCategories} defaultIsBilling={true} />
      )}
    </div>
  );
}
