import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Clock, Eye, Mail, FileText, Share2, BarChart3, ShieldAlert } from "lucide-react";

interface AgentOutputRow {
  id: number;
  agentId: number;
  agentRunId: number;
  outputType: string;
  title: string | null;
  isApproved: boolean;
  createdAt: string;
  agentName: string;
  agentSlug: string;
}

interface AgentOutputDetail extends AgentOutputRow {
  content: string;
  metadata: Record<string, unknown>;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  email: Mail,
  blog_post: FileText,
  social_post: Share2,
  report: BarChart3,
  task_list: FileText,
  alert: ShieldAlert,
  copy_variant: FileText,
};

function TypeBadge({ type }: { type: string }) {
  const Icon = TYPE_ICON[type] || FileText;
  return (
    <Badge variant="outline" className="gap-1 text-xs">
      <Icon className="h-3 w-3" />
      {type.replace(/_/g, " ")}
    </Badge>
  );
}

export default function AdminApprovalsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showApproved, setShowApproved] = useState(false);

  const { data: outputs = [], isLoading, error } = useQuery<AgentOutputRow[]>({
    queryKey: ["/api/agents/outputs/recent"],
    queryFn: async () => {
      const res = await fetch("/api/agents/outputs/recent?limit=50", { credentials: "include" });
      if (res.status === 403) throw new Error("Admin access required");
      if (!res.ok) throw new Error("Failed to load outputs");
      return res.json();
    },
  });

  const { data: detail } = useQuery<AgentOutputDetail>({
    queryKey: ["/api/agents/outputs", selectedId],
    enabled: selectedId !== null,
    queryFn: async () => {
      // Find the run ID from our list, then fetch the run's outputs
      const row = outputs.find((o) => o.id === selectedId);
      if (!row) throw new Error("not found");
      const res = await fetch(`/api/agents/runs/${row.agentRunId}/outputs`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load output detail");
      const all = await res.json();
      return all.find((o: any) => o.id === selectedId) || all[0];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/agents/outputs/${id}/approve`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to approve");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Approved", description: "Output marked approved." });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/outputs/recent"] });
      queryClient.invalidateQueries({ queryKey: ["/api/agents/outputs", selectedId] });
    },
    onError: () => toast({ title: "Approval failed", variant: "destructive" }),
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <ShieldAlert className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-xl font-heading font-bold mb-2">Access denied</h1>
          <p className="text-sm text-muted-foreground">
            This page is for admins only. Set <code className="bg-muted px-1 rounded">ADMIN_EMAILS</code> env var on the server and log in with that email.
          </p>
        </div>
      </div>
    );
  }

  const filtered = outputs.filter((o) => (showApproved ? true : !o.isApproved));

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            <h1 className="font-heading font-semibold">Approval Inbox</h1>
            <Badge variant="outline" className="text-xs">
              {outputs.filter((o) => !o.isApproved).length} pending
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowApproved(!showApproved)}
            className="text-xs"
          >
            {showApproved ? "Hide approved" : "Show approved"}
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6 p-6">
        {/* List */}
        <div className="col-span-12 md:col-span-5 space-y-2">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Inbox zero. Agents haven't produced anything new.</p>
            </div>
          ) : (
            filtered.map((o) => (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={`w-full text-left border rounded-lg p-3 transition-colors ${
                  selectedId === o.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 bg-card"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <TypeBadge type={o.outputType} />
                  {o.isApproved ? (
                    <Badge variant="outline" className="gap-1 text-xs text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 text-xs text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800">
                      <Clock className="h-3 w-3" /> Pending
                    </Badge>
                  )}
                </div>
                <p className="font-medium text-sm text-foreground truncate">
                  {o.title || "Untitled output"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {o.agentName} · {new Date(o.createdAt).toLocaleString()}
                </p>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
        <div className="col-span-12 md:col-span-7">
          {!selectedId ? (
            <div className="border border-dashed border-border rounded-xl p-12 text-center text-muted-foreground">
              <Eye className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select an item to review</p>
            </div>
          ) : !detail ? (
            <div className="text-center py-16 text-muted-foreground text-sm">Loading…</div>
          ) : (
            <div className="border border-border rounded-xl bg-card">
              <div className="p-5 border-b">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <TypeBadge type={detail.outputType} />
                  <span className="text-xs text-muted-foreground">{detail.agentName}</span>
                </div>
                <h2 className="font-heading font-semibold text-lg">{detail.title || "Untitled"}</h2>
              </div>
              <div className="p-5">
                {detail.outputType === "email" || detail.outputType === "blog_post" || detail.outputType === "report" || detail.outputType === "alert" ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: detail.content }}
                  />
                ) : (
                  <pre className="whitespace-pre-wrap text-sm font-mono bg-muted p-3 rounded">
                    {detail.content}
                  </pre>
                )}
              </div>
              <div className="p-5 border-t flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  Output #{detail.id} · Run #{detail.agentRunId}
                </span>
                <div className="flex items-center gap-2">
                  {detail.isApproved ? (
                    <Badge className="gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" /> Approved
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => approveMutation.mutate(detail.id)}
                      disabled={approveMutation.isPending}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
