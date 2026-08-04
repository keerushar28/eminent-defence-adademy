// components/FormInput.tsx
import { ReactNode } from "react";
import { Control, FieldPath, FieldValues } from "react-hook-form";
import {
    FormControl,
    FormField,
    FormItem,
    FormMessage,
} from "@/features/core/components/form";
import { Input } from "@/features/core/components/input";
import { Label } from "@/features/core/components/label";

interface FormInputProps<T extends FieldValues> {
    control: Control<T>;
    name: FieldPath<T>;
    label: string;
    placeholder: string;
    type?: string;
    icon?: ReactNode;
    rightElement?: ReactNode;
    className?: string;
}

export function FormInput<T extends FieldValues>({
    control,
    name,
    label,
    placeholder,
    type = "text",
    icon,
    rightElement,
    className = "",
}: FormInputProps<T>) {
    return (
        <FormField
            control={control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <Label className="font-medium">{label}</Label>
                    <FormControl>
                        <div className="relative">
                            {icon && (
                                <div className="absolute left-3 top-3 ">
                                    {icon}
                                </div>
                            )}
                            <Input
                                type={type}
                                placeholder={placeholder}
                                className={`h-11 ${icon ? "pl-10" : ""} ${rightElement ? "pr-10" : ""
                                    } ${className}`}
                                {...field}
                            />
                            {rightElement && (
                                <div className="absolute right-0 top-0 h-full">
                                    {rightElement}
                                </div>
                            )}
                        </div>
                    </FormControl>
                    <FormMessage className="text-xs" />
                </FormItem>
            )}
        />
    );
}