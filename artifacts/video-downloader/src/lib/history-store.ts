export interface HistoryEntry {
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  platform: string;
  author: string;
  duration: string;
  downloadedAt: string;
  downloadedQuality?: string;
}

const HISTORY_KEY = "vidsave_download_history";

export function getHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function addToHistory(entry: Omit<HistoryEntry, "id" | "downloadedAt">) {
  const history = getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    downloadedAt: new Date().toISOString(),
  };
  const updated = [newEntry, ...history].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return newEntry;
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

export function removeHistoryById(id: string) {
  const updated = getHistory().filter((e) => e.id !== id);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  return updated;
}
