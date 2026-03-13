"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserSupabase } from "@/lib/supabase-browser";
import type { User } from "@supabase/supabase-js";

export default function Nav() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    setDark(document.documentElement.classList.contains("dark"));

    const supabase = createBrowserSupabase();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  const handleLogout = async () => {
    const supabase = createBrowserSupabase();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const isActive = (href: string) => pathname === href;

  // Get initials from email
  const initials = user?.email ? user.email[0].toUpperCase() : null;

  return (
    <nav className="sticky top-0 z-20 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 md:px-6 gap-3">
      {/* Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 font-bold text-gray-900 dark:text-white text-base tracking-tight flex-shrink-0"
      >
        <span className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center text-white">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
        <span className="hidden sm:block">StackJob</span>
      </Link>

      {/* Nav links — only when logged in */}
      {user && (
        <div className="flex items-center gap-1 ml-2">
          <Link
            href="/"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/")
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Jobs
          </Link>
          <Link
            href="/onboard"
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive("/onboard")
                ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Import
          </Link>
        </div>
      )}

      <div className="flex-1" />

      {/* Right side */}
      {user && (
        <>
          <Link
            href="/jobs/new"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            New Job
          </Link>

          {/* User avatar + logout */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm font-semibold flex-shrink-0"
              title={user.email}
            >
              {initials}
            </div>
            <button
              onClick={handleLogout}
              className="hidden sm:block text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Sign out
            </button>
          </div>
        </>
      )}

      {/* Theme toggle */}
      {mounted && (
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400"
          aria-label="Toggle theme"
        >
          {dark ? (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      )}
    </nav>
  );
}
