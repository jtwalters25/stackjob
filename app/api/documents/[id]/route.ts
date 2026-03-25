import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

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
