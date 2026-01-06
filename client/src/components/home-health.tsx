import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Info, ShieldCheck, AlertTriangle, AlertCircle, HelpCircle } from "lucide-react";

interface HomeHealthProps {
  score: number;
  systemsCount?: number;
  tasksCount?: number;
  urgentTasksCount?: number;
  overdueTasksCount?: number;
  poorSystemsCount?: number;
}

type HealthTier = "healthy" | "watch" | "needs-attention" | "unknown";

function getHealthTier(
  score: number, 
  systemsCount: number, 
  urgentTasksCount: number = 0,
  overdueTasksCount: number = 0,
  poorSystemsCount: number = 0
): { tier: HealthTier; label: string; description: string } {
  if (systemsCount === 0) {
    return {
      tier: "unknown",
      label: "Getting Started",
      description: "Add your home systems to see your health status"
    };
  }
  
  if (urgentTasksCount > 0 || overdueTasksCount > 0 || poorSystemsCount > 0) {
    const issues = [];
    if (urgentTasksCount > 0) issues.push(`${urgentTasksCount} urgent task${urgentTasksCount > 1 ? 's' : ''}`);
    if (overdueTasksCount > 0) issues.push(`${overdueTasksCount} overdue`);
    if (poorSystemsCount > 0) issues.push(`${poorSystemsCount} system${poorSystemsCount > 1 ? 's' : ''} in poor condition`);
    
    return {
      tier: "needs-attention",
      label: "Needs Attention",
      description: issues.join(", ")
    };
  }
  
  if (score >= 80) {
    return {
      tier: "healthy",
      label: "Healthy",
      description: "Your home is well-maintained with no urgent concerns"
    };
  }
  
  if (score >= 50) {
    return {
      tier: "watch",
      label: "Watch List",
      description: "A few items need attention soon, but nothing critical"
    };
  }
  
  return {
    tier: "needs-attention",
    label: "Needs Attention",
    description: "Some repairs should be addressed to protect your home"
  };
}

function getTierStyles(tier: HealthTier) {
  switch (tier) {
    case "healthy":
      return {
        icon: ShieldCheck,
        iconColor: "text-green-600",
        bgColor: "bg-green-50",
        borderColor: "border-green-200",
        badgeClass: "bg-green-100 text-green-700 border-green-200"
      };
    case "watch":
      return {
        icon: AlertTriangle,
        iconColor: "text-amber-600",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        badgeClass: "bg-amber-100 text-amber-700 border-amber-200"
      };
    case "needs-attention":
      return {
        icon: AlertCircle,
        iconColor: "text-orange-600",
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        badgeClass: "bg-orange-100 text-orange-700 border-orange-200"
      };
    default:
      return {
        icon: HelpCircle,
        iconColor: "text-muted-foreground",
        bgColor: "bg-muted/30",
        borderColor: "border-muted",
        badgeClass: "bg-muted text-muted-foreground border-muted"
      };
  }
}

export function HomeHealth({ 
  score, 
  systemsCount = 0, 
  tasksCount = 0,
  urgentTasksCount = 0,
  overdueTasksCount = 0,
  poorSystemsCount = 0
}: HomeHealthProps) {
  const { tier, label, description } = getHealthTier(score, systemsCount, urgentTasksCount, overdueTasksCount, poorSystemsCount);
  const styles = getTierStyles(tier);
  const TierIcon = styles.icon;

  return (
    <Card className={`h-full border shadow-sm ${styles.bgColor} ${styles.borderColor}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-heading flex items-center gap-2">
          Home Status
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-medium mb-1">How is this calculated?</p>
              <p className="text-sm">Your status is based on the age and condition of your home systems, pending maintenance tasks, and completed repairs. It improves as we learn more about your home.</p>
            </TooltipContent>
          </Tooltip>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <div className={`h-16 w-16 rounded-full ${styles.bgColor} border-2 ${styles.borderColor} flex items-center justify-center`}>
            <TierIcon className={`h-8 w-8 ${styles.iconColor}`} />
          </div>
          <div className="flex-1">
            <Badge variant="outline" className={`text-sm font-medium px-3 py-1 ${styles.badgeClass}`}>
              {label}
            </Badge>
            <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {tier === "unknown" && (
          <div className="p-3 rounded-lg bg-white/60 border border-muted">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Tip:</span> Add your HVAC, roof, plumbing, and other systems to get a personalized home health assessment.
            </p>
          </div>
        )}

        {tier !== "unknown" && (
          <div className="p-3 rounded-lg bg-white/60 border border-muted">
            <p className="text-xs text-muted-foreground">
              {systemsCount > 0 && `Tracking ${systemsCount} system${systemsCount > 1 ? 's' : ''}`}
              {systemsCount > 0 && tasksCount > 0 && ' • '}
              {tasksCount > 0 && `${tasksCount} active task${tasksCount > 1 ? 's' : ''}`}
              {systemsCount === 0 && tasksCount === 0 && 'Add systems to improve accuracy'}
            </p>
            <p className="text-xs text-muted-foreground mt-1 italic">
              Most homes your age have similar maintenance needs—you're not behind.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
