import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { computeStreaks, taskStreak, type Completion, type Task } from "@/lib/streaks";

export function useTracker(userId: string | undefined) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!userId) return;
    const [t, c, p] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: true }),
      supabase.from("task_completions").select("id, task_id, date, completed_value, is_completed"),
      supabase.from("profiles").select("name").eq("id", userId).maybeSingle(),
    ]);
    setTasks((t.data ?? []) as Task[]);
    setCompletions((c.data ?? []) as Completion[]);
    setProfileName(p.data?.name ?? "");
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => computeStreaks(tasks, completions), [tasks, completions]);

  const taskStreaks = useMemo(
    () => new Map(tasks.map((t) => [t.id, taskStreak(t, completions)])),
    [tasks, completions],
  );

  useEffect(() => {
    if (!userId || loading) return;
    void supabase.from("streaks").upsert(
      {
        user_id: userId,
        current_streak: stats.current,
        longest_streak: stats.longest,
        last_completed_date: null,
      },
      { onConflict: "user_id" },
    );
  }, [userId, loading, stats.current, stats.longest]);

  const setProgress = useCallback(
    async (task: Task, dateKey: string, value: number) => {
      if (!userId) return;
      const isCompleted = task.task_type === "checkbox" ? value > 0 : value >= task.daily_target;
      const { data, error } = await supabase
        .from("task_completions")
        .upsert(
          {
            user_id: userId,
            task_id: task.id,
            date: dateKey,
            completed_value: value,
            is_completed: isCompleted,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "task_id,date" },
        )
        .select("id, task_id, date, completed_value, is_completed")
        .single();
      if (error || !data) return;
      setCompletions((prev) => {
        const rest = prev.filter((c) => !(c.task_id === task.id && c.date === dateKey));
        return [...rest, data as Completion];
      });
    },
    [userId],
  );

  return {
    tasks,
    completions,
    stats,
    taskStreaks,
    loading,
    profileName,
    reload: load,
    setProgress,
  };
}
