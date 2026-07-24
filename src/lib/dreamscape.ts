import { supabase } from "@/integrations/supabase/client";

export type Priority = "low" | "medium" | "high";
export type GoalStatus = "active" | "completed" | "archived";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: GoalStatus;
  progress: number;
  deadline: string | null;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  goal_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string;
  frequency: "daily" | "weekly" | "monthly";
  color: string;
  archived: boolean;
  created_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  log_date: string;
}

export interface VisionItem {
  id: string;
  user_id: string;
  title: string;
  description: string;
  quote: string;
  category: string;
  image_path: string | null;
  created_at: string;
}

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  mood: string | null;
  entry_date: string;
  created_at: string;
  updated_at: string;
}

export interface MoodLog {
  id: string;
  user_id: string;
  mood: string;
  score: number;
  note: string;
  log_date: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  read: boolean;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string | null;
  type: string;
}

export interface Profile {
  id: string;
  full_name: string;
  bio: string;
  avatar_url: string | null;
  xp: number;
  level: number;
  suspended: boolean;
  created_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  target: number;
  metric: string;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export const db = supabase as any;

export const GOAL_CATEGORIES = [
  "Personal",
  "Career",
  "Health",
  "Finance",
  "Learning",
  "Relationships",
  "Travel",
  "Creativity",
];

export const VISION_CATEGORIES = [
  "Dream",
  "Travel",
  "Career",
  "Home",
  "Health",
  "Wealth",
  "Family",
  "Adventure",
];

export const JOURNAL_CATEGORIES = [
  "Daily",
  "Gratitude",
  "Reflection",
  "Ideas",
  "Dreams",
  "Work",
];

export const MOODS = [
  { key: "amazing", emoji: "🤩", label: "Amazing", score: 5 },
  { key: "happy", emoji: "😊", label: "Happy", score: 4 },
  { key: "neutral", emoji: "😐", label: "Neutral", score: 3 },
  { key: "sad", emoji: "😔", label: "Low", score: 2 },
  { key: "awful", emoji: "😩", label: "Awful", score: 1 },
];

export function moodMeta(key: string | null | undefined) {
  return MOODS.find((m) => m.key === key);
}

export function levelFromXp(xp: number) {
  return Math.floor(xp / 500) + 1;
}

export function xpProgress(xp: number) {
  const into = xp % 500;
  return { into, need: 500, pct: Math.round((into / 500) * 100) };
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function dateISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

/** Longest and current consecutive-day streak from a set of ISO dates. */
export function streaks(dates: string[]) {
  const set = new Set(dates);
  const sorted = [...set].sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const d of sorted) {
    const cur = new Date(d + "T00:00:00");
    if (prev && (cur.getTime() - prev.getTime()) / 86400000 === 1) run += 1;
    else run = 1;
    longest = Math.max(longest, run);
    prev = cur;
  }
  let current = 0;
  const cursor = new Date();
  if (!set.has(dateISO(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(dateISO(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, longest };
}

export async function signedUrl(path: string | null) {
  if (!path) return null;
  const { data } = await supabase.storage.from("media").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function awardXp(userId: string, amount: number) {
  const { data } = await db.from("profiles").select("xp").eq("id", userId).maybeSingle();
  const xp = (data?.xp ?? 0) + amount;
  await db.from("profiles").update({ xp, level: levelFromXp(xp) }).eq("id", userId);
}

export async function notify(
  userId: string,
  title: string,
  body: string,
  type = "info",
) {
  await db.from("notifications").insert({ user_id: userId, title, body, type });
}
