import { NextResponse } from "next/server";
import { getAuthUri } from "@/lib/quickbooks";

/**
 * GET /api/quickbooks/connect
 * Initiates the QuickBooks OAuth flow
 */
export async function GET() {
  try {
    const authUri = getAuthUri();
    return NextResponse.json({ authUri });
  } catch (error) {
    console.error("QuickBooks connect error:", error);
    return NextResponse.json(
      { error: "Failed to initiate QuickBooks connection" },
      { status: 500 }
    );
  }
}
