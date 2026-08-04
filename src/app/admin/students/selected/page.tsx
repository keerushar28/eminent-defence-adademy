"use client";

import SelectedStudentsView from "@/features/admin/students/selected/components/SelectedStudentsView";

export default function SelectedStudentsPage() {
  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Selected Students</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all selected students
          </p>
        </div>
      </div>
      <SelectedStudentsView />
    </div>
  );
}
