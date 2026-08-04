"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/features/core/components/sheet";
import { Button } from "@/features/core/components/button";
import { Badge } from "@/features/core/components/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import { ScrollArea } from "@/features/core/components/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/core/components/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/features/core/components/table";
import { Loader2, Plus, Folder, Package, BedDouble } from "lucide-react";
import { toast } from "sonner";
import { formatNepaliDateFromDate } from "@/features/core/lib/nepali-date";
import { useSession } from "next-auth/react";
import {
  getStudentLedgerDetail,
  StudentLedgerDetail,
} from "../actions/unified-ledger-actions";

interface StudentLedgerDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  onAddPayment: () => void;
}

export default function StudentLedgerDetailDialog({
  isOpen,
  onClose,
  studentId,
  onAddPayment,
}: StudentLedgerDetailDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<StudentLedgerDetail | null>(null);
  
  // Check if user is admin
  const isAdmin = session?.user?.role === "ADMIN" || session?.user?.role === "SUPER_ADMIN";

  useEffect(() => {
    if (isOpen && studentId) {
      fetchDetail();
    }
  }, [isOpen, studentId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const data = await getStudentLedgerDetail(studentId);
      setDetail(data);
    } catch (error) {
      console.error("Error fetching student detail:", error);
      toast.error("Failed to load student details");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date: Date) => {
    return formatNepaliDateFromDate(new Date(date));
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl p-0 h-full flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Student Ledger Details</SheetTitle>
          <SheetDescription>
            Complete financial overview for the student
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : detail ? (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {/* Student Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={detail.student.student_image} alt={detail.student.fullname} />
                  <AvatarFallback className="text-lg">{detail.student.fullname.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{detail.student.fullname}</h3>
                  <p className="text-sm text-muted-foreground">{detail.student.email}</p>
                  <p className="text-sm text-muted-foreground">{detail.student.contact_number_student}</p>
                </div>
                {detail.summary.grandPending > 0 && (
                  <Button onClick={onAddPayment}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Payment
                  </Button>
                )}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Total Fee</p>
                  <p className="text-lg font-bold">{formatCurrency(detail.summary.grandTotal)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Total Paid</p>
                  <p className="text-lg font-bold text-green-600">{formatCurrency(detail.summary.grandPaid)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Total Pending</p>
                  <p className="text-lg font-bold text-red-600">{formatCurrency(detail.summary.grandPending)}</p>
                </div>
              </div>

              {/* Tabs for different fee types */}
              <Tabs defaultValue="categories" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="categories" className="text-xs">
                    <Folder className="h-3 w-3 mr-1" />
                    Categories ({detail.categories.length})
                  </TabsTrigger>
                  <TabsTrigger value="issuances" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    Issuances ({detail.issuances.length})
                  </TabsTrigger>
                  <TabsTrigger value="hostel" className="text-xs">
                    <BedDouble className="h-3 w-3 mr-1" />
                    Hostel ({detail.hostel.length})
                  </TabsTrigger>
                </TabsList>

                {/* Categories Tab */}
                <TabsContent value="categories" className="mt-4">
                  <div className="border rounded-lg">
                    <div className="p-3 bg-muted/30 border-b flex justify-between items-center">
                      <span className="text-sm font-medium">Category Assignments</span>
                      <div className="text-xs space-x-4">
                        <span className="text-green-600">Paid: {formatCurrency(detail.summary.categoryPaid)}</span>
                        <span className="text-red-600">Pending: {formatCurrency(detail.summary.categoryPending)}</span>
                      </div>
                    </div>
                    {detail.categories.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">No category assignments</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Fee</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Pending</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.categories.map((cat) => (
                            <TableRow key={cat.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{cat.subCategoryName}</p>
                                  <p className="text-xs text-muted-foreground">{cat.categoryName}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(cat.finalFee)}
                                {cat.discount > 0 && (
                                  <p className="text-xs text-muted-foreground">-{formatCurrency(cat.discount)} disc.</p>
                                )}
                              </TableCell>
                              <TableCell className="text-right text-sm text-green-600">
                                {formatCurrency(cat.paid)}
                              </TableCell>
                              <TableCell className="text-right text-sm text-red-600">
                                {cat.pending > 0 ? formatCurrency(cat.pending) : "-"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={cat.isActive ? "default" : "secondary"} className="text-xs">
                                  {cat.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>

                {/* Issuances Tab */}
                <TabsContent value="issuances" className="mt-4">
                  <div className="border rounded-lg">
                    <div className="p-3 bg-muted/30 border-b flex justify-between items-center">
                      <span className="text-sm font-medium">Inventory Issuances</span>
                      <div className="text-xs space-x-4">
                        <span className="text-green-600">Paid: {formatCurrency(detail.summary.issuancePaid)}</span>
                        <span className="text-red-600">Pending: {formatCurrency(detail.summary.issuancePending)}</span>
                      </div>
                    </div>
                    {detail.issuances.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">No inventory issuances</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty × Price</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Paid</TableHead>
                            <TableHead className="text-right">Pending</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {detail.issuances.map((issuance) => (
                            <TableRow key={issuance.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{issuance.itemName}</p>
                                  <p className="text-xs text-muted-foreground">{formatDate(issuance.issuedDate)}</p>
                                </div>
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {issuance.quantity} × {formatCurrency(issuance.unitPrice)}
                              </TableCell>
                              <TableCell className="text-right text-sm">
                                {formatCurrency(issuance.totalAmount)}
                              </TableCell>
                              <TableCell className="text-right text-sm text-green-600">
                                {formatCurrency(issuance.totalPaid)}
                              </TableCell>
                              <TableCell className="text-right text-sm text-red-600">
                                {issuance.pending > 0 ? formatCurrency(issuance.pending) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </TabsContent>

                {/* Hostel Tab */}
                <TabsContent value="hostel" className="mt-4">
                  <div className="border rounded-lg">
                    <div className="p-3 bg-muted/30 border-b flex justify-between items-center">
                      <span className="text-sm font-medium">Hostel Allocations</span>
                      <div className="text-xs space-x-4">
                        <span className="text-green-600">Paid: {formatCurrency(detail.summary.hostelPaid)}</span>
                        <span className="text-red-600">Pending: {formatCurrency(detail.summary.hostelPending)}</span>
                        {detail.summary.hostelCredit > 0 && isAdmin && (
                          <span className="text-blue-600">Overpaid: {formatCurrency(detail.summary.hostelCredit)}</span>
                        )}
                      </div>
                    </div>
                    {detail.hostel.length === 0 ? (
                      <p className="p-4 text-center text-sm text-muted-foreground">No hostel allocations</p>
                    ) : (
                      <>
                        {/* Pending Allocations */}
                        <div>
                          <div className="p-3 bg-muted/10 border-b text-sm font-medium">Pending</div>
                          {detail.hostel.filter(h => h.pending > 0).length === 0 ? (
                            <p className="p-4 text-center text-sm text-muted-foreground">No pending allocations</p>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Room / Bed</TableHead>
                                  <TableHead className="text-right">Rate/Day</TableHead>
                                  <TableHead className="text-right">Paid</TableHead>
                                  <TableHead className="text-right">Pending</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detail.hostel.filter(h => h.pending > 0).map((h) => (
                                  <TableRow key={h.allocationId}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium text-sm">Room {h.roomNumber} - Bed {h.bedNumber}</p>
                                        <p className="text-xs text-muted-foreground">From {formatDate(h.allocationDate)}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                      {formatCurrency(h.pricePerDay)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-green-600">
                                      {formatCurrency(h.totalPaid)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-red-600">
                                      {formatCurrency(h.pending)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={h.isActive ? "default" : "secondary"} className="text-xs">
                                        {h.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>

                        {/* Overpaid Allocations - Only for Admin */}
                        {isAdmin && detail.hostel.filter(h => h.credit > 0).length > 0 && (
                          <div>
                            <div className="p-3 bg-blue-50 border-b border-t text-sm font-medium text-blue-900">Overpaid</div>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Room / Bed</TableHead>
                                  <TableHead className="text-right">Rate/Day</TableHead>
                                  <TableHead className="text-right">Paid</TableHead>
                                  <TableHead className="text-right">Overpaid</TableHead>
                                  <TableHead>Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detail.hostel.filter(h => h.credit > 0).map((h) => (
                                  <TableRow key={h.allocationId}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium text-sm">Room {h.roomNumber} - Bed {h.bedNumber}</p>
                                        <p className="text-xs text-muted-foreground">From {formatDate(h.allocationDate)}</p>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right text-sm">
                                      {formatCurrency(h.pricePerDay)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-green-600">
                                      {formatCurrency(h.totalPaid)}
                                    </TableCell>
                                    <TableCell className="text-right text-sm text-blue-600">
                                      +{formatCurrency(h.credit)}
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant={h.isActive ? "default" : "secondary"} className="text-xs">
                                        {h.isActive ? "Active" : "Inactive"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center flex-1">
            <p className="text-muted-foreground">Failed to load student details</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
