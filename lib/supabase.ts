import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error(
        "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
      );
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// ─── Stage types ────────────────────────────────────────────────────────────

export type JobStage =
  | "Lead"
  | "Site Visit"
  | "Proposal Sent"
  | "Won"
  | "Scheduled"
  | "In Progress"
  | "Complete";

export const STAGES: JobStage[] = [
  "Lead",
  "Site Visit",
  "Proposal Sent",
  "Won",
  "Scheduled",
  "In Progress",
  "Complete",
];

export const STAGE_GROUPS = {
  Active: ["In Progress", "Scheduled"] as JobStage[],
  Pending: ["Lead", "Site Visit", "Proposal Sent", "Won"] as JobStage[],
  Complete: ["Complete"] as JobStage[],
};

// ─── Trade types ─────────────────────────────────────────────────────────────

export type JobType = string; // Generic — populated per-trade

export const TRADES = [
  "Elevator",
  "Electrician",
  "Plumber",
  "HVAC",
  "Roofing",
  "General Contractor",
  "Carpenter",
  "Painter",
  "General",
] as const;

export type Trade = (typeof TRADES)[number];

export const TRADE_JOB_TYPES: Record<string, string[]> = {
  Elevator: ["Modernization", "Repair", "Install", "Maintenance"],
  Electrician: ["Panel Upgrade", "Rewire", "New Installation", "Repair", "EV Charger", "Generator", "Maintenance"],
  Plumber: ["Repair", "New Installation", "Water Heater", "Repipe", "Drain Cleaning", "Maintenance"],
  HVAC: ["New Installation", "Replacement", "Repair", "Maintenance", "Duct Work"],
  Roofing: ["New Installation", "Replacement", "Repair", "Coating", "Maintenance"],
  "General Contractor": ["Tenant Improvement", "Ground-Up", "Renovation", "Design-Build", "Repair"],
  Carpenter: ["New Installation", "Renovation", "Repair", "Finish Carpentry", "Cabinetry"],
  Painter: ["Interior", "Exterior", "Commercial", "Residential", "Cabinet Painting"],
  General: ["New Installation", "Repair", "Maintenance", "Renovation", "Other"],
};

// ─── Document flag types ──────────────────────────────────────────────────────

export type DocFlagKey = "has_prints" | "has_proposal" | "has_parts_list" | "has_permit";

export interface DocFlag {
  key: DocFlagKey;
  label: string;
}

/** Which doc toggles show on the job detail page per trade */
export const TRADE_DOC_FLAGS: Record<string, DocFlag[]> = {
  Elevator: [
    { key: "has_prints", label: "Prints" },
    { key: "has_proposal", label: "Proposal" },
    { key: "has_parts_list", label: "Parts List" },
  ],
  Electrician: [
    { key: "has_permit", label: "Permit" },
    { key: "has_proposal", label: "Proposal" },
    { key: "has_parts_list", label: "Materials" },
  ],
  Plumber: [
    { key: "has_permit", label: "Permit" },
    { key: "has_proposal", label: "Proposal" },
    { key: "has_parts_list", label: "Materials" },
  ],
  HVAC: [
    { key: "has_prints", label: "Drawings" },
    { key: "has_proposal", label: "Proposal" },
    { key: "has_parts_list", label: "Equipment List" },
  ],
  Roofing: [
    { key: "has_proposal", label: "Proposal" },
    { key: "has_parts_list", label: "Materials List" },
    { key: "has_prints", label: "Drawings" },
  ],
  "General Contractor": [
    { key: "has_permit", label: "Permit" },
    { key: "has_proposal", label: "Proposal / Bid" },
    { key: "has_parts_list", label: "Sub COIs" },
  ],
  Carpenter: [
    { key: "has_proposal", label: "Proposal" },
    { key: "has_prints", label: "Drawings" },
    { key: "has_parts_list", label: "Materials List" },
  ],
  Painter: [
    { key: "has_proposal", label: "Proposal" },
    { key: "has_parts_list", label: "Materials List" },
    { key: "has_prints", label: "Drawings" },
  ],
  General: [
    { key: "has_proposal", label: "Proposal" },
    { key: "has_prints", label: "Drawings" },
    { key: "has_parts_list", label: "Materials List" },
  ],
};

/** Which missing docs trigger the Navigate warning per trade */
export const TRADE_CRITICAL_DOCS: Record<string, DocFlagKey[]> = {
  Elevator: ["has_prints", "has_proposal"],
  Electrician: ["has_permit", "has_proposal"],
  Plumber: ["has_permit", "has_proposal"],
  HVAC: ["has_proposal"],
  Roofing: ["has_proposal"],
  "General Contractor": ["has_permit", "has_proposal"],
  Carpenter: ["has_proposal"],
  Painter: ["has_proposal"],
  General: ["has_proposal"],
};

export function getDocFlags(trade: string): DocFlag[] {
  return TRADE_DOC_FLAGS[trade] ?? TRADE_DOC_FLAGS.General;
}

export function getCriticalDocs(trade: string): DocFlagKey[] {
  return TRADE_CRITICAL_DOCS[trade] ?? TRADE_CRITICAL_DOCS.General;
}

// ─── DB interfaces ────────────────────────────────────────────────────────────

export type FileType = "print" | "proposal" | "photo" | "work_order" | "other";

export interface Job {
  id: string;
  customer_name: string;
  building_name: string | null;
  address: string | null;
  job_type: string | null;
  stage: JobStage;
  trade: string;
  has_prints: boolean;
  has_proposal: boolean;
  has_parts_list: boolean;
  has_permit: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  job_id: string;
  file_name: string;
  file_path: string;
  file_type: FileType;
  file_size: number | null;
  uploaded_at: string;
}

export interface VoiceNote {
  id: string;
  job_id: string;
  content: string;
  created_at: string;
}

export interface Profile {
  id: string;
  trade: string;
  company_name: string | null;
}
