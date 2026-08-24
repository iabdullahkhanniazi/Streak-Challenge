import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Daily Streak Planner" },
      { name: "description", content: "Sign in or create an account to track your daily habits and keep your streak alive." },
      { property: "og:title", content: "Sign in — Daily Streak Planner" },
      { property: "og:description", content: "Sign in to track daily habits and keep your streak alive." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
  name: z.string().trim().max(60).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function signIn() {
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    navigate({ to: "/dashboard", replace: true });
  }

  async function signUp() {
    const parsed = schema.safeParse({ email, password, name });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password,
      options: { emailRedirectTo: window.location.origin, data: { name: parsed.data.name ?? "" } },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    if (data.session) { navigate({ to: "/dashboard", replace: true }); return; }
    toast.success("Check your email to confirm your account.");
  }

  async function google() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) { toast.error("Google sign-in failed."); return; }
    if (result.redirected) { return; }
    navigate({ to: "/dashboard", replace: true });
  }

  async function forgot() {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) { toast.error("Enter your email first."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <Flame className="size-7 text-primary animate-flame" />
          <span className="font-display text-xl font-semibold">Daily Streak Planner</span>
        </Link>

        <div className="surface-panel p-6">
          <Tabs defaultValue="signin">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="mt-5 space-y-4">
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Password" value={password} onChange={setPassword} type="password" />
              <Button className="w-full" disabled={busy} onClick={signIn}>
                Sign in
              </Button>
              <button onClick={forgot} className="w-full text-sm text-muted-foreground hover:text-foreground">
                Forgot password?
              </button>
            </TabsContent>

            <TabsContent value="signup" className="mt-5 space-y-4">
              <Field label="Name" value={name} onChange={setName} />
              <Field label="Email" value={email} onChange={setEmail} type="email" />
              <Field label="Password" value={password} onChange={setPassword} type="password" />
              <Button className="w-full" disabled={busy} onClick={signUp}>
                Create account
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={google}>
            Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
