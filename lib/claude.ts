import Anthropic from "@anthropic-ai/sdk";
import { FileType, JobType } from "./supabase";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ParsedDocument {
  file_name: string;
  file_path: string;
  file_type: FileType;
}

export interface ParsedJob {
  customer_name: string;
  building_name: string;
  job_type: JobType;
  documents: ParsedDocument[];
}

export interface ParsedFolderResult {
  jobs: ParsedJob[];
}

export interface FileEntry {
  name: string;
  path: string;
}

export async function parseFolderStructure(
  files: FileEntry[]
): Promise<ParsedFolderResult> {
  const fileList = files
    .map((f) => f.path)
    .slice(0, 500) // limit to avoid token overflow
    .join("\n");

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are parsing an elevator contractor's desktop folder structure to extract job data.

Folder paths:
${fileList}

Rules:
- Each top-level folder is typically one job
- Customer name comes from folder name (e.g. "Smith_Tower_Modernization" → customer: "Smith Tower", job_type: "Modernization")
- Job types: Modernization (keywords: modern, mod, upgrade), Repair (keywords: repair, fix, service), Install (keywords: install, new, addition), Maintenance (keywords: maint, pm, preventive)
- File types: "print" (keywords: print, drawing, plan, blueprint, dwg), "proposal" (keywords: proposal, quote, bid, estimate), "photo" (keywords: photo, pic, img, jpg, png, jpeg), "work_order" (keywords: wo, work_order, workorder, ticket), "other" (everything else)
- Infer has_prints, has_proposal from file names
- If folder name is ambiguous, make reasonable guesses

Return JSON only, no markdown fences, no explanation:
{"jobs": [{"customer_name": "string", "building_name": "string", "job_type": "Modernization|Repair|Install|Maintenance", "documents": [{"file_name": "string", "file_path": "string", "file_type": "print|proposal|photo|work_order|other"}]}]}`,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  // Strip markdown fences if Claude wraps in them
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as ParsedFolderResult;
  } catch {
    // If parsing fails, return empty result rather than crash
    console.error("Claude response parse error:", cleaned.slice(0, 200));
    return { jobs: [] };
  }
}
