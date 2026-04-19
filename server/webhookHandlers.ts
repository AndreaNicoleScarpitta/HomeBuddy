import { getStripeSync, getUncachableStripeClient } from './stripeClient';
import { AgentRunner } from './agents/runner';
import { logger } from './lib/logger';

export class WebhookHandlers {
  static async processWebhook(payload: Buffer, signature: string): Promise<void> {
    if (!Buffer.isBuffer(payload)) {
      throw new Error(
        'STRIPE WEBHOOK ERROR: Payload must be a Buffer. ' +
        'Received type: ' + typeof payload + '. ' +
        'Ensure webhook route is registered BEFORE app.use(express.json()).'
      );
    }

    const sync = await getStripeSync();
    await sync.processWebhook(payload, signature);

    // Also parse the event ourselves to trigger agents (dunning, etc.)
    // We re-verify the signature via the Stripe client — redundant but safe.
    try {
      const stripe = await getUncachableStripeClient();
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
      let event: any;
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      } else {
        // Fall back to parsing the already-verified body — stripe-replit-sync
        // verified it above, so we trust the envelope here.
        event = JSON.parse(payload.toString('utf8'));
      }

      if (event.type === 'invoice.payment_failed') {
        await handleInvoicePaymentFailed(event.data.object);
      }
    } catch (err: any) {
      logger.warn({ err: err?.message }, 'Post-webhook agent trigger failed (non-fatal)');
    }
  }
}

async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  const email = invoice?.customer_email;
  if (!email) {
    logger.info('invoice.payment_failed: no customer_email, skipping dunning');
    return;
  }

  const attemptCount = Math.min(Math.max(invoice.attempt_count || 1, 1), 3);
  const amount = invoice.amount_due || invoice.amount_remaining || 0;
  const currency = invoice.currency || 'usd';
  const firstName = invoice.customer_name?.split(' ')[0] || null;

  // Generate Stripe customer portal link
  let updatePaymentUrl = '';
  try {
    const stripe = await getUncachableStripeClient();
    const portal = await stripe.billingPortal.sessions.create({
      customer: invoice.customer,
      return_url: process.env.REPLIT_DEPLOYMENT_URL
        ? `${process.env.REPLIT_DEPLOYMENT_URL}/profile`
        : 'http://localhost:5000/profile',
    });
    updatePaymentUrl = portal.url;
  } catch (err: any) {
    logger.warn({ err: err?.message }, 'Failed to create billing portal — dunning email will use fallback link');
  }

  AgentRunner.run('dunning-agent', {
    stripeCustomerId: invoice.customer,
    email,
    firstName,
    amount,
    currency,
    attemptCount,
    updatePaymentUrl,
  }, 'webhook:stripe').catch((err) => {
    logger.error({ err: err?.message }, 'dunning-agent trigger failed');
  });
}
