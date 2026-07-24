import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
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
import { PageHeader } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import { db, todayISO, type CalendarEvent, type Goal } from "@/lib/dreamscape";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendar — DreamScape" },
      {
        name: "description",
        content: "Plan deadlines, events and check-ins in one calm monthly planner view.",
      },
      { property: "og:title", content: "Calendar — DreamScape" },
      {
        property: "og:description",
        content: "Plan deadlines, events and check-ins in a monthly planner.",
      },
    ],
  }),
  component: CalendarPage,
});

const EVENT_TYPES = ["general", "milestone", "reminder", "review"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function CalendarPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return { y: d.getFullYear(), m: d.getMonth() };
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    event_date: todayISO(),
    event_time: "",
    type: "general",
  });

  const { data } = useQuery({
    queryKey: ["calendar", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [e, g] = await Promise.all([
        db.from("calendar_events").select("*").order("event_date"),
        db.from("goals").select("*").not("deadline", "is", null),
      ]);
      return {
        events: (e.data ?? []) as CalendarEvent[],
        goals: (g.data ?? []) as Goal[],
      };
    },
  });

  const create = async () => {
    if (form.title.trim().length < 2) return toast.error("Title is required");
    const { error } = await db.from("calendar_events").insert({
      user_id: user!.id,
      title: form.title.trim().slice(0, 120),
      description: form.description.trim().slice(0, 500),
      event_date: form.event_date,
      event_time: form.event_time || null,
      type: form.type,
    });
    if (error) return toast.error(error.message);
    toast.success("Event added");
    setOpen(false);
    setForm({ ...form, title: "", description: "", event_time: "" });
    qc.invalidateQueries({ queryKey: ["calendar"] });
  };

  const remove = async (id: string) => {
    await db.from("calendar_events").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["calendar"] });
  };

  const first = new Date(cursor.y, cursor.m, 1);
  const startDow = first.getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (string | null)[] = [
    ...Array.from({ length: startDow }, () => null),
    ...Array.from(
      { length: daysInMonth },
      (_, i) => `${cursor.y}-${pad(cursor.m + 1)}-${pad(i + 1)}`,
    ),
  ];

  const today = todayISO();
  const monthLabel = first.toLocaleDateString(undefined, { month: "long", year: "numeric" });

  const shift = (n: number) => {
    const d = new Date(cursor.y, cursor.m + n, 1);
    setCursor({ y: d.getFullYear(), m: d.getMonth() });
  };

  const eventsFor = (iso: string) => (data?.events ?? []).filter((e) => e.event_date === iso);
  const goalsFor = (iso: string) => (data?.goals ?? []).filter((g) => g.deadline === iso);

  const upcoming = (data?.events ?? []).filter((e) => e.event_date >= today).slice(0, 8);

  return (
    <div>
      <PageHeader
        title="Calendar"
        description="Everything that matters, on one page."
        icon={CalendarDays}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Add event
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="glass-card border-0 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">{monthLabel}</h2>
            <div className="flex gap-1">
              <Button size="icon" variant="ghost" onClick={() => shift(-1)}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => shift(1)}>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="mt-1.5 grid grid-cols-7 gap-1.5">
            {cells.map((iso, i) => {
              if (!iso) return <div key={i} />;
              const evs = eventsFor(iso);
              const gls = goalsFor(iso);
              return (
                <div
                  key={iso}
                  className={cn(
                    "min-h-[84px] rounded-xl border border-border/60 p-1.5 text-left transition-smooth",
                    iso === today && "border-primary bg-primary/5",
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      iso === today && "text-primary",
                    )}
                  >
                    {Number(iso.slice(8))}
                  </span>
                  <div className="mt-1 space-y-1">
                    {evs.slice(0, 2).map((e) => (
                      <p
                        key={e.id}
                        className="truncate rounded-md gradient-brand px-1.5 py-0.5 text-[10px] text-primary-foreground"
                      >
                        {e.title}
                      </p>
                    ))}
                    {gls.slice(0, 1).map((g) => (
                      <p
                        key={g.id}
                        className="truncate rounded-md bg-brand-pink/20 px-1.5 py-0.5 text-[10px] text-brand-pink"
                      >
                        🎯 {g.title}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="glass-card h-fit border-0 p-5">
          <h2 className="font-display text-lg font-semibold">Upcoming</h2>
          <ul className="mt-4 space-y-3">
            {upcoming.length === 0 && (
              <li className="text-sm text-muted-foreground">Nothing scheduled yet.</li>
            )}
            {upcoming.map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.event_date + "T00:00:00").toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                    {e.event_time ? ` · ${e.event_time.slice(0, 5)}` : ""}
                  </p>
                  <Badge variant="secondary" className="mt-1.5">
                    {e.type}
                  </Badge>
                </div>
                <Button size="icon" variant="ghost" onClick={() => remove(e.id)}>
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New event</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="c-title">Title</Label>
              <Input
                id="c-title"
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="c-desc">Description</Label>
              <Textarea
                id="c-desc"
                rows={2}
                maxLength={500}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="c-date">Date</Label>
                <Input
                  id="c-date"
                  type="date"
                  value={form.event_date}
                  onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="c-time">Time</Label>
                <Input
                  id="c-time"
                  type="time"
                  value={form.event_time}
                  onChange={(e) => setForm({ ...form, event_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={create}>Add event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
