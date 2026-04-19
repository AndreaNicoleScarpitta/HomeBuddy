/**
 * Billing routes — Stripe Checkout + Customer Portal
 *
 * Env vars used:
 *   STRIPE_PRICE_PLUS   — Stripe Price ID for the Plus tier
 *   STRIPE_PRICE_PRO    — Stripe Price ID for the Pro tier
 *
 * POST /api/billing/create-checkout-session { plan: "plus" | "pro" }
 * POST /api/billing/portal   — opens Stripe Customer Portal
 * GET  /api/billing/plans    — returns plan metadata (public)
 */

import type { Express, Request, Response } from "express";
import { isAuthenticated } from "./replit_integrations/auth";
import { getUncachableStripeClient } from "./stripeClient";
import { logger } from "./lib/logger";
import { db } from "./db";
import { sql } from "drizzle-orm";

const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceMonthly: 0,
    priceId: null,
    features: [
      "1 home",
      "Up to 10 active tasks",
      "Manual task entry",
      "Basic reminders",
      "Community support",
    ],
  },
  plus: {
    id: "plus",
    name: "Plus",
    priceMonthly: 9,
    priceId: process.env.STRIPE_PRICE_PLUS || null,
    features: [
      "Up to 3 homes",
      "Unlimited tasks",
      "AI task suggestions",
      "Document analysis (10/mo)",
      "Smart reminders",
      "Email support",
    ],
    popular: true,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceMonthly: 19,
    priceId: process.env.STRIPE_PRICE_PRO || null,
    features: [
      "Unlimited homes",
      "Unlimited tasks",
      "AI-powered home reports",
      "Unlimited document analysis",
      "Seasonal prep campaigns",
      "Priority support",
      "Early access to new features",
    ],
  },
};

function appUrl(): string {
  if (process.env.REPLIT_DEPLOYMENT_URL) return process.env.REPLIT_DEPLOYMENT_URL;
  if (process.env.REPLIT_DEV_DOMAIN) return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  return "http://localhost:5000";
}

export function registerBillingRoutes(app: Express): void {
  // Public — plan metadata for pricing page
  app.get("/api/billing/plans", (_req, res) => {
    const plansPublic = Object.values(PLANS).map((p) => ({
      id: p.id,
      name: p.name,
      priceMonthly: p.priceMonthly,
      features: p.features,
      popular: (p as any).popular || false,
      available: p.priceId !== null || p.id === "free",
    }));
    res.json(plansPublic);
  });

  app.post("/api/billing/create-checkout-session", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { plan } = req.body as { plan: "plus" | "pro" };
      const user = (req as any).user;

      const config = plan === "plus" ? PLANS.plus : plan === "pro" ? PLANS.pro : null;
      if (!config || !config.priceId) {
        return res.status(400).json({ error: "Invalid plan or pricing not configured. Set STRIPE_PRICE_PLUS / STRIPE_PRICE_PRO env vars." });
      }

      const stripe = await getUncachableStripeClient();

      // Look up or create Stripe customer
      let customerId: string | null = null;
      const existing = await db.execute(sql`
        SELECT stripe_customer_id FROM users WHERE id = ${user.id} LIMIT 1
      `);
      customerId = (existing.rows[0] as any)?.stripe_customer_id || null;

      if (!customerId && user.email) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || undefined,
          metadata: { userId: user.id },
        });
        customerId = customer.id;

        // Persist best-effort (tolerate schema missing the column)
        try {
          await db.execute(sql`
            UPDATE users SET stripe_customer_id = ${customerId} WHERE id = ${user.id}
          `);
        } catch (err: any) {
          logger.warn({ err: err?.message }, "users.stripe_customer_id not persisted (column may not exist yet)");
        }
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customerId || undefined,
        customer_email: customerId ? undefined : user.email,
        line_items: [{ price: config.priceId, quantity: 1 }],
        success_url: `${appUrl()}/profile?checkout=success&plan=${plan}`,
        cancel_url: `${appUrl()}/pricing?checkout=canceled`,
        allow_promotion_codes: true,
        subscription_data: {
          metadata: { userId: user.id, plan },
        },
      });

      res.json({ url: session.url, sessionId: session.id });
    } catch (err: any) {
      logger.error({ err: err?.message }, "Failed to create checkout session");
      res.status(500).json({ error: "Unable to start checkout" });
    }
  });

  app.post("/api/billing/portal", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const row = await db.execute(sql`
        SELECT stripe_customer_id FROM users WHERE id = ${user.id} LIMIT 1
      `);
      const customerId = (row.rows[0] as any)?.stripe_customer_id;
      if (!customerId) {
        return res.status(404).json({ error: "No Stripe customer on file" });
      }
      const stripe = await getUncachableStripeClient();
      const portal = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${appUrl()}/profile`,
      });
      res.json({ url: portal.url });
    } catch (err: any) {
      logger.error({ err: err?.message }, "Failed to open billing portal");
      res.status(500).json({ error: "Unable to open billing portal" });
    }
  });
}
