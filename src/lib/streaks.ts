export type TaskType = "checkbox" | "numeric";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  daily_target: number;
  task_type: TaskType;
  unit: string;
  is_active: boolean;
  created_at: string;
}

export interface Completion {
  id: string;
  task_id: string;
  date: string;
  completed_value: number;
  is_completed: boolean;
}

export type DayStatus = "complete" | "partial" | "missed" | "empty" | "future";

export const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const todayKey = () => toKey(new Date());

export function requiredTasksFor(dateKey: string, tasks: Task[]) {
  return tasks.filter((t) => t.is_active && t.created_at.slice(0, 10) <= dateKey);
}

export function dayProgress(dateKey: string, tasks: Task[], completions: Completion[]) {
  const required = requiredTasksFor(dateKey, tasks);
  const byTask = new Map(completions.filter((c) => c.date === dateKey).map((c) => [c.task_id, c]));
  const done = required.filter((t) => byTask.get(t.id)?.is_completed).length;
  const percent = required.length ? Math.round((done / required.length) * 100) : 0;
  return { required, done, total: required.length, percent };
}

export function dayStatus(dateKey: string, tasks: Task[], completions: Completion[]): DayStatus {
  if (dateKey > todayKey()) return "future";
  const { total, done } = dayProgress(dateKey, tasks, completions);
  if (total === 0) return "empty";
  if (done === total) return "complete";
  if (done > 0) return "partial";
  return dateKey === todayKey() ? "empty" : "missed";
}

function shiftKey(dateKey: string, days: number) {
  const d = new Date(`${dateKey}T12:00:00`);
  d.setDate(d.getDate() + days);
  return toKey(d);
}

export function computeStreaks(tasks: Task[], completions: Completion[]) {
  const today = todayKey();
  const start = tasks.reduce<string>(
    (min, t) => (t.created_at.slice(0, 10) < min ? t.created_at.slice(0, 10) : min),
    today,
  );

  let current = 0;
  let cursor = today;
  if (dayStatus(today, tasks, completions) !== "complete") cursor = shiftKey(today, -1);
  while (cursor >= start && dayStatus(cursor, tasks, completions) === "complete") {
    current += 1;
    cursor = shiftKey(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let totalCompleteDays = 0;
  let trackedDays = 0;
  for (let d = start; d <= today; d = shiftKey(d, 1)) {
    const status = dayStatus(d, tasks, completions);
    if (status === "empty") continue;
    trackedDays += 1;
    if (status === "complete") {
      run += 1;
      totalCompleteDays += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  const totalCompletedTasks = completions.filter((c) => c.is_completed).length;
  const successRate = trackedDays ? Math.round((totalCompleteDays / trackedDays) * 100) : 0;
  const xp = totalCompletedTasks * 10 + totalCompleteDays * 25;

  return { current, longest, totalCompleteDays, trackedDays, successRate, totalCompletedTasks, xp };
}

/**
 * Every day up to and including today is editable, so any missed log can be
 * backfilled. Future days stay read-only — there is nothing to log yet.
 */
export function isEditableDay(dateKey: string) {
  return dateKey <= todayKey();
}

export interface TaskStreak {
  current: number;
  longest: number;
  totalDays: number;
}

export function taskStreak(task: Task, completions: Completion[]): TaskStreak {
  const today = todayKey();
  const start = task.created_at.slice(0, 10);
  const done = new Set(
    completions.filter((c) => c.task_id === task.id && c.is_completed).map((c) => c.date),
  );

  // A paused habit counts today as a miss, so its live streak is already broken.
  let current = 0;
  if (task.is_active) {
    let cursor = done.has(today) ? today : shiftKey(today, -1);
    while (cursor >= start && done.has(cursor)) {
      current += 1;
      cursor = shiftKey(cursor, -1);
    }
  }

  let longest = 0;
  let run = 0;
  for (let d = start; d <= today; d = shiftKey(d, 1)) {
    run = done.has(d) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  return { current, longest, totalDays: done.size };
}

export const LEVELS = [
  { name: "Beginner", min: 0 },
  { name: "Disciplined", min: 250 },
  { name: "Warrior", min: 1000 },
  { name: "Elite", min: 3000 },
  { name: "Legend", min: 8000 },
];

export function levelFor(xp: number) {
  let index = 0;
  LEVELS.forEach((l, i) => {
    if (xp >= l.min) index = i;
  });
  const currentLevel = LEVELS[index]!;
  const next = LEVELS[index + 1];
  const progress = next
    ? Math.round(((xp - currentLevel.min) / (next.min - currentLevel.min)) * 100)
    : 100;
  return { name: currentLevel.name, index, next: next?.name ?? null, nextAt: next?.min ?? null, progress };
}

export const BADGES = [
  { id: "first", label: "First Day", days: 1 },
  { id: "seven", label: "7 Day Streak", days: 7 },
  { id: "thirty", label: "30 Day Streak", days: 30 },
  { id: "hundred", label: "100 Day Streak", days: 100 },
  { id: "year", label: "365 Day Streak", days: 365 },
];

export const QUOTES = [
  "Discipline is choosing between what you want now and what you want most.",
  "Small daily improvements are the key to staggering long-term results.",
  "You do not rise to the level of your goals, you fall to the level of your systems.",
  "Consistency beats intensity, every single day.",
  "The streak is not the goal. The person you become is.",
  "Do it tired. Do it bored. Do it anyway.",
  "One day or day one — you decide.",
];

export function quoteOfTheDay() {
  const day = Math.floor(Date.now() / 86400000);
  return QUOTES[day % QUOTES.length]!;
}
