import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the document and verify ownership
  const { data: document, error: fetchError } = await supabase
    .from("documents")
    .select(`
      id,
      file_path,
      file_type,
      job_id,
      jobs!inner(user_id)
    `)
    .eq("id", params.id)
    .single();

  if (fetchError || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify the user owns the job this document belongs to
  const doc = document as typeof document & { jobs: { user_id: string } };
  if (doc.jobs.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Delete from Supabase Storage
    const { error: storageError } = await supabase.storage
      .from("job-documents")
      .remove([document.file_path]);

    if (storageError) {
      console.error("Storage deletion error:", storageError);
      // Continue anyway - file might not exist in storage
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from("documents")
      .delete()
      .eq("id", params.id);

    if (dbError) {
      return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
    }

    // Check if we need to update job flags
    const { data: remainingDocs } = await supabase
      .from("documents")
      .select("file_type")
      .eq("job_id", document.job_id);

    const hasPrints = remainingDocs?.some((d) => d.file_type === "print") ?? false;
    const hasProposal = remainingDocs?.some((d) => d.file_type === "proposal") ?? false;

    // Update job flags if this was the last document of its type
    await supabase
      .from("jobs")
      .update({
        has_prints: hasPrints,
        has_proposal: hasProposal,
        updated_at: new Date().toISOString(),
      })
      .eq("id", document.job_id)
      .eq("user_id", user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the document and verify ownership
  const { data: document, error } = await supabase
    .from("documents")
    .select(`
      id,
      file_name,
      file_path,
      file_type,
      job_id,
      jobs!inner(user_id)
    `)
    .eq("id", params.id)
    .single();

  if (error || !document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Verify the user owns the job this document belongs to
  const doc = document as typeof document & { jobs: { user_id: string } };
  if (doc.jobs.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Get signed URL from Supabase Storage
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("job-documents")
      .createSignedUrl(document.file_path, 3600); // 1 hour expiry

    if (signedUrlError || !signedUrlData) {
      console.error("Error creating signed URL:", signedUrlError);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Redirect to the signed URL
    return NextResponse.redirect(signedUrlData.signedUrl);
  } catch (error) {
    console.error("Error serving document:", error);
    return NextResponse.json({ error: "Failed to retrieve file" }, { status: 500 });
  }
}
