import { createFileRoute, Link } from "@tanstack/react-router";
import { Flame, Trophy, CalendarCheck, Target, Quote } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTracker } from "@/hooks/useTracker";
import { StatCard } from "@/components/app/StatCard";
import { ProgressRing } from "@/components/app/ProgressRing";
import { StreakCalendar } from "@/components/app/StreakCalendar";
import { TaskCard } from "@/components/app/TaskCard";
import { Button } from "@/components/ui/button";
import { dayProgress, quoteOfTheDay, todayKey, levelFor } from "@/lib/streaks";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Today — Daily Streak Planner" },
      { name: "description", content: "Track today's habits, keep your streak alive and watch your consistency grow." },
      { property: "og:title", content: "Today — Daily Streak Planner" },
      { property: "og:description", content: "Track today's habits and keep your streak alive." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { user } = useAuth();
  const { tasks, completions, stats, taskStreaks, loading, setProgress, profileName } = useTracker(
    user?.id,
  );
  const today = todayKey();
  const progress = dayProgress(today, tasks, completions);
  const level = levelFor(stats.xp);

  if (loading) return <p className="py-16 text-center text-muted-foreground">Loading your streak…</p>;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h1 className="font-display text-3xl font-semibold">
          {profileName ? `Keep going, ${profileName}` : "Keep the fire burning"}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard icon={Flame} label="Current streak" value={`${stats.current}d`} accent hint={level.name} />
        <StatCard icon={Trophy} label="Longest streak" value={`${stats.longest}d`} />
        <StatCard icon={CalendarCheck} label="Completed days" value={stats.totalCompleteDays} />
        <StatCard icon={Target} label="Active habits" value={tasks.filter((t) => t.is_active).length} />
        <StatCard icon={CalendarCheck} label="Success rate" value={`${stats.successRate}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <div className="surface-panel p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Today's habits</h2>
              <Button asChild size="sm" variant="outline">
                <Link to="/tasks">Manage</Link>
              </Button>
            </div>
            {progress.required.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No active habits yet.{" "}
                <Link to="/tasks" className="text-primary underline">
                  Create your first challenge
                </Link>
                .
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                {progress.required.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    completion={completions.find((c) => c.task_id === task.id && c.date === today)}
                    streak={taskStreaks.get(task.id)}
                    onChange={(value) => setProgress(task, today, value)}
                  />
                ))}
              </div>
            )}
          </div>

          <StreakCalendar tasks={tasks} completions={completions} onSetProgress={setProgress} />
        </div>

        <div className="space-y-6">
          <div className="surface-panel flex flex-col items-center p-6">
            <div className="relative">
              <ProgressRing percent={progress.percent} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display text-3xl font-semibold">{progress.percent}%</span>
                <span className="text-xs text-muted-foreground">
                  {progress.done}/{progress.total} done
                </span>
              </div>
            </div>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {progress.total > 0 && progress.done === progress.total
                ? "Day complete. Streak secured."
                : "Finish every habit before midnight to keep the streak."}
            </p>
          </div>

          <div className="surface-panel p-5">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Quote className="size-4" /> Daily fuel
            </div>
            <p className="mt-3 font-display text-lg leading-snug">{quoteOfTheDay()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
