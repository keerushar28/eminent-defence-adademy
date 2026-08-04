"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import { Button } from "@/features/core/components/button";
import { Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/features/core/components/table";
import { Badge } from "@/features/core/components/badge";
import { IVendorPayment } from "../types/inventory-types";

interface VendorPaymentHistoryProps {
  payments: IVendorPayment[];
  vendorId: string;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NRP",
  }).format(amount);
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const getPaymentMethodBadge = (method: string) => {
  const variants: Record<string, "default" | "secondary" | "outline"> = {
    CASH: "default",
    BANK_TRANSFER: "secondary",
    CHEQUE: "outline",
    ONLINE: "secondary",
    CARD: "default",
  };

  return (
    <Badge variant={variants[method] || "default"}>
      {method.replace("_", " ")}
    </Badge>
  );
};

export default function VendorPaymentHistory({
  payments,
}: VendorPaymentHistoryProps) {
  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>
              Total Payments: {formatCurrency(totalPayments)}
            </CardDescription>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Payment
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payment records found.
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(payment.amount)}
                    </TableCell>
                    <TableCell>{getPaymentMethodBadge(payment.paymentMethod)}</TableCell>
                    <TableCell>{payment.referenceNumber || "-"}</TableCell>
                    <TableCell className="max-w-xs truncate">
                      {payment.notes || "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
