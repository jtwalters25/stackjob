"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import StageSelect from "@/components/StageSelect";
import WarningModal from "@/components/WarningModal";
import {
  Job,
  Document,
  VoiceNote,
  JobStage,
  TRADES,
  TRADE_JOB_TYPES,
  getDocFlags,
  getCriticalDocs,
} from "@/lib/supabase";

const FILE_TYPE_LABELS: Record<string, string> = {
  print: "Print",
  proposal: "Proposal",
  photo: "Photo",
  work_order: "Work Order",
  other: "Other",
};

const FILE_TYPE_COLORS: Record<string, string> = {
  print: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  proposal: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  photo: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  work_order: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  other: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const card = "bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 shadow-sm p-4";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [job, setJob] = useState<Job | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [notes, setNotes] = useState<VoiceNote[]>([]);
  const [checklist, setChecklist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [showNavWarning, setShowNavWarning] = useState(false);
  const [editingAddress, setEditingAddress] = useState(false);
  const [addressInput, setAddressInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/jobs/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data.job);
        setDocuments(data.documents ?? []);
        setNotes(data.notes ?? []);
        setChecklist(data.checklist ?? []);
        setAddressInput(data.job?.address ?? "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const updateJob = async (patch: Partial<Job>) => {
    const res = await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const updated = await res.json();
      setJob(updated);
    }
  };

  const handleStageChange = async (stage: JobStage) => {
    setJob((j) => (j ? { ...j, stage } : j));
    await updateJob({ stage });
    // Refresh checklist for new stage
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setChecklist(data.checklist ?? []);
      setCheckedItems(new Set()); // reset checks on stage change
    }
  };

  const handleTradeChange = async (trade: string) => {
    setJob((j) => (j ? { ...j, trade } : j));
    await updateJob({ trade });
    const res = await fetch(`/api/jobs/${id}`);
    if (res.ok) {
      const data = await res.json();
      setChecklist(data.checklist ?? []);
    }
  };

  const handleJobTypeChange = (job_type: string) => {
    setJob((j) => (j ? { ...j, job_type } : j));
    updateJob({ job_type });
  };

  const handleSaveAddress = async () => {
    await updateJob({ address: addressInput || null });
    setEditingAddress(false);
  };

  const handleSaveNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: id, content: newNote.trim() }),
    });
    if (res.ok) {
      const note = await res.json();
      setNotes((prev) => [note, ...prev]);
      setNewNote("");
    }
    setSavingNote(false);
  };

  const handleNavigate = () => {
    if (!job) return;
    const criticalKeys = getCriticalDocs(job.trade ?? "General");
    const docFlags = getDocFlags(job.trade ?? "General");
    const missing = criticalKeys
      .filter((key) => !job[key])
      .map((key) => docFlags.find((f) => f.key === key)?.label ?? key);

    if (missing.length > 0) {
      setShowNavWarning(true);
    } else {
      openMaps();
    }
  };

  const openMaps = () => {
    if (job?.address) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(job.address)}`, "_blank");
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this job? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    router.push("/");
  };

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-56px)]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20 text-gray-400 dark:text-gray-500">
        <p>Job not found.</p>
        <Link href="/" className="text-blue-600 dark:text-blue-400 mt-4 inline-block hover:underline">
          Back to jobs
        </Link>
      </div>
    );
  }

  const trade = job.trade ?? "General";
  const docFlags = getDocFlags(trade);
  const criticalKeys = getCriticalDocs(trade);
  const missingDocs = criticalKeys
    .filter((key) => !job[key])
    .map((key) => docFlags.find((f) => f.key === key)?.label ?? key);
  const jobTypes = TRADE_JOB_TYPES[trade] ?? TRADE_JOB_TYPES.General;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-28">
      {/* Sticky page header */}
      <div className="sticky top-14 z-10 bg-slate-50 dark:bg-gray-950 pt-4 pb-3 border-b border-gray-100 dark:border-gray-800 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <Link
            href="/"
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate leading-tight">
              {job.customer_name}
            </h1>
            {job.building_name && (
              <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{job.building_name}</p>
            )}
          </div>
        </div>

        {/* Stage / Trade / Job Type row */}
        <div className="flex gap-2 flex-wrap">
          <StageSelect value={job.stage} onChange={handleStageChange} className="flex-1 min-w-[130px]" />
          <select
            value={trade}
            onChange={(e) => handleTradeChange(e.target.value)}
            className="flex-1 min-w-[120px] rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] bg-white dark:bg-gray-900"
          >
            {TRADES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={job.job_type ?? ""}
            onChange={(e) => handleJobTypeChange(e.target.value)}
            className="flex-1 min-w-[130px] rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[48px] bg-white dark:bg-gray-900"
          >
            <option value="">Job type...</option>
            {jobTypes.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Two-column layout on large screens */}
      <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">

        {/* LEFT */}
        <div className="space-y-4">
          {/* Missing docs warning */}
          {missingDocs.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Missing: {missingDocs.join(", ")}
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                  You&apos;ll be warned before navigating
                </p>
              </div>
            </div>
          )}

          {/* Address */}
          <div className={card}>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Address</h2>
              <button
                onClick={() => setEditingAddress(!editingAddress)}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {editingAddress ? "Cancel" : "Edit"}
              </button>
            </div>
            {editingAddress ? (
              <div className="flex gap-2">
                <input
                  value={addressInput}
                  onChange={(e) => setAddressInput(e.target.value)}
                  placeholder="123 Main St, City, State"
                  className="flex-1 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyDown={(e) => e.key === "Enter" && handleSaveAddress()}
                />
                <button
                  onClick={handleSaveAddress}
                  className="bg-blue-600 text-white text-sm px-4 py-2 rounded-lg min-h-[40px] hover:bg-blue-700 transition-colors"
                >
                  Save
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {job.address ?? (
                  <span className="text-gray-400 dark:text-gray-500 italic">No address set</span>
                )}
              </p>
            )}
          </div>

          {/* Document flags — trade-driven */}
          <div className={card}>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Documents</h2>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {docFlags.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => updateJob({ [key]: !job[key] })}
                  className={`min-h-[48px] rounded-lg border-2 text-sm font-medium transition-all ${
                    job[key]
                      ? "border-green-400 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  {job[key] ? "✓ " : ""}{label}
                </button>
              ))}
            </div>

            {documents.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-gray-50 dark:border-gray-800">
                {documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={`/api/documents/${doc.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 py-1.5 -mx-2 transition-colors group"
                  >
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${FILE_TYPE_COLORS[doc.file_type] ?? FILE_TYPE_COLORS.other}`}>
                      {FILE_TYPE_LABELS[doc.file_type] ?? "Other"}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                      {doc.file_name}
                    </span>
                    <svg className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 ml-auto flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Danger zone */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-100 dark:border-red-900/40 shadow-sm p-4">
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Danger Zone</h2>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full min-h-[44px] border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50 text-sm"
            >
              {deleting ? "Deleting..." : "Delete Job"}
            </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="space-y-4 mt-4 lg:mt-0">
          {/* Stage checklist — from DB */}
          {checklist.length > 0 && (
            <div className={card}>
              <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                {job.stage} Checklist
              </h2>
              <div className="space-y-1">
                {checklist.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleCheck(item)}
                    className="flex items-center gap-3 w-full text-left min-h-[44px] hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 transition-colors"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                      checkedItems.has(item) ? "border-green-500 bg-green-500" : "border-gray-300 dark:border-gray-600"
                    }`}>
                      {checkedItems.has(item) && (
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${checkedItems.has(item) ? "line-through text-gray-400 dark:text-gray-600" : "text-gray-700 dark:text-gray-300"}`}>
                      {item}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className={card}>
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Notes</h2>
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-2"
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handleSaveNote(); }}
            />
            <button
              onClick={handleSaveNote}
              disabled={savingNote || !newNote.trim()}
              className="w-full min-h-[44px] bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {savingNote ? "Saving..." : "Save Note"}
            </button>

            {notes.length > 0 && (
              <div className="mt-4 space-y-2.5">
                {notes.map((note) => (
                  <div key={note.id} className="bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2.5">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fixed Navigate button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 safe-bottom z-10">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleNavigate}
            className="w-full min-h-[52px] bg-blue-600 text-white font-bold text-base rounded-xl hover:bg-blue-700 active:bg-blue-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Navigate to Job
          </button>
        </div>
      </div>

      {showNavWarning && (
        <WarningModal
          missing={missingDocs}
          address={job.address}
          onClose={() => setShowNavWarning(false)}
          onNavigateAnyway={() => setShowNavWarning(false)}
        />
      )}
    </div>
  );
}
