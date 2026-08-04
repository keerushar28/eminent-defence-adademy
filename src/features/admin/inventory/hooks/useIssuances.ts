"use client";

import { useState, useEffect } from "react";
import { IStudentIssuance, IssuanceFilters } from "../types/inventory-types";
import { getIssuances, getIssuanceById } from "../actions/issuance-actions";

/**
 * Hook to fetch all issuances with optional filters
 */
export function useIssuances(filters?: IssuanceFilters) {
  const [issuances, setIssuances] = useState<IStudentIssuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchIssuances() {
      try {
        setLoading(true);
        setError(null);
        const data = await getIssuances(filters);
        setIssuances(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch issuances");
      } finally {
        setLoading(false);
      }
    }

    fetchIssuances();
  }, [filters?.studentId, filters?.itemId, filters?.status, filters?.dateFrom, filters?.dateTo]);

  return { issuances, loading, error };
}

/**
 * Hook to fetch a single issuance by ID
 */
export function useIssuance(id: string | null) {
  const [issuance, setIssuance] = useState<IStudentIssuance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setIssuance(null);
      setLoading(false);
      return;
    }

    const issuanceId = id; // Capture the non-null id

    async function fetchIssuance() {
      try {
        setLoading(true);
        setError(null);
        const data = await getIssuanceById(issuanceId);
        setIssuance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch issuance");
      } finally {
        setLoading(false);
      }
    }

    fetchIssuance();
  }, [id]);

  return { issuance, loading, error };
}

/**
 * Hook to fetch issuances for a specific student
 */
export function useStudentIssuances(studentId: string | null) {
  const [issuances, setIssuances] = useState<IStudentIssuance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) {
      setIssuances([]);
      setLoading(false);
      return;
    }

    const capturedStudentId = studentId; // Capture the non-null studentId

    async function fetchStudentIssuances() {
      try {
        setLoading(true);
        setError(null);
        const data = await getIssuances({ studentId: capturedStudentId });
        setIssuances(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch student issuances");
      } finally {
        setLoading(false);
      }
    }

    fetchStudentIssuances();
  }, [studentId]);

  return { issuances, loading, error };
}
