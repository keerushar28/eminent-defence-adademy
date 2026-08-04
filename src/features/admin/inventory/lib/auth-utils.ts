/**
 * Authentication and Authorization Utilities for Inventory Management
 * Provides role-based access control and user session management
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/features/core/lib/auth";

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "STAFF";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  isVerified: boolean;
}

export interface AuthResult {
  authorized: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Get the current authenticated user from session
 * @returns AuthUser or null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || !session.user.email) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      role: (session.user.role as UserRole) || "STAFF",
      isVerified: session.user.isVerified || false,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Check if user has required role for inventory operations
 * Only ADMIN and SUPER_ADMIN roles are allowed
 * @param allowedRoles - Array of roles that are allowed (defaults to ADMIN and SUPER_ADMIN)
 * @returns AuthResult with authorization status and user info
 */
export async function checkInventoryAccess(
  allowedRoles: UserRole[] = ["ADMIN", "SUPER_ADMIN", "STAFF"]
): Promise<AuthResult> {
  const user = await getCurrentUser();

  if (!user) {
    return {
      authorized: false,
      error:
        "Authentication required. Please log in to access inventory management.",
    };
  }

  if (!user.isVerified) {
    return {
      authorized: false,
      user,
      error:
        "Account verification required. Please verify your account to access inventory management.",
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      user,
      error:
        "Insufficient permissions. Only administrators can access inventory management.",
    };
  }

  return {
    authorized: true,
    user,
  };
}

/**
 * Require inventory access or throw error
 * Use this in server actions that need authorization
 * @param allowedRoles - Array of roles that are allowed
 * @returns AuthUser if authorized
 * @throws Error if not authorized
 */
export async function requireInventoryAccess(
  allowedRoles: UserRole[] = ["ADMIN", "SUPER_ADMIN", "STAFF"]
): Promise<AuthUser> {
  const result = await checkInventoryAccess(allowedRoles);

  if (!result.authorized) {
    throw new Error(result.error || "Access denied");
  }

  return result.user!;
}

/**
 * Check if user is SUPER_ADMIN
 * @returns boolean indicating if user is super admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "SUPER_ADMIN";
}

/**
 * Check if user is ADMIN or SUPER_ADMIN
 * @returns boolean indicating if user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
}
