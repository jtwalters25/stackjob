import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Verify the job belongs to this user before attaching documents (IDOR prevention)
  const { data: job } = await supabase
    .from("jobs")
    .select("id")
    .eq("id", body.job_id)
    .eq("user_id", user.id)
    .single();

  if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("documents")
    .insert({
      job_id: body.job_id,
      file_name: body.file_name,
      file_path: body.file_path,
      file_type: body.file_type || "other",
      file_size: body.file_size || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (body.file_type === "print") {
    await supabase
      .from("jobs")
      .update({ has_prints: true, updated_at: new Date().toISOString() })
      .eq("id", body.job_id)
      .eq("user_id", user.id);
  } else if (body.file_type === "proposal") {
    await supabase
      .from("jobs")
      .update({ has_proposal: true, updated_at: new Date().toISOString() })
      .eq("id", body.job_id)
      .eq("user_id", user.id);
  }

  return NextResponse.json(data, { status: 201 });
}
