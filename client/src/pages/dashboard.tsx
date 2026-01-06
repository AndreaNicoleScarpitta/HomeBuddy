import { Layout } from "@/components/layout";
import { HomeHealth } from "@/components/home-health";
import { HomeInfoCard } from "@/components/home-info-card";
import { MaintenanceCard } from "@/components/maintenance-card";
import { AddSystemWizard } from "@/components/add-system-wizard";
import { OnboardingTour, useTourState } from "@/components/onboarding-tour";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, ArrowRight, HelpCircle, MessageCircle, Upload } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getHome, getTasks, getSystems } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <header className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-10 w-36" />
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-48" />
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton className="h-7 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const { hasSeenTour, showTour, tourKey, startTour, completeTour } = useTourState();
  const [showAddSystem, setShowAddSystem] = useState(false);

  const { data: home, isLoading: homeLoading } = useQuery({
    queryKey: ["home"],
    queryFn: getHome,
    enabled: isAuthenticated,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks", home?.id],
    queryFn: () => getTasks(home!.id),
    enabled: !!home?.id,
  });

  const { data: systems = [] } = useQuery({
    queryKey: ["systems", home?.id],
    queryFn: () => getSystems(home!.id),
    enabled: !!home?.id,
  });

  useEffect(() => {
    if (!authLoading && !homeLoading && !home) {
      navigate("/onboarding");
    }
  }, [authLoading, homeLoading, home, navigate]);

  useEffect(() => {
    if (home && hasSeenTour === false && !showTour) {
      const timer = setTimeout(() => {
        startTour();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [home, hasSeenTour, showTour, startTour]);

  if (authLoading || homeLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  if (!home) {
    return null;
  }

  const activeTasks = tasks.filter(t => t.status === "pending" || t.status === "scheduled");
  const highPriorityTasks = tasks.filter(t => t.urgency === "now" || t.urgency === "soon");

  return (
    <Layout>
      <OnboardingTour key={tourKey} isOpen={showTour} onComplete={completeTour} />
      
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground" data-testid="text-heading">Overview</h1>
            <p className="text-muted-foreground mt-1">Here's what needs your attention.</p>
          </div>
          <div className="flex items-center gap-2">
            {hasSeenTour && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={startTour}
                    className="text-muted-foreground hover:text-foreground"
                    data-testid="button-restart-tour"
                  >
                    <HelpCircle className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Take a quick tour</TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/chat">
                  <Button size="lg" className="shadow-lg shadow-primary/20" data-testid="button-chat">
                    Ask Assistant <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Get expert advice on repairs, maintenance, and costs</TooltipContent>
            </Tooltip>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Home Status */}
          <div className="md:col-span-1" data-tour="home-status">
            <HomeHealth 
              score={home.healthScore || 0} 
              systemsCount={systems.length}
              tasksCount={activeTasks.length}
            />
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4" data-tour="quick-stats">
             <Card className="bg-primary/5 border-primary/10">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">Next Service</CardTitle>
               </CardHeader>
               <CardContent>
                 {tasks.length > 0 ? (
                   <>
                     <div className="text-2xl font-bold text-foreground" data-testid="text-next-service">{tasks[0].title}</div>
                     <p className="text-sm text-muted-foreground mt-1">
                       {tasks[0].dueDate ? new Date(tasks[0].dueDate).toLocaleDateString() : "Not scheduled"}
                     </p>
                   </>
                 ) : (
                   <>
                     <div className="text-2xl font-bold text-foreground" data-testid="text-next-service">None scheduled</div>
                     <p className="text-sm text-muted-foreground mt-1">All caught up!</p>
                   </>
                 )}
               </CardContent>
             </Card>
             <HomeInfoCard home={home} systems={systems} />
             <Tooltip>
               <TooltipTrigger asChild>
                 <Card className="cursor-help">
                   <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
                   </CardHeader>
                   <CardContent>
                     <div className="text-2xl font-bold text-foreground" data-testid="text-active-tasks">{activeTasks.length}</div>
                     <p className="text-sm text-orange-600 mt-1">{highPriorityTasks.length} High Priority</p>
                   </CardContent>
                 </Card>
               </TooltipTrigger>
               <TooltipContent>Pending and scheduled maintenance tasks</TooltipContent>
             </Tooltip>
             <Tooltip>
               <TooltipTrigger asChild>
                 <Card 
                   className="flex flex-col justify-center items-center border-dashed cursor-pointer hover:bg-muted/50 hover:border-primary/30 transition-colors h-full" 
                   data-testid="card-add-system"
                   onClick={() => setShowAddSystem(true)}
                 >
                   <div className="flex flex-col items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                     <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                       <Plus className="h-6 w-6" />
                     </div>
                     <span className="font-medium">Add System</span>
                   </div>
                 </Card>
               </TooltipTrigger>
               <TooltipContent>Add HVAC, plumbing, roof, or other home systems to track</TooltipContent>
             </Tooltip>
          </div>
        </div>
        
        {/* Add System Wizard */}
        <AddSystemWizard 
          isOpen={showAddSystem} 
          onClose={() => setShowAddSystem(false)} 
          homeId={home.id} 
        />
        {/* Tasks Section */}
        <div className="space-y-6" data-tour="maintenance-plan">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-heading font-semibold">Your Maintenance Plan</h2>
              <p className="text-sm text-muted-foreground">Prioritized by urgency and safety.</p>
            </div>
            <Link href="/budget">
              <Button variant="ghost" data-testid="button-view-plan">View Full Plan</Button>
            </Link>
          </div>
          
          {tasks.length === 0 ? (
            <Card className="p-8 md:p-12">
              <div className="max-w-lg mx-auto text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 mb-6">
                  <MessageCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-heading font-semibold mb-3">Let's create your maintenance plan</h3>
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  We can help you identify what needs attention now vs. what can wait. 
                  Start by chatting with your home assistant or upload an inspection report.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Link href="/chat">
                    <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/20" data-testid="button-start-chat">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with Assistant
                    </Button>
                  </Link>
                  <Link href="/inspections">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto" data-testid="button-upload-inspection">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Report
                    </Button>
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mt-6">
                  No pressure—we'll guide you through it step by step.
                </p>
              </div>
            </Card>
          ) : (
            ["now", "soon", "later", "monitor"].map((urgency) => {
              const urgencyTasks = tasks.filter(t => t.urgency === urgency);
              if (urgencyTasks.length === 0) return null;

              return (
                <div key={urgency} className="space-y-3">
                  <h3 className="uppercase text-xs font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      urgency === 'now' ? 'bg-destructive' : 
                      urgency === 'soon' ? 'bg-orange-500' : 
                      urgency === 'monitor' ? 'bg-blue-400' : 'bg-green-500'
                    }`} />
                    {urgency}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {urgencyTasks.map((task) => (
                      <MaintenanceCard key={task.id} task={task} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Layout>
  );
}
