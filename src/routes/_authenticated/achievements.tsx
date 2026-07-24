import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Lock, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader, StatCard } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import { db, levelFromXp, xpProgress, type Achievement } from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [
      { title: "Achievements — DreamScape" },
      {
        name: "description",
        content: "Earn XP, level up and unlock achievements as you build consistency.",
      },
      { property: "og:title", content: "Achievements — DreamScape" },
      { property: "og:description", content: "Earn XP, level up and unlock achievements." },
    ],
  }),
  component: AchievementsPage,
});

function AchievementsPage() {
  const { user } = useAuth();
  const { data } = useQuery({
    queryKey: ["achievements", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [a, ua, p] = await Promise.all([
        db.from("achievements").select("*").order("xp_reward"),
        db.from("user_achievements").select("*"),
        db.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
      ]);
      return {
        all: (a.data ?? []) as Achievement[],
        mine: (ua.data ?? []) as { achievement_id: string }[],
        profile: p.data,
      };
    },
  });

  const all = data?.all ?? [];
  const unlockedIds = new Set((data?.mine ?? []).map((m) => m.achievement_id));
  const xp = data?.profile?.xp ?? 0;
  const prog = xpProgress(xp);

  return (
    <div>
      <PageHeader
        title="Achievements"
        description="Proof that showing up works."
        icon={Trophy}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Level" value={levelFromXp(xp)} icon={Trophy} />
        <StatCard label="Total XP" value={xp} icon={Trophy} tone="blue" />
        <StatCard
          label="Unlocked"
          value={`${unlockedIds.size}/${all.length}`}
          icon={Trophy}
          tone="pink"
        />
      </div>

      <Card className="glass-card mb-6 border-0 p-5">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold">Level {levelFromXp(xp)}</span>
          <span className="text-muted-foreground">
            {prog.into}/{prog.need} XP to next level
          </span>
        </div>
        <Progress value={prog.pct} className="mt-2 h-3" />
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {all.map((a) => {
          const unlocked = unlockedIds.has(a.id);
          return (
            <Card
              key={a.id}
              className={`glass-card gap-0 border-0 p-5 transition-smooth ${
                unlocked ? "shadow-glow" : "opacity-70"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="text-3xl">{unlocked ? a.icon : "🔒"}</span>
                <Badge variant={unlocked ? "default" : "secondary"}>+{a.xp_reward} XP</Badge>
              </div>
              <h3 className="mt-3 font-display text-base font-semibold">{a.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.description}</p>
              {!unlocked && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Lock className="size-3" /> Locked
                </p>
              )}
            </Card>
          );
        })}
        {all.length === 0 && (
          <p className="text-sm text-muted-foreground">No achievements configured yet.</p>
        )}
      </div>
    </div>
  );
}
