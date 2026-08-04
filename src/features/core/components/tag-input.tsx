'use client'

import { X } from "lucide-react"
import { Input } from "@/features/core/components/input"
import { Badge } from "@/features/core/components/badge"
import { cn } from "@/lib/utils"
import { useState, KeyboardEvent, useRef } from "react"

interface TagInputProps {
    value: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    disabled?: boolean
    className?: string
    maxTags?: number
    maxLength?: number
    allowDuplicates?: boolean
    error?: string
}

export default function TagInput({
    value = [],
    onChange,
    placeholder = "Type and press Enter...",
    disabled = false,
    className,
    maxTags,
    maxLength = 50,
    allowDuplicates = false,
    error
}: TagInputProps) {
    const [inputValue, setInputValue] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    const addTag = (tag: string) => {
        const trimmedTag = tag.trim()

        if (!trimmedTag) return

        if (maxTags && value.length >= maxTags) {
            return
        }

        if (!allowDuplicates && value.includes(trimmedTag)) {
            setInputValue("")
            return
        }

        onChange([...value, trimmedTag])
        setInputValue("")
    }

    const removeTag = (indexToRemove: number) => {
        onChange(value.filter((_, index) => index !== indexToRemove))
    }

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {

        // Add tag on Enter or Tab
        if (e.key === "Enter" || e.key === "Tab") {
            e.preventDefault()
            addTag(inputValue)
        }

        // Remove last tag on Backspace when input is empty
        if (e.key === "Backspace" && !inputValue && value.length > 0) {
            e.preventDefault()
            removeTag(value.length - 1)
        }

        // Remove last tag on Delete when input is empty
        if (e.key === "Delete" && !inputValue && value.length > 0) {
            e.preventDefault()
            removeTag(value.length - 1)
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value

        // Limit input length
        if (newValue.length <= maxLength) {
            setInputValue(newValue)
        }
    }

    const handleContainerClick = () => {
        inputRef.current?.focus()
    }

    return (
        <div className={cn("space-y-2", className)}>
            <div
                onClick={handleContainerClick}
                className={cn(
                    "flex min-h-10 w-full flex-wrap gap-2 rounded-md border  px-3 py-2 text-sm ring-offset-background",
                    "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
                    disabled && "cursor-not-allowed opacity-50",
                    error && "border-red-500 focus-within:ring-red-500"
                )}
            >
                {value.map((tag, index) => (
                    <Badge
                        key={index}
                        variant="outline"
                        className="gap-1 pr-1 pl-2 py-1"
                    >
                        <span>{tag}</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation()
                                removeTag(index)
                            }}
                            disabled={disabled}
                            className={cn(
                                "ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                disabled ? "cursor-not-allowed" : "hover:bg-muted"
                            )}
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </Badge>
                ))}
                <Input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ""}
                    disabled={disabled || (maxTags !== undefined && value.length >= maxTags)}
                    className="h-7 flex-1 border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 min-w-[120px]"
                />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div>
                    {error && <p className="text-red-500">{error}</p>}
                    {!error && maxTags && (
                        <p>
                            {value.length} / {maxTags} tags
                        </p>
                    )}
                </div>
                <p className="text-right">
                    Press <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> or{" "}
                    <kbd className="px-1 py-0.5 rounded bg-muted">Tab</kbd> to add
                </p>
            </div>
        </div>
    )
}