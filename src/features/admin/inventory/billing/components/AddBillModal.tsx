"use client";

import { Button } from "@/features/core/components/button";
import { Loader2 } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/features/core/components/sheet";
import { Input } from "@/features/core/components/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/features/core/components/select";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/features/core/components/form";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { NepaliDatePicker } from "@/features/core/components/nepali-date-picker";
import { createBill } from "../../actions/billing-actions";
import { getBillingCategories } from "../../actions/category-actions";
import { IInventoryCategory } from "../../types/inventory-types";
import { toast } from "sonner";

const billFormSchema = z.object({
    categoryId: z.string().min(1, "Category is required"),
    billingTitle: z.string().min(1, "Billing title is required").max(100, "Billing title cannot exceed 100 characters"),
    periodStartDate: z.string().min(1, "Period start date is required"),
    periodEndDate: z.string().min(1, "Period end date is required"),
    amount: z.string().min(1, "Amount is required").refine(
        (val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0,
        "Amount must be a valid number greater than 0"
    ),
    units: z.string().optional().refine(
        (val) => !val || !isNaN(parseFloat(val)),
        "Units must be a valid number"
    ),
    billDate: z.string().min(1, "Bill date is required"),
    description: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
}).refine(
    (data) => {
        const startDate = new Date(data.periodStartDate);
        const endDate = new Date(data.periodEndDate);
        return startDate <= endDate;
    },
    {
        message: "Period end date must be after or equal to start date",
        path: ["periodEndDate"],
    }
);

type BillFormData = z.infer<typeof billFormSchema>;

const STAFF_HIDDEN_CATEGORIES = ["Regular Expenditure (A)"];

interface AddBillModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    isAdmin?: boolean;
}

export default function AddBillModal({ isOpen, onClose, onSuccess, isAdmin = false }: AddBillModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [categories, setCategories] = useState<IInventoryCategory[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);

    // State for Nepali Date Pickers (AD Dates)
    const [billDateAD, setBillDateAD] = useState<Date | undefined>(undefined);
    const [periodStartAD, setPeriodStartAD] = useState<Date | undefined>(undefined);
    const [periodEndAD, setPeriodEndAD] = useState<Date | undefined>(undefined);

    const form = useForm<BillFormData>({
        resolver: zodResolver(billFormSchema),
        defaultValues: {
            categoryId: "",
            billingTitle: "",
            periodStartDate: "",
            periodEndDate: "",
            amount: "",
            units: "",
            billDate: new Date().toISOString().split("T")[0],
            description: "",
        },
    });

    // Load billing categories
    useEffect(() => {
        const loadCategories = async () => {
            setLoadingCategories(true);
            try {
                const data = await getBillingCategories(isAdmin ? undefined : STAFF_HIDDEN_CATEGORIES);
                setCategories(data);
            } catch (error) {
                console.error("Error loading categories:", error);
                toast.error("Failed to load billing categories");
            } finally {
                setLoadingCategories(false);
            }
        };

        if (isOpen) {
            loadCategories();
        }
    }, [isOpen]);

    // Initialize dates on open
    useEffect(() => {
        if (isOpen) {
            const today = new Date();
            setBillDateAD(today);
            setPeriodStartAD(undefined);
            setPeriodEndAD(undefined);
            form.setValue("billDate", convertDateToYYYYMMDD(today));
        }
    }, [isOpen, form]);

    // Convert Date to YYYY-MM-DD format to avoid timezone issues
    const convertDateToYYYYMMDD = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    // Update period dates when start or end changes
    useEffect(() => {
        if (periodStartAD) {
            form.setValue("periodStartDate", convertDateToYYYYMMDD(periodStartAD));
        } else {
            form.setValue("periodStartDate", "");
        }

        if (periodEndAD) {
            form.setValue("periodEndDate", convertDateToYYYYMMDD(periodEndAD));
        } else {
            form.setValue("periodEndDate", "");
        }
    }, [periodStartAD, periodEndAD, form]);

    const handleBillDateChange = (date: Date | { from?: Date; to?: Date }) => {
        if (date instanceof Date) {
            setBillDateAD(date);
            form.setValue("billDate", convertDateToYYYYMMDD(date));
        }
    };

    const handleSubmit = async (values: BillFormData) => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append("categoryId", values.categoryId);
            formData.append("billingTitle", values.billingTitle);
            formData.append("periodStartDate", values.periodStartDate);
            formData.append("periodEndDate", values.periodEndDate);
            formData.append("amount", String(parseFloat(values.amount)));
            if (values.units) formData.append("units", String(parseFloat(values.units)));
            formData.append("billDate", values.billDate);
            if (values.description) formData.append("description", values.description);

            const result = await createBill(formData);

            if (result.success) {
                toast.success("Bill Added Successfully! 🎉");
                form.reset();
                onSuccess();
            } else {
                toast.error("Failed to Add Bill ❌", {
                    description: result.error || "Something went wrong.",
                });
            }
        } catch (error) {
            console.error("Submission error:", error);
            toast.error("Submission Error ❌");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-xl gap-0 pb-2 p-6 h-full font-medium overflow-y-auto">
                <SheetHeader className="mb-2 p-0 border-b pb-4 gap-0.5">
                    <SheetTitle className="text-xl">Add Bill</SheetTitle>
                    <SheetDescription className="text-sm font-normal">
                        Record a new utility bill or expense.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="categoryId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={loadingCategories}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={loadingCategories ? "Loading categories..." : "Select billing category"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.length === 0 ? (
                                                <div className="p-2 text-sm text-muted-foreground">
                                                    No billing categories available. Create one in Categories section.
                                                </div>
                                            ) : (
                                                categories.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>
                                                        {cat.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="billingTitle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Billing Title <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter billing title"
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />


                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="periodStartDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Period Start Date (BS) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <NepaliDatePicker
                                                value={periodStartAD}
                                                onChange={(date) => {
                                                    if (date instanceof Date) {
                                                        setPeriodStartAD(date);
                                                    }
                                                }}
                                                placeholder="Start date"
                                                className="w-full"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="periodEndDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Period End Date (BS) <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <NepaliDatePicker
                                                value={periodEndAD}
                                                onChange={(date) => {
                                                    if (date instanceof Date) {
                                                        setPeriodEndAD(date);
                                                    }
                                                }}
                                                placeholder="End date"
                                                className="w-full"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Amount <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                {...field}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="units"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Units <span className="text-muted-foreground text-xs font-normal">(Optional)</span></FormLabel>
                                        <FormControl>
                                            <Input
                                                type="text"
                                                inputMode="decimal"
                                                placeholder="0.00"
                                                {...field}
                                                disabled={isSubmitting}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="billDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bill Date (BS) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <NepaliDatePicker
                                            value={billDateAD}
                                            onChange={handleBillDateChange}
                                            placeholder="Select bill date"
                                            className="w-full"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                    <input type="hidden" {...field} />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Notes <span className="text-muted-foreground text-xs font-normal">(Optional)</span></FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="Add any additional notes..." 
                                            {...field}
                                            disabled={isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Bill"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
}
