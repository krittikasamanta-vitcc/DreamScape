import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bell, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState, PageHeader } from "@/components/common/Page";
import { useAuth } from "@/hooks/useAuth";
import { db, type Notification } from "@/lib/dreamscape";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — DreamScape" },
      {
        name: "description",
        content: "Reminders, milestones and achievement alerts from your DreamScape workspace.",
      },
      { property: "og:title", content: "Notifications — DreamScape" },
      {
        property: "og:description",
        content: "Reminders, milestones and achievement alerts.",
      },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await db
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false });
      return (data ?? []) as Notification[];
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["notifications"] });
    qc.invalidateQueries({ queryKey: ["notif-badge"] });
  };

  const markAll = async () => {
    await db.from("notifications").update({ read: true }).eq("read", false);
    toast.success("All marked as read");
    refresh();
  };

  const items = data ?? [];
  const unread = items.filter((n) => !n.read).length;

  return (
    <div>
      <PageHeader
        title="Notifications"
        description={unread ? `${unread} unread` : "You're all caught up."}
        icon={Bell}
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={markAll}>
              <Check className="mr-1.5 size-4" /> Mark all read
            </Button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No notifications"
          description="Progress updates and achievement alerts will show up here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <Card
              key={n.id}
              className={`glass-card flex-row items-start justify-between gap-4 border-0 p-4 ${
                n.read ? "opacity-70" : ""
              }`}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{n.title}</p>
                  {!n.read && <span className="size-2 rounded-full bg-primary" />}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="secondary">{n.type}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(n.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 gap-1">
                {!n.read && (
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      await db.from("notifications").update({ read: true }).eq("id", n.id);
                      refresh();
                    }}
                  >
                    <Check className="size-4" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={async () => {
                    await db.from("notifications").delete().eq("id", n.id);
                    refresh();
                  }}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
