export const dynamic = "force-dynamic";

import { getVendorById, getVendorPayments } from "@/features/admin/inventory/actions/vendor-actions";
import VendorDetails from "@/features/admin/inventory/vendors/VendorDetails";
import VendorPaymentHistory from "@/features/admin/inventory/vendors/VendorPaymentHistory";
import { notFound } from "next/navigation";
import { Button } from "@/features/core/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface VendorDetailPageProps {
  params: {
    id: string;
  };
}

export default async function VendorDetailPage({ params }: VendorDetailPageProps) {
  const vendor = await getVendorById(params.id);

  if (!vendor) {
    notFound();
  }

  const payments = await getVendorPayments(params.id);

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/inventory/vendors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Vendors
          </Button>
        </Link>
      </div>

      <VendorDetails vendor={vendor} />

      <VendorPaymentHistory payments={payments} vendorId={params.id} />
    </div>
  );
}
