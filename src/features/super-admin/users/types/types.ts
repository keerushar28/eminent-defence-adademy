export interface IUser {
  id: string;
  username: string;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "HOSTEL_ADMIN";
  email: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface IUserUpdate {
  id: string;
  isVerified: boolean;
  role: "SUPER_ADMIN" | "ADMIN" | "STAFF" | "HOSTEL_ADMIN";
}
