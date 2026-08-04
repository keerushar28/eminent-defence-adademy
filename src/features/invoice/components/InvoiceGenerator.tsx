"use client";

import { useState, useTransition } from "react";
import { Button } from "@/features/core/components/button";
import { Checkbox } from "@/features/core/components/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/features/core/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/features/core/components/dialog";
import { Loader2, FileText, Download, Eye } from "lucide-react";
import { toast } from "sonner";
import { getStudentInvoiceData } from "../actions/invoice-actions";
import { generateInvoiceHTMLDocument, generateInvoicePDF } from "../lib/pdf-generator";
import { InvoiceOptions } from "../types/invoice";
import { useSession } from "next-auth/react";

interface InvoiceGeneratorProps {
  studentId: string;
  studentName: string;
}

export function InvoiceGenerator({ studentId, studentName }: InvoiceGeneratorProps) {
  const { data: session } = useSession();
  const [isPending, startTransition] = useTransition();
  const [invoiceHtml, setInvoiceHtml] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [options, setOptions] = useState<InvoiceOptions>({
    includeCategoryPayments: true,
    includeInventoryIssuances: true,
    includeHostelPayments: true,
    includeAllocationsInfo: true,
  });

  const handleOptionChange = (key: keyof InvoiceOptions) => {
    setOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleGenerateInvoice = async () => {
    if (!Object.values(options).some((v) => v)) {
      toast.error("Please select at least one option to include in the invoice");
      return;
    }

    startTransition(async () => {
      try {
        const data = await getStudentInvoiceData(studentId, options);
        const htmlContent = generateInvoicePDF(data, options, session?.user?.name);
        setInvoiceHtml(htmlContent);
        setIsPreviewOpen(true);

        toast.success("Invoice generated successfully!", {
          description: `Invoice for ${studentName} is ready to view and download.`,
        });
      } catch (error) {
        console.error("Error generating invoice:", error);
        toast.error("Failed to generate invoice", {
          description: "An error occurred while generating the invoice. Please try again.",
        });
      }
    });
  };

  const handleDownload = async () => {
    if (!invoiceHtml) return;

    try {
      const data = await getStudentInvoiceData(studentId, options);
      const fullHtmlDocument = generateInvoiceHTMLDocument(data, options, session?.user?.name);

      const response = await fetch("/api/invoice/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          htmlContent: fullHtmlDocument,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate PDF");
      }

      // Get the PDF blob from response
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.download = `invoice-${studentName.replace(/\s+/g, "-")}-${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Invoice downloaded as PDF successfully!");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("Failed to download invoice as PDF", {
        description: "An error occurred while generating the PDF. Please try again.",
      });
    }
  };

  const handlePrint = async () => {
    if (!invoiceHtml) return;

    try {
      const data = await getStudentInvoiceData(studentId, options);
      const fullHtmlDocument = generateInvoiceHTMLDocument(data, options, session?.user?.name);

      const win = window.open("", "_blank", "width=640,height=800");
      if (!win) {
        toast.error("Failed to open print window");
        return;
      }
      win.document.open();
      win.document.write(fullHtmlDocument);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 300);
    } catch (error) {
      console.error("Error printing invoice:", error);
      toast.error("Failed to print invoice");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Generate Invoice</CardTitle>
          </div>
          <CardDescription>
            Select the sections to include in the invoice for {studentName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">
              Include in Invoice
            </h3>
            <div className="space-y-2">
              <div
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleOptionChange("includeCategoryPayments")}
              >
                <Checkbox
                  checked={options.includeCategoryPayments}
                  onCheckedChange={() => handleOptionChange("includeCategoryPayments")}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Category Payments
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Include all category and sub-category payments
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleOptionChange("includeInventoryIssuances")}
              >
                <Checkbox
                  checked={options.includeInventoryIssuances}
                  onCheckedChange={() => handleOptionChange("includeInventoryIssuances")}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Inventory Issuances
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Include all issued items with payment status
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleOptionChange("includeHostelPayments")}
              >
                <Checkbox
                  checked={options.includeHostelPayments}
                  onCheckedChange={() => handleOptionChange("includeHostelPayments")}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Hostel Payments
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Include all hostel accommodation payments
                  </p>
                </div>
              </div>

              <div
                className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleOptionChange("includeAllocationsInfo")}
              >
                <Checkbox
                  checked={options.includeAllocationsInfo}
                  onCheckedChange={() => handleOptionChange("includeAllocationsInfo")}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Allocations Information
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Include hostel allocation details and status
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            Invoices print on the top half of an A4 sheet (210 × 148.5 mm) so the paper can be torn in half after printing.
          </p>

          {/* Generate Button */}
          <Button
            onClick={handleGenerateInvoice}
            disabled={isPending || !Object.values(options).some((v) => v)}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Invoice...
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Preview Invoice
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-7xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Preview</DialogTitle>
            <DialogDescription>
              Preview and download invoice for {studentName}
            </DialogDescription>
          </DialogHeader>

          {/* Action Buttons */}
          <div className="flex gap-3 sticky top-0 z-10 bg-background py-3 border-b">
            <Button
              onClick={handleDownload}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Invoice
            </Button>
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1"
            >
              <FileText className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </div>

          {/* Invoice Preview */}
          {invoiceHtml && (
            <div className="bg-muted/30 rounded-lg border overflow-auto flex justify-center p-4">
              <iframe
                title={`Invoice preview for ${studentName}`}
                className="bg-white shadow-sm border"
                style={{ width: "210mm", height: "148.5mm" }}
                scrolling="no"
                srcDoc={`<!DOCTYPE html><html><head><meta charset="UTF-8" /></head><body>${invoiceHtml}</body></html>`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}