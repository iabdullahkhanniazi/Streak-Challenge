import { Flame } from "lucide-react";
import type { TaskStreak } from "@/lib/streaks";

export function StreakBadge({
  streak,
  paused,
}: {
  streak?: TaskStreak | undefined;
  paused?: boolean;
}) {
  if (!streak) return null;

  if (streak.current === 0) {
    // Nothing live to show, but a past best is still worth surfacing.
    if (streak.longest === 0) return null;
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground"
        title={`${paused ? "Paused — streak broken" : "Streak broken"}. Best ever: ${streak.longest} days`}
      >
        <Flame className="size-3" />
        {paused ? "Paused" : "0d"} · best {streak.longest}d
      </span>
    );
  }

  return (
    <span
      className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-foreground"
      title={`${streak.current} day streak · best ever ${streak.longest} days · ${streak.totalDays} days completed`}
    >
      <Flame className="size-3 text-primary" />
      {streak.current}d
    </span>
  );
}
