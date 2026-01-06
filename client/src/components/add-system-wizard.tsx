import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Wind, 
  Droplets, 
  Zap, 
  Square,
  Layers,
  Building,
  CookingPot,
  Flame,
  Trees,
  Bug,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  Check,
  Info,
  Camera
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSystem } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { systemCategories, systemConditions } from "@shared/schema";

interface AddSystemWizardProps {
  isOpen: boolean;
  onClose: () => void;
  homeId: number;
}

const categoryIcons: Record<string, any> = {
  "Roof": Home,
  "HVAC": Wind,
  "Plumbing": Droplets,
  "Electrical": Zap,
  "Windows": Square,
  "Siding/Exterior": Layers,
  "Foundation": Building,
  "Appliances": CookingPot,
  "Water Heater": Flame,
  "Landscaping": Trees,
  "Pest": Bug,
  "Other": HelpCircle,
};

const categoryHints: Record<string, string> = {
  "Roof": "Look at the exterior or check attic access",
  "HVAC": "Garage, utility closet, attic, or outdoor unit",
  "Plumbing": "Under sinks, water main, or utility room",
  "Electrical": "Garage, basement, or side of house panel",
  "Windows": "Check labels on window frames for brand/year",
  "Siding/Exterior": "Walk the exterior to assess condition",
  "Foundation": "Basement, crawl space, or exterior base",
  "Appliances": "Kitchen, laundry room - check labels",
  "Water Heater": "Garage or utility room",
  "Landscaping": "Irrigation systems, outdoor lighting",
  "Pest": "Recent pest treatments or contracts",
  "Other": "Any other home system you want to track",
};

export function AddSystemWizard({ isOpen, onClose, homeId }: AddSystemWizardProps) {
  const [step, setStep] = useState(1);
  const [showHints, setShowHints] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    name: "",
    installYear: "",
    condition: "Unknown",
    notes: "",
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (data: typeof formData) => createSystem(homeId, {
      category: data.category,
      name: data.name,
      installYear: data.installYear ? parseInt(data.installYear) : undefined,
      condition: data.condition,
      notes: data.notes || undefined,
      source: "manual",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["systems", homeId] });
      toast({ title: "System added", description: `${formData.name} has been added to your home.` });
      handleClose();
    },
    onError: () => {
      toast({ title: "Error", description: "Could not add system.", variant: "destructive" });
    },
  });

  const handleClose = () => {
    setStep(1);
    setFormData({ category: "", name: "", installYear: "", condition: "Unknown", notes: "" });
    setShowHints(false);
    onClose();
  };

  const handleCategorySelect = (category: string) => {
    setFormData({ ...formData, category, name: formData.name || category });
    setStep(2);
  };

  const handleSubmit = () => {
    createMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Home System</DialogTitle>
          <DialogDescription>
            {step === 1 && "Choose the type of system you want to add."}
            {step === 2 && "Add details about your system."}
            {step === 3 && "Review and save."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Select a category</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowHints(!showHints)}
                className="text-xs"
              >
                <Info className="h-3 w-3 mr-1" />
                {showHints ? "Hide tips" : "Where to find"}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {systemCategories.map((category) => {
                const Icon = categoryIcons[category] || HelpCircle;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategorySelect(category)}
                    className="flex flex-col items-center gap-2 p-4 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors"
                    data-testid={`button-category-${category.toLowerCase().replace(/\//g, "-")}`}
                  >
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="text-xs text-center font-medium">{category}</span>
                  </button>
                );
              })}
            </div>
            {showHints && (
              <Card className="p-4 bg-muted/30 border-muted">
                <p className="text-sm font-medium mb-2">Where to find system info:</p>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {Object.entries(categoryHints).slice(0, 6).map(([cat, hint]) => (
                    <li key={cat}>
                      <span className="font-medium text-foreground">{cat}:</span> {hint}
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Badge variant="secondary">{formData.category}</Badge>
              <span className="text-xs text-muted-foreground">{categoryHints[formData.category]}</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">System Name</Label>
              <Input
                id="name"
                placeholder={`e.g., Main ${formData.category} - Carrier`}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-system-name"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="installYear">Install Year (optional)</Label>
                <Input
                  id="installYear"
                  type="number"
                  placeholder="2015"
                  value={formData.installYear}
                  onChange={(e) => setFormData({ ...formData, installYear: e.target.value })}
                  data-testid="input-install-year"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                  <SelectTrigger data-testid="select-condition">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {systemConditions.map((cond) => (
                      <SelectItem key={cond} value={cond}>{cond}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Brand, model, serial number, or any relevant details..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                data-testid="input-notes"
              />
            </div>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!formData.name}>
                Review
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Card className="p-4 bg-muted/30">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  {(() => {
                    const Icon = categoryIcons[formData.category] || HelpCircle;
                    return <Icon className="h-5 w-5 text-primary" />;
                  })()}
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <span className="ml-2">{formData.category}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Condition:</span>
                    <span className="ml-2">{formData.condition}</span>
                  </div>
                  {formData.installYear && (
                    <div>
                      <span className="text-muted-foreground">Installed:</span>
                      <span className="ml-2">{formData.installYear}</span>
                    </div>
                  )}
                </div>
                {formData.notes && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 text-foreground">{formData.notes}</p>
                  </div>
                )}
              </div>
            </Card>
            
            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button onClick={handleSubmit} disabled={createMutation.isPending} data-testid="button-save-system">
                {createMutation.isPending ? "Saving..." : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Add System
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
