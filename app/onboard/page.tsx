"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ImportStatus = "idle" | "reading" | "parsing" | "done" | "error";

export default function OnboardPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [fileCount, setFileCount] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const handleFolderSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setStatus("reading");
    setFileCount(files.length);

    const fileEntries: { name: string; path: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileEntries.push({
        name: file.name,
        path: (file as File & { webkitRelativePath: string }).webkitRelativePath || file.name,
      });
    }

    setStatus("parsing");

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: fileEntries }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Import failed");

      setImportedCount(data.imported);
      setStatus("done");

      setTimeout(() => router.push("/"), 2000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Unknown error");
      setStatus("error");
    }
  };

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

      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">Import Jobs</h1>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 leading-relaxed">
        Select your jobs folder from your desktop. Claude AI will read the folder names and
        file names to automatically create your job list.
      </p>

      {status === "idle" && (
        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors"
        >
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          </div>
          <p className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-1">
            Select Folder
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Choose the folder containing your job folders
          </p>
          <input
            ref={inputRef}
            type="file"
            // @ts-expect-error - webkitdirectory is not in standard TS types
            webkitdirectory="true"
            multiple
            className="hidden"
            onChange={handleFolderSelect}
          />
        </div>
      )}

      {status === "reading" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-10 text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-gray-800 dark:text-gray-200">Reading files...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Found {fileCount} files</p>
        </div>
      )}

      {status === "parsing" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-10 text-center">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-semibold text-gray-800 dark:text-gray-200">Claude is parsing...</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Analyzing {fileCount} files to identify jobs
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600 mt-3">This may take 15–30 seconds</p>
        </div>
      )}

      {status === "done" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-green-100 dark:border-green-900/40 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            Found {importedCount} jobs!
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">Redirecting to your job list...</p>
        </div>
      )}

      {status === "error" && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-red-100 dark:border-red-900/40 shadow-sm p-10 text-center">
          <div className="w-14 h-14 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Import failed</p>
          <p className="text-sm text-red-500 dark:text-red-400 mb-6">{errorMsg}</p>
          <button
            onClick={() => setStatus("idle")}
            className="bg-blue-600 text-white font-medium px-6 py-3 rounded-lg min-h-[48px] hover:bg-blue-700 transition-colors text-sm"
          >
            Try Again
          </button>
        </div>
      )}

      {status === "idle" && (
        <div className="mt-8 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-6">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            How it works
          </p>
          {[
            { icon: "📁", text: 'Select your jobs folder (e.g. "Desktop/Jobs")' },
            { icon: "🤖", text: "Claude reads folder names like Smith_Tower_Modernization and extracts job details" },
            { icon: "📄", text: 'Files with "print" or "proposal" in the name are automatically tagged' },
            { icon: "✅", text: "Jobs appear in your list grouped by stage" },
          ].map(({ icon, text }, i) => (
            <div key={i} className="flex gap-3 text-sm text-gray-600 dark:text-gray-400">
              <span>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
