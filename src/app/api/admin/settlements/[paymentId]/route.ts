import { NextRequest, NextResponse } from "next/server";
import { 
  updatePaymentSettlementStatus,
  getPaymentDetails 
} from "@/features/admin/settlements/actions/settlement-actions";

export async function GET(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentType = searchParams.get("type") as 'CATEGORY' | 'HOSTEL' | 'ISSUANCE';

    if (!paymentType) {
      return NextResponse.json(
        { error: "Payment type is required" },
        { status: 400 }
      );
    }

    const result = await getPaymentDetails(params.paymentId, paymentType);

    if (result.success) {
      return NextResponse.json(result.payment);
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("Error fetching payment details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { paymentId: string } }
) {
  try {
    const body = await request.json();
    const { paymentType, isSettled, settlementDetails } = body;

    if (!paymentType) {
      return NextResponse.json(
        { error: "Payment type is required" },
        { status: 400 }
      );
    }

    if (typeof isSettled !== "boolean") {
      return NextResponse.json(
        { error: "Settlement status (isSettled) is required" },
        { status: 400 }
      );
    }

    const result = await updatePaymentSettlementStatus(
      params.paymentId,
      paymentType,
      isSettled,
      settlementDetails
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        settlementId: result.settlementId,
      });
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error updating payment settlement status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}