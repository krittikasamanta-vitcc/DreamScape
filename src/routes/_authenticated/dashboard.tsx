import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  BookOpen,
  Calendar as CalendarIcon,
  Flame,
  Image as ImageIcon,
  Plus,
  Repeat,
  Smile,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import {
  db,
  dateISO,
  levelFromXp,
  moodMeta,
  streaks,
  todayISO,
  xpProgress,
} from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — DreamScape" },
      {
        name: "description",
        content: "Your daily progress, goals, habits, mood and achievements at a glance.",
      },
      { property: "og:title", content: "Dashboard — DreamScape" },
      {
        property: "og:description",
        content: "Your daily progress, goals, habits, mood and achievements at a glance.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const uid = user?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", uid],
    enabled: !!uid,
    queryFn: async () => {
      const since = dateISO(new Date(Date.now() - 29 * 86400000));
      const [
        profile,
        goals,
        habits,
        logs,
        journal,
        moods,
        vision,
        events,
        notifs,
        achievements,
        userAchievements,
      ] = await Promise.all([
        db.from("profiles").select("*").eq("id", uid).maybeSingle(),
        db.from("goals").select("*").order("created_at", { ascending: false }),
        db.from("habits").select("*").eq("archived", false),
        db.from("habit_logs").select("*").gte("log_date", since),
        db
          .from("journal_entries")
          .select("*")
          .order("entry_date", { ascending: false })
          .limit(3),
        db.from("mood_logs").select("*").gte("log_date", since).order("log_date"),
        db.from("vision_items").select("*").order("created_at", { ascending: false }).limit(4),
        db
          .from("calendar_events")
          .select("*")
          .gte("event_date", todayISO())
          .order("event_date")
          .limit(5),
        db
          .from("notifications")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5),
        db.from("achievements").select("*"),
        db.from("user_achievements").select("*"),
      ]);
      return {
        profile: profile.data,
        goals: goals.data ?? [],
        habits: habits.data ?? [],
        logs: logs.data ?? [],
        journal: journal.data ?? [],
        moods: moods.data ?? [],
        vision: vision.data ?? [],
        events: events.data ?? [],
        notifs: notifs.data ?? [],
        achievements: achievements.data ?? [],
        userAchievements: userAchievements.data ?? [],
      };
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const today = todayISO();
  const activeGoals = data.goals.filter((g: any) => g.status === "active");
  const completedGoals = data.goals.filter((g: any) => g.status === "completed");
  const todaysLogs = data.logs.filter((l: any) => l.log_date === today);
  const habitPct = data.habits.length
    ? Math.round((todaysLogs.length / data.habits.length) * 100)
    : 0;
  const todaysMood = data.moods.find((m: any) => m.log_date === today);
  const { current: streak } = streaks(data.logs.map((l: any) => l.log_date));
  const xp = data.profile?.xp ?? 0;
  const prog = xpProgress(xp);

  const weekly = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const iso = dateISO(d);
    return {
      day: d.toLocaleDateString(undefined, { weekday: "short" }),
      habits: data.logs.filter((l: any) => l.log_date === iso).length,
      mood: data.moods.find((m: any) => m.log_date === iso)?.score ?? 0,
    };
  });

  const monthly = Array.from({ length: 4 }).map((_, i) => {
    const start = new Date();
    start.setDate(start.getDate() - (3 - i) * 7 - 6);
    const end = new Date();
    end.setDate(end.getDate() - (3 - i) * 7);
    const a = dateISO(start);
    const b = dateISO(end);
    return {
      week: `W${i + 1}`,
      completions: data.logs.filter((l: any) => l.log_date >= a && l.log_date <= b).length,
    };
  });

  const unlocked = data.userAchievements.length;

  const quick = [
    { to: "/goals", label: "New goal", icon: Target },
    { to: "/habits", label: "Track habit", icon: Repeat },
    { to: "/journal", label: "Write entry", icon: BookOpen },
    { to: "/mood", label: "Log mood", icon: Smile },
  ];

  return (
    <div className="space-y-6">
      <Card className="glass-card relative overflow-hidden border-0 p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full gradient-brand opacity-20 blur-3xl" />
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <p className="text-sm text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold sm:text-3xl">
              Welcome back,{" "}
              <span className="text-gradient">
                {data.profile?.full_name?.split(" ")[0] || "dreamer"}
              </span>
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              You have {activeGoals.length} active goal
              {activeGoals.length === 1 ? "" : "s"} and {data.habits.length} habit
              {data.habits.length === 1 ? "" : "s"} in motion today.
            </p>
          </div>
          <div className="min-w-[220px]">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Level {levelFromXp(xp)}</span>
              <span className="text-muted-foreground">
                {prog.into}/{prog.need} XP
              </span>
            </div>
            <Progress value={prog.pct} className="mt-2 h-2.5" />
            <div className="mt-3 flex flex-wrap gap-2">
              {quick.map((q) => (
                <Button key={q.to} size="sm" variant="secondary" asChild>
                  <Link to={q.to}>
                    <q.icon className="mr-1.5 size-3.5" />
                    {q.label}
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active goals"
          value={activeGoals.length}
          icon={Target}
          hint={`${completedGoals.length} completed`}
        />
        <StatCard
          label="Habits today"
          value={`${todaysLogs.length}/${data.habits.length}`}
          icon={Repeat}
          tone="blue"
          hint={`${habitPct}% complete`}
        />
        <StatCard
          label="Current streak"
          value={`${streak}d`}
          icon={Flame}
          tone="pink"
          hint="Consecutive tracked days"
        />
        <StatCard
          label="Achievements"
          value={`${unlocked}/${data.achievements.length}`}
          icon={Trophy}
          tone="success"
          hint={`${xp} XP earned`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card border-0 p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">Weekly progress</h2>
          <p className="text-xs text-muted-foreground">Habit completions & mood score</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weekly}>
                <defs>
                  <linearGradient id="gHabits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gMood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-pink)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--brand-pink)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <RTooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="habits"
                  stroke="var(--primary)"
                  fill="url(#gHabits)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="mood"
                  stroke="var(--brand-pink)"
                  fill="url(#gMood)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card border-0 p-5">
          <h2 className="font-display text-lg font-semibold">Monthly rhythm</h2>
          <p className="text-xs text-muted-foreground">Completions per week</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <RTooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    color: "var(--popover-foreground)",
                  }}
                />
                <Bar dataKey="completions" fill="var(--brand-blue)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card border-0 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Today's mood</h2>
            <Smile className="size-4 text-brand-pink" />
          </div>
          {todaysMood ? (
            <div className="mt-4 flex items-center gap-3">
              <span className="text-4xl">{moodMeta(todaysMood.mood)?.emoji}</span>
              <div>
                <p className="font-semibold">{moodMeta(todaysMood.mood)?.label}</p>
                <p className="text-xs text-muted-foreground">
                  {todaysMood.note || "No note added"}
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Not logged yet today.</p>
              <Button size="sm" className="mt-3" asChild>
                <Link to="/mood">Log mood</Link>
              </Button>
            </div>
          )}
        </Card>

        <Card className="glass-card border-0 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Upcoming</h2>
            <CalendarIcon className="size-4 text-brand-blue" />
          </div>
          <ul className="mt-3 space-y-2">
            {data.events.length === 0 && (
              <li className="text-sm text-muted-foreground">Nothing scheduled.</li>
            )}
            {data.events.map((e: any) => (
              <li key={e.id} className="flex items-center justify-between gap-2 text-sm">
                <span className="truncate">{e.title}</span>
                <Badge variant="secondary" className="shrink-0">
                  {new Date(e.event_date + "T00:00:00").toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </Badge>
              </li>
            ))}
          </ul>
          <Button size="sm" variant="ghost" className="mt-3 w-full" asChild>
            <Link to="/calendar">Open calendar</Link>
          </Button>
        </Card>

        <Card className="glass-card border-0 p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Recent activity</h2>
            <Sparkles className="size-4 text-primary" />
          </div>
          <ul className="mt-3 space-y-2.5">
            {data.notifs.length === 0 && (
              <li className="text-sm text-muted-foreground">No activity yet.</li>
            )}
            {data.notifs.map((n: any) => (
              <li key={n.id} className="text-sm">
                <p className="truncate font-medium">{n.title}</p>
                <p className="truncate text-xs text-muted-foreground">{n.body}</p>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card border-0 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Goal progress</h2>
            <Button size="sm" variant="ghost" asChild>
              <Link to="/goals">
                <Plus className="mr-1 size-3.5" /> Manage
              </Link>
            </Button>
          </div>
          <div className="space-y-4">
            {activeGoals.slice(0, 4).map((g: any) => (
              <div key={g.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="truncate font-medium">{g.title}</span>
                  <span className="text-muted-foreground">{g.progress}%</span>
                </div>
                <Progress value={g.progress} className="mt-1.5 h-2" />
              </div>
            ))}
            {activeGoals.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No active goals — create one to get started.
              </p>
            )}
          </div>
        </Card>

        <Card className="glass-card border-0 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">Journal & vision</h2>
            <ImageIcon className="size-4 text-brand-pink" />
          </div>
          <div className="space-y-3">
            {data.journal.map((j: any) => (
              <div key={j.id} className="rounded-xl border border-border/60 p-3">
                <p className="truncate text-sm font-medium">{j.title}</p>
                <p className="line-clamp-2 text-xs text-muted-foreground">{j.content}</p>
              </div>
            ))}
            {data.journal.length === 0 && (
              <p className="text-sm text-muted-foreground">No journal entries yet.</p>
            )}
            {data.vision.length > 0 && (
              <p className="pt-1 text-xs text-muted-foreground">
                {data.vision.length} vision item{data.vision.length === 1 ? "" : "s"} on your
                board
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
