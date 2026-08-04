export const dynamic = 'force-dynamic'; // Add this line

import { getOrders } from "@/features/admin/inventory/actions/order-actions";
import OrderList from "@/features/admin/inventory/orders/OrderList";

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <div className="p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage purchase orders and track deliveries
        </p>
      </div>

      <OrderList orders={orders} />
    </div>
  );
}
