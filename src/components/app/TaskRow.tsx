import { Check, Minus, Plus } from "lucide-react";
import type { Completion, Task, TaskStreak } from "@/lib/streaks";
import { Button } from "@/components/ui/button";
import { StreakBadge } from "@/components/app/StreakBadge";

export function TaskRow({
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

  if (task.task_type === "checkbox") {
    return (
      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
        <div>
          <div className="flex items-center gap-2">
            <p className={`font-medium ${done ? "text-muted-foreground line-through" : ""}`}>
              {task.title}
            </p>
            <StreakBadge streak={streak} paused={!task.is_active} />
          </div>
          {task.description ? (
            <p className="text-xs text-muted-foreground">{task.description}</p>
          ) : null}
        </div>
        <Button
          size="icon"
          variant={done ? "default" : "outline"}
          aria-label={done ? "Mark incomplete" : "Mark complete"}
          onClick={() => onChange(done ? 0 : 1)}
        >
          <Check className="size-4" />
        </Button>
      </div>
    );
  }

  const step = Math.max(1, Math.round(task.daily_target / 10));
  const percent = Math.min(100, Math.round((value / Math.max(1, task.daily_target)) * 100));

  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className={`truncate font-medium ${done ? "text-success" : ""}`}>{task.title}</p>
            <StreakBadge streak={streak} paused={!task.is_active} />
          </div>
          <p className="text-xs text-muted-foreground">
            {value} / {task.daily_target} {task.unit}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="outline" onClick={() => onChange(Math.max(0, value - step))}>
            <Minus className="size-4" />
          </Button>
          <Button size="icon" variant="outline" onClick={() => onChange(value + step)}>
            <Plus className="size-4" />
          </Button>
          <Button size="icon" variant={done ? "default" : "secondary"} onClick={() => onChange(task.daily_target)}>
            <Check className="size-4" />
          </Button>
        </div>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${done ? "bg-success" : "bg-ember"}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
