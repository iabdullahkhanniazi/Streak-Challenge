import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — Daily Streak Planner" },
      { name: "description", content: "Choose a new password for your Daily Streak Planner account." },
      { property: "og:title", content: "Reset password — Daily Streak Planner" },
      { property: "og:description", content: "Choose a new password for your account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated.");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="surface-panel w-full max-w-md space-y-4 p-6">
        <h1 className="font-display text-2xl font-semibold">Set a new password</h1>
        <div className="space-y-2">
          <Label>New password</Label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button className="w-full" disabled={busy} onClick={save}>
          Update password
        </Button>
      </div>
    </div>
  );
}
