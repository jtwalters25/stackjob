"use client";

import { STAGES, JobStage } from "@/lib/supabase";

const STAGE_COLORS: Record<JobStage, string> = {
  Lead: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  "Site Visit": "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
  "Proposal Sent": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
  Won: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
  Scheduled: "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
  "In Progress": "bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300",
  Complete: "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
};

interface StageSelectProps {
  value: JobStage;
  onChange: (stage: JobStage) => void;
  className?: string;
}

export default function StageSelect({
  value,
  onChange,
  className = "",
}: StageSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as JobStage)}
      className={`rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] bg-white dark:bg-gray-800 dark:text-gray-100 ${className}`}
    >
      {STAGES.map((stage) => (
        <option key={stage} value={stage}>
          {stage}
        </option>
      ))}
    </select>
  );
}

export { STAGE_COLORS };
