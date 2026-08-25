import * as SecureStore from "expo-secure-store";

const KEY = "watch_progress_v1";
const MAX_ENTRIES = 10;
// A story counts as "finished" past this point, so it drops off Continue
// Watching instead of lingering there forever with a full progress bar.
const COMPLETE_THRESHOLD = 0.95;

export type WatchProgressEntry = {
  videoId: string;
  position: number;
  duration: number;
  updatedAt: number;
};

type ProgressMap = Record<string, WatchProgressEntry>;

// SecureStore caps a value at 2048 bytes (see lib/supabase.ts), so this
// keeps only the most recently-watched handful of videos rather than an
// unbounded history — plenty for a "continue watching" row.
async function readAll(): Promise<ProgressMap> {
  const raw = await SecureStore.getItemAsync(KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

async function writeAll(map: ProgressMap): Promise<void> {
  const trimmed = Object.values(map)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_ENTRIES);
  const next: ProgressMap = {};
  for (const entry of trimmed) next[entry.videoId] = entry;
  await SecureStore.setItemAsync(KEY, JSON.stringify(next));
}

export async function getWatchProgress(videoId: string): Promise<WatchProgressEntry | null> {
  const all = await readAll();
  return all[videoId] ?? null;
}

export async function saveWatchProgress(videoId: string, position: number, duration: number): Promise<void> {
  if (!duration || position <= 0) return;
  const all = await readAll();
  if (position / duration >= COMPLETE_THRESHOLD) {
    delete all[videoId];
  } else {
    all[videoId] = { videoId, position, duration, updatedAt: Date.now() };
  }
  await writeAll(all);
}

export async function clearWatchProgress(videoId: string): Promise<void> {
  const all = await readAll();
  delete all[videoId];
  await writeAll(all);
}

export async function getRecentWatchProgress(): Promise<WatchProgressEntry[]> {
  const all = await readAll();
  return Object.values(all).sort((a, b) => b.updatedAt - a.updatedAt);
}
