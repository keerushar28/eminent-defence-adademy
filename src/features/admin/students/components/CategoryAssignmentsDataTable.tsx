'use client'

import { useState, useMemo } from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, MoreHorizontal, UserCog, Eye, Plus, Trash2, AlertCircle, Loader2, ArrowRightLeft, Pencil } from "lucide-react"
import {
  Button
} from "@/features/core/components/button"
import { Input } from "@/features/core/components/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/core/components/dropdown-menu"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select"
import { Badge } from "@/features/core/components/badge"
import { IStudent } from "../types/types"
import AssignCategories from "./AssignCategories"
import TransferCategoryDialog from "./TransferCategoryDialog"
import EditAssignmentDialog from "./EditAssignmentDialog"
import { useRouter } from "next/navigation"
import { removeStudentCategory } from "../actions/category-assignment-actions"
import { useExistingAssignments } from "../hooks/useExistingAssignments"
import { toast } from "sonner"
import NepaliDate from "nepali-date-converter"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog"

// Helper function to format date - converts AD to BS
const formatDateString = (date: Date | string) => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  try {
    const nepaliDate = new NepaliDate(dateObj)
    return nepaliDate.format("DD MMMM YYYY")
  } catch {
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}

interface CategoryAssignmentsDataTableProps {
  students: IStudent[]
  allStudents?: IStudent[]
  categories: Array<{
    id: string
    name: string
    subCategories: Array<{
      id: string
      name: string
      fee: number
    }>
  }>
}

export default function CategoryAssignmentsDataTable({ students, allStudents, categories }: CategoryAssignmentsDataTableProps) {
  // Use allStudents for the assign dialog if provided, otherwise fall back to students
  const studentsForAssign = allStudents || students
  const router = useRouter()
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<{ id: string; name: string } | null>(null)
  const [selectedStudentCategories, setSelectedStudentCategories] = useState<IStudent['studentCategories']>(undefined)
  const [deallocateDialogOpen, setDeallocateDialogOpen] = useState(false)
  const [selectedStudentForDealloc, setSelectedStudentForDealloc] = useState<IStudent | null>(null)
  const [selectedCategoryToDealloc, setSelectedCategoryToDealloc] = useState<string>("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [allocationDetailsOpen, setAllocationDetailsOpen] = useState(false)
  const [selectedStudentForView, setSelectedStudentForView] = useState<IStudent | null>(null)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false)
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState<IStudent | null>(null)
  const [editAssignmentOpen, setEditAssignmentOpen] = useState(false)
  const [selectedStudentForEdit, setSelectedStudentForEdit] = useState<IStudent | null>(null)

  // Use the custom hook for existing assignments
  const { existingAssignments } = useExistingAssignments({
    studentCategories: selectedStudentCategories
  })

  const handleOpenAssignDialog = (student?: IStudent) => {
    if (student) {
      setSelectedStudent({ id: student.id, name: student.fullname })
      // Set student categories for the hook to process
      setSelectedStudentCategories(student.studentCategories)
    } else {
      setSelectedStudent(null)
      setSelectedStudentCategories(undefined)
    }
    setIsAssignOpen(true)
  }

  const handleOpenDeallocateDialog = (student: IStudent) => {
    setSelectedStudentForDealloc(student)
    setSelectedCategoryToDealloc("")
    setDeallocateDialogOpen(true)
  }

  const handleDeallocateCategory = async () => {
    if (!selectedCategoryToDealloc) {
      toast.error("Please select a category to de-allocate")
      return
    }

    setIsDeleting(true)

    try {
      const result = await removeStudentCategory(selectedCategoryToDealloc)

      if (result.success) {
        toast.success("Category de-allocated successfully")
        router.refresh()
        setDeallocateDialogOpen(false)
        setSelectedStudentForDealloc(null)
        setSelectedCategoryToDealloc("")
      } else {
        toast.error(result.error || "Failed to de-allocate category")
      }
    } catch (error) {
      console.error("Error de-allocating category:", error)
      toast.error("An error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  const getSelectedCategoryDetails = () => {
    if (!selectedStudentForDealloc || !selectedCategoryToDealloc) return null
    return selectedStudentForDealloc.studentCategories?.find(sc => sc.id === selectedCategoryToDealloc)
  }

  const columns: ColumnDef<IStudent>[] = useMemo(() => [
    {
      id: "serial",
      header: () => (
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
      accessorKey: "fullname",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Student Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("fullname")}</div>,
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
    },
    {
      accessorKey: "contact_number_student",
      header: "Contact",
      cell: ({ row }) => <div>{row.getValue("contact_number_student")}</div>,
    },
    {
      accessorKey: "studentCategories",
      id: "assignedCategories",
      header: "Assigned Categories",
      cell: ({ row }) => {
        const studentCategories = row.getValue("assignedCategories") as Array<{
          id: string
          isActive: boolean
          assignedDate?: Date | string
          subCategory?: {
            name: string
            category?: {
              name: string
            }
          }
        }>

        // Show all categories (both active and inactive) to track history
        const allCategories = studentCategories || []

        if (allCategories.length === 0) {
          return <Badge variant="secondary">No categories</Badge>
        }

        return (
          <div className="flex flex-wrap gap-1">
            {allCategories.map((sc) => (
              <Badge
                key={sc.id}
                variant={sc.isActive ? "outline" : "secondary"}
                className={`text-xs cursor-pointer hover:bg-primary/10 ${!sc.isActive ? 'opacity-60' : ''}`}
                onClick={() => {
                  setSelectedStudentForView(row.original)
                  setAllocationDetailsOpen(true)
                }}
              >
                {sc.subCategory?.category?.name} - {sc.subCategory?.name}
                {!sc.isActive && ' (De-allocated)'}
              </Badge>
            ))}
          </div>
        )
      },
    },
    {
      accessorKey: "studentCategories",
      id: "assignedDate",
      header: "Assigned Date",
      cell: ({ row }) => {
        const studentCategories = row.getValue("assignedDate") as Array<{
          id: string
          isActive: boolean
          assignedDate?: Date | string
        }>

        // Get all assigned dates (both active and inactive)
        const allDates = studentCategories?.filter(sc => sc.assignedDate) || []
        if (allDates.length === 0) {
          return <span className="text-muted-foreground">-</span>
        }

        // Show the most recent date
        const mostRecentDate = allDates
          .sort((a, b) => new Date(b.assignedDate!).getTime() - new Date(a.assignedDate!).getTime())[0]?.assignedDate

        return mostRecentDate ? <div>{formatDateString(mostRecentDate)}</div> : <span className="text-muted-foreground">-</span>
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const student = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => handleOpenAssignDialog(student)}
              >
                <UserCog className="mr-2 h-4 w-4" />
                Assign Categories
              </DropdownMenuItem>
              {student.studentCategories && student.studentCategories.some(sc => sc.isActive) && (
                <>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedStudentForView(student)
                      setAllocationDetailsOpen(true)
                    }}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Allocation
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedStudentForTransfer(student)
                      setTransferDialogOpen(true)
                    }}
                  >
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Transfer Category
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setSelectedStudentForEdit(student)
                      setEditAssignmentOpen(true)
                    }}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Assignment
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleOpenDeallocateDialog(student)}
                  >
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                    De-allocate Student
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ], [router])

  const table = useReactTable({
    data: students,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="w-full">
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Filter by student name..."
          value={(table.getColumn("fullname")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("fullname")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Button
          onClick={() => handleOpenAssignDialog()}
        >
          <Plus className="mr-2 h-4 w-4" />
          Assign Category
        </Button>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} student(s) total
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>

      {/* Assign Categories Dialog */}
      <AssignCategories
        students={studentsForAssign}
        initialStudentId={selectedStudent?.id}
        initialStudentName={selectedStudent?.name}
        isOpen={isAssignOpen}
        onClose={() => {
          setIsAssignOpen(false)
          setSelectedStudent(null)
          setSelectedStudentCategories(undefined)
        }}
        onSuccess={() => {
          router.refresh()
        }}
        existingAssignments={existingAssignments}
      />

      {/* De-allocate Category Dialog */}
      <AlertDialog open={deallocateDialogOpen} onOpenChange={setDeallocateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>De-allocate Category</AlertDialogTitle>
            <AlertDialogDescription>
              Select a category to de-allocate from {selectedStudentForDealloc?.fullname}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                Select Category <span className="text-red-500">*</span>
              </label>
              <Select value={selectedCategoryToDealloc} onValueChange={setSelectedCategoryToDealloc} disabled={isDeleting}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a category to de-allocate..." />
                </SelectTrigger>
                <SelectContent>
              {selectedStudentForDealloc?.studentCategories?.filter(sc => sc.isActive).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.subCategory?.category?.name} - {category.subCategory?.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {getSelectedCategoryDetails() && (
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Category Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground">Final Fee</p>
                    <p className="font-semibold">NPR {Number(getSelectedCategoryDetails()?.finalFee || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Paid</p>
                    <p className="font-semibold text-green-600">NPR {Number(getSelectedCategoryDetails()?.totalPaid || 0).toLocaleString()}</p>
                  </div>
                </div>

                {getSelectedCategoryDetails() && Number(getSelectedCategoryDetails()?.finalFee || 0) - Number(getSelectedCategoryDetails()?.totalPaid || 0) > 0 && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-semibold text-red-800 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Pending Balance
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      NPR {(Number(getSelectedCategoryDetails()?.finalFee || 0) - Number(getSelectedCategoryDetails()?.totalPaid || 0)).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeallocateCategory}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting || !selectedCategoryToDealloc}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  De-allocating...
                </>
              ) : (
                'De-allocate'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Allocation Details Dialog */}
      <Dialog open={allocationDetailsOpen} onOpenChange={setAllocationDetailsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Allocation Details</DialogTitle>
            <DialogDescription className="text-sm">
              {selectedStudentForView?.fullname} — {selectedStudentForView?.studentCategories?.length ?? 0} allocation(s)
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 space-y-4 pr-1">
            {/* Student Info */}
            {selectedStudentForView && (
              <div className="p-3 bg-muted/40 rounded-lg space-y-0.5">
                <p className="text-sm font-medium">{selectedStudentForView.fullname}</p>
                <p className="text-xs text-muted-foreground">{selectedStudentForView.email}</p>
                <p className="text-xs text-muted-foreground">{selectedStudentForView.contact_number_student}</p>
              </div>
            )}

            {/* All allocations */}
            {selectedStudentForView?.studentCategories?.map((sc, idx) => (
              <div key={sc.id} className="border rounded-lg p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">
                      {sc.subCategory?.category?.name} — {sc.subCategory?.name}
                    </p>
                    <p className="text-xs text-muted-foreground">#{idx + 1}</p>
                  </div>
                  <Badge variant={sc.isActive ? "default" : "secondary"} className="text-xs shrink-0">
                    {sc.isActive ? "Active" : "De-allocated"}
                  </Badge>
                </div>

                <div className="border-t" />

                {/* Dates */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Date</p>
                    <p className="font-medium text-sm">
                      {sc.assignedDate ? formatDateString(sc.assignedDate) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium text-sm">
                      {sc.durationMonths ? `${sc.durationMonths}m` : '-'}
                    </p>
                  </div>
                  {!sc.isActive && sc.checkedOutAt && (
                    <div className="col-span-2">
                      <p className="text-xs text-muted-foreground">Checked Out</p>
                      <p className="font-medium text-sm">{formatDateString(sc.checkedOutAt)}</p>
                    </div>
                  )}
                </div>

                <div className="border-t" />

                {/* Fees */}
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Original</span>
                    <span className="font-medium">NPR {Number(sc.subCategory?.fee || 0).toLocaleString()}</span>
                  </div>
                  {Number(sc.discountAmount || 0) > 0 && (
                    <div className="flex justify-between text-red-600">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="font-medium">- NPR {Number(sc.discountAmount || 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t font-semibold">
                    <span>Final Fee</span>
                    <span className="text-primary">NPR {Number(sc.finalFee || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-green-600 text-xs">
                    <span className="text-muted-foreground">Paid</span>
                    <span className="font-medium">NPR {Number(sc.totalPaid || 0).toLocaleString()}</span>
                  </div>
                  {Number(sc.finalFee || 0) - Number(sc.totalPaid || 0) > 0 && (
                    <div className="flex justify-between text-red-600 text-xs font-semibold">
                      <span>Pending</span>
                      <span>NPR {(Number(sc.finalFee || 0) - Number(sc.totalPaid || 0)).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Notes */}
                {sc.notes && (
                  <>
                    <div className="border-t" />
                    <p className="text-xs text-muted-foreground italic">{sc.notes}</p>
                  </>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Category Dialog */}
      <TransferCategoryDialog
        open={transferDialogOpen}
        onOpenChange={setTransferDialogOpen}
        student={selectedStudentForTransfer}
        availableCategories={categories}
      />

      {/* Edit Assignment Dialog */}
      <EditAssignmentDialog
        open={editAssignmentOpen}
        onOpenChange={setEditAssignmentOpen}
        student={selectedStudentForEdit}
      />
    </div>
  )
}
