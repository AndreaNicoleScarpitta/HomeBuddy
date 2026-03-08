import { getUncachableStripeClient } from './stripeClient';

async function seedDonationProducts() {
  const stripe = await getUncachableStripeClient();

  const existing = await stripe.products.search({ query: "metadata['type']:'donation'" });
  if (existing.data.length > 0) {
    console.log('Donation products already exist:');
    for (const p of existing.data) {
      const prices = await stripe.prices.list({ product: p.id, active: true });
      for (const pr of prices.data) {
        console.log(`  ${p.name}: ${pr.id} ($${(pr.unit_amount || 0) / 100})`);
      }
    }
    return;
  }

  const tiers = [
    { name: 'Home Buddy Donation — $1', amount: 100, description: 'A small thank-you to keep Home Buddy free.' },
    { name: 'Home Buddy Donation — $5', amount: 500, description: 'Help cover hosting costs for Home Buddy.' },
    { name: 'Home Buddy Donation — $10', amount: 1000, description: 'A generous contribution to support Home Buddy development.' },
  ];

  for (const tier of tiers) {
    const product = await stripe.products.create({
      name: tier.name,
      description: tier.description,
      metadata: { type: 'donation' },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: tier.amount,
      currency: 'usd',
    });

    console.log(`Created: ${tier.name} -> product: ${product.id}, price: ${price.id}`);
  }

  console.log('Donation products seeded successfully.');
}

seedDonationProducts().catch(console.error);
