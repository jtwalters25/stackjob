import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { readFile } from "fs/promises";
import { join, normalize } from "path";
import { existsSync } from "fs";

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
  if ((document as any).jobs.user_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    // Normalize the path to prevent directory traversal
    const normalizedPath = normalize(document.file_path);

    // For security, ensure the path doesn't contain ".." or start with "/"
    if (normalizedPath.includes("..") || normalizedPath.startsWith("/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Get the base directory from environment or use home directory
    const baseDir = process.env.JOBS_BASE_DIR || process.env.HOME || "";
    const fullPath = join(baseDir, normalizedPath);

    // Check if file exists
    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
    }

    // Read the file
    const fileBuffer = await readFile(fullPath);

    // Determine content type based on file extension
    const ext = document.file_name.split(".").pop()?.toLowerCase();
    const contentTypeMap: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      txt: "text/plain",
    };
    const contentType = contentTypeMap[ext || ""] || "application/octet-stream";

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(document.file_name)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error serving document:", error);
    return NextResponse.json({ error: "Failed to read file" }, { status: 500 });
  }
}
