import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Calendar, MessageSquare, Shield, CheckCircle2 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Home className="h-6 w-6 text-primary" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-muted-foreground" />
              </div>
            </div>
            <span className="text-2xl font-heading font-bold text-foreground">Home Buddy</span>
          </div>
          <Button onClick={handleLogin} size="lg" data-testid="button-login">
            Sign In
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl md:text-6xl font-heading font-bold text-foreground tracking-tight">
            Your Home's{" "}
            <span className="text-primary">Maintenance</span>{" "}
            Assistant
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Never miss a maintenance task again. Get AI-powered guidance, safety alerts, and expert recommendations—all tailored to your home.
          </p>
          <div className="pt-4">
            <Button onClick={handleLogin} size="lg" className="text-lg h-14 px-8 shadow-lg shadow-primary/20" data-testid="button-hero-login">
              Get Started Free
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>
                Get personalized maintenance plans with Now, Soon, Later, and Monitor priorities.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Safety First</CardTitle>
              <CardDescription>
                Clear DIY-Safe, Caution, and Pro-Only badges with explicit safety warnings.
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="border-primary/20 bg-card/50 backdrop-blur">
            <CardHeader>
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>AI Assistant</CardTitle>
              <CardDescription>
                Chat with your personal home maintenance expert 24/7 for instant advice.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Benefits */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader className="text-center pb-8">
              <CardTitle className="text-3xl font-heading">Why Home Buddy?</CardTitle>
              <CardDescription>Built for homeowners who want peace of mind</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  "Track all your home systems in one place",
                  "Get reminders before issues become emergencies",
                  "Know when to DIY vs. call a pro",
                  "See estimated costs before you commit",
                  "Access permit requirements for your area",
                  "Build trust with transparent safety guidance"
                ].map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-muted-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2026 Home Buddy. Your trusted home maintenance assistant.</p>
        </div>
      </footer>
    </div>
  );
}
