import { NextRequest, NextResponse } from "next/server";
import { getTokensFromCode } from "@/lib/quickbooks";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * GET /api/quickbooks/callback
 * Handles the OAuth callback from QuickBooks
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get("code");
    const realmId = searchParams.get("realmId");

    if (!code || !realmId) {
      return NextResponse.redirect(
        new URL("/profile?qb_error=missing_params", request.url)
      );
    }

    // Exchange code for tokens
    const tokens = await getTokensFromCode(code);

    // Get the authenticated user
    const supabaseClient = createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(
        new URL("/login?error=unauthenticated", request.url)
      );
    }

    // Store connection in database
    const { error: dbError } = await supabaseClient
      .from("quickbooks_connections")
      .upsert({
        user_id: user.id,
        realm_id: tokens.realmId,
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expires_at: tokens.expiresAt.toISOString(),
        is_active: true,
        connected_at: new Date().toISOString(),
      });

    if (dbError) {
      console.error("Database error:", dbError);
      return NextResponse.redirect(
        new URL("/profile?qb_error=database_error", request.url)
      );
    }

    // Redirect back to profile with success
    return NextResponse.redirect(
      new URL("/profile?qb_connected=true", request.url)
    );
  } catch (error) {
    console.error("QuickBooks callback error:", error);
    return NextResponse.redirect(
      new URL("/profile?qb_error=callback_failed", request.url)
    );
  }
}
