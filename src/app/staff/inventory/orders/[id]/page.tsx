export const dynamic = "force-dynamic";

import { getOrderById } from "@/features/admin/inventory/actions/order-actions";
import OrderDetails from "@/features/admin/inventory/orders/OrderDetails";
import { notFound } from "next/navigation";
import { Button } from "@/features/core/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface OrderDetailPageProps {
  params: {
    id: string;
  };
}

export default async function OrderDetailPage({ params }: OrderDetailPageProps) {
  const order = await getOrderById(params.id);

  if (!order) {
    notFound();
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/admin/inventory/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
      </div>

      <OrderDetails order={order} />
    </div>
  );
}
