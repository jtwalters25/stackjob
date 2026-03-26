import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { revokeToken } from "@/lib/quickbooks";

/**
 * POST /api/quickbooks/disconnect
 * Disconnects the QuickBooks integration
 */
export async function POST() {
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
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !connection) {
      return NextResponse.json(
        { error: "No QuickBooks connection found" },
        { status: 404 }
      );
    }

    // Revoke the token with QuickBooks
    try {
      await revokeToken(connection.access_token);
    } catch (error) {
      console.error("Failed to revoke QuickBooks token:", error);
      // Continue anyway to delete from our database
    }

    // Delete the connection from database
    const { error: deleteError } = await supabaseClient
      .from("quickbooks_connections")
      .delete()
      .eq("user_id", user.id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to disconnect" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("QuickBooks disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect from QuickBooks" },
      { status: 500 }
    );
  }
}
