import { Check, Flame, Minus, Plus } from "lucide-react";
import type { Completion, Task, TaskStreak } from "@/lib/streaks";
import { ProgressRing } from "@/components/app/ProgressRing";
import { Button } from "@/components/ui/button";

export function TaskCard({
  task,
  completion,
  streak,
  onChange,
}: {
  task: Task;
  completion?: Completion | undefined;
  streak?: TaskStreak | undefined;
  onChange: (value: number) => void;
}) {
  const value = completion?.completed_value ?? 0;
  const done = completion?.is_completed ?? false;
  const isNumeric = task.task_type === "numeric";
  const percent = isNumeric
    ? Math.min(100, Math.round((value / Math.max(1, task.daily_target)) * 100))
    : done
      ? 100
      : 0;
  const step = Math.max(1, Math.round(task.daily_target / 10));

  return (
    <div
      className={`relative flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition-colors ${
        done ? "border-success/40 bg-success/5" : "border-border bg-card"
      }`}
    >
      {/* Corner badge instead of its own row — keeps the card to four lines. */}
      {streak && streak.current > 0 ? (
        <span
          className="absolute right-1.5 top-1.5 flex items-center gap-0.5 text-[10px] font-medium text-primary"
          title={`${streak.current} day streak · best ever ${streak.longest} days`}
        >
          <Flame className="size-2.5" />
          {streak.current}
        </span>
      ) : null}

      <button
        onClick={() => onChange(done ? 0 : isNumeric ? task.daily_target : 1)}
        aria-label={done ? `Reset ${task.title}` : `Complete ${task.title}`}
        className="relative rounded-full transition-transform hover:scale-105"
      >
        <ProgressRing percent={percent} size={56} stroke={5} />
        <span className="absolute inset-0 flex items-center justify-center">
          {done ? (
            <Check className="size-5 text-success" />
          ) : (
            <span className="text-xs font-semibold">{percent}%</span>
          )}
        </span>
      </button>

      <div className="w-full min-w-0">
        <p className="truncate text-xs font-medium" title={task.title}>
          {task.title}
        </p>
        <p className="truncate text-[10px] text-muted-foreground">
          {isNumeric
            ? `${value}/${task.daily_target} ${task.unit}`.trim()
            : done
              ? "Done"
              : "Not yet"}
        </p>
      </div>

      {isNumeric ? (
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="outline"
            className="size-6"
            aria-label={`Decrease ${task.title}`}
            onClick={() => onChange(Math.max(0, value - step))}
          >
            <Minus className="size-3" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="size-6"
            aria-label={`Increase ${task.title}`}
            onClick={() => onChange(value + step)}
          >
            <Plus className="size-3" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
