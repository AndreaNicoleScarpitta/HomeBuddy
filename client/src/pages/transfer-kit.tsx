import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getHome, getSystems } from "@/lib/api";
import { differenceInDays, format } from "date-fns";
import {
  Printer, Home, Layers, Shield, Zap, ShieldCheck,
  Droplets, Flame, AlertTriangle, CheckCircle2, Clock,
} from "lucide-react";
import { useEffect } from "react";
import { trackSlugPageView } from "@/lib/analytics";
import { PAGE_SLUGS } from "@/lib/slug-registry";

// Legacy API fetch (these pages use numeric homeId)
async function legacyGet(url: string) {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`${res.status}`);
  return res.json();
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section className="mb-8 print:mb-6 break-inside-avoid">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b">
        <Icon className="h-4 w-4 text-primary shrink-0" />
        <h2 className="font-semibold text-base">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm py-1 border-b border-dashed border-muted last:border-0">
      <span className="text-muted-foreground w-40 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function warrantyBadge(expiryDate: string | null | undefined) {
  if (!expiryDate) return <Badge variant="outline" className="text-xs">No expiry</Badge>;
  const days = differenceInDays(new Date(expiryDate), new Date());
  if (days < 0) return <Badge variant="destructive" className="text-xs">Expired</Badge>;
  if (days < 90) return <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-xs">{days}d left</Badge>;
  return <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">Active</Badge>;
}

export default function TransferKitPage() {
  useEffect(() => { trackSlugPageView(PAGE_SLUGS.transferKit); }, []);

  const { data: v2Home, isLoading: homeLoading } = useQuery({ queryKey: ["home"], queryFn: getHome });
  const legacyId = v2Home?.legacyId;

  const { data: legacyHome } = useQuery({
    queryKey: ["legacyHome", legacyId],
    queryFn: () => legacyGet("/api/home"),
    enabled: !!legacyId,
  });

  const { data: systems = [] } = useQuery({
    queryKey: ["systems", legacyId],
    queryFn: () => legacyGet(`/api/home/${legacyId}/systems`),
    enabled: !!legacyId,
  });

  const { data: warranties = [] } = useQuery({
    queryKey: ["warranties", legacyId],
    queryFn: () => legacyGet(`/api/home/${legacyId}/warranties`),
    enabled: !!legacyId,
  });

  const { data: utilities = [] } = useQuery({
    queryKey: ["utilities", legacyId],
    queryFn: () => legacyGet(`/api/home/${legacyId}/utilities`),
    enabled: !!legacyId,
  });

  const { data: insurance = [] } = useQuery({
    queryKey: ["insurance", legacyId],
    queryFn: () => legacyGet(`/api/home/${legacyId}/insurance`),
    enabled: !!legacyId,
  });

  const { data: tasksData = [] } = useQuery({
    queryKey: ["tasks", legacyId],
    queryFn: () => legacyGet(`/api/home/${legacyId}/tasks`),
    enabled: !!legacyId,
  });

  const home = legacyHome ?? v2Home;
  const currentYear = new Date().getFullYear();
  const completedTasks = tasksData.filter((t: any) => t.completedAt || t.status === "completed");
  const openTasks = tasksData.filter((t: any) => !t.completedAt && t.status !== "completed");

  if (homeLoading) {
    return (
      <Layout>
        <div className="space-y-4 max-w-3xl">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </Layout>
    );
  }

  const address = [home?.streetAddress || home?.address, home?.city, home?.state, home?.zipCode].filter(Boolean).join(", ") || "Address not set";

  return (
    <Layout>
      <div className="max-w-3xl">
        {/* Toolbar — hidden when printing */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <div>
            <h1 className="text-3xl font-heading font-bold">Home Transfer Kit</h1>
            <p className="text-muted-foreground text-sm mt-1">A complete record of your home — share with buyers, agents, or your next owner.</p>
          </div>
          <Button onClick={() => window.print()} className="gap-2 shrink-0">
            <Printer className="h-4 w-4" />
            Print / Save PDF
          </Button>
        </div>

        {/* Print header — only visible when printing */}
        <div className="hidden print:block mb-6 pb-4 border-b">
          <h1 className="text-2xl font-bold">Home Transfer Kit</h1>
          <p className="text-muted-foreground text-sm">{address}</p>
          <p className="text-muted-foreground text-xs mt-1">Generated {format(new Date(), "MMMM d, yyyy")}</p>
        </div>

        {/* Home Summary */}
        <Section title="Property" icon={Home}>
          <Row label="Address" value={address} />
          <Row label="Year Built" value={home?.builtYear} />
          <Row label="Size" value={home?.sqFt ? `${home.sqFt} sq ft` : undefined} />
          <Row label="Type" value={home?.type} />
          <Row label="Beds / Baths" value={home?.beds || home?.baths ? `${home?.beds ?? "?"} bed / ${home?.baths ?? "?"} bath` : undefined} />
          <Row label="Lot Size" value={home?.lotSize ? `${home.lotSize} sq ft` : undefined} />
        </Section>

        {/* Emergency Shutoffs */}
        {(v2Home?.waterShutoffLocation || v2Home?.gasShutoffLocation || v2Home?.electricalPanelLocation) && (
          <Section title="Emergency Shutoffs" icon={AlertTriangle}>
            {v2Home.waterShutoffLocation && (
              <div className="flex gap-2 items-start text-sm py-1 border-b border-dashed border-muted last:border-0">
                <Droplets className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground w-36 shrink-0">Main Water</span>
                <span className="font-medium">{v2Home.waterShutoffLocation}</span>
              </div>
            )}
            {v2Home.gasShutoffLocation && (
              <div className="flex gap-2 items-start text-sm py-1 border-b border-dashed border-muted last:border-0">
                <Flame className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground w-36 shrink-0">Gas Meter</span>
                <span className="font-medium">{v2Home.gasShutoffLocation}</span>
              </div>
            )}
            {v2Home.electricalPanelLocation && (
              <div className="flex gap-2 items-start text-sm py-1 border-b border-dashed border-muted last:border-0">
                <Zap className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
                <span className="text-muted-foreground w-36 shrink-0">Electrical Panel</span>
                <span className="font-medium">{v2Home.electricalPanelLocation}</span>
              </div>
            )}
          </Section>
        )}

        {/* Systems */}
        {systems.length > 0 && (
          <Section title={`Systems & Appliances (${systems.length})`} icon={Layers}>
            <div className="space-y-3">
              {systems.map((s: any) => (
                <div key={s.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{s.name}</span>
                    {s.installYear && (
                      <span className="text-muted-foreground text-xs">
                        {s.installYear} · {currentYear - s.installYear} yr old
                      </span>
                    )}
                  </div>
                  {(s.make || s.model) && (
                    <p className="text-muted-foreground text-xs">{[s.make, s.model, s.serialNumber ? `S/N: ${s.serialNumber}` : ""].filter(Boolean).join(" · ")}</p>
                  )}
                  {s.condition && s.condition !== "Unknown" && (
                    <p className="text-muted-foreground text-xs">Condition: {s.condition}</p>
                  )}
                  {s.notes && <p className="text-muted-foreground text-xs mt-0.5 italic">{s.notes}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Warranties */}
        {warranties.length > 0 && (
          <Section title={`Warranties (${warranties.length})`} icon={Shield}>
            <div className="space-y-2">
              {warranties.map((w: any) => (
                <div key={w.id} className="text-sm flex items-start justify-between gap-2">
                  <div>
                    <span className="font-medium">{w.warrantyProvider || "Warranty"}</span>
                    <span className="text-muted-foreground ml-2 text-xs capitalize">{(w.warrantyType || "other").replace("-", " ")}</span>
                    {w.coverageSummary && <p className="text-muted-foreground text-xs">{w.coverageSummary}</p>}
                    {w.expiryDate && <p className="text-muted-foreground text-xs">Expires: {format(new Date(w.expiryDate), "MMM d, yyyy")}</p>}
                    {w.isTransferable && <p className="text-xs text-blue-600">✓ Transferable</p>}
                  </div>
                  {warrantyBadge(w.expiryDate)}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Utilities */}
        {utilities.length > 0 && (
          <Section title={`Utility Accounts (${utilities.length})`} icon={Zap}>
            <div className="space-y-2">
              {utilities.map((u: any) => (
                <div key={u.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{u.utilityType}</span>
                    {u.averageMonthlyBill && <span className="text-muted-foreground text-xs">~${u.averageMonthlyBill}/mo</span>}
                  </div>
                  {u.provider && <p className="text-muted-foreground text-xs">{u.provider}{u.accountNumber ? ` · Account: ${u.accountNumber}` : ""}</p>}
                  {u.serviceAddress && <p className="text-muted-foreground text-xs">{u.serviceAddress}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Insurance */}
        {insurance.length > 0 && (
          <Section title={`Insurance Policies (${insurance.length})`} icon={ShieldCheck}>
            <div className="space-y-2">
              {insurance.map((ins: any) => (
                <div key={ins.id} className="text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium capitalize">{ins.policyType?.replace(/_/g, " ")}</span>
                    {ins.renewalDate && <span className="text-muted-foreground text-xs">Renews: {format(new Date(ins.renewalDate), "MMM d, yyyy")}</span>}
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {ins.carrier}
                    {ins.policyNumber ? ` · Policy: ${ins.policyNumber}` : ""}
                    {ins.premiumAmount ? ` · $${ins.premiumAmount}/${ins.premiumFrequency ?? "yr"}` : ""}
                  </p>
                  {ins.agentName && <p className="text-muted-foreground text-xs">Agent: {ins.agentName}{ins.agentPhone ? ` · ${ins.agentPhone}` : ""}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Maintenance History */}
        {completedTasks.length > 0 && (
          <Section title={`Maintenance History (${completedTasks.length} completed)`} icon={CheckCircle2}>
            <div className="space-y-1">
              {completedTasks.slice(0, 30).map((t: any) => (
                <div key={t.id} className="text-sm flex items-center justify-between py-0.5 border-b border-dashed border-muted last:border-0">
                  <span>{t.title}</span>
                  {t.completedAt && <span className="text-muted-foreground text-xs shrink-0 ml-2">{format(new Date(t.completedAt), "MMM yyyy")}</span>}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Open Tasks */}
        {openTasks.length > 0 && (
          <Section title={`Known Open Items (${openTasks.length})`} icon={Clock}>
            <p className="text-xs text-muted-foreground mb-2">These tasks were identified but not yet completed at time of transfer.</p>
            <div className="space-y-1">
              {openTasks.map((t: any) => (
                <div key={t.id} className="text-sm flex items-center justify-between py-0.5 border-b border-dashed border-muted last:border-0">
                  <span>{t.title}</span>
                  {t.urgency && t.urgency !== "later" && (
                    <Badge variant={t.urgency === "now" ? "destructive" : "outline"} className="text-xs shrink-0 ml-2">
                      {t.urgency}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Footer */}
        <div className="mt-8 pt-4 border-t text-xs text-muted-foreground print:block">
          <p>Generated by Home Buddy · homebuddy.space · {format(new Date(), "MMMM d, yyyy")}</p>
          <p className="mt-1">This document is for informational purposes only. Verify all systems and warranties with the appropriate providers.</p>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { font-size: 12px; }
          nav, header, .print\\:hidden { display: none !important; }
          aside { display: none !important; }
          main { padding: 0 !important; overflow: visible !important; }
          .max-w-3xl { max-width: 100% !important; }
        }
      `}</style>
    </Layout>
  );
}
