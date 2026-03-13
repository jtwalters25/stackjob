"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import JobCard from "@/components/JobCard";
import { Job, STAGE_GROUPS } from "@/lib/supabase";

export default function HomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [loadingDemo, setLoadingDemo] = useState(false);

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => r.json())
      .then((data) => {
        setJobs(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLoadDemo = async () => {
    setLoadingDemo(true);
    try {
      const res = await fetch("/api/demo", { method: "POST" });
      if (res.ok) router.refresh();
      // Reload jobs after seeding
      const updated = await fetch("/api/jobs").then((r) => r.json());
      setJobs(Array.isArray(updated) ? updated : []);
    } finally {
      setLoadingDemo(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return jobs;
    const q = search.toLowerCase();
    return jobs.filter(
      (j) =>
        j.customer_name.toLowerCase().includes(q) ||
        j.building_name?.toLowerCase().includes(q) ||
        j.address?.toLowerCase().includes(q) ||
        j.job_type?.toLowerCase().includes(q)
    );
  }, [jobs, search]);

  const grouped = useMemo(() => ({
    Active: filtered.filter((j) => STAGE_GROUPS.Active.includes(j.stage)),
    Pending: filtered.filter((j) => STAGE_GROUPS.Pending.includes(j.stage)),
    Complete: filtered.filter((j) => STAGE_GROUPS.Complete.includes(j.stage)),
  }), [filtered]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-56px)] p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">No jobs yet</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm text-sm leading-relaxed">
          Import your desktop job folders or try the demo to see how StackJob works.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
          <Link
            href="/onboard"
            className="flex-1 bg-blue-600 text-white font-semibold px-6 py-3 rounded-xl min-h-[48px] flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import Folders
          </Link>
          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="flex-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-semibold px-6 py-3 rounded-xl min-h-[48px] flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm disabled:opacity-60"
          >
            {loadingDemo ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Try Demo
          </button>
        </div>
        <Link href="/jobs/new" className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline">
          Or add a job manually
        </Link>
      </div>
    );
  }

  const groupConfig = {
    Active: {
      label: "Active",
      dot: "bg-orange-500",
      badge: "text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20",
    },
    Pending: {
      label: "Pending",
      dot: "bg-blue-500",
      badge: "text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20",
    },
    Complete: {
      label: "Complete",
      dot: "bg-green-500",
      badge: "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20",
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      {/* Sticky search bar */}
      <div className="sticky top-14 bg-slate-50 dark:bg-gray-950 z-10 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>
          <Link
            href="/jobs/new"
            className="sm:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
          </Link>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          {filtered.length} of {jobs.length} job{jobs.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Job groups */}
      <div className="space-y-8">
        {(["Active", "Pending", "Complete"] as const).map((group) => {
          const groupJobs = grouped[group];
          if (groupJobs.length === 0) return null;
          const cfg = groupConfig[group];

          return (
            <section key={group}>
              <div className="flex items-center gap-2.5 mb-4">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                  {cfg.label}
                </span>
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {groupJobs.length} job{groupJobs.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {groupJobs.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </div>
            </section>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400 dark:text-gray-500">
            <p>No jobs match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
