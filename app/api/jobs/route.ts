import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { Metrics } from "@/lib/metrics";

export async function GET() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Get user's primary trade to auto-set role
  const { data: profile } = await supabase
    .from("profiles")
    .select("trade")
    .eq("id", user.id)
    .single();

  const userPrimaryTrade = profile?.trade || "General";
  const jobTrade = body.trade || "General";

  // Auto-set role: Self-Perform if trade matches, otherwise Prime Contractor
  // Allow override if role is explicitly provided
  const role = body.role || (jobTrade === userPrimaryTrade ? "Self-Perform" : "Prime Contractor");

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      customer_name: body.customer_name,
      building_name: body.building_name || null,
      address: body.address || null,
      job_type: body.job_type || null,
      stage: body.stage || "Lead",
      trade: jobTrade,
      role,
      has_prints: body.has_prints ?? false,
      has_proposal: body.has_proposal ?? false,
      has_parts_list: body.has_parts_list ?? false,
      has_permit: body.has_permit ?? false,
      notes: body.notes || null,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    Metrics.performance.trackAPILatency("/api/jobs", "POST", performance.now() - startTime, 500);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Track successful job creation
  const duration = performance.now() - startTime;
  Metrics.business.trackJobCreation(jobTrade, role, duration);
  Metrics.performance.trackAPILatency("/api/jobs", "POST", duration, 201);

  return NextResponse.json(data, { status: 201 });
}
