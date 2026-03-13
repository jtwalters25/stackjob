"use client";

interface WarningModalProps {
  missing: string[];
  address: string | null;
  onClose: () => void;
  onNavigateAnyway: () => void;
}

export default function WarningModal({
  missing,
  address,
  onClose,
  onNavigateAnyway,
}: WarningModalProps) {
  const handleNavigate = () => {
    if (address) {
      const encoded = encodeURIComponent(address);
      window.open(`https://maps.google.com/?q=${encoded}`, "_blank");
    }
    onNavigateAnyway();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-sm w-full p-6 z-10 border border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Missing Documents
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Before you head to the job</p>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-3 text-sm">
          This job is missing the following before you go on-site:
        </p>

        <ul className="mb-5 space-y-2">
          {missing.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2"
            >
              <svg
                className="w-4 h-4 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-medium text-sm">{item}</span>
            </li>
          ))}
        </ul>

        {!address && (
          <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 mb-4">
            No address saved for this job. Add one in job details.
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
          >
            Go Back
          </button>
          <button
            onClick={handleNavigate}
            disabled={!address}
            className="flex-1 min-h-[48px] rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            Navigate Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
