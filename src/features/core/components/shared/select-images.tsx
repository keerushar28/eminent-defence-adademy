import { FormControl, FormField, FormItem, FormMessage } from "@/features/core/components/form";
import { Input } from "@/features/core/components/input";
import { X, Upload, FileImage } from "lucide-react";
import { UseFormReturn, FieldValues } from "react-hook-form";
import { toast } from "sonner";
import { useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/features/core/lib/utils";

interface SelectImageProps<TFieldValues extends FieldValues = FieldValues> {
    form: UseFormReturn<TFieldValues>;
    selectedAttachments?: File[];
    mode: 'create' | 'edit';
    existingAttachments?: string[];
    onRemoveExisting?: (attachmentUrl: string) => void;
    title?: string;
    description?: string;
    required?: boolean;
}

export default function SelectImages<TFieldValues extends FieldValues = FieldValues>({
    form,
    selectedAttachments = [],
    mode,
    existingAttachments = [],
    onRemoveExisting,
    title = "Upload Images",
    description,
    required = false
}: SelectImageProps<TFieldValues>) {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>(selectedAttachments);
    const [isDragging, setIsDragging] = useState(false);

    // Use the required prop or default behavior
    const isRequired = required;

    // Updated handleFileChange function - images only
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

        // Allowed image types only
        const allowedImageTypes = [
            "image/png",
            "image/jpg",
            "image/jpeg",
            "image/gif",
            "image/webp",
        ];

        // Validate file types and sizes
        const invalidFiles = files.filter((file) => {
            // Check if file is an allowed image type
            const isValidImage = allowedImageTypes.includes(file.type);
            // Check file size (5MB limit)
            const isSizeValid = file.size <= 5 * 1024 * 1024;

            return !isValidImage || !isSizeValid;
        });

        // Show error for invalid files
        if (invalidFiles.length > 0) {
            const invalidTypes = invalidFiles.filter(
                (file) => !allowedImageTypes.includes(file.type)
            );

            const oversizedFiles = invalidFiles.filter(
                (file) => file.size > 5 * 1024 * 1024
            );

            if (invalidTypes.length > 0) {
                toast.error(
                    `Invalid file type(s): ${invalidTypes
                        .map((f) => f.name)
                        .join(", ")}. ` +
                    `Only PNG, JPG, JPEG, GIF, and WEBP images are allowed.`
                );
            }

            if (oversizedFiles.length > 0) {
                toast.error(
                    `Some files exceed 5MB limit: ${oversizedFiles
                        .map((f) => f.name)
                        .join(", ")}`
                );
            }

            // Only keep valid files
            const validFiles = files.filter(
                (file) =>
                    allowedImageTypes.includes(file.type) &&
                    file.size <= 5 * 1024 * 1024
            );

            const newFiles = [...selectedFiles, ...validFiles];
            form.setValue("attachments" as never, newFiles as never);
            setSelectedFiles(newFiles);
        } else {
            const newFiles = [...selectedFiles, ...files];
            form.setValue("attachments" as never, newFiles as never);
            setSelectedFiles(newFiles);
        }

        // Clear the input value
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleRemoveSelectedFile = (index: number) => {
        const updatedFiles = [...selectedFiles];
        updatedFiles.splice(index, 1);
        setSelectedFiles(updatedFiles);
        form.setValue("attachments" as never, updatedFiles as never);
    };

    const handleRemoveExistingFile = (attachmentUrl: string) => {
        if (onRemoveExisting) {
            onRemoveExisting(attachmentUrl);
        }
    };

    // Drag and drop handlers
    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const files = Array.from(e.dataTransfer.files);

        // Allowed image types only
        const allowedImageTypes = [
            "image/png",
            "image/jpg",
            "image/jpeg",
            "image/gif",
            "image/webp",
        ];

        // Validate file types and sizes
        const invalidFiles = files.filter((file) => {
            const isValidImage = allowedImageTypes.includes(file.type);
            const isSizeValid = file.size <= 5 * 1024 * 1024;
            return !isValidImage || !isSizeValid;
        });

        // Show error for invalid files
        if (invalidFiles.length > 0) {
            const invalidTypes = invalidFiles.filter(
                (file) => !allowedImageTypes.includes(file.type)
            );

            const oversizedFiles = invalidFiles.filter(
                (file) => file.size > 5 * 1024 * 1024
            );

            if (invalidTypes.length > 0) {
                toast.error(
                    `Invalid file type(s): ${invalidTypes
                        .map((f) => f.name)
                        .join(", ")}. ` +
                    `Only PNG, JPG, JPEG, GIF, and WEBP images are allowed.`
                );
            }

            if (oversizedFiles.length > 0) {
                toast.error(
                    `Some files exceed 5MB limit: ${oversizedFiles
                        .map((f) => f.name)
                        .join(", ")}`
                );
            }

            // Only keep valid files
            const validFiles = files.filter(
                (file) =>
                    allowedImageTypes.includes(file.type) &&
                    file.size <= 5 * 1024 * 1024
            );

            if (validFiles.length > 0) {
                const newFiles = [...selectedFiles, ...validFiles];
                form.setValue("attachments" as never, newFiles as never);
                setSelectedFiles(newFiles);
                toast.success(`${validFiles.length} image(s) added successfully`);
            }
        } else {
            const newFiles = [...selectedFiles, ...files];
            form.setValue("attachments" as never, newFiles as never);
            setSelectedFiles(newFiles);
            toast.success(`${files.length} image(s) added successfully`);
        }
    };

    return (
        <FormField
            control={form.control}
            name={"attachments" as never}
            render={() => (
                <FormItem className="w-full">
                    <FormControl>
                        <div>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                multiple
                                accept="image/png, image/jpg, image/jpeg, image/gif, image/webp"
                                onChange={handleFileChange}
                            />
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                onDragEnter={handleDragEnter}
                                onDragLeave={handleDragLeave}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                className={cn(
                                    "flex cursor-pointer flex-col w-full rounded-xl border-2 border-dashed transition-all duration-200",
                                    isDragging
                                        ? "border-primary bg-primary/5 scale-[1.02]"
                                        : "border-gray-300 dark:border-neutral-700 bg-gradient-to-br from-gray-50 to-white dark:from-neutral-950 dark:to-neutral-900 hover:border-primary/50 hover:bg-primary/5",
                                    "shadow-sm hover:shadow-md"
                                )}
                            >
                                {/* Upload Area */}
                                <div className="p-8">
                                    <div className="flex flex-col items-center justify-center text-center space-y-4">
                                        {/* Icon */}
                                        <div className={cn(
                                            "flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200",
                                            isDragging
                                                ? "bg-primary text-primary-foreground scale-110"
                                                : "bg-gradient-to-br from-purple-100 to-blue-100 text-purple-600 dark:from-purple-900/30 dark:to-blue-900/30 dark:text-purple-400"
                                        )}>
                                            {isDragging ? (
                                                <Upload size={32} className="animate-bounce" />
                                            ) : (
                                                <FileImage size={32} />
                                            )}
                                        </div>

                                        {/* Title and Description */}
                                        <div className="space-y-2">
                                            <div className="text-lg font-semibold text-gray-800 dark:text-neutral-200">
                                                {isDragging ? "Drop images here" : title}
                                                {isRequired && <span className="text-red-500 ml-1">*</span>}
                                            </div>

                                            {!isDragging && (
                                                <div className="text-sm text-gray-600 dark:text-neutral-400 max-w-md mx-auto">
                                                    {description || (
                                                        <>
                                                            <p className="font-medium mb-1">
                                                                Drag and drop images here or click to browse
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-neutral-500">
                                                                Supported: PNG, JPG, JPEG, GIF, WEBP • Max 5MB each
                                                                {!isRequired && " • Optional"}
                                                            </p>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Upload Button */}
                                        {!isDragging && (selectedFiles.length > 0 || existingAttachments.length > 0) && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    fileInputRef.current?.click();
                                                }}
                                                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                            >
                                                Add More Images
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {/* Existing Attachments (Edit Mode) */}
                                {mode === 'edit' && existingAttachments.length > 0 && (
                                    <div className="px-8 pb-6 space-y-3 border-t dark:border-neutral-700/50">
                                        <div className="pt-6 flex items-center justify-between">
                                            <div className="text-sm font-semibold text-gray-700 dark:text-neutral-300">
                                                Current Images
                                            </div>
                                            <div className="text-xs text-gray-500 dark:text-neutral-500 bg-gray-100 dark:bg-neutral-800 px-2 py-1 rounded-full">
                                                {existingAttachments.length} {existingAttachments.length === 1 ? 'image' : 'images'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {existingAttachments.map((attachmentUrl: string, index: number) => (
                                                <div
                                                    key={index}
                                                    className="relative group"
                                                >
                                                    <div className="aspect-square rounded-xl overflow-hidden bg-linear-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-900 border-2 border-gray-200 dark:border-neutral-700 shadow-sm group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                                                        <Image
                                                            height={120}
                                                            width={120}
                                                            src={`/api/images${attachmentUrl}`}
                                                            alt={`Attachment ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                (e.target as HTMLImageElement).src = "/uploads/default.jpg"
                                                            }}
                                                        />
                                                    </div>

                                                    {/* Overlay with file info on hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl flex flex-col items-center justify-end p-3">
                                                        <div className="text-white text-xs text-center truncate w-full font-medium">
                                                            Existing
                                                        </div>
                                                    </div>

                                                    {/* Remove button */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveExistingFile(attachmentUrl);
                                                            }}
                                                            className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                                                            aria-label={`Remove ${attachmentUrl}`}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* New Selected Files */}
                                {selectedFiles.length > 0 && (
                                    <div className="px-8 pb-6 space-y-3 border-t dark:border-neutral-700/50">
                                        <div className="pt-6 flex items-center justify-between">
                                            <div className="text-sm font-semibold text-gray-700 dark:text-neutral-300">
                                                {mode === 'create' ? 'Selected' : 'New'} Images
                                            </div>
                                            <div className="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full font-medium">
                                                +{selectedFiles.length} {selectedFiles.length === 1 ? 'image' : 'images'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                                            {selectedFiles.map((file, index) => (
                                                <div
                                                    key={index}
                                                    className="relative group"
                                                >
                                                    <div className="aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-2 border-green-200 dark:border-green-700/50 shadow-sm group-hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                                                        <Image
                                                            height={120}
                                                            width={120}
                                                            src={URL.createObjectURL(file)}
                                                            alt={file.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>

                                                    {/* New badge */}
                                                    <div className="absolute top-2 left-2">
                                                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs font-semibold rounded-full shadow-sm">
                                                            New
                                                        </span>
                                                    </div>

                                                    {/* Overlay with file info on hover */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl flex flex-col items-center justify-end p-3">
                                                        <div className="text-white text-xs text-center truncate w-full mb-1 font-medium">
                                                            {file.name}
                                                        </div>
                                                        <div className="text-white/80 text-xs">
                                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                                        </div>
                                                    </div>

                                                    {/* Remove button */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRemoveSelectedFile(index);
                                                            }}
                                                            className="p-1.5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                                                            aria-label={`Remove ${file.name}`}
                                                        >
                                                            <X size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {form.formState.errors.attachments && (
                                            <div className="text-sm text-red-500 dark:text-red-400 mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                {form.formState.errors.attachments.message as string}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </FormControl>

                    <FormMessage />
                </FormItem>
            )}
        />
    );
}