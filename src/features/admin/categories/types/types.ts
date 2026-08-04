export interface ICategory {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  subCategories?: ISubCategory[];
}

export interface ISubCategory {
  id: string;
  name: string;
  fee: number;
  categoryId: string;
  category?: ICategory;
  createdAt: Date;
}

export interface IStudentCategory {
  id: string;
  studentId: string;
  subCategoryId: string;
  assignedAt: Date;
  assignedFee?: number;
  student?: {
    id: string;
    fullname: string;
  };
  subCategory?: ISubCategory;
}

export interface CreateCategoryData {
  name: string;
  description?: string;
}

export interface CreateSubCategoryData {
  name: string;
  fee: number;
  categoryId: string;
}

export interface UpdateCategoryData {
  name?: string;
  description?: string;
}

export interface UpdateSubCategoryData {
  name?: string;
  fee?: number;
}