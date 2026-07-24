import { createFileRoute } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/common/Page";
import { supabase } from "@/integrations/supabase/client";
import { useTheme } from "@/lib/theme";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — DreamScape" },
      { name: "description", content: "Appearance, account and session settings for DreamScape." },
      { property: "og:title", content: "Settings — DreamScape" },
      { property: "og:description", content: "Appearance, account and session settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div>
      <PageHeader title="Settings" description="Make DreamScape yours." icon={SettingsIcon} />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="glass-card border-0 p-6">
          <h2 className="font-display text-lg font-semibold">Appearance</h2>
          <div className="mt-4 space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={(v) => setTheme(v as "light" | "dark" | "system")}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <Card className="glass-card border-0 p-6">
          <h2 className="font-display text-lg font-semibold">Account</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign out of DreamScape on this device.
          </p>
          <Button variant="outline" className="mt-4 w-fit" onClick={signOut}>
            <LogOut className="mr-1.5 size-4" /> Sign out
          </Button>
        </Card>
      </div>
    </div>
  );
}
