import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PageHeader, StatCard } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import { MOODS, awardXp, db, dateISO, moodMeta, todayISO, type MoodLog } from "@/lib/dreamscape";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/mood")({
  head: () => ({
    meta: [
      { title: "Mood Tracker — DreamScape" },
      {
        name: "description",
        content: "Log how you feel each day and discover the emotional patterns behind your progress.",
      },
      { property: "og:title", content: "Mood Tracker — DreamScape" },
      {
        property: "og:description",
        content: "Log how you feel each day and discover your emotional patterns.",
      },
    ],
  }),
  component: MoodPage,
});

function MoodPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selected, setSelected] = useState("happy");
  const [note, setNote] = useState("");

  const { data } = useQuery({
    queryKey: ["moods", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = dateISO(new Date(Date.now() - 59 * 86400000));
      const { data } = await db
        .from("mood_logs")
        .select("*")
        .gte("log_date", since)
        .order("log_date");
      return (data ?? []) as MoodLog[];
    },
  });

  const logs = data ?? [];
  const today = todayISO();
  const todays = logs.find((l) => l.log_date === today);

  const save = async () => {
    const meta = MOODS.find((m) => m.key === selected)!;
    const payload = {
      user_id: user!.id,
      mood: meta.key,
      score: meta.score,
      note: note.trim().slice(0, 500),
      log_date: today,
    };
    if (todays) {
      await db.from("mood_logs").update(payload).eq("id", todays.id);
      toast.success("Mood updated");
    } else {
      const { error } = await db.from("mood_logs").insert(payload);
      if (error) return toast.error(error.message);
      await awardXp(user!.id, 10);
      toast.success("Mood logged (+10 XP)");
    }
    setNote("");
    qc.invalidateQueries({ queryKey: ["moods"] });
  };

  const chart = Array.from({ length: 30 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    const iso = dateISO(d);
    return {
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: logs.find((l) => l.log_date === iso)?.score ?? null,
    };
  });

  const scored = logs.filter((l) => l.score > 0);
  const avg = scored.length
    ? (scored.reduce((s, l) => s + l.score, 0) / scored.length).toFixed(1)
    : "—";
  const best = MOODS.find(
    (m) =>
      m.key ===
      Object.entries(
        logs.reduce<Record<string, number>>((acc, l) => {
          acc[l.mood] = (acc[l.mood] ?? 0) + 1;
          return acc;
        }, {}),
      ).sort((a, b) => b[1] - a[1])[0]?.[0],
  );

  return (
    <div>
      <PageHeader
        title="Mood Tracker"
        description="Awareness is the first step to change."
        icon={Smile}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Today"
          value={todays ? `${moodMeta(todays.mood)?.emoji}` : "—"}
          icon={Smile}
          hint={todays ? moodMeta(todays.mood)?.label : "Not logged"}
        />
        <StatCard label="30-day average" value={avg} icon={Smile} tone="blue" hint="out of 5" />
        <StatCard
          label="Most frequent"
          value={best ? best.emoji : "—"}
          icon={Smile}
          tone="pink"
          hint={best?.label ?? "No data"}
        />
      </div>

      <Card className="glass-card mb-6 border-0 p-6">
        <h2 className="font-display text-lg font-semibold">How are you feeling today?</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {MOODS.map((m) => (
            <button
              key={m.key}
              onClick={() => setSelected(m.key)}
              className={cn(
                "flex w-24 flex-col items-center gap-1.5 rounded-2xl border p-4 transition-smooth hover:-translate-y-1",
                selected === m.key
                  ? "border-primary bg-primary/10 shadow-glow"
                  : "border-border/60",
              )}
            >
              <span className="text-3xl">{m.emoji}</span>
              <span className="text-xs font-medium">{m.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-5 space-y-2">
          <Label htmlFor="m-note">Note (optional)</Label>
          <Textarea
            id="m-note"
            rows={3}
            maxLength={500}
            placeholder="What's shaping your mood today?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <Button className="mt-4 w-fit" onClick={save}>
          {todays ? "Update today's mood" : "Log mood"}
        </Button>
      </Card>

      <Card className="glass-card border-0 p-5">
        <h2 className="font-display text-lg font-semibold">Last 30 days</h2>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={11} interval={4} />
              <YAxis domain={[0, 5]} stroke="var(--muted-foreground)" fontSize={12} />
              <RTooltip
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  color: "var(--popover-foreground)",
                }}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="var(--brand-pink)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
