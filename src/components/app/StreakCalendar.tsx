import { useState } from "react";
import { Check, ChevronLeft, ChevronRight, Lock, X } from "lucide-react";
import {
  dayProgress,
  dayStatus,
  isEditableDay,
  toKey,
  todayKey,
  type Completion,
  type Task,
} from "@/lib/streaks";
import { Button } from "@/components/ui/button";
import { TaskRow } from "@/components/app/TaskRow";

const STATUS_CLASS: Record<string, string> = {
  complete: "bg-success text-success-foreground",
  partial: "bg-warning text-warning-foreground",
  missed: "bg-destructive text-destructive-foreground",
  empty: "bg-muted text-muted-foreground",
  future: "bg-muted/40 text-muted-foreground/60",
};

export function StreakCalendar({
  tasks,
  completions,
  onSetProgress,
}: {
  tasks: Task[];
  completions: Completion[];
  onSetProgress?: (task: Task, dateKey: string, value: number) => void;
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = first.getDay();

  const detail = selected ? dayProgress(selected, tasks, completions) : null;

  function goToMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1));
    setSelected(null); // a day from the month you just left shouldn't stay pinned open
  }

  return (
    <div className="surface-panel p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">
          {first.toLocaleString("en-US", { month: "long", year: "numeric" })}
        </h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Previous month"
            onClick={() => goToMonth(-1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Next month" onClick={() => goToMonth(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-muted-foreground">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={`${d}-${i}`} className="pb-1">
            {d}
          </div>
        ))}
        {Array.from({ length: leading }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const key = toKey(new Date(year, month, i + 1));
          const status = dayStatus(key, tasks, completions);
          const isToday = key === todayKey();
          // One ring at a time — selection outranks the today marker, which
          // keeps its bold number either way.
          const ring =
            selected === key
              ? "ring-2 ring-ring ring-offset-1 ring-offset-background"
              : isToday
                ? "ring-2 ring-primary"
                : "";
          return (
            <button
              key={key}
              onClick={() => setSelected((prev) => (prev === key ? null : key))}
              aria-label={isToday ? `${key} (today)` : key}
              aria-current={isToday ? "date" : undefined}
              className={`aspect-square rounded-md text-xs transition-transform hover:scale-105 ${STATUS_CLASS[status]} ${isToday ? "font-bold" : "font-medium"} ${ring}`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
        <Legend className="bg-success" label="All done" />
        <Legend className="bg-warning" label="Partial" />
        <Legend className="bg-destructive" label="Broken" />
        <Legend className="bg-muted" label="No data / future" />
      </div>

      {selected && detail ? (
        <div className="mt-4 rounded-lg border border-border p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium">
              {new Date(`${selected}T12:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {detail.total === 0
                  ? "No habits"
                  : `${detail.done}/${detail.total} · ${detail.percent}%`}
              </span>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close day details"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {detail.total === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No habits were active on this day.</p>
          ) : isEditableDay(selected) && onSetProgress ? (
            <div className="mt-3 space-y-2">
              {detail.required.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  completion={completions.find((c) => c.task_id === task.id && c.date === selected)}
                  onChange={(value) => onSetProgress(task, selected, value)}
                />
              ))}
            </div>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {detail.required.map((task) => {
                const entry = completions.find((c) => c.task_id === task.id && c.date === selected);
                const done = entry?.is_completed ?? false;
                return (
                  <li key={task.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      {done ? (
                        <Check className="size-3.5 shrink-0 text-success" />
                      ) : (
                        <X className="size-3.5 shrink-0 text-destructive" />
                      )}
                      <span className="truncate">{task.title}</span>
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {task.task_type === "numeric"
                        ? `${entry?.completed_value ?? 0}/${task.daily_target} ${task.unit}`
                        : done
                          ? "Done"
                          : "Missed"}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}

          {!isEditableDay(selected) ? (
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Lock className="size-3 shrink-0" />
              Future date — nothing to log yet.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`size-3 rounded ${className}`} />
      {label}
    </span>
  );
}
