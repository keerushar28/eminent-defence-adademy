"use client";

import { useState, useEffect } from "react";
import { IOrder, OrderFilters } from "../types/inventory-types";
import { getOrders, getOrderById } from "../actions/order-actions";

/**
 * Hook to fetch all orders with optional filters
 */
export function useOrders(filters?: OrderFilters) {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrders(filters);
        setOrders(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders");
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [filters?.vendorId, filters?.status, filters?.dateFrom, filters?.dateTo]);

  return { orders, loading, error };
}

/**
 * Hook to fetch a single order by ID
 */
export function useOrder(id: string | null) {
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setOrder(null);
      setLoading(false);
      return;
    }

    const orderId = id; // Capture the non-null id

    async function fetchOrder() {
      try {
        setLoading(true);
        setError(null);
        const data = await getOrderById(orderId);
        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch order");
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [id]);

  return { order, loading, error };
}
