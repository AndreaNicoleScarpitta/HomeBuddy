import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Home, MapPin, Calendar, Maximize, Bed, Bath, ExternalLink, Pencil } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateHome } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { Home as HomeType, System } from "@shared/schema";

interface HomeInfoCardProps {
  home: HomeType;
  systems: System[];
}

export function HomeInfoCard({ home, systems }: HomeInfoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    builtYear: home.builtYear?.toString() || "",
    sqFt: home.sqFt?.toString() || "",
    beds: home.beds?.toString() || "",
    baths: home.baths?.toString() || "",
    zillowUrl: home.zillowUrl || "",
  });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateMutation = useMutation({
    mutationFn: (data: Partial<HomeType>) => updateHome(home.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["home"] });
      setIsEditing(false);
      toast({ title: "Home updated", description: "Your home information has been saved." });
    },
    onError: () => {
      toast({ title: "Error", description: "Could not update home info.", variant: "destructive" });
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      builtYear: editData.builtYear ? parseInt(editData.builtYear) : undefined,
      sqFt: editData.sqFt ? parseInt(editData.sqFt) : undefined,
      beds: editData.beds ? parseInt(editData.beds) : undefined,
      baths: editData.baths ? parseInt(editData.baths) : undefined,
      zillowUrl: editData.zillowUrl || undefined,
    });
  };

  const homeAge = home.builtYear ? new Date().getFullYear() - home.builtYear : null;
  const location = home.city && home.state ? `${home.city}, ${home.state}` : home.address?.split(",").slice(-2).join(",").trim() || "Location not set";

  const systemTags = systems.slice(0, 3).map(s => s.category || s.name);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            Home Information
          </CardTitle>
          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" data-testid="button-edit-home">
                <Pencil className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Home Details</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="builtYear">Year Built</Label>
                    <Input
                      id="builtYear"
                      type="number"
                      placeholder="1990"
                      value={editData.builtYear}
                      onChange={(e) => setEditData({ ...editData, builtYear: e.target.value })}
                      data-testid="input-built-year"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sqFt">Square Feet</Label>
                    <Input
                      id="sqFt"
                      type="number"
                      placeholder="2000"
                      value={editData.sqFt}
                      onChange={(e) => setEditData({ ...editData, sqFt: e.target.value })}
                      data-testid="input-sqft"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="beds">Bedrooms</Label>
                    <Input
                      id="beds"
                      type="number"
                      placeholder="3"
                      value={editData.beds}
                      onChange={(e) => setEditData({ ...editData, beds: e.target.value })}
                      data-testid="input-beds"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="baths">Bathrooms</Label>
                    <Input
                      id="baths"
                      type="number"
                      step="0.5"
                      placeholder="2"
                      value={editData.baths}
                      onChange={(e) => setEditData({ ...editData, baths: e.target.value })}
                      data-testid="input-baths"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zillowUrl">Zillow URL (optional)</Label>
                  <Input
                    id="zillowUrl"
                    type="url"
                    placeholder="https://zillow.com/homedetails/..."
                    value={editData.zillowUrl}
                    onChange={(e) => setEditData({ ...editData, zillowUrl: e.target.value })}
                    data-testid="input-zillow-url"
                  />
                  <p className="text-xs text-muted-foreground">Paste your Zillow listing URL to import home details</p>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button onClick={handleSave} disabled={updateMutation.isPending} data-testid="button-save-home">
                  {updateMutation.isPending ? "Saving..." : "Save"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate" data-testid="text-location">{location}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {homeAge !== null && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold" data-testid="text-home-age">{homeAge} yrs</p>
                <p className="text-xs text-muted-foreground">Built {home.builtYear}</p>
              </div>
            </div>
          )}
          {home.sqFt && (
            <div className="flex items-center gap-2">
              <Maximize className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold" data-testid="text-sqft">{home.sqFt.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">sq ft</p>
              </div>
            </div>
          )}
          {home.beds && (
            <div className="flex items-center gap-2">
              <Bed className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold" data-testid="text-beds">{home.beds}</p>
                <p className="text-xs text-muted-foreground">beds</p>
              </div>
            </div>
          )}
          {home.baths && (
            <div className="flex items-center gap-2">
              <Bath className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-lg font-bold" data-testid="text-baths">{home.baths}</p>
                <p className="text-xs text-muted-foreground">baths</p>
              </div>
            </div>
          )}
        </div>

        {systemTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {systemTags.map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {systems.length > 3 && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                +{systems.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {home.zillowUrl && (
          <a
            href={home.zillowUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            data-testid="link-zillow"
          >
            View on Zillow <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
