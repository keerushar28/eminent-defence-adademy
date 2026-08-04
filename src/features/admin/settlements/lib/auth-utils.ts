import { getServerSession } from "next-auth";
import { authOptions } from "@/features/core/lib/auth";

export async function getCurrentUser() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new Error("Unauthorized: No valid session found");
  }

  return {
    id: session.user.id,
    email: session.user.email,
    role: session.user.role,
    isVerified: session.user.isVerified,
  };
}

export async function requireAuth() {
  const user = await getCurrentUser();
  
  if (!user.isVerified) {
    throw new Error("Unauthorized: User not verified");
  }

  return user;
}