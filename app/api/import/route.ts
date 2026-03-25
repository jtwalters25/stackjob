import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { parseFolderStructure, FileEntry } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const files: FileEntry[] = body.files;

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // Get the user's default trade to inform Claude's parsing
    const { data: profile } = await supabase
      .from("profiles")
      .select("trade")
      .eq("id", user.id)
      .single();

    const tradeHint = profile?.trade ?? "General";
    const parsed = await parseFolderStructure(files, tradeHint);

    if (!parsed.jobs || parsed.jobs.length === 0) {
      return NextResponse.json({ error: "No jobs found in folder structure" }, { status: 422 });
    }

    const insertedJobs = [];

    for (const parsedJob of parsed.jobs) {
      const hasPrints = parsedJob.documents.some((d) => d.file_type === "print");
      const hasProposal = parsedJob.documents.some((d) => d.file_type === "proposal");
      const jobTrade = parsedJob.trade || tradeHint;

      // Auto-set role: Self-Perform if trade matches user's primary trade, otherwise Prime Contractor
      const role = jobTrade === tradeHint ? "Self-Perform" : "Prime Contractor";

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({
          customer_name: parsedJob.customer_name,
          building_name: parsedJob.building_name || null,
          job_type: parsedJob.job_type || null,
          trade: jobTrade,
          role,
          stage: "Lead",
          has_prints: hasPrints,
          has_proposal: hasProposal,
          has_parts_list: false,
          has_permit: false,
          user_id: user.id,
        })
        .select()
        .single();

      if (jobError || !job) {
        console.error("Job insert error:", jobError);
        continue;
      }

      if (parsedJob.documents && parsedJob.documents.length > 0) {
        const docInserts = parsedJob.documents.map((doc) => ({
          job_id: job.id,
          file_name: doc.file_name,
          file_path: doc.file_path,
          file_type: doc.file_type,
          file_size: null,
        }));

        const { error: docError } = await supabase.from("documents").insert(docInserts);
        if (docError) console.error("Document insert error:", docError);
      }

      insertedJobs.push(job);
    }

    return NextResponse.json({
      imported: insertedJobs.length,
      total: parsed.jobs.length,
      jobs: insertedJobs,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
