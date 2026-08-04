"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table";
import { Card, CardContent } from "@/features/core/components/card";
import { Badge } from "@/features/core/components/badge";
import { Button } from "@/features/core/components/button";
import { Skeleton } from "@/features/core/components/skeleton";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { X } from "lucide-react";
import { toggleStudentSelection } from "../../actions/selected-students-actions";
import { toast } from "sonner";
import Image from "next/image";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/core/components/alert-dialog";

interface Student {
  id: string;
  fullname: string;
  email: string;
  citizenship_number: string;
  contact_number_student: string;
  gender: string;
  student_image?: string;
  selectedAt: Date | string | null;
  subCategorySelections?: Array<{
    id: string;
    subCategory: {
      id: string;
      name: string;
      fee: number;
      category: {
        id: string;
        name: string;
      };
    };
  }>;
}

interface SelectedStudentsTableProps {
  students: Student[];
  loading?: boolean;
  onRefresh: () => void;
}

const genderColors: Record<string, string> = {
  MALE: "bg-blue-100 text-blue-800",
  FEMALE: "bg-pink-100 text-pink-800",
};

export default function SelectedStudentsTable({
  students,
  loading,
  onRefresh,
}: SelectedStudentsTableProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null);
  const [isDeselecting, setIsDeselecting] = useState(false);

  const handleDeselectClick = (studentId: string, studentName: string) => {
    setSelectedStudent({ id: studentId, name: studentName });
    setIsDialogOpen(true);
  };

  const handleConfirmDeselect = async () => {
    if (!selectedStudent) return;

    setIsDeselecting(true);
    try {
      const result = await toggleStudentSelection(selectedStudent.id);
      if (result.success) {
        toast.success(`${selectedStudent.name} deselected`);
        onRefresh();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to deselect student");
    } finally {
      setIsDeselecting(false);
      setIsDialogOpen(false);
      setSelectedStudent(null);
    }
  };

  if (loading) {
    return (
      <Card className="border shadow-xs">
        <CardContent className="pt-6">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (students.length === 0) {
    return (
      <Card className="border shadow-xs">
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground">No selected students found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Photo</TableHead>
              <TableHead className="font-semibold">Name</TableHead>
              <TableHead className="font-semibold">Email</TableHead>
              <TableHead className="font-semibold">Citizenship</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Gender</TableHead>
              <TableHead className="font-semibold">Selected Subcategories</TableHead>
              <TableHead className="font-semibold">Selected Date</TableHead>
              <TableHead className="font-semibold text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.map((student) => {
              const imageUrl = student.student_image || "/uploads/default.jpg";
              return (
              <TableRow key={student.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <div className="flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full overflow-hidden border">
                      <Image
                        src={`/api/images${imageUrl}`}
                        alt={`${student.fullname}'s photo`}
                        width={40}
                        height={40}
                        className="object-cover w-full h-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/uploads/default.jpg";
                        }}
                      />
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{student.fullname}</TableCell>
                <TableCell className="text-sm">{student.email}</TableCell>
                <TableCell className="text-sm">{student.citizenship_number}</TableCell>
                <TableCell className="text-sm">{student.contact_number_student}</TableCell>
                <TableCell>
                  <Badge className={genderColors[student.gender] || "bg-gray-100 text-gray-800"}>
                    {student.gender}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1 max-w-md">
                    {student.subCategorySelections && student.subCategorySelections.length > 0 ? (
                      student.subCategorySelections.map((selection) => (
                        <Badge
                          key={selection.id}
                          variant="secondary"
                          className="text-xs"
                          title={`${selection.subCategory.category.name} - NPR ${selection.subCategory.fee}`}
                        >
                          {selection.subCategory.category.name}: {selection.subCategory.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No subcategories</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {student.selectedAt
                    ? formatNepaliDateFromDate(new Date(student.selectedAt))
                    : "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeselectClick(student.id, student.fullname)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    disabled={isDeselecting}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deselect Student?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deselect <span className="font-semibold">{selectedStudent?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeselecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDeselect}
              disabled={isDeselecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeselecting ? "Deselecting..." : "Deselect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
