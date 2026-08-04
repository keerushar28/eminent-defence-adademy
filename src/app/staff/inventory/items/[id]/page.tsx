export const dynamic = "force-dynamic";

import { getItemById } from "@/features/admin/inventory/actions/item-actions";
import ItemDetails from "@/features/admin/inventory/items/ItemDetails";
import { notFound } from "next/navigation";
import { Button } from "@/features/core/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ItemDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const item = await getItemById(params.id);

  if (!item) {
    notFound();
  }

  return (
    <div className="p-6 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Link href="/staff/inventory/items">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Items
          </Button>
        </Link>
      </div>

      <ItemDetails item={item} />
    </div>
  );
}
