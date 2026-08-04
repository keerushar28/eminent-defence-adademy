"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, User, Mail, Phone, Loader2, X } from "lucide-react";
import { cn } from "@/features/core/lib/utils";
import { Button } from "@/features/core/components/button";
import { Input } from "@/features/core/components/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/features/core/components/popover";
import { ScrollArea } from "@/features/core/components/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import { Badge } from "@/features/core/components/badge";
import { useDebounce } from "@/features/core/hooks/useDebounce";

interface Student {
  id: string;
  fullname: string;
  email: string;
  student_image: string;
  contact_number_student: string;
  studentCategories?: Array<{
    id: string;
    subCategory: {
      id: string;
      name: string;
      category: {
        id: string;
        name: string;
      };
    };
  }>;
}

interface StudentSelectorOptimizedProps {
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

export default function StudentSelectorOptimized({
  value,
  onValueChange,
  disabled = false,
  placeholder = "Select student...",
  showAvatar = true,
  showEmail = true,
  showPhone = false,
  showCategories = true,
  className,
}: StudentSelectorOptimizedProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);

  // Debounce search query
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch students from API
  const fetchStudents = useCallback(async (query: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: query,
        limit: "50",
      });

      const response = await fetch(`/api/students/search?${params}`);
      if (!response.ok) throw new Error("Failed to fetch students");

      const data = await response.json();
      setStudents(data.students);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error("Error fetching students:", error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch selected student details
  const fetchSelectedStudent = useCallback(async (studentId: string) => {
    try {
      const response = await fetch(`/api/students/search?q=&limit=1000`);
      if (!response.ok) return;

      const data = await response.json();
      const student = data.students.find((s: Student) => s.id === studentId);
      if (student) setSelectedStudent(student);
    } catch (error) {
      console.error("Error fetching selected student:", error);
    }
  }, []);

  // Fetch students when search changes
  useEffect(() => {
    if (open) {
      fetchStudents(debouncedSearch);
    }
  }, [debouncedSearch, open, fetchStudents]);

  // Fetch selected student on mount
  useEffect(() => {
    if (value && !selectedStudent) {
      fetchSelectedStudent(value);
    }
  }, [value, selectedStudent, fetchSelectedStudent]);

  // Load initial students when opened
  useEffect(() => {
    if (open && students.length === 0 && !loading) {
      fetchStudents("");
    }
  }, [open, students.length, loading, fetchStudents]);

  const handleSelect = (student: Student) => {
    setSelectedStudent(student);
    onValueChange(student.id);
    setOpen(false);
    setSearchQuery("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between h-auto min-h-[44px] py-2", className)}
          disabled={disabled}
        >
          {selectedStudent ? (
            <div className="flex items-center gap-2 truncate">
              {showAvatar && (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={`/api/images${selectedStudent.student_image}`} alt={selectedStudent.fullname} />
                  <AvatarFallback className="text-xs">
                    {selectedStudent.fullname.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="truncate">{selectedStudent.fullname}</span>
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-0 max-h-[600px] flex flex-col" align="start">
        <div className="flex flex-col h-full">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2 shrink-0">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border-0 focus-visible:ring-0 shadow-none focus-visible:ring-offset-0 h-9 px-0"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />
            )}
          </div>

          {/* Loading State */}
          {loading && students.length === 0 ? (
            <div className="flex items-center justify-center py-8 flex-1">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
              <span className="text-sm text-muted-foreground">Loading students...</span>
            </div>
          ) : students.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
              <User className="h-10 w-10 text-muted-foreground mb-2" />
              <p className="text-sm font-medium">No students found</p>
              <p className="text-xs text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search"
                  : "Start typing to search for students"}
              </p>
            </div>
          ) : (
            /* Student List */
            <>
              <ScrollArea className={students.length <= 5 ? "h-auto" : "h-[350px]"}>
                <div className="p-2">
                  {students.map((student) => (
                    <button
                      key={student.id}
                      onClick={() => handleSelect(student)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 rounded-md hover:bg-accent transition-colors text-left cursor-pointer",
                        value === student.id && "bg-accent"
                      )}
                    >
                      {showAvatar && (
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage src={`/api/images${student.student_image}`} alt={student.fullname} />
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
                      {value === student.id && (
                        <div className="shrink-0 mt-1">
                          <div className="h-4 w-4 rounded-full bg-primary flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-white" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>

              {/* More Results Message */}
              {hasMore && (
                <div className="px-3 py-2 text-xs text-center text-muted-foreground bg-muted/30 border-t shrink-0">
                  Showing first 50 results. Refine your search to see more.
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
