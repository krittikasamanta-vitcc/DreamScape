import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, Flame, Plus, Repeat, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState, PageHeader, SkeletonGrid, StatCard } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import {
  awardXp,
  db,
  dateISO,
  streaks,
  todayISO,
  type Habit,
  type HabitLog,
} from "@/lib/dreamscape";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/habits")({
  head: () => ({
    meta: [
      { title: "Habits — DreamScape" },
      {
        name: "description",
        content: "Build daily habits, keep streaks alive and visualise consistency heatmaps.",
      },
      { property: "og:title", content: "Habits — DreamScape" },
      {
        property: "og:description",
        content: "Build daily habits, keep streaks alive and visualise consistency.",
      },
    ],
  }),
  component: HabitsPage,
});

const COLORS = ["#7C3AED", "#2563EB", "#EC4899", "#10B981", "#F59E0B", "#EF4444"];

function HabitsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    frequency: "daily",
    color: COLORS[0],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["habits", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const since = dateISO(new Date(Date.now() - 83 * 86400000));
      const [h, l] = await Promise.all([
        db.from("habits").select("*").eq("archived", false).order("created_at"),
        db.from("habit_logs").select("*").gte("log_date", since),
      ]);
      return { habits: (h.data ?? []) as Habit[], logs: (l.data ?? []) as HabitLog[] };
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["habits"] });

  const create = useMutation({
    mutationFn: async () => {
      if (form.name.trim().length < 2) throw new Error("Habit name is required");
      const { error } = await db.from("habits").insert({
        user_id: user!.id,
        name: form.name.trim().slice(0, 80),
        description: form.description.trim().slice(0, 400),
        frequency: form.frequency,
        color: form.color,
      });
      if (error) throw error;
      await awardXp(user!.id, 15);
    },
    onSuccess: () => {
      toast.success("Habit created (+15 XP)");
      setOpen(false);
      setForm({ name: "", description: "", frequency: "daily", color: COLORS[0] });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggle = async (habit: Habit, iso: string) => {
    const existing = (data?.logs ?? []).find(
      (l) => l.habit_id === habit.id && l.log_date === iso,
    );
    if (existing) {
      await db.from("habit_logs").delete().eq("id", existing.id);
    } else {
      const { error } = await db
        .from("habit_logs")
        .insert({ habit_id: habit.id, user_id: user!.id, log_date: iso });
      if (error) return toast.error(error.message);
      await awardXp(user!.id, 10);
      toast.success("Nice! +10 XP");
    }
    refresh();
  };

  const remove = async (habit: Habit) => {
    await db.from("habits").update({ archived: true }).eq("id", habit.id);
    toast.success("Habit archived");
    refresh();
  };

  const today = todayISO();
  const habits = data?.habits ?? [];
  const logs = data?.logs ?? [];
  const doneToday = habits.filter((h) =>
    logs.some((l) => l.habit_id === h.id && l.log_date === today),
  ).length;
  const overall = streaks(logs.map((l) => l.log_date));

  const days = Array.from({ length: 84 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    return dateISO(d);
  });

  return (
    <div>
      <PageHeader
        title="Habits"
        description="Small daily actions, compounding into transformation."
        icon={Repeat}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" /> New habit
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Completed today"
          value={`${doneToday}/${habits.length}`}
          icon={Check}
        />
        <StatCard
          label="Current streak"
          value={`${overall.current}d`}
          icon={Flame}
          tone="pink"
        />
        <StatCard
          label="Longest streak"
          value={`${overall.longest}d`}
          icon={Flame}
          tone="blue"
        />
      </div>

      {isLoading ? (
        <SkeletonGrid count={3} />
      ) : habits.length === 0 ? (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Start with one small habit you can do today."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Add habit
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {habits.map((h) => {
            const hLogs = logs.filter((l) => l.habit_id === h.id).map((l) => l.log_date);
            const s = streaks(hLogs);
            const doneTodayHabit = hLogs.includes(today);
            return (
              <Card key={h.id} className="glass-card gap-0 border-0 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-1 size-3 shrink-0 rounded-full"
                      style={{ backgroundColor: h.color }}
                    />
                    <div>
                      <h3 className="font-display text-base font-semibold">{h.name}</h3>
                      {h.description && (
                        <p className="text-sm text-muted-foreground">{h.description}</p>
                      )}
                      <div className="mt-2 flex gap-2">
                        <Badge variant="secondary">{h.frequency}</Badge>
                        <Badge variant="outline">
                          <Flame className="mr-1 size-3 text-brand-pink" /> {s.current} day
                          streak
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={doneTodayHabit ? "default" : "outline"}
                      onClick={() => toggle(h, today)}
                    >
                      <Check className="mr-1.5 size-4" />
                      {doneTodayHabit ? "Done today" : "Mark done"}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(h)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-1">
                  {days.map((d) => {
                    const on = hLogs.includes(d);
                    return (
                      <button
                        key={d}
                        title={d}
                        onClick={() => toggle(h, d)}
                        className={cn(
                          "size-3.5 rounded-[4px] transition-smooth hover:scale-125",
                          on ? "" : "bg-muted",
                        )}
                        style={on ? { backgroundColor: h.color } : undefined}
                      />
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New habit</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="h-name">Name</Label>
              <Input
                id="h-name"
                maxLength={80}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="h-desc">Description</Label>
              <Textarea
                id="h-desc"
                rows={2}
                maxLength={400}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(v) => setForm({ ...form, frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Colour</Label>
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setForm({ ...form, color: c })}
                    className={cn(
                      "size-8 rounded-full transition-smooth",
                      form.color === c && "ring-2 ring-offset-2 ring-offset-background",
                    )}
                    style={{ backgroundColor: c }}
                    aria-label={c}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              Create habit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
