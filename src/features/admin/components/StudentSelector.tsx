"use client";

import { useState, useMemo, useEffect } from "react";
import { Check, ChevronsUpDown, Search, User, Mail, Phone, Loader2 } from "lucide-react";
import { cn } from "@/features/core/lib/utils";
import { Button } from "@/features/core/components/button";
import {
  Command,
  CommandEmpty,
  CommandItem,
} from "@/features/core/components/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/core/components/popover";
import { ScrollArea } from "@/features/core/components/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import { Badge } from "@/features/core/components/badge";
import { IStudent } from "../students/types/types";
import { useDebounce } from "@/features/core/hooks/useDebounce";

interface StudentSelectorProps {
  students: IStudent[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  showAvatar?: boolean;
  showEmail?: boolean;
  showPhone?: boolean;
  showCategories?: boolean;
  className?: string;
}

export default function StudentSelector({
  students,
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select student...",
  showAvatar = true,
  showEmail = true,
  showPhone = false,
  showCategories = true,
  className,
}: StudentSelectorProps) {
  console.log(students.length)
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Debounce search query with 300ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Show searching indicator
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, debouncedSearchQuery]);

  // Filter students based on debounced search with result limit
  const filteredStudents = useMemo(() => {
    const MAX_RESULTS = 50; // Limit results for performance

    if (!debouncedSearchQuery) {
      // Show first 50 students when no search query
      return students.slice(0, MAX_RESULTS);
    }

    const query = debouncedSearchQuery.toLowerCase();
    const results: IStudent[] = [];

    // Optimized search - stop when we have enough results
    for (let i = 0; i < students.length && results.length < MAX_RESULTS; i++) {
      const student = students[i];

      // Quick checks first (most common searches)
      if (student.fullname.toLowerCase().includes(query)) {
        results.push(student);
        continue;
      }

      if (student.email.toLowerCase().includes(query)) {
        results.push(student);
        continue;
      }

      if (student.contact_number_student?.toLowerCase().includes(query)) {
        results.push(student);
        continue;
      }

      // Category search (more expensive, do last)
      if (student.studentCategories?.some(
        (sc) =>
          sc.subCategory?.name.toLowerCase().includes(query) ||
          sc.subCategory?.category?.name.toLowerCase().includes(query)
      )) {
        results.push(student);
      }
    }

    return results;
  }, [students, debouncedSearchQuery]);

  const selectedStudent = students.find((student) => student.id === value);
  const hasMoreResults = debouncedSearchQuery && filteredStudents.length === 50;

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between py-5", className)}
          disabled={disabled || students.length === 0}
        >
          {selectedStudent ? (
            <div className="flex items-center gap-2 truncate">
              {showAvatar && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={selectedStudent.student_image} alt={selectedStudent.fullname} />
                  <AvatarFallback className="text-xs">
                    {selectedStudent.fullname.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="truncate">{selectedStudent.fullname}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">
              {students.length === 0 ? "No students available" : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[450px] w-full p-0" align="start">
        <Command shouldFilter={false} className="w-full">
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              placeholder="Search by name, email, phone, or category..."
              className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {isSearching && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
          {isSearching ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Searching...</span>
            </div>
          ) : filteredStudents.length === 0 ? (
            <CommandEmpty>
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <User className="h-10 w-10 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">No students found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {searchQuery
                    ? "Try adjusting your search"
                    : "No students available to select"}
                </p>
              </div>
            </CommandEmpty>
          ) : (
            <>
              {!searchQuery && students.length > 50 && (
                <div className="px-2 py-1.5 text-xs text-muted-foreground bg-muted/50 border-b">
                  Showing first 50 students. Use search to find more.
                </div>
              )}
              <ScrollArea className="h-max">
                <div className="p-1">
                  {filteredStudents.map((student) => (
                    <CommandItem
                      key={student.id}
                      value={student.id}
                      onSelect={(currentValue: string) => {
                        onValueChange(currentValue === value ? "" : currentValue);
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      className="flex items-start gap-3 py-3"
                    >
                      <Check
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0",
                          value === student.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {showAvatar && (
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={student.student_image} alt={student.fullname} />
                          <AvatarFallback>{student.fullname.charAt(0)}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="font-medium truncate">{student.fullname}</div>
                        {showEmail && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 shrink-0" />
                            <span className="truncate">{student.email}</span>
                          </div>
                        )}
                        {showPhone && student.contact_number_student && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{student.contact_number_student}</span>
                          </div>
                        )}
                        {showCategories &&
                          student.studentCategories &&
                          student.studentCategories.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {student.studentCategories.slice(0, 3).map((sc) => (
                                <Badge
                                  key={sc.id}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {sc.subCategory?.name}
                                </Badge>
                              ))}
                              {student.studentCategories.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{student.studentCategories.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                      </div>
                    </CommandItem>
                  ))}
                  {hasMoreResults && (
                    <div className="px-2 py-3 text-xs text-center text-muted-foreground bg-muted/30">
                      Showing first 50 results. Refine your search to see more specific results.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}
