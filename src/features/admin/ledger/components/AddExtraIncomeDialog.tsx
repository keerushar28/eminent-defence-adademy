"use client";

import { useState, useEffect } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/features/core/components/sheet";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";
import { PaymentMethod as PrismaPaymentMethod } from "@prisma/client";
import { addExtraIncome } from "../actions/extra-income-actions";
import { PayerType } from "../types";
import StudentSelectorOptimized from "@/features/admin/components/StudentSelectorOptimized";
import ItemSelector from "@/features/admin/inventory/components/shared/ItemSelector";
import { useItems } from "@/features/admin/inventory/hooks/useItems";

interface AddExtraIncomeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AddExtraIncomeDialog({
  isOpen,
  onClose,
  onSuccess,
}: AddExtraIncomeDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("");
  const [payerType, setPayerType] = useState<PayerType>("INSIDER");
  const [payerName, setPayerName] = useState("");
  const [insiderStudentId, setInsiderStudentId] = useState("");
  const [payerContact, setPayerContact] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [amountTouched, setAmountTouched] = useState(false);

  const { items, loading: loadingItems } = useItems({ isActive: true });

  const convertDateToYYYYMMDD = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const selectedItem = items.find((item) => item.id === itemId);

  // Auto-fill the amount from the selected item's unit price when not manually overridden
  useEffect(() => {
    if (amountTouched || !itemId) return;
    const item = items.find((i) => i.id === itemId);
    if (item && item.unitPrice && item.unitPrice > 0) {
      const qty = Number(quantity) || 1;
      setAmount(String(Math.round(item.unitPrice * qty * 100) / 100));
    }
  }, [itemId, items, quantity, amountTouched]);

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    if (amountTouched) return;
    const item = items.find((i) => i.id === itemId);
    if (item && item.unitPrice && item.unitPrice > 0) {
      const qty = Number(value) || 1;
      setAmount(String(Math.round(item.unitPrice * qty * 100) / 100));
    }
  };

  const handleItemSelect = (value: string) => {
    setItemId(value);
    setAmountTouched(false);
    const item = items.find((i) => i.id === value);
    if (item && item.unitPrice && item.unitPrice > 0) {
      const qty = Number(quantity) || 1;
      setAmount(String(Math.round(item.unitPrice * qty * 100) / 100));
    }
  };

  const handleInsiderStudentChange = (studentId: string) => {
    setInsiderStudentId(studentId);
    if (studentId) {
      fetch(`/api/students/search?q=&limit=1000`)
        .then((res) => res.json())
        .then((data) => {
          const student = data.students?.find(
            (s: { id: string }) => s.id === studentId
          );
          if (student) {
            setPayerName(student.fullname || "");
            setPayerContact(
              student.email || student.contact_number_student || ""
            );
          }
        })
        .catch(() => {
          setPayerName("");
        });
    } else {
      setPayerName("");
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title / income description");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid income amount");
      return;
    }

    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addExtraIncome({
        amount: amountNum,
        incomeDate: convertDateToYYYYMMDD(incomeDate),
        paymentMethod: paymentMethod as PrismaPaymentMethod,
        title,
        category,
        payerType,
        payerName: payerName.trim() || undefined,
        payerContact: payerContact.trim() || undefined,
        referenceNumber: referenceNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        itemId: itemId || undefined,
        quantity: itemId ? Number(quantity) || 1 : undefined,
      });

      if (result.success) {
        toast.success("Extra income added successfully!");
        onSuccess();
        handleClose();
      } else {
        toast.error(result.error || "Failed to add extra income");
      }
    } catch (error) {
      console.error("Error adding extra income:", error);
      toast.error("An error occurred while adding extra income");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setCategory("");
    setAmount("");
    setIncomeDate(new Date());
    setPaymentMethod("");
    setPayerType("INSIDER");
    setPayerName("");
    setInsiderStudentId("");
    setPayerContact("");
    setReferenceNumber("");
    setNotes("");
    setItemId("");
    setQuantity("1");
    setAmountTouched(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent className="w-full sm:max-w-xl h-full overflow-y-auto p-4">
        <SheetHeader className="mb-6 p-0">
          <SheetTitle>Add Extra Income</SheetTitle>
          <SheetDescription>
            Record a one-off / manual income. The payer can be an insider or an outsider.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm">
              Income Title <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="e.g. Donation, Event ticket sales, Rent"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 h-9 bg-white text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Category / Purpose (optional)</Label>
            <Input
              type="text"
              placeholder="e.g. Donation, Fundraising"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 h-9 bg-white text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Inventory Item (optional)</Label>
            <ItemSelector
              items={items}
              value={itemId}
              onValueChange={handleItemSelect}
              disabled={isSubmitting || loadingItems}
              placeholder={loadingItems ? "Loading items..." : "Select item to sell (decrements stock)"}
              showCategory
              showStock
              filterByStock
            />
            {itemId && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <Input
                    type="number"
                    min={1}
                    placeholder="1"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    disabled={isSubmitting}
                    className="h-9 bg-white text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Unit Price (NPR)</Label>
                  <Input
                    type="text"
                    value={selectedItem?.unitPrice ? String(selectedItem.unitPrice) : "-"}
                    readOnly
                    disabled
                    className="h-9 bg-muted/40 text-sm"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Selecting an item will reduce its stock on save. Leave empty for donations / one-off income.
            </p>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">
              Income Amount (NPR) <span className="text-red-500">*</span>
            </Label>
            <Input
              type="text"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "" || /^\d*\.?\d*$/.test(value)) {
                  setAmount(value);
                  setAmountTouched(true);
                }
              }}
              disabled={isSubmitting}
              className="mt-1 h-9 bg-white text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">
              Income Date <span className="text-red-500">*</span>
            </Label>
            <div className="mt-1">
              <NepaliDatePicker
                value={incomeDate}
                onChange={(value) => {
                  if (value instanceof Date) setIncomeDate(value);
                }}
                placeholder="Select income date"
                mode="single"
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">
              Payment Method <span className="text-red-500">*</span>
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={isSubmitting}>
              <SelectTrigger className="mt-1 h-9 bg-white text-sm">
                <SelectValue placeholder="Select method" />
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
            <Label className="text-sm">
              Payer Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={payerType}
              onValueChange={(value) => setPayerType(value as PayerType)}
              disabled={isSubmitting}
            >
              <SelectTrigger className="mt-1 h-9 bg-white text-sm">
                <SelectValue placeholder="Select payer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="INSIDER">Insider (student / staff)</SelectItem>
                <SelectItem value="OUTSIDER">Outsider (external person)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Payer Name</Label>
            {payerType === "INSIDER" ? (
              <StudentSelectorOptimized
                value={insiderStudentId}
                onValueChange={handleInsiderStudentChange}
                disabled={isSubmitting}
                placeholder="Search and select a student..."
                showAvatar
                showEmail={false}
                showPhone={false}
                showCategories={false}
              />
            ) : (
              <Input
                type="text"
                placeholder="Name of the person who paid"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                disabled={isSubmitting}
                className="mt-1 h-9 bg-white text-sm"
              />
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Payer Contact / Email (optional)</Label>
            <Input
              type="text"
              placeholder="Phone or email"
              value={payerContact}
              onChange={(e) => setPayerContact(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 h-9 bg-white text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Reference Number (optional)</Label>
            <Input
              type="text"
              placeholder="Transaction/Receipt number"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              disabled={isSubmitting}
              className="mt-1 h-9 bg-white text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm">Notes</Label>
            <Textarea
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isSubmitting}
              className="resize-none mt-1 bg-white text-sm"
              rows={2}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>Add Extra Income</>
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
