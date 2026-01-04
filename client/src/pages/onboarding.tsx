import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ArrowRight, Home } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { createHome } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { AddressAutocomplete, type AddressComponents } from "@/components/address-autocomplete";
import logoImage from "@assets/generated_images/orange_house_logo_with_grey_gear..png";

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState("");
  const [addressComponents, setAddressComponents] = useState<AddressComponents | null>(null);
  const [addressVerified, setAddressVerified] = useState(false);
  const [builtYear, setBuiltYear] = useState("");
  const [sqFt, setSqFt] = useState("");

  const createHomeMutation = useMutation({
    mutationFn: createHome,
    onSuccess: () => {
      toast({
        title: "Home profile created!",
        description: "Your home maintenance plan is ready.",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create home profile",
        variant: "destructive",
      });
    },
  });

  const handleAddressChange = (addr: string, components?: AddressComponents) => {
    setAddress(addr);
    if (components) {
      setAddressComponents(components);
    }
  };

  const handleAddressVerified = (verified: boolean, components?: AddressComponents) => {
    setAddressVerified(verified);
    if (verified && components) {
      setAddressComponents(components);
    }
  };

  const handleNext = () => {
    if (step === 1 && address) {
      setStep(2);
    } else if (step === 2) {
      createHomeMutation.mutate({
        address: addressComponents?.fullAddress || address,
        streetAddress: addressComponents?.streetAddress,
        city: addressComponents?.city,
        state: addressComponents?.state,
        zipCode: addressComponents?.zipCode,
        zipPlus4: addressComponents?.zipPlus4,
        addressVerified,
        builtYear: builtYear ? parseInt(builtYear) : undefined,
        sqFt: sqFt ? parseInt(sqFt) : undefined,
        type: "Single Family Home",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md z-10"
      >
        <div className="text-center mb-8">
          <img src={logoImage} alt="Home Buddy" className="w-20 h-20 mx-auto rounded-2xl shadow-xl mb-6" />
          <h1 className="text-3xl font-heading font-bold text-foreground mb-2" data-testid="text-welcome">Welcome to Home Buddy</h1>
          <p className="text-muted-foreground">Your personal AI home maintenance expert.</p>
        </div>

        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            {step === 1 ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-base font-medium">Where is your home located?</Label>
                  <div className="bg-secondary/50 p-3 rounded-lg border border-secondary text-sm text-muted-foreground my-2 flex gap-2 items-start">
                    <div className="mt-0.5 shrink-0 text-primary">ℹ</div>
                    We use your address to identify local building codes, permit requirements (AHJ), and regional maintenance costs.
                  </div>
                  <AddressAutocomplete
                    value={address}
                    onChange={handleAddressChange}
                    onVerified={handleAddressVerified}
                    placeholder="Enter your home address..."
                  />
                </div>
                <Button 
                  className="w-full h-12 text-lg" 
                  onClick={handleNext}
                  disabled={!address}
                  data-testid="button-continue"
                >
                  Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="text-center py-2">
                    <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                      <Home className="h-8 w-8" />
                    </div>
                    <h3 className="text-xl font-heading font-semibold mb-2">Tell us more</h3>
                    <p className="text-muted-foreground text-sm">
                      Help us create a personalized maintenance plan
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="year">Year Built (Optional)</Label>
                    <Input 
                      id="year"
                      type="number"
                      placeholder="e.g., 1985"
                      value={builtYear}
                      onChange={(e) => setBuiltYear(e.target.value)}
                      data-testid="input-year"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="sqft">Square Footage (Optional)</Label>
                    <Input 
                      id="sqft"
                      type="number"
                      placeholder="e.g., 2400"
                      value={sqFt}
                      onChange={(e) => setSqFt(e.target.value)}
                      data-testid="input-sqft"
                    />
                  </div>
                </div>
                
                <Button 
                  className="w-full h-12 text-lg" 
                  onClick={handleNext}
                  disabled={createHomeMutation.isPending}
                  data-testid="button-create-plan"
                >
                  {createHomeMutation.isPending ? "Creating..." : "Create My Plan"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
