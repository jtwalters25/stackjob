import Anthropic from "@anthropic-ai/sdk";
import { FileType } from "./supabase";

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
  job_type: string;
  trade: string;
  documents: ParsedDocument[];
}

export interface ParsedFolderResult {
  jobs: ParsedJob[];
}

export interface FileEntry {
  name: string;
  path: string;
}

// Per-trade keyword hints sent to Claude to improve parsing accuracy
const TRADE_PARSING_CONFIGS: Record<string, { keywords: string[]; jobTypes: string[] }> = {
  Elevator: {
    keywords: ["elevator", "lift", "escalator", "mod", "modernization", "controller", "shaft", "cab"],
    jobTypes: ["Modernization", "Repair", "Install", "Maintenance"],
  },
  Electrician: {
    keywords: ["electric", "panel", "circuit", "wiring", "conduit", "breaker", "service", "ev", "generator"],
    jobTypes: ["Panel Upgrade", "Rewire", "New Installation", "Repair", "EV Charger", "Generator", "Maintenance"],
  },
  Plumber: {
    keywords: ["plumb", "pipe", "drain", "water", "sewer", "fixture", "valve", "repipe"],
    jobTypes: ["Repair", "New Installation", "Water Heater", "Repipe", "Drain Cleaning", "Maintenance"],
  },
  HVAC: {
    keywords: ["hvac", "heat", "cool", "ac", "duct", "refrigerant", "furnace", "air handler", "rooftop"],
    jobTypes: ["New Installation", "Replacement", "Repair", "Maintenance", "Duct Work"],
  },
  Roofing: {
    keywords: ["roof", "membrane", "flashing", "shingle", "tpo", "epdm", "gutter", "coating"],
    jobTypes: ["New Installation", "Replacement", "Repair", "Coating", "Maintenance"],
  },
  "General Contractor": {
    keywords: ["construction", "build", "renovation", "ti", "tenant", "permit", "sub", "gc"],
    jobTypes: ["Tenant Improvement", "Ground-Up", "Renovation", "Design-Build", "Repair"],
  },
  Carpenter: {
    keywords: ["carpenter", "wood", "frame", "finish", "cabinet", "door", "window", "deck"],
    jobTypes: ["New Installation", "Renovation", "Repair", "Finish Carpentry", "Cabinetry"],
  },
  Painter: {
    keywords: ["paint", "coat", "primer", "stain", "interior", "exterior", "epoxy"],
    jobTypes: ["Interior", "Exterior", "Commercial", "Residential", "Cabinet Painting"],
  },
  General: {
    keywords: ["install", "repair", "maintenance", "renovation", "service"],
    jobTypes: ["New Installation", "Repair", "Maintenance", "Renovation", "Other"],
  },
};

export async function parseFolderStructure(
  files: FileEntry[],
  tradeHint: string = "General"
): Promise<ParsedFolderResult> {
  const fileList = files
    .map((f) => f.path)
    .slice(0, 500)
    .join("\n");

  const tradeConfig = TRADE_PARSING_CONFIGS[tradeHint] ?? TRADE_PARSING_CONFIGS.General;
  const allTrades = Object.keys(TRADE_PARSING_CONFIGS);

  const message = await client.messages.create({
    model: "claude-opus-4-6",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are parsing a ${tradeHint} contractor's desktop folder structure to extract job data.

Folder paths:
${fileList}

Rules:
- Each top-level folder is typically one job
- Customer name comes from folder name (e.g. "Smith_Building_PanelUpgrade" → customer: "Smith Building", job_type: "Panel Upgrade")
- This contractor's trade is: ${tradeHint}
- Trade keywords for ${tradeHint}: ${tradeConfig.keywords.join(", ")}
- Valid job types for ${tradeHint}: ${tradeConfig.jobTypes.join(", ")}
- If a folder seems to belong to a different trade, set that trade instead. Known trades: ${allTrades.join(", ")}
- File types: "print" (keywords: print, drawing, plan, blueprint, dwg), "proposal" (keywords: proposal, quote, bid, estimate), "photo" (keywords: photo, pic, img, jpg, png, jpeg), "work_order" (keywords: wo, work_order, workorder, ticket), "other" (everything else)
- If folder name is ambiguous, make reasonable guesses

Return JSON only, no markdown fences, no explanation:
{"jobs": [{"customer_name": "string", "building_name": "string", "job_type": "string", "trade": "string", "documents": [{"file_name": "string", "file_path": "string", "file_type": "print|proposal|photo|work_order|other"}]}]}`,
      },
    ],
  });

  const raw =
    message.content[0].type === "text" ? message.content[0].text : "";

  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as ParsedFolderResult;
  } catch {
    console.error("Claude response parse error:", cleaned.slice(0, 200));
    return { jobs: [] };
  }
}
