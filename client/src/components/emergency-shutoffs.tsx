import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { updateHome } from "@/lib/api";
import { Droplets, Flame, Zap, Check, X } from "lucide-react";
import type { V2Home } from "@/lib/api";

type ShutoffField = "waterShutoffLocation" | "gasShutoffLocation" | "electricalPanelLocation";

interface Props {
  home: V2Home;
}

function ShutoffRow({
  label,
  icon: Icon,
  iconColor,
  value,
  field,
  homeId,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  value: string | null | undefined;
  field: ShutoffField;
  homeId: string;
}) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  const mutation = useMutation({
    mutationFn: (val: string) => updateHome(homeId, { [field]: val || null }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["home"] });
      setEditing(false);
    },
    onError: () => toast({ title: "Failed to save", variant: "destructive" }),
  });

  return (
    <div className="flex items-center gap-3">
      <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
        {editing ? (
          <div className="flex items-center gap-2 mt-1">
            <Input
              autoFocus
              className="h-8 text-sm"
              placeholder={`Where is the ${label.toLowerCase()}?`}
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") mutation.mutate(draft);
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <Button variant="ghost" size="icon" aria-label="Save" className="h-8 w-8 shrink-0" onClick={() => mutation.mutate(draft)} disabled={mutation.isPending}>
              <Check className="h-4 w-4 text-green-600" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Cancel" className="h-8 w-8 shrink-0" onClick={() => { setDraft(value ?? ""); setEditing(false); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <button
            className="text-sm text-left w-full hover:text-primary transition-colors mt-0.5"
            onClick={() => { setDraft(value ?? ""); setEditing(true); }}
            aria-label={`Edit ${label} location`}
          >
            {value || <span className="text-muted-foreground italic">Tap to add location</span>}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmergencyShutoffs({ home }: Props) {
  return (
    <div className="space-y-1 pt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Emergency Shutoffs</p>
      <div className="space-y-4">
        <ShutoffRow label="Main Water" icon={Droplets} iconColor="text-blue-500" value={home.waterShutoffLocation} field="waterShutoffLocation" homeId={home.id} />
        <ShutoffRow label="Gas Meter" icon={Flame} iconColor="text-orange-500" value={home.gasShutoffLocation} field="gasShutoffLocation" homeId={home.id} />
        <ShutoffRow label="Electrical Panel" icon={Zap} iconColor="text-yellow-500" value={home.electricalPanelLocation} field="electricalPanelLocation" homeId={home.id} />
      </div>
    </div>
  );
}
