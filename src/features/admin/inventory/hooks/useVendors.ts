"use client";

import { useState, useEffect } from "react";
import { IVendor, IVendorPayment } from "../types/inventory-types";
import { getVendors, getVendorById, getVendorPayments } from "../actions/vendor-actions";

/**
 * Hook to fetch all vendors
 */
export function useVendors() {
  const [vendors, setVendors] = useState<IVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVendors() {
      try {
        setLoading(true);
        setError(null);
        const data = await getVendors();
        setVendors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch vendors");
      } finally {
        setLoading(false);
      }
    }

    fetchVendors();
  }, []);

  return { vendors, loading, error };
}

/**
 * Hook to fetch a single vendor by ID
 */
export function useVendor(id: string | null) {
  const [vendor, setVendor] = useState<IVendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setVendor(null);
      setLoading(false);
      return;
    }

    const vendorId = id; // Capture the non-null id

    async function fetchVendor() {
      try {
        setLoading(true);
        setError(null);
        const data = await getVendorById(vendorId);
        setVendor(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch vendor");
      } finally {
        setLoading(false);
      }
    }

    fetchVendor();
  }, [id]);

  return { vendor, loading, error };
}

/**
 * Hook to fetch vendor payments
 */
export function useVendorPayments(vendorId: string | null) {
  const [payments, setPayments] = useState<IVendorPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vendorId) {
      setPayments([]);
      setLoading(false);
      return;
    }

    const capturedVendorId = vendorId; // Capture the non-null vendorId

    async function fetchPayments() {
      try {
        setLoading(true);
        setError(null);
        const data = await getVendorPayments(capturedVendorId);
        setPayments(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch vendor payments");
      } finally {
        setLoading(false);
      }
    }

    fetchPayments();
  }, [vendorId]);

  return { payments, loading, error };
}
