"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/features/core/components/card";
import { Button } from "@/features/core/components/button";
import Link from "next/link";
import { TrendingUp, TrendingDown } from "lucide-react";

export default function LedgerPage() {
  return (
    <div className="p-6 flex flex-col gap-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Ledger Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage income and expense ledgers
          </p>
        </div>
      </div>

      {/* Ledger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Income Ledger Card */}
        <Card className="border shadow-xs hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Income Ledger</CardTitle>
              <div className="bg-green-50 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Track all income payments from students and hostel accommodations
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>✓ Student category payments</li>
              <li>✓ Hostel accommodation payments</li>
              <li>✓ Payment analytics & reports</li>
              <li>✓ Collection tracking</li>
            </ul>
            <Link href="/admin/ledger/income" className="block">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                View Income Ledger
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Expense Ledger Card */}
        <Card className="border shadow-xs hover:shadow-md transition-shadow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Expense Ledger</CardTitle>
              <div className="bg-red-50 p-3 rounded-lg">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Track all expense payments for utilities and inventory
            </p>
            <ul className="text-sm space-y-2 text-muted-foreground">
              <li>✓ Utility bills (electricity, water, etc.)</li>
              <li>✓ Inventory expenses</li>
              <li>✓ Expense tracking & analytics</li>
              <li>✓ Budget monitoring</li>
            </ul>
            <Link href="/admin/ledger/expense" className="block">
              <Button className="w-full bg-red-600 hover:bg-red-700">
                View Expense Ledger
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
