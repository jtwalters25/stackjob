import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import {
  createCustomer,
  createInvoice,
  queryQuickBooks,
  refreshAccessToken,
} from "@/lib/quickbooks";

/**
 * POST /api/quickbooks/sync
 * Sync a job to QuickBooks as an invoice
 */
export async function POST(request: NextRequest) {
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

    // Get request body
    const body = await request.json();
    const { job_id } = body;

    if (!job_id) {
      return NextResponse.json(
        { error: "job_id is required" },
        { status: 400 }
      );
    }

    // Get QuickBooks connection
    const { data: connection, error: connError } = await supabaseClient
      .from("quickbooks_connections")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (connError || !connection) {
      return NextResponse.json(
        { error: "QuickBooks not connected" },
        { status: 404 }
      );
    }

    // Get the job
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("*")
      .eq("id", job_id)
      .single();

    if (jobError || !job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Check if token needs refresh
    let accessToken = connection.access_token;
    const expiresAt = new Date(connection.expires_at);
    if (expiresAt < new Date()) {
      // Token expired, refresh it
      const newTokens = await refreshAccessToken(connection.refresh_token);
      accessToken = newTokens.accessToken;

      // Update the connection
      await supabaseClient
        .from("quickbooks_connections")
        .update({
          access_token: newTokens.accessToken,
          refresh_token: newTokens.refreshToken,
          expires_at: newTokens.expiresAt.toISOString(),
        })
        .eq("user_id", user.id);
    }

    // Create sync job record
    const { data: syncJob, error: syncJobError } = await supabaseClient
      .from("sync_jobs")
      .insert({
        user_id: user.id,
        job_id: job.id,
        entity_type: "invoice",
        direction: "to_qb",
        status: "processing",
      })
      .select()
      .single();

    if (syncJobError) {
      return NextResponse.json(
        { error: "Failed to create sync job" },
        { status: 500 }
      );
    }

    try {
      // Check if customer exists in QuickBooks
      const customerQuery = `SELECT * FROM Customer WHERE DisplayName = '${job.customer_name}'`;
      const customerResult = await queryQuickBooks<{
        QueryResponse?: { Customer?: Array<{ Id: string }> };
      }>(accessToken, connection.realm_id, customerQuery);

      let customerId: string;

      if (
        !customerResult.QueryResponse?.Customer ||
        customerResult.QueryResponse.Customer.length === 0
      ) {
        // Customer doesn't exist, create it
        const customerData = (await createCustomer(
          accessToken,
          connection.realm_id,
          {
            displayName: job.customer_name,
            companyName: job.building_name || undefined,
            billAddr: job.address
              ? {
                  line1: job.address,
                }
              : undefined,
          }
        )) as { Customer: { Id: string } };
        customerId = customerData.Customer.Id;
      } else {
        customerId = customerResult.QueryResponse.Customer[0].Id;
      }

      // Create invoice
      const invoiceData = (await createInvoice(
        accessToken,
        connection.realm_id,
        {
          customerId,
          lineItems: [
            {
              amount: 0, // TODO: Add amount from job
              description: `${job.job_type || "Service"} - ${job.trade || "General"}`,
              detailType: "SalesItemLineDetail",
            },
          ],
          docNumber: job.id.slice(0, 8),
        }
      )) as { Invoice: { Id: string } };

      const invoiceId = invoiceData.Invoice.Id;

      // Update sync job as completed
      await supabaseClient
        .from("sync_jobs")
        .update({
          status: "completed",
          qb_id: invoiceId,
        })
        .eq("id", syncJob.id);

      // Log success
      await supabaseClient.from("sync_logs").insert({
        sync_job_id: syncJob.id,
        level: "info",
        message: "Successfully synced job to QuickBooks",
        metadata: { invoice_id: invoiceId, customer_id: customerId },
      });

      // Update last_sync_at
      await supabaseClient
        .from("quickbooks_connections")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("user_id", user.id);

      return NextResponse.json({
        success: true,
        invoiceId,
        customerId,
        syncJobId: syncJob.id,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      // Update sync job as failed
      await supabaseClient
        .from("sync_jobs")
        .update({
          status: "failed",
          error_message: errorMessage,
          retry_count: syncJob.retry_count + 1,
        })
        .eq("id", syncJob.id);

      // Log error
      await supabaseClient.from("sync_logs").insert({
        sync_job_id: syncJob.id,
        level: "error",
        message: "Failed to sync job to QuickBooks",
        metadata: { error: errorMessage },
      });

      throw error;
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to sync to QuickBooks";
    console.error("QuickBooks sync error:", error);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
