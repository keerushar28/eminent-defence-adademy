// lib/fileUpload.ts
import { writeFile, mkdir, access, unlink } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

// Configuration for different upload types
export interface UploadConfig {
  maxFileSize?: number;
  allowedTypes?: Record<string, string[]>;
  uploadPath?: string;
  maxFiles?: number;
}

// Default configurations
export const DEFAULT_CONFIG: UploadConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: {
    // Images
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"],
    "image/webp": [".webp"],
    "image/gif": [".gif"],
    // Documents
    "application/pdf": [".pdf"],
    "application/msword": [".doc"],
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
      ".docx",
    ],
    "application/vnd.ms-excel": [".xls"],
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
      ".xlsx",
    ],
    "application/vnd.ms-powerpoint": [".ppt"],
    "application/vnd.openxmlformats-officedocument.presentationml.presentation":
      [".pptx"],
  },
  uploadPath: "public/uploads",
  maxFiles: 10,
};

// Upload result interface
export interface UploadResult {
  success: boolean;
  files: string[];
  errors: string[];
  message?: string;
}

// Validation error interface
export interface ValidationError {
  fileName: string;
  error: string;
}

// Helper function to validate file type
function isValidFileType(
  file: File,
  allowedTypes: Record<string, string[]>
): boolean {
  const allowedMimeTypes = Object.keys(allowedTypes);
  return allowedMimeTypes.includes(file.type);
}

// Helper function to get file extension from MIME type
function getFileExtension(
  file: File,
  allowedTypes: Record<string, string[]>
): string {
  const extensions = allowedTypes[file.type as keyof typeof allowedTypes];
  if (extensions && extensions.length > 0) {
    return extensions[0];
  }
  // Fallback to original file extension
  const originalExtension = file.name.split(".").pop();
  return originalExtension ? `.${originalExtension}` : ".bin";
}

// Helper function to ensure directory exists
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await access(dirPath);
  } catch {
    await mkdir(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

// Helper function to clean up file name for logging
function sanitizeFileName(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_");
}

// Validate files before upload
export function validateFiles(
  files: File[],
  config: UploadConfig
): ValidationError[] {
  const errors: ValidationError[] = [];
  const {
    maxFileSize = DEFAULT_CONFIG.maxFileSize!,
    allowedTypes = DEFAULT_CONFIG.allowedTypes!,
    maxFiles = DEFAULT_CONFIG.maxFiles!,
  } = config;

  // Check file count
  if (files.length > maxFiles) {
    errors.push({
      fileName: "general",
      error: `Too many files. Maximum ${maxFiles} files allowed, but ${files.length} provided.`,
    });
  }

  // Validate each file
  files.forEach((file) => {
    // Check file size
    if (file.size > maxFileSize) {
      errors.push({
        fileName: file.name,
        error: `File exceeds maximum size of ${Math.round(
          maxFileSize / (1024 * 1024)
        )}MB`,
      });
    }

    // Check file type
    if (!isValidFileType(file, allowedTypes)) {
      const allowedTypesList = Object.keys(allowedTypes).join(", ");
      errors.push({
        fileName: file.name,
        error: `File type '${file.type}' is not allowed. Allowed types: ${allowedTypesList}`,
      });
    }
  });

  return errors;
}

// Main upload function
export async function uploadFiles(
  files: File[],
  config: UploadConfig = DEFAULT_CONFIG
): Promise<UploadResult> {
  try {
    const {
      uploadPath = DEFAULT_CONFIG.uploadPath!,
      allowedTypes = DEFAULT_CONFIG.allowedTypes!,
    } = config;

    // Validate files first
    const validationErrors = validateFiles(files, config);
    if (validationErrors.length > 0) {
      return {
        success: false,
        files: [],
        errors: validationErrors.map((err) => `${err.fileName}: ${err.error}`),
        message: "File validation failed",
      };
    }

    // Setup upload directory
    const uploadDir = join(process.cwd(), uploadPath);
    await ensureDirectoryExists(uploadDir);

    const savedFiles: string[] = [];
    const errors: string[] = [];

    // Process each file
    for (const file of files) {
      try {
        console.log(
          `Processing file: ${sanitizeFileName(file.name)}, Size: ${
            file.size
          } bytes, Type: ${file.type}`
        );

        // Generate unique filename
        const fileExtension = getFileExtension(file, allowedTypes);
        const uniqueFilename = `${uuidv4()}${fileExtension}`;
        const filePath = join(uploadDir, uniqueFilename);

        // Convert file to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Write file to disk
        await writeFile(filePath, buffer);
        console.log(`Successfully saved file: ${uniqueFilename}`);

        // Store the filename (relative path)
        savedFiles.push(uniqueFilename);
      } catch (error) {
        const errorMsg = `Failed to save ${file.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`;
        console.error(errorMsg);
        errors.push(errorMsg);
      }
    }

    return {
      success: savedFiles.length > 0,
      files: savedFiles,
      errors,
      message:
        savedFiles.length > 0
          ? `Successfully uploaded ${savedFiles.length} file(s)${
              errors.length > 0 ? ` with ${errors.length} error(s)` : ""
            }`
          : "No files were uploaded",
    };
  } catch (error) {
    console.error("Upload function error:", error);
    return {
      success: false,
      files: [],
      errors: [
        error instanceof Error ? error.message : "Unknown error occurred",
      ],
      message: "Upload operation failed",
    };
  }
}

// Function to delete files from disk
export async function deleteFiles(
  fileUrls: string[],
  uploadPath: string = "public/uploads"
): Promise<{
  deleted: string[];
  failed: string[];
}> {
  const deleted: string[] = [];
  const failed: string[] = [];

  for (const fileUrl of fileUrls) {
    try {
      // Handle both full paths and just filenames
      const filename = fileUrl.includes("/")
        ? fileUrl.split("/").pop()
        : fileUrl;

      if (!filename) {
        console.warn(`Invalid file URL format: ${fileUrl}`);
        failed.push(fileUrl);
        continue;
      }

      // Construct full file path
      const filePath = join(process.cwd(), uploadPath, filename);

      // Check if file exists before attempting to delete
      try {
        await access(filePath);
        await unlink(filePath);
        console.log(`Deleted file: ${filename}`);
        deleted.push(fileUrl);
      } catch (error) {
        console.warn(`File not found or inaccessible: ${filename}`, error);
        failed.push(fileUrl);
      }
    } catch (error) {
      console.error(`Error deleting file ${fileUrl}:`, error);
      failed.push(fileUrl);
    }
  }

  return { deleted, failed };
}

// Utility function to extract files from FormData
export function extractFilesFromFormData(
  formData: FormData,
  fieldName: string = "attachments"
): File[] {
  const files = formData.getAll(fieldName) as File[];

  // Filter out empty files and invalid entries
  return files.filter((file) => {
    return (
      file && file.size > 0 && file.name !== "undefined" && file.name !== ""
    );
  });
}

// Utility function for single file upload (for testimonials)
export async function uploadSingleFile(
  file: File,
  config: UploadConfig = DEFAULT_CONFIG
): Promise<UploadResult> {
  const singleFileConfig = { ...config, maxFiles: 1 };
  return uploadFiles([file], singleFileConfig);
}
