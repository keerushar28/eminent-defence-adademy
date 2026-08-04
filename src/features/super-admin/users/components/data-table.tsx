"use client";

import * as React from "react";
import {
    ColumnDef,
    ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    SortingState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronDown, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/features/core/components/button";
import { Checkbox } from "@/features/core/components/checkbox";
import { Badge } from "@/features/core/components/badge";
import {
    DropdownMenu, DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuCheckboxItem,
} from "@/features/core/components/dropdown-menu";
import { Switch } from "@/features/core/components/switch";
import { Input } from "@/features/core/components/input";
import {
    Table, TableBody, TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/features/core/components/table";
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
import { IUser } from "../types/types";

interface IProps {
    users?: IUser[];
    onVerificationChange?: (userId: string, isVerified: boolean) => void;
    onRoleChange?: (
        userId: string,
        role: "SUPER_ADMIN" | "ADMIN" | "HOSTEL_ADMIN" | "STAFF"
    ) => void;
    onDeleteUser?: (userId: string) => void;
    currentUserId?: string;
}

const roleConfig = {
    SUPER_ADMIN: {
        label: "Super Admin",
        color: "bg-red-100 text-red-800 hover:bg-red-200",
        darkColor: "dark:bg-red-900 dark:text-red-300",
    },
    ADMIN: {
        label: "Admin",
        color: "bg-blue-100 text-blue-800 hover:bg-blue-200",
        darkColor: "dark:bg-blue-900 dark:text-blue-300",
    },
    HOSTEL_ADMIN: {
        label: "Hostel Admin",
        color: "bg-purple-100 text-purple-800 hover:bg-purple-200",
        darkColor: "dark:bg-purple-900 dark:text-purple-300",
    },
    STAFF: {
        label: "Staff",
        color: "bg-green-100 text-green-800 hover:bg-green-200",
        darkColor: "dark:bg-green-900 dark:text-green-300",
    },
};

export function createColumns(
    onVerificationChange?: (userId: string, isVerified: boolean) => void,
    onRoleChange?: (
        userId: string,
        role: "SUPER_ADMIN" | "ADMIN" | "HOSTEL_ADMIN" | "STAFF"
    ) => void,
    onDeleteUser?: (userId: string) => void,
    currentUserId?: string
): ColumnDef<IUser>[] {
    return [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected()
                            ? true
                            : table.getIsSomePageRowsSelected()
                                ? "indeterminate"
                                : false
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
            accessorKey: "id",
            header: "ID",
            cell: ({ row }) => (
                <div className="font-mono text-xs">{row.getValue("id")}</div>
            ),
        },
        {
            accessorKey: "username",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Username
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const isCurrentUser = row.original.id === currentUserId;
                return (
                    <div className="flex items-center gap-2">
                        <span className="lowercase">{row.getValue("username")}</span>
                        {isCurrentUser && (
                            <Badge variant="destructive" className="text-xs">
                                You
                            </Badge>
                        )}
                    </div>
                );
            },
        },
        {
            accessorKey: "email",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Email
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => (
                <div className="lowercase">{row.getValue("email")}</div>
            ),
        },
        {
            accessorKey: "role",
            header: ({ column }) => {
                return (
                    <Button
                        variant="ghost"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Role
                        <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                );
            },
            cell: ({ row }) => {
                const user = row.original;
                const role = row.getValue("role") as "SUPER_ADMIN" | "ADMIN" | "HOSTEL_ADMIN" | "STAFF";
                const config = roleConfig[role];
                const isCurrentUser = user.id === currentUserId;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild disabled={isCurrentUser}>
                            <Button
                                variant="ghost"
                                className={`h-auto p-0 ${isCurrentUser ? "cursor-not-allowed opacity-50" : ""
                                    }`}
                            >
                                <Badge
                                    className={`${config.color} ${config.darkColor} cursor-pointer hover:scale-105 transition-transform`}
                                >
                                    {config.label}
                                </Badge>
                            </Button>
                        </DropdownMenuTrigger>
                        {!isCurrentUser && (
                            <DropdownMenuContent align="start">
                                <DropdownMenuLabel>Change Role</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuRadioGroup
                                    value={role}
                                    onValueChange={(newRole) => {
                                        onRoleChange?.(
                                            user.id,
                                            newRole as "SUPER_ADMIN" | "ADMIN" | "HOSTEL_ADMIN" | "STAFF"
                                        );
                                    }}
                                >
                                    {Object.entries(roleConfig)
                                        .filter(([roleKey]) => roleKey !== "HOSTEL_ADMIN")
                                        .map(([roleKey, roleConf]) => (
                                        <DropdownMenuRadioItem key={roleKey} value={roleKey}>
                                            <Badge
                                                className={`${roleConf.color} ${roleConf.darkColor} mr-2`}
                                                variant="secondary"
                                            >
                                                {roleConf.label}
                                            </Badge>
                                        </DropdownMenuRadioItem>
                                    ))}
                                </DropdownMenuRadioGroup>
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                );
            },
        },
        {
            accessorKey: "isVerified",
            header: "Verified",
            cell: ({ row }) => {
                const user = row.original;
                const isVerified = row.getValue("isVerified") as boolean;
                const isCurrentUser = user.id === currentUserId;

                return (
                    <div className="flex items-center gap-2 ">
                        <Switch
                            checked={isVerified}
                            onCheckedChange={(checked) => {
                                if (!isCurrentUser) {
                                    onVerificationChange?.(user.id, checked);
                                }
                            }}
                            disabled={isCurrentUser}
                            aria-label={`Toggle verification for ${user.username}`}
                            className="cursor-pointer"
                        />
                        <span
                            className={`text-sm ${isVerified ? "text-green-600" : "text-red-600"
                                }`}
                        >
                            {isVerified ? "Verified" : "Not Verified"}
                        </span>
                    </div>
                );
            },
        },
        {
            id: "actions",
            enableHiding: false,
            cell: ({ row }) => {
                const user = row.original;
                const isCurrentUser = user.id === currentUserId;
                const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

                return (
                    <>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                    <span className="sr-only">Open menu</span>
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => navigator.clipboard.writeText(user.id)}
                                >
                                    Copy user ID
                                </DropdownMenuItem>
                                {!isCurrentUser && (
                                    <>
                                        <DropdownMenuItem
                                            onClick={() => {
                                                onVerificationChange?.(user.id, !user.isVerified);
                                            }}
                                        >
                                            {user.isVerified
                                                ? "Mark as Unverified"
                                                : "Mark as Verified"}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => {
                                                const roles: ("SUPER_ADMIN" | "ADMIN" | "HOSTEL_ADMIN" | "STAFF")[] = [
                                                    "STAFF",
                                                    "ADMIN",
                                                    "SUPER_ADMIN",
                                                ];
                                                const currentIndex = roles.indexOf(user.role);
                                                const nextRole = roles[(currentIndex + 1) % roles.length];
                                                onRoleChange?.(user.id, nextRole);
                                            }}
                                        >
                                            Cycle Role ({roleConfig[user.role].label} →{" "}
                                            {(() => {
                                                const roles: ("SUPER_ADMIN" | "ADMIN" | "HOSTEL_ADMIN" | "STAFF")[] = [
                                                    "STAFF",
                                                    "ADMIN",
                                                    "SUPER_ADMIN",
                                                ];
                                                const currentIndex = roles.indexOf(user.role);
                                                const nextRole = roles[(currentIndex + 1) % roles.length];
                                                return roleConfig[nextRole].label;
                                            })()}
                                            )
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={() => setShowDeleteDialog(true)}
                                            className="text-destructive focus:text-destructive"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete User
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Are you sure you want to delete user <strong>{user.username}</strong> ({user.email})?
                                        This action cannot be undone and will permanently remove the user and all associated data.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={() => {
                                            onDeleteUser?.(user.id);
                                            setShowDeleteDialog(false);
                                        }}
                                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </>
                );
            },
        },
    ];
}

export function DataTable({
    users = [],
    onVerificationChange,
    onRoleChange,
    onDeleteUser,
    currentUserId,
}: IProps) {
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
        []
    );
    const [columnVisibility, setColumnVisibility] =
        React.useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = React.useState({});

    const columns = React.useMemo(
        () => createColumns(onVerificationChange, onRoleChange, onDeleteUser, currentUserId),
        [onVerificationChange, onRoleChange, onDeleteUser, currentUserId]
    );

    const table = useReactTable({
        data: users,
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
    });

    return (
        <div className="w-full">
            <div className="flex items-center py-4 gap-4">
                <Input
                    placeholder="Filter emails..."
                    value={(table.getColumn("email")?.getFilterValue() as string) ?? ""}
                    onChange={(event) =>
                        table.getColumn("email")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <Input
                    placeholder="Filter usernames..."
                    value={
                        (table.getColumn("username")?.getFilterValue() as string) ?? ""
                    }
                    onChange={(event) =>
                        table.getColumn("username")?.setFilterValue(event.target.value)
                    }
                    className="max-w-sm"
                />
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="ml-auto">
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
                                        onCheckedChange={(value) =>
                                            column.toggleVisibility(!!value)
                                        }
                                    >
                                        {column.id}
                                    </DropdownMenuCheckboxItem>
                                );
                            })}
                    </DropdownMenuContent>
                </DropdownMenu>
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
                                    );
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
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className="flex items-center justify-end space-x-2 py-4">
                <div className="text-muted-foreground flex-1 text-sm">
                    {table.getFilteredSelectedRowModel().rows.length} of{" "}
                    {table.getFilteredRowModel().rows.length} row(s) selected.
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
        </div>
    );
}
