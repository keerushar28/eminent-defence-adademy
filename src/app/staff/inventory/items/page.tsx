export const dynamic = 'force-dynamic'; // Add this line

import { getItems, getCategories } from "@/features/admin/inventory/actions/item-actions";
import ItemList from "@/features/admin/inventory/items/ItemList";
import LowStockAlert from "@/features/admin/inventory/items/LowStockAlert";
import { getLowStockItems } from "@/features/admin/inventory/actions/item-actions";

export default async function ItemsPage() {
  const items = await getItems();
  const categories = await getCategories();
  const lowStockItems = await getLowStockItems();

  return (
    <div className="p-6 flex flex-col gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inventory Items</h1>
        <p className="text-muted-foreground">
          Manage your inventory items and stock levels
        </p>
      </div>

      {lowStockItems.length > 0 && (
        <LowStockAlert items={lowStockItems} />
      )}

      <ItemList items={items} categories={categories} />
    </div>
  );
}
