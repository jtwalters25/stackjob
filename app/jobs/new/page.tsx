"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { STAGES, TRADES, TRADE_JOB_TYPES, JobStage } from "@/lib/supabase";

export default function NewJobPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    customer_name: "",
    building_name: "",
    address: "",
    trade: "General",
    job_type: "",
    stage: "Lead" as JobStage,
    has_prints: false,
    has_proposal: false,
    has_parts_list: false,
    has_permit: false,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill trade from user profile
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.trade) setForm((f) => ({ ...f, trade: p.trade }));
      })
      .catch(() => {});
  }, []);

  const jobTypes = TRADE_JOB_TYPES[form.trade] ?? TRADE_JOB_TYPES.General;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) {
      setError("Customer name is required");
      return;
    }

    setSaving(true);
    setError("");

    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        job_type: form.job_type || null,
        building_name: form.building_name || null,
        address: form.address || null,
      }),
    });

    if (res.ok) {
      const job = await res.json();
      router.push(`/jobs/${job.id}`);
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to create job");
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5";

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm mb-8 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">New Job</h1>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>
            Customer Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.customer_name}
            onChange={(e) => setForm((f) => ({ ...f, customer_name: e.target.value }))}
            placeholder="Smith Industries"
            className={inputClass}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Building Name</label>
            <input
              type="text"
              value={form.building_name}
              onChange={(e) => setForm((f) => ({ ...f, building_name: e.target.value }))}
              placeholder="Smith Tower"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Trade</label>
            <select
              value={form.trade}
              onChange={(e) => setForm((f) => ({ ...f, trade: e.target.value, job_type: "" }))}
              className={`${inputClass} min-h-[48px]`}
            >
              {TRADES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Address</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            placeholder="123 Main St, Chicago, IL 60601"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Job Type</label>
            <select
              value={form.job_type}
              onChange={(e) => setForm((f) => ({ ...f, job_type: e.target.value }))}
              className={`${inputClass} min-h-[48px]`}
            >
              <option value="">Select type...</option>
              {jobTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm((f) => ({ ...f, stage: e.target.value as JobStage }))}
              className={`${inputClass} min-h-[48px]`}
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <p className={labelClass}>Documents on Hand</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { key: "has_prints" as const, label: "Prints" },
              { key: "has_proposal" as const, label: "Proposal" },
              { key: "has_parts_list" as const, label: "Materials" },
              { key: "has_permit" as const, label: "Permit" },
            ].map(({ key, label }) => (
              <button
                type="button"
                key={key}
                onClick={() => setForm((f) => ({ ...f, [key]: !f[key] }))}
                className={`min-h-[48px] rounded-xl border-2 text-sm font-medium transition-all ${
                  form[key]
                    ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                {form[key] ? "✓ " : ""}{label}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[52px] bg-blue-600 text-white font-bold text-base rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 mt-2 shadow-lg"
        >
          {saving ? "Creating..." : "Create Job"}
        </button>
      </form>
    </div>
  );
}
