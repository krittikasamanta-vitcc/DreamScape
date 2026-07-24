import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCircle2, Plus, Target, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState, PageHeader, SkeletonGrid } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import {
  GOAL_CATEGORIES,
  awardXp,
  db,
  notify,
  type Goal,
  type Milestone,
} from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/goals")({
  head: () => ({
    meta: [
      { title: "Goals — DreamScape" },
      {
        name: "description",
        content: "Create goals, break them into milestones and track progress toward your dreams.",
      },
      { property: "og:title", content: "Goals — DreamScape" },
      {
        property: "og:description",
        content: "Create goals, break them into milestones and track progress.",
      },
    ],
  }),
  component: GoalsPage,
});

const blank = {
  title: "",
  description: "",
  category: "Personal",
  priority: "medium",
  deadline: "",
};

function GoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [filter, setFilter] = useState("active");
  const [category, setCategory] = useState("all");
  const [milestoneText, setMilestoneText] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [g, m] = await Promise.all([
        db.from("goals").select("*").order("created_at", { ascending: false }),
        db.from("goal_milestones").select("*").order("created_at"),
      ]);
      return {
        goals: (g.data ?? []) as Goal[],
        milestones: (m.data ?? []) as Milestone[],
      };
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["goals"] });

  const save = useMutation({
    mutationFn: async () => {
      if (form.title.trim().length < 2) throw new Error("Title is required");
      const payload = {
        title: form.title.trim().slice(0, 120),
        description: form.description.trim().slice(0, 1000),
        category: form.category,
        priority: form.priority,
        deadline: form.deadline || null,
      };
      if (editing) {
        const { error } = await db.from("goals").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("goals")
          .insert({ ...payload, user_id: user!.id });
        if (error) throw error;
        await awardXp(user!.id, 20);
        await notify(user!.id, "New goal created", payload.title, "goal");
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Goal updated" : "Goal created (+20 XP)");
      setOpen(false);
      setEditing(null);
      setForm({ ...blank });
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setProgress = async (goal: Goal, progress: number) => {
    const status = progress >= 100 ? "completed" : "active";
    await db.from("goals").update({ progress, status }).eq("id", goal.id);
    if (progress >= 100 && goal.status !== "completed") {
      await awardXp(user!.id, 100);
      await notify(user!.id, "Goal completed! 🎉", goal.title, "achievement");
      toast.success("Goal completed — +100 XP!");
    }
    refresh();
  };

  const toggleMilestone = async (m: Milestone, goal: Goal, all: Milestone[]) => {
    await db.from("goal_milestones").update({ completed: !m.completed }).eq("id", m.id);
    const done = all.filter((x) => (x.id === m.id ? !m.completed : x.completed)).length;
    await setProgress(goal, Math.round((done / all.length) * 100));
  };

  const addMilestone = async (goal: Goal) => {
    const title = (milestoneText[goal.id] ?? "").trim();
    if (!title) return;
    await db.from("goal_milestones").insert({
      goal_id: goal.id,
      user_id: user!.id,
      title: title.slice(0, 120),
    });
    setMilestoneText((s) => ({ ...s, [goal.id]: "" }));
    refresh();
  };

  const remove = async (goal: Goal) => {
    await db.from("goals").delete().eq("id", goal.id);
    toast.success("Goal deleted");
    refresh();
  };

  const goals = (data?.goals ?? []).filter(
    (g) =>
      (filter === "all" || g.status === filter) &&
      (category === "all" || g.category === category),
  );

  const priorityTone: Record<string, string> = {
    high: "bg-destructive/15 text-destructive",
    medium: "bg-warning/15 text-warning",
    low: "bg-success/15 text-success",
  };

  return (
    <div>
      <PageHeader
        title="Goals"
        description="Break your dreams into trackable milestones."
        icon={Target}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ ...blank });
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" /> New goal
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Tabs value={filter} onValueChange={setFilter}>
          <TabsList>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="archived">Archived</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {GOAL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals here yet"
          description="Create your first goal and start turning intention into progress."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Create goal
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {goals.map((g) => {
            const ms = (data?.milestones ?? []).filter((m) => m.goal_id === g.id);
            return (
              <Card key={g.id} className="glass-card gap-0 border-0 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-semibold">
                      {g.title}
                    </h3>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <Badge variant="secondary">{g.category}</Badge>
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-medium ${priorityTone[g.priority]}`}
                      >
                        {g.priority}
                      </span>
                      {g.deadline && (
                        <Badge variant="outline">
                          {new Date(g.deadline + "T00:00:00").toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(g);
                        setForm({
                          title: g.title,
                          description: g.description ?? "",
                          category: g.category,
                          priority: g.priority,
                          deadline: g.deadline ?? "",
                        });
                        setOpen(true);
                      }}
                    >
                      <Pencil className="size-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(g)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                {g.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
                    {g.description}
                  </p>
                )}

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{g.progress}%</span>
                  </div>
                  <Progress value={g.progress} className="mt-1.5 h-2" />
                </div>

                <div className="mt-4 space-y-2">
                  {ms.map((m) => (
                    <label key={m.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={m.completed}
                        onCheckedChange={() => toggleMilestone(m, g, ms)}
                      />
                      <span className={m.completed ? "text-muted-foreground line-through" : ""}>
                        {m.title}
                      </span>
                    </label>
                  ))}
                  <div className="flex gap-2 pt-1">
                    <Input
                      placeholder="Add milestone…"
                      value={milestoneText[g.id] ?? ""}
                      onChange={(e) =>
                        setMilestoneText((s) => ({ ...s, [g.id]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === "Enter" && addMilestone(g)}
                      className="h-9"
                    />
                    <Button size="sm" variant="secondary" onClick={() => addMilestone(g)}>
                      <Plus className="size-4" />
                    </Button>
                  </div>
                </div>

                {g.status !== "completed" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-4"
                    onClick={() => setProgress(g, 100)}
                  >
                    <CheckCircle2 className="mr-1.5 size-4" /> Mark complete
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit goal" : "New goal"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="g-title">Title</Label>
              <Input
                id="g-title"
                value={form.title}
                maxLength={120}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-desc">Description</Label>
              <Textarea
                id="g-desc"
                rows={3}
                maxLength={1000}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {GOAL_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={form.priority}
                  onValueChange={(v) => setForm({ ...form, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-date">Deadline</Label>
              <Input
                id="g-date"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {editing ? "Save changes" : "Create goal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
