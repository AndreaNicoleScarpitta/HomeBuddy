import {
  Shield,
  CheckCircle2,
  Sparkles,
  FileText,
  Zap,
  CalendarClock,
  Paintbrush,
} from "lucide-react";
import { motion } from "framer-motion";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import { buttonVariants } from "@/components/ui/button";

const benefits = [
  {
    icon: CalendarClock,
    title: "Personalized schedules",
    description: "AI builds maintenance tasks tailored to your exact systems",
  },
  {
    icon: FileText,
    title: "Upload inspection reports",
    description: "AI reads your documents and extracts every system and finding",
  },
  {
    icon: Zap,
    title: "DIY safety ratings",
    description: "Know what you can fix yourself and what needs a professional",
  },
  {
    icon: Paintbrush,
    title: "Track everything",
    description: "From paint colors to circuit breakers — one place for it all",
  },
];

const socialProof = [
  "14 system categories",
  "50+ task templates",
  "19 AI detection patterns",
  "100% free, forever",
];

export default function Signup() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-background to-background dark:from-orange-950/20 dark:via-background dark:to-background">
      <header className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <nav className="container mx-auto px-6 h-16 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 no-underline" data-testid="link-signup-home">
            <img
              src="/images/home-buddy-icon.png"
              alt="Home Buddy logo"
              className="h-8 w-8 rounded-lg object-cover"
              width="32"
              height="32"
            />
            <span className="text-xl font-heading font-bold text-foreground">Home Buddy</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:inline">Already have an account?</span>
            <Link
              href="/login"
              onClick={() => trackEvent("click", "signup", "sign_in_header")}
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent no-underline transition-colors"
              data-testid="link-signup-signin"
            >
              Sign In
            </Link>
          </div>
        </nav>
      </header>

      <main className="pt-16">
        <div className="container mx-auto px-6 py-12 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-start">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-10 lg:sticky lg:top-28"
            >
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  Free forever. No credit card needed.
                </div>

                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-foreground leading-[1.08] tracking-tight">
                  Take control of<br />
                  <span className="text-primary">your home.</span>
                </h1>

                <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                  Home Buddy gives you a personalized maintenance plan in minutes. Stop worrying about what you're forgetting.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {benefits.map((benefit) => (
                  <div
                    key={benefit.title}
                    className="flex gap-3 p-4 rounded-xl bg-card border border-border/50"
                  >
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <benefit.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{benefit.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-3">
                {socialProof.map((stat) => (
                  <span
                    key={stat}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-xs font-medium"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    {stat}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="w-full max-w-md mx-auto lg:mx-0"
            >
              <div className="bg-card border border-border/50 rounded-2xl shadow-xl shadow-black/5 p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-2xl font-heading font-bold text-foreground">Create your free account</h2>
                  <p className="text-sm text-muted-foreground">Set up your home profile in under 2 minutes</p>
                </div>

                <a
                  href="/api/login"
                  target="_top"
                  onClick={() => trackEvent("signup_attempt", "auth", "google")}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "w-full h-12 text-base font-medium gap-3 justify-center no-underline border-border hover:bg-accent"
                  )}
                  data-testid="button-signup-google"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </a>

                <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center pt-2">
                  <Shield className="h-4 w-4" />
                  <span>Secure authentication. Your data stays yours.</span>
                </div>

                <p className="text-center text-xs text-muted-foreground leading-relaxed">
                  By creating an account, you agree to our{" "}
                  <Link href="/terms" className="underline hover:text-foreground" data-testid="link-signup-terms">
                    Terms of Service & Privacy Policy
                  </Link>
                </p>
              </div>

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-medium hover:underline no-underline" data-testid="link-signup-login">
                  Sign in here
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
