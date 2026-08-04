import { NextRequest, NextResponse } from "next/server";
import { 
  getSettlementStats, 
  getAllPaymentsPaginated, 
  createSettlement,
  updatePaymentSettlementStatus 
} from "@/features/admin/settlements/actions/settlement-actions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "stats") {
      const stats = await getSettlementStats();
      return NextResponse.json(stats);
    }

    if (action === "payments") {
      const page = parseInt(searchParams.get("page") || "1");
      const pageSize = parseInt(searchParams.get("pageSize") || "10");
      const search = searchParams.get("search") || "";
      const type = searchParams.get("type") || "ALL";
      const isSettled = searchParams.get("isSettled");
      const dateFrom = searchParams.get("dateFrom");
      const dateTo = searchParams.get("dateTo");
      const sortBy = searchParams.get("sortBy") || "paymentDate";
      const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

      const result = await getAllPaymentsPaginated({
        page,
        pageSize,
        search,
        type: type as any,
        isSettled: isSettled ? isSettled === "true" : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortOrder,
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error in settlements API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paymentIds, notes } = body;

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: "Payment IDs are required" },
        { status: 400 }
      );
    }

    const result = await createSettlement({
      paymentIds,
      notes,
    });

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        settlementId: result.settlementId 
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating settlement:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}