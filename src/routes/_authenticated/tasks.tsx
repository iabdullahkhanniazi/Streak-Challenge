import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTracker } from "@/hooks/useTracker";
import type { Task, TaskType } from "@/lib/streaks";
import { StreakBadge } from "@/components/app/StreakBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/tasks")({
  head: () => ({
    meta: [
      { title: "Habits — Daily Streak Planner" },
      { name: "description", content: "Create, edit and organise the daily challenges that define your streak." },
      { property: "og:title", content: "Habits — Daily Streak Planner" },
      { property: "og:description", content: "Create and manage the daily challenges that define your streak." },
    ],
  }),
  component: TasksPage,
});

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(80),
  description: z.string().trim().max(200),
  daily_target: z.number().int().min(1).max(100000),
  unit: z.string().trim().max(20),
});

const PRESETS = [
  { title: "100 Pushups", daily_target: 100, task_type: "numeric" as TaskType, unit: "reps" },
  { title: "1000 Dhikr", daily_target: 1000, task_type: "numeric" as TaskType, unit: "times" },
  { title: "5 Daily Prayers", daily_target: 5, task_type: "numeric" as TaskType, unit: "prayers" },
  { title: "Read 2 Pages", daily_target: 2, task_type: "numeric" as TaskType, unit: "pages" },
  { title: "Drink 3L Water", daily_target: 3, task_type: "numeric" as TaskType, unit: "liters" },
  { title: "No Social Media", daily_target: 1, task_type: "checkbox" as TaskType, unit: "" },
];

function TasksPage() {
  const { user } = useAuth();
  const { tasks, taskStreaks, reload, loading } = useTracker(user?.id);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    daily_target: 1,
    task_type: "checkbox" as TaskType,
    unit: "",
  });

  function startCreate() {
    setEditing(null);
    setForm({ title: "", description: "", daily_target: 1, task_type: "checkbox", unit: "" });
    setOpen(true);
  }

  function startEdit(task: Task) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      daily_target: task.daily_target,
      task_type: task.task_type,
      unit: task.unit,
    });
    setOpen(true);
  }

  async function save() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]!.message);
      return;
    }
    const payload = { ...parsed.data, task_type: form.task_type };
    const { error } = editing
      ? await supabase.from("tasks").update(payload).eq("id", editing.id)
      : await supabase.from("tasks").insert({ ...payload, user_id: user!.id });
    if (error) {
      toast.error(error.message);
      return;
    }
    setOpen(false);
    await reload();
    toast.success(editing ? "Habit updated" : "Habit created");
  }

  async function toggleActive(task: Task) {
    await supabase.from("tasks").update({ is_active: !task.is_active }).eq("id", task.id);
    await reload();
  }

  async function remove(task: Task) {
    await supabase.from("tasks").delete().eq("id", task.id);
    await reload();
    toast.success("Habit deleted");
  }

  async function addPreset(preset: (typeof PRESETS)[number]) {
    await supabase.from("tasks").insert({ ...preset, description: "", user_id: user!.id });
    await reload();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Habits</h1>
          <p className="text-sm text-muted-foreground">Every active habit must be done daily.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={startCreate}>
              <Plus className="size-4" /> New habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editing ? "Edit habit" : "New habit"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={form.task_type}
                    onValueChange={(v) => setForm({ ...form, task_type: v as TaskType })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="checkbox">Checkbox</SelectItem>
                      <SelectItem value="numeric">Numeric progress</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Daily target</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.daily_target}
                    onChange={(e) => setForm({ ...form, daily_target: Number(e.target.value) })}
                    disabled={form.task_type === "checkbox"}
                  />
                </div>
              </div>
              {form.task_type === "numeric" ? (
                <div className="space-y-2">
                  <Label>Unit</Label>
                  <Input
                    placeholder="reps, pages, liters…"
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                  />
                </div>
              ) : null}
              <Button className="w-full" onClick={save}>
                {editing ? "Save changes" : "Create habit"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!loading && tasks.length === 0 ? (
        <div className="surface-panel p-5">
          <p className="mb-3 text-sm text-muted-foreground">Start with a popular challenge:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button key={p.title} variant="outline" size="sm" onClick={() => addPreset(p)}>
                <Plus className="size-3.5" /> {p.title}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        {tasks.map((task) => (
          <div key={task.id} className="surface-panel flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate font-medium">{task.title}</p>
                <StreakBadge streak={taskStreaks.get(task.id)} paused={!task.is_active} />
              </div>
              <p className="text-xs text-muted-foreground">
                {task.task_type === "numeric"
                  ? `Target ${task.daily_target} ${task.unit}`
                  : "Checkbox habit"}
                {task.description ? ` · ${task.description}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={task.is_active} onCheckedChange={() => toggleActive(task)} />
              <Button size="icon" variant="ghost" onClick={() => startEdit(task)}>
                <Pencil className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => remove(task)}>
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
