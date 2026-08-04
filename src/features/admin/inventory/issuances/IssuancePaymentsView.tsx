"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/features/core/components/card";
import { Button } from "@/features/core/components/button";
import { Badge } from "@/features/core/components/badge";
import { Loader2, Plus, Package, CreditCard, Trash2 } from "lucide-react";
import { getIssuances } from "../actions/issuance-actions";
import { deleteIssuancePayment } from "../actions/issuance-payment-actions";
import { MakePaymentDialog } from "./MakePaymentDialog";
import { toast } from "sonner";
import { IStudentIssuance } from "../types/inventory-types";
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

interface IssuancePaymentsViewProps {
    studentId: string;
}

export function IssuancePaymentsView({ studentId }: IssuancePaymentsViewProps) {
    const [issuances, setIssuances] = useState<IStudentIssuance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState<IStudentIssuance | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);

    useEffect(() => {
        loadIssuances();
    }, [studentId]);

    const loadIssuances = async () => {
        setIsLoading(true);
        try {
            const data = await getIssuances({ studentId });
            setIssuances(data);
        } catch (error) {
            console.error("Error loading issuances:", error);
            toast.error("Failed to load issuances", {
                description: "Could not load student issuances. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleMakePayment = (issuance: IStudentIssuance) => {
        setSelectedIssuance(issuance);
        setPaymentDialogOpen(true);
    };

    const handlePaymentSuccess = () => {
        setPaymentDialogOpen(false);
        setSelectedIssuance(null);
        loadIssuances();
        toast.success("Payment recorded successfully", {
            description: "The payment has been recorded and the balance updated.",
        });
    };

    const handleDeletePayment = async () => {
        if (!paymentToDelete) return;

        try {
            const result = await deleteIssuancePayment(paymentToDelete);
            if (result.success) {
                toast.success("Payment deleted successfully", {
                    description: "The payment has been removed and the balance updated.",
                });
                loadIssuances();
            } else {
                toast.error(result.error || "Failed to delete payment", {
                    description: "Could not delete the payment. Please try again.",
                });
            }
        } catch (error) {
            toast.error("Failed to delete payment", {
                description: "An unexpected error occurred. Please try again.",
            });
        } finally {
            setDeleteDialogOpen(false);
            setPaymentToDelete(null);
        }
    };

    const getStatusBadge = (issuance: IStudentIssuance) => {
        const totalAmount = issuance.quantity * (issuance.unitPrice || 0);
        const balanceDue = totalAmount - (issuance.totalPaid || 0);

        if (balanceDue === 0) {
            return <Badge variant="default" className="bg-green-600">Paid</Badge>;
        } else if (Number(issuance.totalPaid) > 0) {
            return <Badge variant="default" className="bg-yellow-600">Partial</Badge>;
        } else {
            return <Badge variant="destructive">Unpaid</Badge>;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </CardContent>
            </Card>
        );
    }

    if (issuances.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No items issued to this student</p>
                </CardContent>
            </Card>
        );
    }

    const totalAmount = issuances.reduce((sum: number, issuance: IStudentIssuance) => sum + (issuance.quantity * (issuance.unitPrice || 0)), 0);
    const totalPaid = issuances.reduce((sum: number, issuance: IStudentIssuance) => sum + (issuance.totalPaid || 0), 0);
    const totalDue = totalAmount - totalPaid;

    return (
        <>
            {/* Summary Stats */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Amount</p>
                        <Package className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">NPR {totalAmount.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Paid</p>
                        <CreditCard className="h-4 w-4 text-green-500" />
                    </div>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400">NPR {totalPaid.toFixed(2)}</p>
                </div>
                <div className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Balance Due</p>
                        <Package className="h-4 w-4 text-red-500" />
                    </div>
                    <p className="text-xl font-bold text-red-600 dark:text-red-400">NPR {totalDue.toFixed(2)}</p>
                </div>
            </div>

            {/* Issued Items */}
            <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                    <Package className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                        Issued Items
                    </h2>
                    <span className="ml-auto text-sm text-slate-600 dark:text-slate-400">
                        {issuances.length} item{issuances.length !== 1 ? 's' : ''}
                    </span>
                </div>
                <div className="space-y-3">
                    {issuances.map((issuance) => (
                        <div key={issuance.id} className="bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 p-5 space-y-4 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-slate-900 dark:text-white">{issuance.item?.name}</h3>
                                        {getStatusBadge(issuance)}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-slate-600 dark:text-slate-400">Quantity</p>
                                            <p className="font-medium text-slate-900 dark:text-white">{issuance.quantity} {issuance.item?.unit}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600 dark:text-slate-400">Unit Price</p>
                                            <p className="font-medium text-slate-900 dark:text-white">NPR {(issuance.unitPrice || 0).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600 dark:text-slate-400">Total Amount</p>
                                            <p className="font-medium text-slate-900 dark:text-white">NPR {(issuance.quantity * (issuance.unitPrice || 0)).toFixed(2)}</p>
                                        </div>
                                        <div>
                                            <p className="text-slate-600 dark:text-slate-400">Issued Date</p>
                                            <p className="font-medium text-slate-900 dark:text-white">{new Date(issuance.issuedDate).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-3">
                                    <div className="text-right">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Paid</p>
                                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                                            NPR {(issuance.totalPaid || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mb-1">Balance</p>
                                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                                            NPR {(issuance.quantity * (issuance.unitPrice || 0) - (issuance.totalPaid || 0)).toFixed(2)}
                                        </p>
                                    </div>
                                    {(issuance.quantity * (issuance.unitPrice || 0) - (issuance.totalPaid || 0)) > 0 && (
                                        <Button
                                            onClick={() => handleMakePayment(issuance)}
                                            size="sm"
                                            className="mt-2 bg-green-600 hover:bg-green-700 text-white"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Record Payment
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {issuance.payments && issuance.payments.length > 0 && (
                                <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Payment History</h4>
                                    <div className="space-y-2">
                                        {issuance.payments.map((payment) => (
                                            <div key={payment.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3">
                                                        <div>
                                                            <p className="font-medium text-slate-900 dark:text-white">NPR {payment.amount.toFixed(2)}</p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400">{new Date(payment.paymentDate).toLocaleDateString()}</p>
                                                        </div>
                                                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                            {payment.paymentMethod}
                                                        </Badge>
                                                        {payment.referenceNumber && (
                                                            <span className="text-xs text-slate-600 dark:text-slate-400">Ref: {payment.referenceNumber}</span>
                                                        )}
                                                    </div>
                                                    {payment.notes && (
                                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{payment.notes}</p>
                                                    )}
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setPaymentToDelete(payment.id);
                                                        setDeleteDialogOpen(true);
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {selectedIssuance && (
                <MakePaymentDialog
                    isOpen={paymentDialogOpen}
                    onClose={() => {
                        setPaymentDialogOpen(false);
                        setSelectedIssuance(null);
                    }}
                    onSuccess={handlePaymentSuccess}
                    issuance={selectedIssuance}
                />
            )}

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the payment record and update the balance. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeletePayment} className="bg-destructive">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
