import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useTracker } from "@/hooks/useTracker";
import { levelFor } from "@/lib/streaks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — Daily Streak Planner" },
      { name: "description", content: "Manage your display name, level progress and daily reminder notifications." },
      { property: "og:title", content: "Profile — Daily Streak Planner" },
      { property: "og:description", content: "Manage your name, level progress and reminders." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const { stats, profileName, reload } = useTracker(user?.id);
  const [name, setName] = useState("");
  const level = levelFor(stats.xp);

  useEffect(() => setName(profileName), [profileName]);

  async function save() {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({ name: name.trim().slice(0, 60) }).eq("id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await reload();
    toast.success("Profile updated");
  }

  async function enableReminders() {
    if (!("Notification" in window)) {
      toast.error("Notifications are not supported on this device.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      toast.error("Notification permission denied.");
      return;
    }
    window.localStorage.setItem("dsp-reminders", "on");
    new Notification("Daily Streak Planner", { body: "Reminders enabled. Don't break the chain!" });
    toast.success("Daily reminders enabled");
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-semibold">Profile</h1>

      <div className="surface-panel space-y-4 p-5">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-full bg-ember">
            <Flame className="size-7 text-primary-foreground" />
          </div>
          <div>
            <p className="font-display text-xl font-semibold">{profileName || "Streak builder"}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{level.name}</span>
            <span className="text-muted-foreground">
              {stats.xp} XP{level.nextAt ? ` · ${level.nextAt} XP to ${level.next}` : ""}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-ember" style={{ width: `${level.progress}%` }} />
          </div>
        </div>
      </div>

      <div className="surface-panel space-y-4 p-5">
        <div className="space-y-2">
          <Label>Display name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        </div>
        <Button onClick={save}>Save changes</Button>
      </div>

      <div className="surface-panel flex items-center justify-between p-5">
        <div>
          <p className="font-medium">Daily reminders</p>
          <p className="text-sm text-muted-foreground">Get nudged before the day ends.</p>
        </div>
        <Button variant="outline" onClick={enableReminders}>
          <Bell className="size-4" /> Enable
        </Button>
      </div>
    </div>
  );
}
