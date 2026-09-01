"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/useAuth";
import { listenAllPatterns, listenStreak, touchStreak } from "@/lib/firestore";

const NAV_LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/topics", label: "Topics" },
  { href: "/concepts", label: "Concepts" },
];

export default function AppChrome({ children }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patternCount, setPatternCount] = useState(0);
  const [showPatterns, setShowPatterns] = useState(false);
  const [patterns, setPatterns] = useState([]);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!loading && !user && pathname !== "/login") {
      router.replace("/login");
    }
  }, [loading, user, pathname, router]);

  useEffect(() => {
    if (!user) return;
    touchStreak(user.uid);
    const un1 = listenAllPatterns(user.uid, (p) => {
      setPatterns(p);
      setPatternCount(p.length);
    });
    const un2 = listenStreak(user.uid, (s) => setStreak(s.current || 0));
    return () => {
      un1 && un1();
      un2 && un2();
    };
  }, [user]);

  if (pathname === "/login") return children;
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* top bar */}
      <header className="h-14 border-b border-line bg-panel flex items-center px-4 gap-4 sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
          className="w-8 h-8 flex flex-col items-center justify-center gap-[4px] rounded hover:bg-panel2"
        >
          <span className="w-4 h-[2px] bg-text" />
          <span className="w-4 h-[2px] bg-text" />
          <span className="w-4 h-[2px] bg-text" />
        </button>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.slice(1).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded text-sm ${
                pathname.startsWith(l.href) && l.href !== "/"
                  ? "bg-panel2 text-text"
                  : "text-muted hover:text-text"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="relative">
          <button
            onClick={() => setShowPatterns((v) => !v)}
            className="w-8 h-8 rounded-full bg-panel2 border border-line flex items-center justify-center text-xs font-mono hover:border-amber"
            title={`${patternCount} patterns added`}
          >
            {patternCount}
          </button>
          {showPatterns && (
            <div className="absolute top-10 left-0 w-72 max-h-80 overflow-y-auto bg-panel2 border border-line rounded-card shadow-xl p-2 z-40">
              <p className="text-xs text-muted px-2 pb-2">
                {patternCount} pattern{patternCount === 1 ? "" : "s"} added
              </p>
              {patterns.length === 0 && (
                <p className="text-xs text-muted px-2">Nothing yet.</p>
              )}
              {patterns.map((p) => (
                <div key={p.id} className="px-2 py-1.5 rounded hover:bg-panel text-sm">
                  <p className="text-text">{p.title}</p>
                  <p className="text-muted text-xs mono truncate">{p.pattern}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber" title="Current streak">
            <FireIcon />
            <span className="font-mono text-sm">{streak}</span>
          </div>
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-line" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-panel2 border border-line flex items-center justify-center text-xs">
              {(user.email || "?")[0].toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {streak > 0 && (
        <div className="bg-panel border-b border-line px-4 py-1 text-xs text-muted">
          Streak continues — {streak} day{streak === 1 ? "" : "s"} in a row
        </div>
      )}

      {/* sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-panel border-r border-line z-50 transform transition-transform duration-200 flex flex-col ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-line flex items-center justify-between">
          <span className="display font-semibold">DSA Tracker</span>
          <button onClick={() => setSidebarOpen(false)} className="text-muted hover:text-text">
            ✕
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {[
            { href: "/", label: "Dashboard" },
            { href: "/topics", label: "Topics" },
            { href: "/concepts", label: "Concepts" },
            { href: "/?focus=today-goal", label: "Today's goal" },
            { href: "/?focus=goals", label: "Goal" },
            { href: "/?focus=heatmap", label: "Heatmap" },
          ].map((l) => (
            <Link
              key={l.label}
              href={l.href}
              onClick={() => setSidebarOpen(false)}
              className="block px-3 py-2 rounded hover:bg-panel2 text-sm text-text"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-line flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full border border-line" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-panel2 border border-line flex items-center justify-center text-xs">
              {(user.email || "?")[0].toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm text-text truncate">{user.displayName || "You"}</p>
            <p className="text-xs text-muted truncate">{user.email}</p>
          </div>
          <button onClick={logout} className="text-xs text-muted hover:text-rose">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}

function FireIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2c1 3-2 4-2 7a4 4 0 108 0c0-1-.5-2-1-2 1 4-1 5-2 5-1.5 0-2-1.2-2-2.5 0-2.5 2-3.5 1-7.5-1 1-1.5 2.5-3 3-1.2.4-2 1.7-2 3 0 3.3 2.7 6 6 6s6-2.7 6-6c0-4-3-6-4-9-1 1-2 2-2 3z" />
    </svg>
  );
}
