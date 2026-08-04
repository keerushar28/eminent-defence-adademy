"use client";

import { useState, useEffect } from "react";
import { getCategories, getSubCategories } from "../actions/category-actions";
import { ICategory, ISubCategory } from "../types/types";

export function useCategories() {
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const result = await getCategories();
      if (result.success && result.data) {
        setCategories(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch categories");
      }
    } catch {
      setError("Failed to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return {
    categories,
    loading,
    error,
    refetch: fetchCategories,
  };
}

export function useSubCategories() {
  const [subCategories, setSubCategories] = useState<ISubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubCategories = async () => {
    try {
      setLoading(true);
      const result = await getSubCategories();
      if (result.success && result.data) {
        setSubCategories(result.data);
        setError(null);
      } else {
        setError(result.error || "Failed to fetch subcategories");
      }
    } catch {
      setError("Failed to fetch subcategories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubCategories();
  }, []);

  return {
    subCategories,
    loading,
    error,
    refetch: fetchSubCategories,
  };
}
