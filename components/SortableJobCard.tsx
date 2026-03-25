"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Link from "next/link";
import { Job, JobStage, getCriticalDocs, getDocFlags } from "@/lib/supabase";
import { STAGE_COLORS } from "./StageSelect";

interface SortableJobCardProps {
  job: Job;
}

export function SortableJobCard({ job }: SortableJobCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const criticalKeys = getCriticalDocs(job.trade ?? "General");
  const missingDocs = criticalKeys
    .filter((key) => !job[key])
    .map((key) => getDocFlags(job.trade ?? "General").find((f) => f.key === key)?.label ?? key);

  const showWarning =
    ["Scheduled", "In Progress"].includes(job.stage) && missingDocs.length > 0;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/jobs/${job.id}`}>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm hover:shadow-md dark:shadow-none dark:hover:bg-gray-800 transition-all border border-gray-100 dark:border-gray-800 p-4 min-h-[80px] cursor-grab active:cursor-grabbing">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate text-base">
                {job.customer_name}
              </h3>
              {job.building_name && (
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                  {job.building_name}
                </p>
              )}
              {job.address && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                  {job.address}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span
                className={`text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap ${STAGE_COLORS[job.stage as JobStage] ?? "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}
              >
                {job.stage}
              </span>
              <div className="flex items-center gap-1.5">
                {job.trade && job.trade !== "General" && (
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {job.trade}
                  </span>
                )}
                {job.job_type && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">{job.job_type}</span>
                )}
              </div>
            </div>
          </div>

          {showWarning && (
            <div className="mt-3 flex items-center gap-1.5 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-1.5">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs font-medium">Missing: {missingDocs.join(", ")}</span>
            </div>
          )}

          {/* Drag handle indicator */}
          <div className="mt-2 flex justify-center">
            <svg className="w-4 h-4 text-gray-300 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 10-4 0 2 2 0 004 0zM7 10a2 2 0 10-4 0 2 2 0 004 0zM7 18a2 2 0 10-4 0 2 2 0 004 0zM17 2a2 2 0 10-4 0 2 2 0 004 0zM17 10a2 2 0 10-4 0 2 2 0 004 0zM17 18a2 2 0 10-4 0 2 2 0 004 0z" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
