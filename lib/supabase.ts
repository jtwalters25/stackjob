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

// Convenience proxy — behaves like the old `supabase` export
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type JobStage =
  | "Lead"
  | "Site Visit"
  | "Proposal Sent"
  | "Won"
  | "Scheduled"
  | "In Progress"
  | "Complete";

export type JobType = "Modernization" | "Repair" | "Install" | "Maintenance";

export type FileType = "print" | "proposal" | "photo" | "work_order" | "other";

export interface Job {
  id: string;
  customer_name: string;
  building_name: string | null;
  address: string | null;
  job_type: JobType | null;
  stage: JobStage;
  has_prints: boolean;
  has_proposal: boolean;
  has_parts_list: boolean;
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

export const STAGES: JobStage[] = [
  "Lead",
  "Site Visit",
  "Proposal Sent",
  "Won",
  "Scheduled",
  "In Progress",
  "Complete",
];

export const JOB_TYPES: JobType[] = [
  "Modernization",
  "Repair",
  "Install",
  "Maintenance",
];

export const STAGE_GROUPS = {
  Active: ["In Progress", "Scheduled"] as JobStage[],
  Pending: ["Lead", "Site Visit", "Proposal Sent", "Won"] as JobStage[],
  Complete: ["Complete"] as JobStage[],
};

export const STAGE_CHECKLISTS: Partial<Record<JobStage, string[]>> = {
  "Site Visit": [
    "Take photos of equipment",
    "Get model numbers",
    "Measure shaft dimensions",
    "Note existing conditions",
    "Meet building contact",
  ],
  Scheduled: [
    "Upload prints to job",
    "Confirm building access",
    "Verify parts ordered",
    "Notify building management",
    "Schedule crew",
  ],
  "In Progress": [
    "Check in on site",
    "Take progress photos",
    "Log hours",
    "Note any issues",
    "Get daily sign-off",
  ],
};
