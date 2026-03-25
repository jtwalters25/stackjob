import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const jobId = formData.get("job_id") as string;
    const fileType = formData.get("file_type") as string || "other";

    if (!file || !jobId) {
      return NextResponse.json({ error: "Missing file or job_id" }, { status: 400 });
    }

    // Verify the job belongs to this user
    const { data: job } = await supabase
      .from("jobs")
      .select("id")
      .eq("id", jobId)
      .eq("user_id", user.id)
      .single();

    if (!job) return NextResponse.json({ error: "Job not found" }, { status: 404 });

    // Upload file to Supabase Storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${jobId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("job-documents")
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Create document record
    const { data, error } = await supabase
      .from("documents")
      .insert({
        job_id: jobId,
        file_name: file.name,
        file_path: uploadData.path,
        file_type: fileType,
        file_size: file.size,
      })
      .select()
      .single();

    if (error) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from("job-documents").remove([fileName]);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update job flags based on file type
    const updateFields: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (fileType === "print") updateFields.has_prints = true;
    else if (fileType === "proposal") updateFields.has_proposal = true;

    if (Object.keys(updateFields).length > 1) {
      await supabase
        .from("jobs")
        .update(updateFields)
        .eq("id", jobId)
        .eq("user_id", user.id);
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
