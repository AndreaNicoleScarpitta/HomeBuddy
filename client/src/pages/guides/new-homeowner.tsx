import { SeoPageLayout } from "@/components/seo-page-layout";
import { PAGE_SLUGS } from "@/lib/slug-registry";

export default function NewHomeowner() {
  return (
    <SeoPageLayout
      slug={PAGE_SLUGS.guideNewHomeowner}
      title="What to Maintain in a New House"
      description="First-time homeowner? Learn exactly what systems to maintain, how often, and what happens when you skip it. A no-stress guide to protecting your biggest investment."
    >
      <h1 className="text-4xl font-heading font-bold mb-4">
        What to Maintain in a New House: A First-Time Homeowner's Guide
      </h1>

      <div className="space-y-4 text-muted-foreground">
        <p>
          Congratulations — you just bought a home! Whether it's your first house or your first time being responsible for maintaining one, this is an exciting milestone. But once the moving boxes are unpacked and the celebration winds down, a new reality sets in: this place is entirely yours to take care of.
        </p>
        <p>
          Most new homeowners don't get a manual with their keys. You might not know what systems your home has, how often they need attention, or what happens when you let things slide. That uncertainty can feel overwhelming, especially when you're already adjusting to mortgage payments, a new neighborhood, and all the other changes that come with homeownership.
        </p>
        <p>
          The good news? Home maintenance isn't as complicated as it seems. This guide breaks your home down into 10 core systems, explains what to maintain and how often, and tells you exactly what's at stake if you skip it. By the end, you'll have a clear picture of what your home needs — and the confidence to stay on top of it.
        </p>
      </div>

      <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6 mt-12">
        The 10 Systems Every Homeowner Should Know
      </h2>

      <p className="text-muted-foreground mb-6">
        Your home is made up of interconnected systems that work together to keep you comfortable, safe, and dry. When one system is neglected, it often creates problems for others. Here's what you need to know about each one.
      </p>

      <div className="space-y-6">
        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">1. HVAC (Heating & Cooling)</h3>
          <p className="text-muted-foreground mb-3">
            Your HVAC system controls heating and cooling throughout your home. It's one of the most expensive systems to replace, so regular maintenance is essential.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Replace air filters every 1–3 months</li>
            <li>Schedule an annual professional tune-up (spring for AC, fall for heating)</li>
            <li>Clean the outdoor condenser unit — remove debris, trim vegetation back 2 feet</li>
            <li>Have ductwork inspected for leaks or buildup every few years</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Higher energy bills, reduced air quality, and premature compressor failure — a replacement costs $3,000–$7,000.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">2. Roof</h3>
          <p className="text-muted-foreground mb-3">
            Your roof is your home's first line of defense against the elements. Small problems become big problems fast if ignored.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Inspect twice yearly — once in spring and once in fall</li>
            <li>Look for missing, curling, or cracked shingles</li>
            <li>Clean gutters and downspouts to prevent water backup</li>
            <li>Trim overhanging tree branches that can damage shingles or drop debris</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Leaks, water damage to ceilings and walls, mold growth, and eventually a full roof replacement — $8,000–$15,000+.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">3. Plumbing</h3>
          <p className="text-muted-foreground mb-3">
            Your plumbing system delivers clean water and removes waste. Small leaks can cause major damage if left unchecked.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Check for leaks under sinks monthly</li>
            <li>Know where your main water shutoff valve is — and make sure it works</li>
            <li>Flush your water heater annually to remove sediment</li>
            <li>Inspect outdoor hose bibs before winter and disconnect hoses</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Water damage, mold behind walls, and burst pipes in winter that can cost thousands to repair.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">4. Electrical</h3>
          <p className="text-muted-foreground mb-3">
            Your electrical system powers everything in your home. Safety issues here can be life-threatening.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Test GFCI outlets monthly (the ones with "test" and "reset" buttons)</li>
            <li>Make sure your breaker panel is properly labeled</li>
            <li>Don't overload circuits with too many devices on one outlet</li>
            <li>Watch for flickering lights, warm outlets, or burning smells — these are red flags</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Fire hazard, electrical code violations, and shock risk for your family.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">5. Water Heater</h3>
          <p className="text-muted-foreground mb-3">
            Your water heater works quietly in the background until it doesn't. Knowing its age and condition prevents unpleasant surprises.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Flush the tank annually to clear sediment buildup</li>
            <li>Check the anode rod every 2–3 years (it protects the tank from corrosion)</li>
            <li>Know its age — tank water heaters last 8–12 years, tankless units 20+ years</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Sediment buildup reduces efficiency, leads to early failure, and a ruptured tank means flooding.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">6. Foundation</h3>
          <p className="text-muted-foreground mb-3">
            Your foundation supports your entire home. Issues here are among the most expensive to fix, but prevention is straightforward.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Check for cracks seasonally — small hairline cracks are normal, but monitor them</li>
            <li>Ensure proper grading: soil should slope away from the house on all sides</li>
            <li>Keep gutters and downspouts draining water well away from the foundation</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Structural damage, water intrusion into basements or crawlspaces, and costly underpinning repairs.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">7. Windows & Doors</h3>
          <p className="text-muted-foreground mb-3">
            Windows and doors are where your home meets the outside world. Keeping them sealed keeps your energy bills low and water out.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Check weather stripping annually and replace if worn or compressed</li>
            <li>Inspect exterior caulking around frames for gaps or cracks</li>
            <li>Clean weep holes on window sills so water can drain properly</li>
            <li>Operate all locks and latches to make sure they function smoothly</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Energy waste from drafts, higher utility bills, and water intrusion that damages walls and framing.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">8. Exterior (Siding, Paint, Deck)</h3>
          <p className="text-muted-foreground mb-3">
            Your home's exterior protects the structure underneath. It also drives curb appeal and property value.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Power wash siding and walkways annually</li>
            <li>Inspect for rot, damage, or pest entry points</li>
            <li>Re-stain or re-seal your deck every 2–3 years</li>
            <li>Touch up exterior paint before small chips become peeling sections</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Wood rot, pest entry (termites, carpenter ants), and curb appeal/value loss.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">9. Appliances</h3>
          <p className="text-muted-foreground mb-3">
            Your major appliances need periodic attention to run safely and last their full lifespan.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Clean the dryer vent annually — lint buildup is a serious fire hazard</li>
            <li>Vacuum refrigerator coils every 6–12 months for efficient cooling</li>
            <li>Run a dishwasher cleaner monthly to prevent buildup and odors</li>
            <li>Check washing machine hoses for bulges or cracks and replace every 3–5 years</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Dryer fires (2,900 per year in the US), premature appliance failure, and costly replacements.
          </p>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-2 text-foreground">10. Landscaping & Grading</h3>
          <p className="text-muted-foreground mb-3">
            What happens outside your home directly affects what happens inside. Proper landscaping is a defense system, not just decoration.
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Maintain proper drainage so water flows away from the house</li>
            <li>Keep plants and mulch at least 12 inches from the foundation</li>
            <li>Trim trees away from the roof and power lines</li>
            <li>Aerate your lawn annually to promote healthy root growth</li>
          </ul>
          <p className="text-sm italic text-orange-600 dark:text-orange-400 mt-3">
            Skip it: Foundation water damage, pest infestation from vegetation touching the house, and roof damage from falling branches.
          </p>
        </div>
      </div>

      <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6 mt-12">
        Your First 30 Days in a New Home
      </h2>

      <p className="text-muted-foreground mb-4">
        Don't try to do everything at once. Focus on these essential tasks during your first month to set yourself up for success:
      </p>

      <ol className="list-decimal list-inside space-y-3 text-muted-foreground">
        <li>Locate and label your main water shutoff, gas shutoff, and breaker panel</li>
        <li>Change all HVAC filters</li>
        <li>Test every smoke and CO detector (replace batteries if needed)</li>
        <li>Check the water heater temperature (120°F is recommended)</li>
        <li>Inspect the attic and crawlspace for signs of leaks, pests, or insulation issues</li>
        <li>Walk the exterior perimeter — note any cracks, gaps, or drainage issues</li>
        <li>Schedule a pest inspection if one wasn't part of your home inspection</li>
        <li>Document the age and model of major systems (HVAC, water heater, roof)</li>
      </ol>

      <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6 mt-12">
        When to DIY vs. Call a Pro
      </h2>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Safe to DIY</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Changing HVAC filters</li>
            <li>Caulking windows and doors</li>
            <li>Testing smoke and CO detectors</li>
            <li>Cleaning gutters</li>
            <li>Power washing siding and walkways</li>
            <li>Basic drain clearing</li>
          </ul>
        </div>
        <div className="rounded-lg bg-muted/30 p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Call a Pro</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Electrical panel work</li>
            <li>Gas line issues</li>
            <li>Roof repairs</li>
            <li>HVAC refrigerant handling</li>
            <li>Foundation cracks</li>
            <li>Plumbing behind walls</li>
          </ul>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mt-4">
        When in doubt, safety is priority number one. If a task involves electricity, gas, structural elements, or heights, it's worth the cost to hire a licensed professional.
      </p>

      <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6 mt-12">
        Let Home Buddy Keep Track For You
      </h2>

      <p className="text-muted-foreground">
        You don't need to memorize all of this. Home Buddy asks about your specific home systems and generates a personalized maintenance schedule tailored to your house. It tells you what's safe to DIY, what needs a pro, and when each task is due — so nothing falls through the cracks and you can focus on enjoying your new home.
      </p>
    </SeoPageLayout>
  );
}
