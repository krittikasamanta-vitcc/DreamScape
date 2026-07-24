import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Shield, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader, StatCard } from "@/components/common/Page";
import { db } from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — DreamScape" },
      { name: "description", content: "Admin overview of DreamScape members and activity." },
      { property: "og:title", content: "Admin — DreamScape" },
      { property: "og:description", content: "Admin overview of members and activity." },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [profiles, goals, habits] = await Promise.all([
        db.from("profiles").select("*").order("created_at", { ascending: false }).limit(50),
        db.from("goals").select("id"),
        db.from("habits").select("id"),
      ]);
      return {
        profiles: profiles.data ?? [],
        goals: goals.data ?? [],
        habits: habits.data ?? [],
      };
    },
  });

  return (
    <div>
      <PageHeader title="Admin" description="Platform overview." icon={Shield} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Members" value={data?.profiles.length ?? 0} icon={Users} />
        <StatCard label="Goals" value={data?.goals.length ?? 0} icon={Shield} tone="blue" />
        <StatCard label="Habits" value={data?.habits.length ?? 0} icon={Shield} tone="pink" />
      </div>

      <Card className="glass-card border-0 p-5">
        <h2 className="font-display text-lg font-semibold">Recent members</h2>
        <ul className="mt-4 divide-y divide-border/60">
          {(data?.profiles ?? []).map((p: any) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.full_name || "Unnamed"}</p>
                <p className="text-xs text-muted-foreground">
                  Level {p.level} · {p.xp} XP
                </p>
              </div>
              <Badge variant={p.suspended ? "destructive" : "secondary"}>
                {p.suspended ? "Suspended" : "Active"}
              </Badge>
            </li>
          ))}
          {!data?.profiles.length && (
            <li className="py-3 text-sm text-muted-foreground">No members visible.</li>
          )}
        </ul>
      </Card>
    </div>
  );
}
