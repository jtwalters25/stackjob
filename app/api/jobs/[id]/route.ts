import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  const [jobResult, docsResult, notesResult] = await Promise.all([
    supabase.from("jobs").select("*").eq("id", id).eq("user_id", user.id).single(),
    supabase.from("documents").select("*").eq("job_id", id).order("uploaded_at", { ascending: false }),
    supabase.from("voice_notes").select("*").eq("job_id", id).order("created_at", { ascending: false }),
  ]);

  if (jobResult.error || !jobResult.data) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  // Fetch trade+stage specific checklist from DB
  const { data: checklistData } = await supabase
    .from("checklist_templates")
    .select("items")
    .eq("trade", jobResult.data.trade ?? "General")
    .eq("stage", jobResult.data.stage)
    .single();

  return NextResponse.json({
    job: jobResult.data,
    documents: docsResult.data ?? [],
    notes: notesResult.data ?? [],
    checklist: checklistData?.items ?? [],
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;
  const body = await request.json();

  const ALLOWED_FIELDS = [
    "stage", "job_type", "trade", "customer_name", "building_name",
    "address", "notes", "has_prints", "has_proposal", "has_parts_list", "has_permit",
  ];
  const updates = Object.fromEntries(
    Object.entries(body).filter(([key]) => ALLOWED_FIELDS.includes(key))
  );

  const { data, error } = await supabase
    .from("jobs")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = params;

  const { error } = await supabase
    .from("jobs")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
