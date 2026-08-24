import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Flame, CalendarCheck, BarChart3, Trophy, Target, Bell } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-streak.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Daily Streak Planner — Build Discipline One Day at a Time" },
      {
        name: "description",
        content:
          "Track daily habits and challenges, keep your streak alive, and turn consistency into discipline with progress rings, calendars and badges.",
      },
      { property: "og:title", content: "Daily Streak Planner — Build Discipline One Day at a Time" },
      {
        property: "og:description",
        content: "Track daily habits, keep your streak alive and turn consistency into discipline.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Target, title: "Checkbox & numeric habits", body: "100 pushups, 1000 dhikr, 3L water — track targets or simple yes/no wins." },
  { icon: Flame, title: "Unforgiving streaks", body: "Every active habit must be done before midnight. Miss one, the chain resets." },
  { icon: CalendarCheck, title: "Calendar tracking", body: "Green for perfect days, yellow for partial, red for broken. Tap any day for details." },
  { icon: BarChart3, title: "Deep statistics", body: "Success rate, consistency graph, monthly and yearly performance." },
  { icon: Trophy, title: "Badges & levels", body: "Earn XP and climb from Beginner to Legend as your streak grows." },
  { icon: Bell, title: "Reminders", body: "Get nudged before the day ends so the streak never dies quietly." },
];

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Flame className="size-6 text-primary animate-flame" />
          <span className="font-display text-lg font-semibold">Daily Streak</span>
        </div>
        <Button asChild size="sm">
          <Link to="/auth">Sign in</Link>
        </Button>
      </header>

      <section className="relative overflow-hidden">
        <img
          src={heroImage}
          alt="Glowing ember habit grid representing a daily streak"
          width={1600}
          height={1008}
          className="absolute inset-0 size-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/80 to-background" />
        <div className="relative mx-auto max-w-3xl px-4 py-24 text-center md:py-32">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Discipline engine</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight md:text-6xl">
            Don't break <span className="text-ember">the chain</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg">
            Daily Streak Planner turns your challenges into a single non-negotiable daily scorecard.
            Complete every habit before midnight, or start from zero.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Start your streak</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/auth">I already have an account</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-panel p-5">
              <Icon className="size-5 text-primary" />
              <h2 className="mt-3 font-display text-lg font-semibold">{title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        Built for people who keep their word to themselves.
      </footer>
    </div>
  );
}
