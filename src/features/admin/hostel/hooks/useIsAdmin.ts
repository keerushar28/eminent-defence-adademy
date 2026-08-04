'use client';

import { useSession } from 'next-auth/react';

/**
 * Hook to check if the current user is an admin
 * @returns boolean indicating if user has admin role
 */
export function useIsAdmin(): boolean {
  const { data: session } = useSession();
  return session?.user?.role === 'ADMIN';
}
