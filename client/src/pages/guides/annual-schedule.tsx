import { SeoPageLayout } from "@/components/seo-page-layout";
import { PAGE_SLUGS } from "@/lib/slug-registry";

export default function AnnualSchedule() {
  return (
    <SeoPageLayout
      slug={PAGE_SLUGS.guideAnnualSchedule}
      title="Annual Home Maintenance Schedule"
      description="A complete yearly home maintenance schedule organized by season. Plan ahead for every inspection, service, and repair your home needs."
    >
      <h1 className="text-4xl font-heading font-bold mb-4">
        Annual Home Maintenance Schedule
      </h1>

      <p className="text-lg text-muted-foreground leading-relaxed mb-4">
        Owning a home means staying ahead of wear and tear — and the best way to do that is with a structured annual home maintenance schedule. Without one, small problems quietly grow into expensive emergencies. The average homeowner spends $3,000+ per year on emergency repairs that proper maintenance could prevent.
      </p>

      <p className="text-lg text-muted-foreground leading-relaxed mb-4">
        A yearly home maintenance calendar keeps every system in your house running longer and more efficiently. From your HVAC and water heater to your roof and foundation, each component has an ideal service window. Hitting those windows consistently is what separates a well-maintained home from one that drains your savings.
      </p>

      <p className="text-lg text-muted-foreground leading-relaxed mb-10">
        This home maintenance calendar breaks every critical task into four seasons so you always know what to focus on next. Use it as your baseline — then customize it to match your home's specific systems and climate.
      </p>

      <div className="space-y-10">
        <div className="rounded-lg bg-muted/30 p-6">
          <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6">
            Spring — Inspect and Refresh
          </h2>
          <p className="text-muted-foreground mb-6">
            As temperatures rise, spring is the ideal time to assess winter damage, open up the house, and prepare outdoor systems for the warmer months ahead.
          </p>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Exterior</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li>Inspect roof shingles for cracks, curling, or missing pieces</li>
            <li>Clean gutters and downspouts to ensure proper drainage</li>
            <li>Check the foundation for new cracks or signs of settling</li>
            <li>Power wash siding, walkways, and driveways</li>
            <li>Service the sprinkler system and check for broken heads</li>
            <li>Inspect deck and patio surfaces for rot, loose boards, or damage</li>
            <li>Trim trees and vegetation away from the house and roofline</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Interior</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Replace HVAC filters and schedule an AC tune-up</li>
            <li>Test all smoke detectors and carbon monoxide detectors</li>
            <li>Check the water heater anode rod for corrosion</li>
            <li>Inspect plumbing connections and pipes under all sinks</li>
            <li>Deep clean the kitchen exhaust hood and filter</li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6">
            Summer — Maintain and Protect
          </h2>
          <p className="text-muted-foreground mb-6">
            Summer is the season to tackle outdoor projects, maintain landscaping, and handle tasks that benefit from warm, dry weather.
          </p>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Exterior</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li>Maintain lawn, landscaping, and garden beds regularly</li>
            <li>Inspect the driveway for cracks and apply sealant as needed</li>
            <li>Check exterior paint and stain for peeling or fading</li>
            <li>Clean the outdoor HVAC condenser unit of debris and dirt</li>
            <li>Inspect window and door screens for tears or damage</li>
            <li>Check yard grading and drainage to prevent water pooling near the foundation</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Interior</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Clean the dryer vent and exhaust duct thoroughly</li>
            <li>Inspect attic insulation and ventilation for efficiency</li>
            <li>Flush the water heater to remove sediment buildup</li>
            <li>Test all GFCI outlets in kitchens, bathrooms, and outdoors</li>
            <li>Check and refresh caulking in bathrooms and kitchen</li>
            <li>Service the garbage disposal with cleaning and blade maintenance</li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6">
            Fall — Prepare and Seal
          </h2>
          <p className="text-muted-foreground mb-6">
            Fall is your last chance to button up the house before cold weather arrives. Focus on winterization, heating prep, and preventing moisture intrusion.
          </p>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Exterior</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li>Clean gutters and downspouts again after leaves have fallen</li>
            <li>Winterize outdoor faucets, hoses, and sprinkler systems</li>
            <li>Seal gaps and cracks around windows and doors with weatherstripping or caulk</li>
            <li>Inspect the roof for damage before winter storms</li>
            <li>Aerate and fertilize the lawn for spring recovery</li>
            <li>Store outdoor furniture, grills, and seasonal equipment</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Interior</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Schedule a professional furnace tune-up and inspection</li>
            <li>Reverse ceiling fan direction to clockwise for heat circulation</li>
            <li>Test the heating system before cold weather sets in</li>
            <li>Check insulation in the attic, basement, and crawl spaces</li>
            <li>Clean and prepare the humidifier for winter use</li>
            <li>Inspect the chimney and fireplace — schedule a sweep if needed</li>
          </ul>
        </div>

        <div className="rounded-lg bg-muted/30 p-6">
          <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6">
            Winter — Monitor and Plan
          </h2>
          <p className="text-muted-foreground mb-6">
            Winter is about protecting your home from harsh conditions, staying safe, and planning ahead for the maintenance season to come.
          </p>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Exterior</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-6">
            <li>Prevent ice dams by keeping the attic cold and gutters clear</li>
            <li>Clear snow and ice from vents, exhausts, and dryer outlets</li>
            <li>Check for icicle formation that may signal insulation problems</li>
            <li>Inspect weather stripping on all exterior doors</li>
            <li>Monitor for frozen pipe signs — reduced water flow or visible frost on pipes</li>
          </ul>

          <h3 className="text-lg font-semibold mb-3 text-foreground">Interior</h3>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Test backup power systems such as generators or battery backups</li>
            <li>Check fire extinguishers for charge and expiration dates</li>
            <li>Inspect exposed pipes for condensation or slow leaks</li>
            <li>Plan spring projects and gather estimates from contractors</li>
            <li>Review your maintenance log and update records for completed tasks</li>
          </ul>
        </div>
      </div>

      <div className="mt-12">
        <h2 className="text-2xl font-heading font-semibold border-b pb-2 mb-6">
          Your Home Is Unique — Your Schedule Should Be Too
        </h2>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Generic checklists are a great starting point, but they miss the specifics that matter most: your AC model's recommended service interval, your roof's age and warranty timeline, your water heater's ideal flush schedule. Every home has different systems installed at different times, and a one-size-fits-all calendar can't account for that. Home Buddy creates a personalized annual maintenance schedule based on your actual systems and their install dates — so you get reminders tailored to your home, not someone else's.
        </p>
      </div>
    </SeoPageLayout>
  );
}
