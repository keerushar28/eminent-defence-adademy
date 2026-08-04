// hooks/useUserManagement.ts
import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { IUser } from "../types/types";
import { useSession } from "next-auth/react";
import { userApi } from "../api/user-api";

export function useUserManagement(usersData?: IUser[]) {
  const { data: session, status } = useSession();
  const currentUserId = session?.user?.id as string | undefined;
  const isLoading = status === "loading";

  const [users, setUsers] = useState<IUser[]>(usersData || []);
  const [originalUsers, setOriginalUsers] = useState<IUser[]>(usersData || []);
  const [isSaving, setIsSaving] = useState(false);

  const updateUserVerification = (userId: string, isVerified: boolean) => {
    if (userId === currentUserId) {
      toast.error("You cannot change your own verification status.");
      return;
    }
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, isVerified } : user
      )
    );
  };

  const updateUserRole = (
    userId: string,
    role: "SUPER_ADMIN" | "ADMIN" | "HOSTEL_ADMIN" | "STAFF"
  ) => {
    if (userId === currentUserId) {
      toast.error("You cannot change your own role.");
      return;
    }
    setUsers((prevUsers) =>
      prevUsers.map((user) => (user.id === userId ? { ...user, role } : user))
    );
  };

  const hasChanges = () => {
    return users.some((user) => {
      const original = originalUsers.find((orig) => orig.id === user.id);
      return (
        original &&
        (original.isVerified !== user.isVerified || original.role !== user.role)
      );
    });
  };

  const getChangedUsers = () => {
    return users.filter((user) => {
      const original = originalUsers.find((orig) => orig.id === user.id);
      return (
        original &&
        (original.isVerified !== user.isVerified || original.role !== user.role)
      );
    });
  };

  const saveChanges = async () => {
    const changedUsers = getChangedUsers();
    if (changedUsers.length === 0) {
      toast.info("No changes to save");
      return;
    }

    try {
      setIsSaving(true);

      const updates = changedUsers.map((user) => ({
        id: user.id,
        isVerified: user.isVerified,
        role: user.role,
      }));

      await userApi.updateBatch(updates); // backend call

      setOriginalUsers([...users]);

      // update success handling
      const verificationChanges = changedUsers.filter((user) => {
        const original = originalUsers.find((orig) => orig.id === user.id);
        return original && original.isVerified !== user.isVerified;
      }).length;

      const roleChanges = changedUsers.filter((user) => {
        const original = originalUsers.find((orig) => orig.id === user.id);
        return original && original.role !== user.role;
      }).length;

      let description = "";
      if (verificationChanges > 0 && roleChanges > 0) {
        description = `Updated verification for ${verificationChanges} user(s) and roles for ${roleChanges} user(s)`;
      } else if (verificationChanges > 0) {
        description = `Updated verification for ${verificationChanges} user(s)`;
      } else if (roleChanges > 0) {
        description = `Updated roles for ${roleChanges} user(s)`;
      }

      toast.success("Changes saved successfully", {
        description,
      });
    } catch (error) {
      let message = "Failed to save changes. Please try again later.";
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          message = error.response.data.error;
        } else if (error.message) {
          message = error.message;
        }
      }
      toast.error(message);

      setUsers([...originalUsers]);
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    setUsers([...originalUsers]);
    toast.info("Changes discarded");
  };

  const deleteUserHandler = async (userId: string) => {
    if (userId === currentUserId) {
      toast.error("You cannot delete your own account.");
      return;
    }

    try {
      const result = await userApi.deleteUser(userId);
      
      if (result.success) {
        // Remove user from both current and original state
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        setOriginalUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        toast.success("User deleted successfully");
      } else {
        toast.error(result.error || "Failed to delete user");
      }
    } catch (error) {
      let message = "Failed to delete user. Please try again later.";
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.error) {
          message = error.response.data.error;
        } else if (error.message) {
          message = error.message;
        }
      }
      toast.error(message);
    }
  };

  return {
    currentUserId,
    isLoading,
    users,
    isSaving,
    updateUserVerification,
    updateUserRole,
    saveChanges,
    discardChanges,
    deleteUser: deleteUserHandler,
    hasChanges: hasChanges(),
    getChangedUsers,
    changedUsersCount: getChangedUsers().length,
  };
}
