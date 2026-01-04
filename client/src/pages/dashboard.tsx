import { Layout } from "@/components/layout";
import { HomeHealth } from "@/components/home-health";
import { MaintenanceCard } from "@/components/maintenance-card";
import { HOME_PROFILE, MAINTENANCE_TASKS } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-8">
        <header className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Overview</h1>
            <p className="text-muted-foreground mt-1">Good Morning. Here's your home's status.</p>
          </div>
          <Link href="/chat">
            <Button size="lg" className="shadow-lg shadow-primary/20">
              Ask Assistant <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Health Score */}
          <div className="md:col-span-1">
            <HomeHealth score={HOME_PROFILE.healthScore} />
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
             <Card className="bg-primary/5 border-primary/10">
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">Next Service</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-foreground">HVAC Tune-up</div>
                 <p className="text-sm text-muted-foreground mt-1">In 3 weeks</p>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">YTD Spending</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-foreground">$450</div>
                 <p className="text-sm text-green-600 mt-1">-12% vs last year</p>
               </CardContent>
             </Card>
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-sm font-medium text-muted-foreground">Active Tasks</CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-foreground">4</div>
                 <p className="text-sm text-orange-600 mt-1">2 High Priority</p>
               </CardContent>
             </Card>
             <Card className="flex flex-col justify-center items-center border-dashed cursor-pointer hover:bg-muted/50 transition-colors">
               <div className="flex flex-col items-center gap-2 text-muted-foreground">
                 <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                   <Plus className="h-6 w-6" />
                 </div>
                 <span className="font-medium">Add System</span>
               </div>
             </Card>
          </div>
        </div>

        {/* Tasks Section */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-heading font-semibold">Your Maintenance Plan</h2>
              <p className="text-sm text-muted-foreground">Prioritized by urgency and safety.</p>
            </div>
            <Button variant="ghost">View Full Plan</Button>
          </div>
          
          {["now", "soon", "later", "monitor"].map((urgency) => {
            const tasks = MAINTENANCE_TASKS.filter(t => t.urgency === urgency);
            if (tasks.length === 0) return null;

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
                  {tasks.map((task) => (
                    <MaintenanceCard key={task.id} task={task} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Layout>
  );
}
