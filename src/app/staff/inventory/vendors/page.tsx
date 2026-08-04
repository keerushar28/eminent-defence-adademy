export const dynamic = 'force-dynamic'; // Add this line

import { getVendors } from "@/features/admin/inventory/actions/vendor-actions";
import VendorList from "@/features/admin/inventory/vendors/VendorList";

export default async function VendorsPage() {
  const vendors = await getVendors();

  return (
    <div className="  p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Vendors</h1>
        <p className="text-muted-foreground">
          Manage your vendors and suppliers
        </p>
      </div>

      <VendorList vendors={vendors} />
    </div>
  );
}
