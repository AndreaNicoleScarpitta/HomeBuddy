import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home, Shield } from "lucide-react";
import { motion } from "framer-motion";

export default function Login() {
  const [, setLocation] = useLocation();

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 via-primary/5 to-background items-center justify-center p-12">
        <div className="max-w-md space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
            <Home className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-4xl font-heading font-bold text-foreground">
            Your home maintenance, simplified.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Join thousands of homeowners who trust Home Buddy to keep their homes in perfect condition.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm space-y-8"
        >
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Home className="h-4 w-4 text-white" />
            </div>
            <span className="text-xl font-heading font-bold">Home Buddy</span>
          </div>

          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">Welcome back</h1>
            <p className="text-muted-foreground mt-1">Sign in to your account</p>
          </div>

          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full h-14 text-lg font-medium"
              data-testid="button-login"
            >
              Sign in with Replit
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
              <Shield className="h-4 w-4" />
              <span>Secure authentication powered by Replit</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground text-center">
              Don't have a Replit account?
            </p>
            <Button 
              variant="outline"
              onClick={handleLogin}
              className="w-full h-12"
              data-testid="button-signup"
            >
              Create Account
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground leading-relaxed pt-4">
            By continuing, you agree to our{" "}
            <a href="#" className="underline hover:text-foreground" data-testid="link-terms">Terms</a>
            {" "}and{" "}
            <a href="#" className="underline hover:text-foreground" data-testid="link-privacy">Privacy Policy</a>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
