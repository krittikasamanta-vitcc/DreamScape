import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, Flame, Target, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader, StatCard } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import { db, dateISO, streaks } from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — DreamScape" },
      {
        name: "description",
        content: "Weekly and monthly analytics on your goals, habits and mood so you can adjust fast.",
      },
      { property: "og:title", content: "Analytics — DreamScape" },
      {
        property: "og:description",
        content: "Weekly and monthly analytics on your goals, habits and mood.",
      },
    ],
  }),
  component: AnalyticsPage,
});

const PIE_COLORS = [
  "var(--primary)",
  "var(--brand-blue)",
  "var(--brand-pink)",
  "var(--success)",
  "var(--warning)",
  "#8B5CF6",
  "#06B6D4",
  "#F97316",
];

function AnalyticsPage() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["analytics", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = dateISO(new Date(Date.now() - 89 * 86400000));
      const [goals, habits, logs, moods, journal] = await Promise.all([
        db.from("goals").select("*"),
        db.from("habits").select("*").eq("archived", false),
        db.from("habit_logs").select("*").gte("log_date", since),
        db.from("mood_logs").select("*").gte("log_date", since),
        db.from("journal_entries").select("*").gte("entry_date", since),
      ]);
      return {
        goals: goals.data ?? [],
        habits: habits.data ?? [],
        logs: logs.data ?? [],
        moods: moods.data ?? [],
        journal: journal.data ?? [],
      };
    },
  });

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-card h-32 animate-pulse" />
        ))}
      </div>
    );
  }

  const completed = data.goals.filter((g: any) => g.status === "completed").length;
  const rate = data.goals.length ? Math.round((completed / data.goals.length) * 100) : 0;
  const s = streaks(data.logs.map((l: any) => l.log_date));

  const byCategory = Object.entries(
    data.goals.reduce((acc: Record<string, number>, g: any) => {
      acc[g.category] = (acc[g.category] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([name, value]) => ({ name, value: value as number }));

  const last12Weeks = Array.from({ length: 12 }).map((_, i) => {
    const end = new Date();
    end.setDate(end.getDate() - (11 - i) * 7);
    const start = new Date(end);
    start.setDate(start.getDate() - 6);
    const a = dateISO(start);
    const b = dateISO(end);
    const weekMoods = data.moods.filter((m: any) => m.log_date >= a && m.log_date <= b);
    return {
      week: `${end.getMonth() + 1}/${end.getDate()}`,
      habits: data.logs.filter((l: any) => l.log_date >= a && l.log_date <= b).length,
      journal: data.journal.filter((j: any) => j.entry_date >= a && j.entry_date <= b).length,
      mood: weekMoods.length
        ? +(weekMoods.reduce((t: number, m: any) => t + m.score, 0) / weekMoods.length).toFixed(1)
        : 0,
    };
  });

  const perHabit = data.habits.map((h: any) => ({
    name: h.name.length > 12 ? h.name.slice(0, 12) + "…" : h.name,
    completions: data.logs.filter((l: any) => l.habit_id === h.id).length,
    color: h.color,
  }));

  const tooltip = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--popover-foreground)",
  };

  return (
    <div>
      <PageHeader
        title="Analytics"
        description="The numbers behind your transformation."
        icon={BarChart3}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Goal completion"
          value={`${rate}%`}
          icon={Target}
          hint={`${completed} of ${data.goals.length}`}
        />
        <StatCard
          label="Habit check-ins"
          value={data.logs.length}
          icon={TrendingUp}
          tone="blue"
          hint="Last 90 days"
        />
        <StatCard
          label="Longest streak"
          value={`${s.longest}d`}
          icon={Flame}
          tone="pink"
          hint={`${s.current}d current`}
        />
        <StatCard
          label="Journal entries"
          value={data.journal.length}
          icon={BarChart3}
          tone="success"
          hint="Last 90 days"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="glass-card border-0 p-5 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold">12-week trend</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last12Weeks}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <RTooltip contentStyle={tooltip} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="habits"
                  stroke="var(--primary)"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="journal"
                  stroke="var(--brand-blue)"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="mood"
                  stroke="var(--brand-pink)"
                  strokeWidth={2.5}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="glass-card border-0 p-5">
          <h2 className="font-display text-lg font-semibold">Goals by category</h2>
          <div className="mt-4 h-72">
            {byCategory.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={byCategory}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                  >
                    {byCategory.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={tooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No goals yet
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="glass-card mt-4 border-0 p-5">
        <h2 className="font-display text-lg font-semibold">Completions per habit</h2>
        <div className="mt-4 h-72">
          {perHabit.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perHabit}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} />
                <RTooltip contentStyle={tooltip} />
                <Bar dataKey="completions" radius={[8, 8, 0, 0]}>
                  {perHabit.map((h: any, i: number) => (
                    <Cell key={i} fill={h.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              No habits yet
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
