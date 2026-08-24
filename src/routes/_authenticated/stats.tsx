import { createFileRoute } from "@tanstack/react-router";
import { Award, Flame, Target, TrendingUp, Trophy } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { useTracker } from "@/hooks/useTracker";
import { StatCard } from "@/components/app/StatCard";
import { BADGES, dayProgress, toKey, todayKey } from "@/lib/streaks";

export const Route = createFileRoute("/_authenticated/stats")({
  head: () => ({
    meta: [
      { title: "Statistics — Daily Streak Planner" },
      { name: "description", content: "See your success rate, consistency graph, monthly performance and unlocked badges." },
      { property: "og:title", content: "Statistics — Daily Streak Planner" },
      { property: "og:description", content: "Success rate, consistency graph and unlocked badges." },
    ],
  }),
  component: StatsPage,
});

function StatsPage() {
  const { user } = useAuth();
  const { tasks, completions, stats, loading } = useTracker(user?.id);

  if (loading) return <p className="py-16 text-center text-muted-foreground">Loading stats…</p>;

  const series = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const key = toKey(d);
    return { day: key.slice(5), percent: dayProgress(key, tasks, completions).percent };
  });

  const monthKey = todayKey().slice(0, 7);
  const yearKey = todayKey().slice(0, 4);
  const monthDone = completions.filter((c) => c.is_completed && c.date.startsWith(monthKey)).length;
  const yearDone = completions.filter((c) => c.is_completed && c.date.startsWith(yearKey)).length;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Statistics</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Flame} label="Current streak" value={`${stats.current}d`} accent />
        <StatCard icon={Trophy} label="Longest streak" value={`${stats.longest}d`} />
        <StatCard icon={Target} label="Tasks completed" value={stats.totalCompletedTasks} />
        <StatCard icon={TrendingUp} label="Success rate" value={`${stats.successRate}%`} />
      </div>

      <div className="surface-panel p-4">
        <h2 className="mb-4 font-display text-lg font-semibold">Consistency — last 30 days</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series}>
              <defs>
                <linearGradient id="ember" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
              <Tooltip
                contentStyle={{
                  background: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 12,
                  color: "var(--color-foreground)",
                }}
              />
              <Area
                type="monotone"
                dataKey="percent"
                stroke="var(--color-primary)"
                fill="url(#ember)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard icon={TrendingUp} label="This month" value={`${monthDone} tasks`} />
        <StatCard icon={TrendingUp} label="This year" value={`${yearDone} tasks`} />
      </div>

      <div className="surface-panel p-4">
        <h2 className="mb-4 font-display text-lg font-semibold">Achievements</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {BADGES.map((badge) => {
            const unlocked = stats.longest >= badge.days;
            return (
              <div
                key={badge.id}
                className={`rounded-xl border p-4 text-center ${unlocked ? "border-primary bg-accent" : "border-border opacity-60"}`}
              >
                <Award className={`mx-auto size-6 ${unlocked ? "text-primary" : "text-muted-foreground"}`} />
                <p className="mt-2 text-sm font-medium">{badge.label}</p>
                <p className="text-xs text-muted-foreground">{unlocked ? "Unlocked" : `${badge.days} days`}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
