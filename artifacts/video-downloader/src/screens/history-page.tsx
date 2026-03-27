"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Trash2,
  Download,
  ExternalLink,
  History as HistoryIcon,
  ArrowLeft,
  Film,
  Clock,
  Search,
} from "lucide-react";
import {
  type HistoryEntry,
  getHistory,
  clearHistory,
  removeHistoryById,
} from "@/lib/history-store";

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "from-yellow-500 via-pink-500 to-purple-500",
  facebook: "from-blue-600 to-blue-400",
  tiktok: "from-cyan-400 to-pink-500",
  youtube: "from-red-600 to-red-500",
  twitter: "from-sky-500 to-blue-600",
};

const PLATFORM_BADGE: Record<string, string> = {
  instagram: "bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600",
  facebook: "bg-blue-600",
  tiktok: "bg-gradient-to-r from-cyan-500 to-pink-500",
  youtube: "bg-red-600",
  twitter: "bg-sky-500",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

export default function HistoryPage() {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [search, setSearch] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const filtered = history.filter(
    (e) =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.platform.toLowerCase().includes(search.toLowerCase()) ||
      e.author.toLowerCase().includes(search.toLowerCase())
  );

  const handleClear = () => {
    if (confirmClear) {
      clearHistory();
      setHistory([]);
      setConfirmClear(false);
    } else {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
    }
  };

  const handleRemove = (id: string) => {
    setHistory(removeHistoryById(id));
  };

  const handleReDownload = (entry: HistoryEntry) => {
    router.push(`/?url=${encodeURIComponent(entry.url)}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 w-[32rem] h-[32rem] rounded-full bg-primary/12 blur-3xl" />
        <div className="absolute top-20 -right-24 w-[28rem] h-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/35 to-background/80" />
      </div>
      <header className="sticky top-0 z-50 w-full border-b border-[hsl(var(--chrome-border)/0.45)] bg-[hsl(var(--chrome-bg)/0.9)] backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="flex items-center gap-1.5 text-[hsl(var(--chrome-text)/0.82)] hover:text-[hsl(var(--chrome-text))] transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <span className="text-[hsl(var(--chrome-text)/0.35)]">|</span>
            <div className="flex items-center gap-2">
              <HistoryIcon className="w-5 h-5 text-primary" />
              <span className="font-bold text-lg text-[hsl(var(--chrome-text))]">Download History</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[hsl(var(--chrome-text)/0.75)] hidden sm:block">
              {history.length} {history.length === 1 ? "entry" : "entries"}
            </span>
            {history.length > 0 && (
              <button
                onClick={handleClear}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  confirmClear
                    ? "bg-destructive/20 text-destructive border border-destructive/30"
                    : "bg-[hsl(var(--chrome-text)/0.08)] hover:bg-[hsl(var(--chrome-text)/0.14)] text-[hsl(var(--chrome-text)/0.85)] hover:text-[hsl(var(--chrome-text))]"
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                {confirmClear ? "Confirm clear?" : "Clear all"}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {history.length > 0 && (
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/65 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search history…"
              className="w-full h-11 pl-11 pr-4 bg-black/30 border border-white/15 rounded-xl text-sm text-foreground placeholder:text-foreground/60 focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition"
            />
          </div>
        )}

        {history.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 text-center"
          >
            <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
              <Film className="w-10 h-10 text-muted-foreground/70" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">No downloads yet</h2>
            <p className="text-muted-foreground dark:text-foreground/85 text-sm max-w-xs">
              Your download history will appear here once you start saving videos.
            </p>
            <button
              onClick={() => router.push("/")}
              className="mt-8 px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition"
            >
              Start downloading
            </button>
          </motion.div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 text-muted-foreground dark:text-foreground/85"
          >
            <Search className="w-10 h-10 mx-auto mb-4 opacity-30" />
            <p>
              No results for "<span className="text-foreground/90">{search}</span>"
            </p>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-3">
              {filtered.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ delay: i * 0.04 }}
                  className="group relative flex gap-4 p-4 rounded-2xl bg-gradient-to-br from-black/28 to-black/18 border border-white/12 hover:from-black/34 hover:to-black/24 hover:border-white/20 transition-all duration-200"
                >
                  <div
                    className={`absolute -top-20 -left-20 w-40 h-40 opacity-0 group-hover:opacity-10 blur-3xl rounded-full transition-opacity duration-500 bg-gradient-to-br ${PLATFORM_COLORS[entry.platform] || "from-primary to-accent"}`}
                  />

                  <div className="relative shrink-0 w-24 h-16 sm:w-32 sm:h-20 rounded-xl overflow-hidden bg-black/30">
                    <img
                      src={entry.thumbnail}
                      alt={entry.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[10px] text-white/80">
                      <Clock className="w-2.5 h-2.5" />
                      {entry.duration}
                    </div>
                    <span
                      className={`absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase text-white ${PLATFORM_BADGE[entry.platform] || "bg-primary"}`}
                    >
                      {entry.platform}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground text-sm leading-snug line-clamp-2 mb-1">
                        {entry.title}
                      </h3>
                      <p className="text-xs text-muted-foreground dark:text-foreground/80 truncate">
                        {entry.author}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(entry.downloadedAt)}
                      </span>
                      {entry.downloadedQuality && (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          {entry.downloadedQuality}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 justify-center">
                    <button
                      onClick={() => handleReDownload(entry)}
                      title="Download again"
                      className="p-2 rounded-xl bg-black/25 hover:bg-primary/20 hover:text-primary text-foreground/80 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <a
                      href={entry.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Open original"
                      className="p-2 rounded-xl bg-black/25 hover:bg-black/35 text-foreground/80 hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleRemove(entry.id)}
                      title="Remove from history"
                      className="p-2 rounded-xl bg-black/25 hover:bg-destructive/20 hover:text-destructive text-foreground/80 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
}
