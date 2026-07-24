import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Image as ImageIcon, Target } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { db } from "@/lib/dreamscape";
import { useAuth } from "@/hooks/useAuth";

interface Result {
  id: string;
  title: string;
}

export function GlobalSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const { data } = useQuery({
    queryKey: ["global-search", user?.id, term],
    enabled: !!user && term.trim().length > 1,
    queryFn: async () => {
      const q = `%${term.trim()}%`;
      const [goals, journal, vision] = await Promise.all([
        db.from("goals").select("id,title").ilike("title", q).limit(5),
        db.from("journal_entries").select("id,title").ilike("title", q).limit(5),
        db.from("vision_items").select("id,title").ilike("title", q).limit(5),
      ]);
      return {
        goals: (goals.data ?? []) as Result[],
        journal: (journal.data ?? []) as Result[],
        vision: (vision.data ?? []) as Result[],
      };
    },
  });

  const go = (to: string) => {
    onOpenChange(false);
    setTerm("");
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search goals, journal entries and vision items…"
        value={term}
        onValueChange={setTerm}
      />
      <CommandList>
        <CommandEmpty>
          {term.length > 1 ? "No matches found." : "Type at least 2 characters."}
        </CommandEmpty>
        {!!data?.goals.length && (
          <CommandGroup heading="Goals">
            {data.goals.map((g) => (
              <CommandItem key={g.id} value={"goal" + g.id} onSelect={() => go("/goals")}>
                <Target className="mr-2 size-4" />
                {g.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!data?.journal.length && (
          <CommandGroup heading="Journal">
            {data.journal.map((j) => (
              <CommandItem key={j.id} value={"j" + j.id} onSelect={() => go("/journal")}>
                <BookOpen className="mr-2 size-4" />
                {j.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {!!data?.vision.length && (
          <CommandGroup heading="Vision Board">
            {data.vision.map((v) => (
              <CommandItem
                key={v.id}
                value={"v" + v.id}
                onSelect={() => go("/vision-board")}
              >
                <ImageIcon className="mr-2 size-4" />
                {v.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
