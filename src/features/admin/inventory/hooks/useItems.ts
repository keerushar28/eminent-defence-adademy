"use client";

import { useState, useEffect } from "react";
import { IInventoryItem, IInventoryCategory, ItemFilters } from "../types/inventory-types";
import { getItems, getItemById, getLowStockItems, getCategories } from "../actions/item-actions";

/**
 * Hook to fetch all items with optional filters
 */
export function useItems(filters?: ItemFilters) {
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchItems() {
      try {
        setLoading(true);
        setError(null);
        const data = await getItems(filters);
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch items");
      } finally {
        setLoading(false);
      }
    }

    fetchItems();
  }, [filters?.categoryId, filters?.isActive, filters?.lowStock, filters?.searchQuery]);

  return { items, loading, error };
}

/**
 * Hook to fetch a single item by ID
 */
export function useItem(id: string | null) {
  const [item, setItem] = useState<IInventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setItem(null);
      setLoading(false);
      return;
    }

    const itemId = id; // Capture the non-null id

    async function fetchItem() {
      try {
        setLoading(true);
        setError(null);
        const data = await getItemById(itemId);
        setItem(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch item");
      } finally {
        setLoading(false);
      }
    }

    fetchItem();
  }, [id]);

  return { item, loading, error };
}

/**
 * Hook to fetch low stock items
 */
export function useLowStockItems() {
  const [items, setItems] = useState<IInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLowStockItems() {
      try {
        setLoading(true);
        setError(null);
        const data = await getLowStockItems();
        setItems(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch low stock items");
      } finally {
        setLoading(false);
      }
    }

    fetchLowStockItems();
  }, []);

  return { items, loading, error };
}

/**
 * Hook to fetch all categories
 */
export function useCategories() {
  const [categories, setCategories] = useState<IInventoryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        setError(null);
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch categories");
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  return { categories, loading, error };
}
