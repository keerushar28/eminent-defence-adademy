import { updateUsers, deleteUser } from "@/app/super-admin/actions/user-actions";
import { IUserUpdate } from "../types/types";

export const userApi = {
  async updateBatch(updates: IUserUpdate[]): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return await updateUsers(updates);
  },
  
  async deleteUser(userId: string): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    return await deleteUser(userId);
  },
};
