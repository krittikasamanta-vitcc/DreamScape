import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PageHeader, StatCard } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { db, levelFromXp, signedUrl } from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile — DreamScape" },
      { name: "description", content: "Manage your DreamScape profile, avatar and bio." },
      { property: "og:title", content: "Profile — DreamScape" },
      { property: "og:description", content: "Manage your profile, avatar and bio." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (!data) return;
    setFullName(data.full_name ?? "");
    setBio(data.bio ?? "");
    signedUrl(data.avatar_url).then(setAvatar);
  }, [data]);

  const save = async () => {
    setSaving(true);
    const { error } = await db
      .from("profiles")
      .update({ full_name: fullName.trim().slice(0, 80), bio: bio.trim().slice(0, 400) })
      .eq("id", user!.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const upload = async (file: File) => {
    if (file.size > 3 * 1024 * 1024) return toast.error("Image must be under 3MB");
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${user!.id}/avatar/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("media").upload(path, file);
    if (error) return toast.error(error.message);
    await db.from("profiles").update({ avatar_url: path }).eq("id", user!.id);
    setAvatar(await signedUrl(path));
    toast.success("Avatar updated");
    qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const xp = data?.xp ?? 0;

  return (
    <div>
      <PageHeader title="Profile" description="How you show up in DreamScape." icon={User} />

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="glass-card border-0 p-6">
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              {avatar && <AvatarImage src={avatar} alt={fullName} />}
              <AvatarFallback className="text-xl">
                {(fullName || user?.email || "?").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar" className="text-sm font-medium">
                Change avatar
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                className="mt-1.5"
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
              />
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Full name</Label>
              <Input
                id="p-name"
                maxLength={80}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-email">Email</Label>
              <Input id="p-email" value={user?.email ?? ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-bio">Bio</Label>
              <Textarea
                id="p-bio"
                rows={4}
                maxLength={400}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />
            </div>
            <Button onClick={save} disabled={saving}>
              Save profile
            </Button>
          </div>
        </Card>

        <div className="space-y-4">
          <StatCard label="Level" value={levelFromXp(xp)} icon={User} />
          <StatCard label="Total XP" value={xp} icon={User} tone="blue" />
          <StatCard
            label="Member since"
            value={
              data?.created_at ? new Date(data.created_at).toLocaleDateString() : "—"
            }
            icon={User}
            tone="pink"
          />
        </div>
      </div>
    </div>
  );
}
