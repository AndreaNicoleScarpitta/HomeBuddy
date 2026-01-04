import { Calendar, AlertTriangle, CheckCircle2, Clock, ChevronRight, User, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { MaintenanceTask } from "@shared/schema";

interface TaskProps {
  task: MaintenanceTask;
}

export function MaintenanceCard({ task }: TaskProps) {
  const isNow = task.urgency === "now";
  
  const getDiyBadgeColor = (level: string | null) => {
    switch (level) {
      case "DIY-Safe": return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
      case "Caution": return "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200";
      case "Pro-Only": return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
      default: return "bg-secondary text-secondary-foreground";
    }
  };

  return (
    <Card className={`group overflow-hidden border-l-4 transition-all duration-300 hover:shadow-md ${
      task.urgency === "now" ? "border-l-destructive" : 
      task.urgency === "soon" ? "border-l-orange-500" :
      task.urgency === "monitor" ? "border-l-blue-400" : "border-l-green-500"
    }`}>
      <CardContent className="p-5">
        <div className="flex justify-between items-start mb-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              {task.category && (
                <Badge variant="outline" className="text-xs font-normal uppercase tracking-wider text-muted-foreground">
                  {task.category}
                </Badge>
              )}
              <Badge className={`text-xs border ${getDiyBadgeColor(task.diyLevel)} shadow-none`}>
                {task.diyLevel || "Unknown"}
              </Badge>
            </div>
            <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
              {task.title}
            </h3>
          </div>
          <Button variant="ghost" size="icon" className="text-muted-foreground group-hover:text-primary" data-testid={`button-task-${task.id}`}>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>

        {task.safetyWarning && (
           <div className="mb-3 flex items-start gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded border border-orange-100">
             <ShieldAlert className="h-3 w-3 mt-0.5 shrink-0" />
             {task.safetyWarning}
           </div>
        )}

        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm mt-4 pt-4 border-t border-dashed">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className={isNow ? "text-destructive font-medium" : ""}>
              {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "Not scheduled"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground justify-end">
             <span className="font-semibold text-foreground">{task.estimatedCost || "TBD"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
