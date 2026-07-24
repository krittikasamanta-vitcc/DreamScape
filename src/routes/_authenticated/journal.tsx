import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
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
import { EmptyState, PageHeader, SkeletonGrid } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import {
  JOURNAL_CATEGORIES,
  MOODS,
  awardXp,
  db,
  moodMeta,
  todayISO,
  type JournalEntry,
} from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Journal — DreamScape" },
      {
        name: "description",
        content: "Capture reflections, gratitude and ideas with mood tagging and instant search.",
      },
      { property: "og:title", content: "Journal — DreamScape" },
      {
        property: "og:description",
        content: "Capture reflections, gratitude and ideas with mood tagging.",
      },
    ],
  }),
  component: JournalPage,
});

const blank = {
  title: "",
  content: "",
  category: "Daily",
  mood: "neutral",
  entry_date: todayISO(),
};

function JournalPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JournalEntry | null>(null);
  const [form, setForm] = useState({ ...blank });
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["journal", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from("journal_entries")
        .select("*")
        .order("entry_date", { ascending: false });
      return (data ?? []) as JournalEntry[];
    },
  });

  const save = useMutation({
    mutationFn: async () => {
      if (form.title.trim().length < 2) throw new Error("Title is required");
      if (form.content.trim().length < 1) throw new Error("Write something first");
      const payload = {
        title: form.title.trim().slice(0, 140),
        content: form.content.trim().slice(0, 20000),
        category: form.category,
        mood: form.mood,
        entry_date: form.entry_date,
      };
      if (editing) {
        const { error } = await db
          .from("journal_entries")
          .update(payload)
          .eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from("journal_entries")
          .insert({ ...payload, user_id: user!.id });
        if (error) throw error;
        await awardXp(user!.id, 25);
      }
    },
    onSuccess: () => {
      toast.success(editing ? "Entry updated" : "Entry saved (+25 XP)");
      setOpen(false);
      setEditing(null);
      setForm({ ...blank });
      qc.invalidateQueries({ queryKey: ["journal"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = async (entry: JournalEntry) => {
    await db.from("journal_entries").delete().eq("id", entry.id);
    toast.success("Entry deleted");
    qc.invalidateQueries({ queryKey: ["journal"] });
  };

  const entries = (data ?? []).filter((e) => {
    const t = term.trim().toLowerCase();
    const matches =
      !t ||
      e.title.toLowerCase().includes(t) ||
      (e.content ?? "").toLowerCase().includes(t);
    return matches && (category === "all" || e.category === category);
  });

  return (
    <div>
      <PageHeader
        title="Journal"
        description="Reflection turns experience into wisdom."
        icon={BookOpen}
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setForm({ ...blank });
              setOpen(true);
            }}
          >
            <Plus className="mr-1.5 size-4" /> New entry
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entries…"
            className="pl-9"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {JOURNAL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="Nothing written yet"
          description="Start with today — how did it go, and what did you learn?"
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Write entry
            </Button>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {entries.map((e) => (
            <Card key={e.id} className="glass-card gap-0 border-0 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-base font-semibold">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                      dateStyle: "medium",
                    })}
                  </p>
                </div>
                <span className="text-2xl">{moodMeta(e.mood)?.emoji}</span>
              </div>
              <p className="mt-3 line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                {e.content}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <Badge variant="secondary">{e.category}</Badge>
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(e);
                      setForm({
                        title: e.title,
                        content: e.content,
                        category: e.category,
                        mood: e.mood ?? "neutral",
                        entry_date: e.entry_date,
                      });
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(e)}>
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit entry" : "New journal entry"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="j-title">Title</Label>
              <Input
                id="j-title"
                maxLength={140}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="j-content">Entry</Label>
              <Textarea
                id="j-content"
                rows={9}
                maxLength={20000}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
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
                    {JOURNAL_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Mood</Label>
                <Select
                  value={form.mood}
                  onValueChange={(v) => setForm({ ...form, mood: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MOODS.map((m) => (
                      <SelectItem key={m.key} value={m.key}>
                        {m.emoji} {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="j-date">Date</Label>
                <Input
                  id="j-date"
                  type="date"
                  value={form.entry_date}
                  onChange={(e) => setForm({ ...form, entry_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              Save entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
