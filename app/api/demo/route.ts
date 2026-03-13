import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { DEMO_JOBS } from "@/lib/demo-data";

export async function POST() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const insertedJobs = [];

    for (const demoJob of DEMO_JOBS) {
      const { documents, ...jobData } = demoJob;

      const { data: job, error: jobError } = await supabase
        .from("jobs")
        .insert({ ...jobData, user_id: user.id })
        .select()
        .single();

      if (jobError || !job) {
        console.error("Demo job insert error:", jobError);
        continue;
      }

      if (documents.length > 0) {
        const docInserts = documents.map((doc) => ({
          job_id: job.id,
          file_name: doc.file_name,
          file_path: doc.file_path,
          file_type: doc.file_type,
          file_size: null,
        }));

        const { error: docError } = await supabase.from("documents").insert(docInserts);
        if (docError) console.error("Demo doc insert error:", docError);
      }

      insertedJobs.push(job);
    }

    return NextResponse.json({ imported: insertedJobs.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
