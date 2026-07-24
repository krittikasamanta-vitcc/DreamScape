import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Image as ImageIcon, Plus, Quote, Trash2, Upload } from "lucide-react";
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
import { supabase } from "@/integrations/supabase/client";
import {
  VISION_CATEGORIES,
  awardXp,
  db,
  signedUrl,
  type VisionItem,
} from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/vision-board")({
  head: () => ({
    meta: [
      { title: "Vision Board — DreamScape" },
      {
        name: "description",
        content: "Pin images, quotes and dreams to a visual board that keeps your ambition in sight.",
      },
      { property: "og:title", content: "Vision Board — DreamScape" },
      {
        property: "og:description",
        content: "Pin images, quotes and dreams to a visual board.",
      },
    ],
  }),
  component: VisionBoardPage,
});

function VisionCard({ item, onDelete }: { item: VisionItem; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    signedUrl(item.image_path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [item.image_path]);

  return (
    <Card className="glass-card group mb-5 gap-0 break-inside-avoid overflow-hidden border-0 p-0 transition-smooth hover:-translate-y-1 hover:shadow-float">
      {url ? (
        <img
          src={url}
          alt={item.title}
          loading="lazy"
          className="w-full object-cover"
        />
      ) : (
        <div className="grid h-40 place-items-center gradient-soft">
          <ImageIcon className="size-8 text-primary/60" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-base font-semibold">{item.title}</h3>
          <Button
            size="icon"
            variant="ghost"
            className="opacity-0 transition-smooth group-hover:opacity-100"
            onClick={onDelete}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
        {item.description && (
          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
        )}
        {item.quote && (
          <p className="mt-3 flex gap-2 rounded-xl gradient-soft p-3 text-sm italic">
            <Quote className="size-4 shrink-0 text-primary" />
            {item.quote}
          </p>
        )}
        <Badge variant="secondary" className="mt-3">
          {item.category}
        </Badge>
      </div>
    </Card>
  );
}

function VisionBoardPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("all");
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    quote: "",
    category: "Dream",
  });

  const { data, isLoading } = useQuery({
    queryKey: ["vision", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from("vision_items")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as VisionItem[];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (form.title.trim().length < 2) throw new Error("Title is required");
      let image_path: string | null = null;
      if (file) {
        if (file.size > 5 * 1024 * 1024) throw new Error("Image must be under 5MB");
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user!.id}/vision/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from("media").upload(path, file);
        if (error) throw error;
        image_path = path;
      }
      const { error } = await db.from("vision_items").insert({
        user_id: user!.id,
        title: form.title.trim().slice(0, 120),
        description: form.description.trim().slice(0, 500),
        quote: form.quote.trim().slice(0, 300),
        category: form.category,
        image_path,
      });
      if (error) throw error;
      await awardXp(user!.id, 15);
    },
    onSuccess: () => {
      toast.success("Added to your vision board (+15 XP)");
      setOpen(false);
      setFile(null);
      setForm({ title: "", description: "", quote: "", category: "Dream" });
      qc.invalidateQueries({ queryKey: ["vision"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = async (item: VisionItem) => {
    if (item.image_path) await supabase.storage.from("media").remove([item.image_path]);
    await db.from("vision_items").delete().eq("id", item.id);
    toast.success("Removed");
    qc.invalidateQueries({ queryKey: ["vision"] });
  };

  const items = (data ?? []).filter((i) => filter === "all" || i.category === filter);

  return (
    <div>
      <PageHeader
        title="Vision Board"
        description="See it clearly, and you're halfway there."
        icon={ImageIcon}
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-1.5 size-4" /> Add vision
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        {VISION_CATEGORIES.map((c) => (
          <Button
            key={c}
            size="sm"
            variant={filter === c ? "default" : "outline"}
            onClick={() => setFilter(c)}
          >
            {c}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonGrid />
      ) : items.length === 0 ? (
        <EmptyState
          icon={ImageIcon}
          title="Your board is empty"
          description="Add the images and words that describe the life you're building."
          action={
            <Button onClick={() => setOpen(true)}>
              <Plus className="mr-1.5 size-4" /> Add your first vision
            </Button>
          }
        />
      ) : (
        <div className="columns-1 gap-5 sm:columns-2 xl:columns-3">
          {items.map((i) => (
            <VisionCard key={i.id} item={i} onDelete={() => remove(i)} />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to vision board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="v-title">Title</Label>
              <Input
                id="v-title"
                maxLength={120}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-desc">Description</Label>
              <Textarea
                id="v-desc"
                rows={2}
                maxLength={500}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-quote">Inspirational quote</Label>
              <Input
                id="v-quote"
                maxLength={300}
                value={form.quote}
                onChange={(e) => setForm({ ...form, quote: e.target.value })}
              />
            </div>
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
                  {VISION_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="v-file">Image</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="v-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Upload className="size-4 shrink-0 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">PNG or JPG, up to 5MB.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending ? "Uploading…" : "Add to board"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
