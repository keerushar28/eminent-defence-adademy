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
import { Input } from "@/features/core/components/input";
import { Label } from "@/features/core/components/label";
import { Textarea } from "@/features/core/components/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/features/core/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/features/core/components/tabs";
import { ScrollArea } from "@/features/core/components/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/features/core/components/avatar";
import { Alert, AlertDescription } from "@/features/core/components/alert";
import { Loader2, AlertCircle, Folder, Package, BedDouble } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import {
  getStudentPendingIssuances,
  getStudentPendingHostelAllocations,
} from "../actions/unified-ledger-actions";
import { getStudentPendingFees, addPayment } from "@/features/admin/payments/actions/payment-actions";
import { createIssuancePayment } from "@/features/admin/inventory/actions/issuance-payment-actions";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";
import axios from "axios";

interface UnifiedPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  studentId: string;
}

interface PendingCategory {
  id: string;
  remaining: number;
  finalFee: number;
  totalPaid: number;
  subCategory: {
    name: string;
    category: {
      name: string;
    };
  };
}

interface PendingIssuance {
  id: string;
  itemName: string;
  itemUnit: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  totalPaid: number;
  remaining: number;
  issuedDate: Date;
}

interface PendingHostel {
  id: string;
  roomNumber: string;
  bedNumber: string;
  pricePerDay: number;
  allocationDate: Date;
  isActive?: boolean;
  totalPaid: number;
  pending: number;
  credit: number;
  isPending: boolean;
}

export default function UnifiedPaymentDialog({
  isOpen,
  onClose,
  onSuccess,
  studentId,
}: UnifiedPaymentDialogProps) {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("category");
  
  // Student info
  const [student, setStudent] = useState<{ fullname: string; email: string; student_image: string } | null>(null);
  
  // Pending items
  const [pendingCategories, setPendingCategories] = useState<PendingCategory[]>([]);
  const [pendingIssuances, setPendingIssuances] = useState<PendingIssuance[]>([]);
  const [pendingHostel, setPendingHostel] = useState<PendingHostel[]>([]);
  
  // Form state
  const [selectedItemId, setSelectedItemId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen && studentId) {
      fetchPendingItems();
    }
  }, [isOpen, studentId]);

  useEffect(() => {
    // Reset selection when tab changes
    setSelectedItemId("");
    setAmount("");
  }, [activeTab]);

  // Convert Date to YYYY-MM-DD format to avoid timezone issues
  const convertDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchPendingItems = async () => {
    try {
      setLoading(true);
      
      // Fetch student info
      const studentRes = await fetch(`/api/students/${studentId}`);
      if (studentRes.ok) {
        const studentData = await studentRes.json();
        setStudent(studentData);
      }

      // Fetch pending items from all sources
      const [categories, issuances, hostel] = await Promise.all([
        getStudentPendingFees(studentId, true),
        getStudentPendingIssuances(studentId),
        getStudentPendingHostelAllocations(studentId),
      ]);

      setPendingCategories(categories as PendingCategory[]);
      setPendingIssuances(issuances);
      setPendingHostel(hostel);

      // Set default tab based on what has pending items
      if (categories.length > 0) {
        setActiveTab("category");
      } else if (issuances.length > 0) {
        setActiveTab("issuance");
      } else if (hostel.some(h => h.isPending)) {
        setActiveTab("hostel");
      }
    } catch (error) {
      console.error("Error fetching pending items:", error);
      toast.error("Failed to load pending items");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedItem = () => {
    if (activeTab === "category") {
      return pendingCategories.find(c => c.id === selectedItemId);
    } else if (activeTab === "issuance") {
      return pendingIssuances.find(i => i.id === selectedItemId);
    } else {
      return pendingHostel.find(h => h.id === selectedItemId);
    }
  };

  const getMaxAmount = () => {
    const item = getSelectedItem();
    if (!item) return 0;
    
    if (activeTab === "category") {
      return (item as PendingCategory).remaining;
    } else if (activeTab === "issuance") {
      return (item as PendingIssuance).remaining;
    } else {
      return (item as PendingHostel).pending;
    }
  };

  const handleSubmit = async () => {
    if (!selectedItemId) {
      toast.error("Please select an item to pay for");
      return;
    }

    const paymentAmount = parseFloat(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const maxAmount = getMaxAmount();
    
    // Only allow overpayment for hostel module
    if (activeTab !== "hostel" && paymentAmount > maxAmount) {
      toast.error(`Amount exceeds remaining balance (NPR ${maxAmount.toLocaleString()})`);
      return;
    }

    setSubmitting(true);

    try {
      const paymentDateStr = convertDateToYYYYMMDD(paymentDate);
      if (activeTab === "category") {
        // Use existing category payment action
        const result = await addPayment(
          selectedItemId,
          paymentAmount,
          paymentDateStr,
          paymentMethod,
          referenceNumber || null,
          notes || null
        );

        if (!result.success) {
          throw new Error(result.error || "Failed to add payment");
        }
      } else if (activeTab === "issuance") {
        // Use existing issuance payment action
        const formData = new FormData();
        formData.append("amount", paymentAmount.toString());
        formData.append("paymentDate", new Date(paymentDateStr).toISOString());
        formData.append("paymentMethod", paymentMethod);
        formData.append("referenceNumber", referenceNumber);
        formData.append("notes", notes);

        const result = await createIssuancePayment(selectedItemId, formData, session?.user?.id);

        if (!result.success) {
          throw new Error(result.error || "Failed to add payment");
        }
      } else if (activeTab === "hostel") {
        // Use hostel payment API - allows overpayment
        await axios.post("/api/hostel/payments", {
          allocationId: selectedItemId,
          amount: paymentAmount,
          paymentDate: new Date(paymentDateStr).toISOString(),
          paymentMethod,
          referenceNumber: referenceNumber || undefined,
          notes: notes || undefined,
          createdBy: session?.user?.id || "admin",
        });
      }

      toast.success("Payment recorded successfully!");
      handleClose();
      onSuccess();
    } catch (error) {
      console.error("Error adding payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to add payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedItemId("");
    setAmount("");
    setPaymentDate(new Date());
    setPaymentMethod("CASH");
    setReferenceNumber("");
    setNotes("");
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const hasPendingItems = pendingCategories.length > 0 || 
                          pendingIssuances.length > 0 || 
                          pendingHostel.some(h => h.isPending);

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl p-0 h-full flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Add Payment</SheetTitle>
          <SheetDescription>
            Record a payment for category, inventory, or hostel fees
          </SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="flex items-center justify-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-4">
              {/* Student Info */}
              {student && (
                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={student.student_image} alt={student.fullname} />
                    <AvatarFallback>{student.fullname.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{student.fullname}</p>
                    <p className="text-xs text-muted-foreground">{student.email}</p>
                  </div>
                </div>
              )}

              {!hasPendingItems ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This student has no pending fees.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  {/* Payment Type Tabs */}
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="category" disabled={pendingCategories.length === 0}>
                        <Folder className="h-3 w-3 mr-1" />
                        Category
                      </TabsTrigger>
                      <TabsTrigger value="issuance" disabled={pendingIssuances.length === 0}>
                        <Package className="h-3 w-3 mr-1" />
                        Issuance
                      </TabsTrigger>
                      <TabsTrigger value="hostel" disabled={!pendingHostel.some(h => h.isPending)}>
                        <BedDouble className="h-3 w-3 mr-1" />
                        Hostel
                      </TabsTrigger>
                    </TabsList>

                    {/* Category Payment */}
                    <TabsContent value="category" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Select Category</Label>
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a category..." />
                          </SelectTrigger>
                          <SelectContent>
                            {pendingCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{cat.subCategory.category.name} - {cat.subCategory.name}</span>
                                  <span className="text-xs text-red-600 ml-2">
                                    {formatCurrency(cat.remaining)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedItemId && (
                        <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                          {(() => {
                            const cat = pendingCategories.find(c => c.id === selectedItemId);
                            if (!cat) return null;
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Final Fee:</span>
                                  <span>{formatCurrency(cat.finalFee)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Paid:</span>
                                  <span className="text-green-600">{formatCurrency(cat.totalPaid)}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                  <span>Remaining:</span>
                                  <span className="text-red-600">{formatCurrency(cat.remaining)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>

                    {/* Issuance Payment */}
                    <TabsContent value="issuance" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Select Issuance</Label>
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an issuance..." />
                          </SelectTrigger>
                          <SelectContent>
                            {pendingIssuances.map((issuance) => (
                              <SelectItem key={issuance.id} value={issuance.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>{issuance.itemName} ({issuance.quantity} {issuance.itemUnit})</span>
                                  <span className="text-xs text-red-600 ml-2">
                                    {formatCurrency(issuance.remaining)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedItemId && (
                        <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                          {(() => {
                            const issuance = pendingIssuances.find(i => i.id === selectedItemId);
                            if (!issuance) return null;
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Item:</span>
                                  <span>{issuance.itemName}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Qty × Price:</span>
                                  <span>{issuance.quantity} × {formatCurrency(issuance.unitPrice)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total:</span>
                                  <span>{formatCurrency(issuance.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Paid:</span>
                                  <span className="text-green-600">{formatCurrency(issuance.totalPaid)}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                  <span>Remaining:</span>
                                  <span className="text-red-600">{formatCurrency(issuance.remaining)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>

                    {/* Hostel Payment */}
                    <TabsContent value="hostel" className="space-y-4 mt-4">
                      <div className="space-y-2">
                        <Label>Select Allocation</Label>
                        <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an allocation..." />
                          </SelectTrigger>
                          <SelectContent>
                            {pendingHostel.filter(h => h.isPending).map((h) => (
                              <SelectItem key={h.id} value={h.id}>
                                <div className="flex justify-between items-center w-full">
                                  <span>Room {h.roomNumber} - Bed {h.bedNumber}{!h.isActive ? " (Deallocated)" : ""}</span>
                                  <span className="text-xs text-red-600 ml-2">
                                    {formatCurrency(h.pending)}
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {selectedItemId && (
                        <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                          {(() => {
                            const h = pendingHostel.find(h => h.id === selectedItemId);
                            if (!h) return null;
                            return (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Room/Bed:</span>
                                  <span>Room {h.roomNumber} - Bed {h.bedNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Rate/Day:</span>
                                  <span>{formatCurrency(h.pricePerDay)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Total Paid:</span>
                                  <span className="text-green-600">{formatCurrency(h.totalPaid)}</span>
                                </div>
                                <div className="flex justify-between font-medium">
                                  <span>Pending:</span>
                                  <span className="text-red-600">{formatCurrency(h.pending)}</span>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Payment Form */}
                  {selectedItemId && (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="space-y-2">
                        <Label>
                          Payment Date <span className="text-red-500">*</span>
                        </Label>
                        <NepaliDatePicker
                          value={paymentDate}
                          onChange={(value) => {
                            if (value instanceof Date) setPaymentDate(value);
                          }}
                          placeholder="Select payment date"
                          mode="single"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Amount (NPR) <span className="text-red-500">*</span></Label>
                        <Input
                          type="text"
                          placeholder="Enter amount"
                          value={amount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === "" || /^\d*\.?\d*$/.test(value)) {
                              setAmount(value);
                            }
                          }}
                          disabled={submitting}
                        />
                        <p className="text-xs text-muted-foreground">
                          {activeTab === "hostel" 
                            ? `Pending: ${formatCurrency(getMaxAmount())} (Overpayment allowed)`
                            : `Max: ${formatCurrency(getMaxAmount())}`
                          }
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Payment Method <span className="text-red-500">*</span></Label>
                        <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={submitting}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CASH">Cash</SelectItem>
                            <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                            <SelectItem value="CHEQUE">Cheque</SelectItem>
                            <SelectItem value="ONLINE">Online</SelectItem>
                            <SelectItem value="CARD">Card</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Reference Number</Label>
                        <Input
                          placeholder="Transaction/Receipt number"
                          value={referenceNumber}
                          onChange={(e) => setReferenceNumber(e.target.value)}
                          disabled={submitting}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Additional notes..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          disabled={submitting}
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t">
          <Button variant="outline" onClick={handleClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !selectedItemId || !amount}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              "Add Payment"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
