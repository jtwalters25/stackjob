import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * GET /api/quickbooks/status
 * Check QuickBooks connection status
 */
export async function GET() {
  try {
    const supabaseClient = createServerSupabase();

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });
    }

    // Get the connection
    const { data: connection, error: fetchError } = await supabaseClient
      .from("quickbooks_connections")
      .select("id, realm_id, connected_at, last_sync_at, is_active")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json({
        connected: false,
        connection: null,
      });
    }

    return NextResponse.json({
      connected: connection.is_active,
      connection: {
        id: connection.id,
        realmId: connection.realm_id,
        connectedAt: connection.connected_at,
        lastSyncAt: connection.last_sync_at,
      },
    });
  } catch (error) {
    console.error("QuickBooks status error:", error);
    return NextResponse.json(
      { error: "Failed to check QuickBooks status" },
      { status: 500 }
    );
  }
}
