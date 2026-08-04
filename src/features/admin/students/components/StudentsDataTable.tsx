"use client"

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, Plus, Edit, Eye, Trash2, MoreHorizontal, CheckSquare2 } from "lucide-react"
import { Button } from "@/features/core/components/button"
import { Checkbox } from "@/features/core/components/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/features/core/components/dropdown-menu"
import { Input } from "@/features/core/components/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/features/core/components/tooltip"
import Image from "next/image"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import AddStudent from "./AddStudent"
import EditStudent from "./EditStudent"
import { useSidebar } from "@/features/core/components/sidebar"
import DeleteStudent from "./DeleteStudent"
import { cn } from "@/features/core/lib/utils"
import { IStudent } from "../types/types"
import { useStudentsData } from "../hooks/useStudentsData";
import { Loader2, Search, X } from "lucide-react";
import { Skeleton } from "@/features/core/components/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import Pagination from "@/features/core/components/shared/pagination"
import { Badge } from "@/features/core/components/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/features/core/components/alert-dialog"
import { useStudent } from "../hooks/useStudent"
import SelectStudentButton from "../selected/components/SelectStudentButton"
import { convertAdToBs } from "@/features/core/utils/convertAdToBs"
import { printStudentRegistration, printMultipleStudentRegistrations } from "../utils/student-registration-print"
import { Printer } from "lucide-react"

export default function StudentsDataTable() {
  const router = useRouter();
  const pathname = usePathname();

  // Use the custom hook for data management
  const {
    students,
    pagination,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    debouncedSearch,
    genderFilter,
    setGenderFilter,
    registrationSort,
    setRegistrationSort,
    categoryFilter,
    setCategoryFilter,
    subCategoryFilter,
    setSubCategoryFilter,
    categories,
    subCategories,
    loadingCategories,
    goToPage,
    changeLimit,
    clearFilters,
    hasActiveFilters,
    refetch,
  } = useStudentsData();


  const columns: ColumnDef<IStudent>[] = [
    {
      id: "serial",
      header: ({ table }) => (
        <div className="w-10 text-center text-sm font-medium text-muted-foreground">#</div>
      ),
      cell: ({ row, table }) => (
        <div className="w-10 text-center text-sm font-medium">
          {(table.getState().pagination.pageIndex || 0) * table.getState().pagination.pageSize + row.index + 1}
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ? true :
              table.getIsSomePageRowsSelected() ? "indeterminate" : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "student_image",
      header: "Photo",
      cell: ({ row }) => {
        const imageUrl = row.getValue("student_image") as string || "/uploads/default.jpg"
        return (
          <div className="flex items-center justify-center">
            <div className="w-10 h-10 rounded-full overflow-hidden border">
              <Image
                src={`/api/images${imageUrl}`}
                alt={`${row.getValue("fullname")}'s photo`}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/uploads/default.jpg"
                }}
              />
            </div>
          </div>
        )
      },
      enableSorting: false,
      enableHiding: true,
    },
    {
      accessorKey: "fullname",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Fullname
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div>{row.getValue("fullname")}</div>,
      enableColumnFilter: true,
      filterFn: "includesString",
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div>{row.getValue("email")}</div>,
    },
    {
      accessorKey: "createdAt",
      header: "Registration Date",
      cell: ({ row }) => <div>{convertAdToBs(row.getValue("createdAt"))}</div>,
    },
    {
      accessorKey: "dob",
      header: "DOB",
      cell: ({ row }) => <div>{convertAdToBs(row.getValue("dob"))}</div>,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      cell: ({ row }) => <div className="capitalize">{(row.getValue("gender") as string).toLowerCase()}</div>,
    },
    {
      accessorKey: "blood_group",
      header: "Blood Group",
      cell: ({ row }) => <div className="capitalize">{(row.getValue("blood_group") as string).replace('_', ' ')}</div>,
    },
    {
      accessorKey: "studentCategories",
      header: "Categories",
      cell: ({ row }) => {
        const studentCategories = row.getValue("studentCategories") as Array<{
          id: string;
          subCategory?: {
            name: string;
            category?: {
              name: string;
            };
          };
        }>
        if (!studentCategories || studentCategories.length === 0) {
          return <div className="text-muted-foreground text-sm">No categories</div>
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-max">
            {studentCategories.slice(0, 4).map((sc) => (
              <div
                key={sc.id}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80"
              >
                {sc.subCategory?.category?.name} - {sc.subCategory?.name}
              </div>
            ))}
            {studentCategories.length > 4 && (
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-muted text-muted-foreground">
                +{studentCategories.length - 4} more
              </div>
            )}
          </div>
        )
      },
      enableSorting: false,
    },

    {
      accessorKey: "contact_number_student",
      header: "Student's Phone",
      cell: ({ row }) => <div>{row.getValue("contact_number_student")}</div>,
    },
    {
      accessorKey: "height",
      header: "Height",
      cell: ({ row }) => {
        const student = row.original
        return <div>{row.getValue("height")} {student.heightUnit || 'cm'}</div>
      },
    },
    {
      accessorKey: "qualifications",
      header: "Qualifications",
      cell: ({ row }) => {
        const qualifications = row.getValue("qualifications") as string[] | undefined;
        if (!qualifications || qualifications.length === 0) return <div>-</div>;
        return (
          <div className="flex flex-wrap gap-1">
            {qualifications.map((qual, index) => (
              <Badge key={index}>
                {qual}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "weight",
      header: "Weight",
      cell: ({ row }) => {
        const student = row.original
        return <div>{row.getValue("weight")} {student.weightUnit || 'kg'}</div>
      },
    },

    {
      accessorKey: "contact_number_parent",
      header: "Parent's Phone",
      cell: ({ row }) => <div>{row.getValue("contact_number_parent")}</div>,
    },
    {
      accessorKey: "permanent_address",
      header: "Permanent Address",
      cell: ({ row }) => <div className="capitalize">{row.getValue("permanent_address")}</div>,
    },
    {
      accessorKey: "temporary_address",
      header: "Temporary Address",
      cell: ({ row }) => <div className="capitalize">{row.getValue("temporary_address")}</div>,
    },
    {
      accessorKey: "parentName",
      header: "Parent Name",
      cell: ({ row }) => <div>{row.getValue("parentName")}</div>,
    },
    {
      accessorKey: "guardianName",
      header: "Guardian Name",
      cell: ({ row }) => {
        const guardianName = row.getValue("guardianName") as string | undefined
        return <div>{guardianName || "-"}</div>
      },
    },
    {
      accessorKey: "citizenship_number",
      header: "Citizenship Number",
      cell: ({ row }) => <div>{row.getValue("citizenship_number")}</div>,
    },
    {
      accessorKey: "images",
      header: "Attachments",
      cell: ({ row }) => {
        const attachments = row.getValue("images") as string[]
        if (!attachments || attachments.length === 0) {
          return <div className="text-muted-foreground text-sm">No attachments</div>
        }

        return (
          <div className="flex flex-wrap gap-1 max-w-48">
            {attachments.map((am, index) => (
              <Image key={index} src={`/api/images${am}`} alt="attachment" width={100} height={100} className="h-8 w-8 object-contain cursor-pointer" />
            ))}

          </div>
        )
      },
      enableSorting: false,
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original
        const isStudentSelected = (student as unknown as Record<string, unknown>).isSelected as boolean || false
        return (
          <div className="flex justify-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  disabled={loading}
                >
                  <span className="sr-only">Open actions menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    printStudentRegistration(student)
                  }}
                >
                  <Printer className="h-4 w-4 mr-2" />
                  <span>Print Registration</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => {
                    const basePath = pathname.includes('/staff') ? '/staff' : '/admin'
                    router.push(`${basePath}/students/${student.id}`)
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  <span>View Details</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    setSelectedStudentId(student.id)
                    setIsEditStudentOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  <span>Edit Student</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                  }}
                  className="p-0"
                >
                  <SelectStudentButton
                    studentId={student.id}
                    studentName={student.fullname}
                    isSelected={isStudentSelected}
                    onToggle={() => refetch()}
                  />
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault()
                  }}
                  className="p-0"
                >
                  <DeleteStudent id={student.id} />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
    },
  ]

  const [sorting, setSorting] = useState<SortingState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    dob: false,
    temporary_address: false,
    citizenship_number: false,
    height: false,
    weight: false,
    contact_number_parent: false,
    permanent_address: false,
    parentName: false,
    guardianName: false,
    images: false,
    qualifications: false,
  })
  const [rowSelection, setRowSelection] = useState({})
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isEditStudentOpen, setIsEditStudentOpen] = useState(false)
  const [selectedStudentId, setSelectedStudentId] = useState<string>("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { handleDeleteMultipleStudents } = useStudent()

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    manualPagination: true,
    manualFiltering: true,
    pageCount: pagination.totalPages,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  })
  const { state } = useSidebar()

  const selectedRows = table.getSelectedRowModel().rows
  const selectedStudentIds = selectedRows.map(row => row.original.id)

  const handleBulkDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await handleDeleteMultipleStudents(selectedStudentIds)
      if (result.success) {
        setRowSelection({})
        setIsDeleteDialogOpen(false)
        refetch()
      }
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-4", state === "collapsed" ? "w-full" : "md:w-[calc(100vw-18rem)] ")}>
      {/* Error Message */}
      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md border border-destructive">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 w-fill">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            disabled={loading}
          />
          {searchQuery && debouncedSearch !== searchQuery && (
            <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
        </div>

        <Select value={genderFilter} onValueChange={setGenderFilter} disabled={loading}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Genders</SelectItem>
            <SelectItem value="MALE">Male</SelectItem>
            <SelectItem value="FEMALE">Female</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter || "all-categories"} onValueChange={(value) => setCategoryFilter(value === "all-categories" ? "" : value)} disabled={loading || loadingCategories}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-categories">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-[180px]">
              <Select value={subCategoryFilter || "all-subcategories"} onValueChange={(value) => setSubCategoryFilter(value === "all-subcategories" ? "" : value)} disabled={loading || !categoryFilter || subCategories.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="Sub-Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-subcategories">All Sub-Categories</SelectItem>
                  {subCategories.map((subCategory) => (
                    <SelectItem key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          {!categoryFilter && (
            <TooltipContent>
              <p>Select a category first</p>
            </TooltipContent>
          )}
        </Tooltip>

        <Select value={registrationSort} onValueChange={(value) => setRegistrationSort(value as "asc" | "desc")} disabled={loading}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Registration Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="desc">Newest First</SelectItem>
            <SelectItem value="asc">Oldest First</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={loading}
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}

        {selectedStudentIds.length > 0 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const selectedStudents = selectedRows.map(row => row.original);
                printMultipleStudentRegistrations(selectedStudents);
              }}
              disabled={isDeleting}
            >
              <Printer className="h-4 w-4 mr-1" />
              Print {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'Student' : 'Students'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete {selectedStudentIds.length} {selectedStudentIds.length === 1 ? 'Student' : 'Students'}
            </Button>
          </>
        )}

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto bg-transparent text-muted-foreground">
                Columns <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex gap-2 ml-auto items-center">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          )}
          <Button
            onClick={() => setIsAddStudentOpen(true)}
            disabled={loading}
          >
            Add Student <Plus />
          </Button>
        </div>
      </div>
      <div className="rounded-md border ">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // Show skeleton rows while loading
              Array.from({ length: pagination.limit }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  {table.getVisibleFlatColumns().map((column) => (
                    <TableCell key={`skeleton-${index}-${column.id}`}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <p className="font-medium">No students found</p>
                    <p className="text-sm">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Pagination */}
      {pagination.total > 0 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          itemsPerPage={pagination.limit}
          onPageChange={goToPage}
          onItemsPerPageChange={changeLimit}
          loading={loading}
        />
      )}

      <AddStudent
        isOpen={isAddStudentOpen}
        onClose={() => setIsAddStudentOpen(false)}
        onSuccess={() => {
          setIsAddStudentOpen(false);
          refetch();
        }}
      />

      <EditStudent
        studentId={selectedStudentId}
        isOpen={isEditStudentOpen}
        onClose={() => {
          setIsEditStudentOpen(false);
          setSelectedStudentId("");
        }}
        onSuccess={() => {
          refetch();
          setIsEditStudentOpen(false)
          setSelectedStudentId("")
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedStudentIds.length} Student(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete {selectedStudentIds.length} student(s)
              and remove all of their allocations to rooms.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div >
  )
}