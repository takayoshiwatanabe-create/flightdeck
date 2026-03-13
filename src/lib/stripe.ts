import Stripe from 'stripe';

// Ensure Stripe is initialized only once
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
  typescript: true,
});

export { stripe };

/**
 * Retrieves a Stripe customer or creates a new one if not found.
 * @param userId The internal ID of the user.
 * @param email The user's email address.
 * @returns The Stripe Customer object.
 */
export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<Stripe.Customer> {
  // In a real application, you would first check your database
  // to see if you've already stored a Stripe customer ID for this userId.
  // For this example, we'll simulate checking and creating.

  // Simulate database lookup for existing customer
  // const existingCustomer = await prisma.user.findUnique({
  //   where: { id: userId },
  //   select: { stripeCustomerId: true },
  // });

  // if (existingCustomer?.stripeCustomerId) {
  //   const customer = await stripe.customers.retrieve(existingCustomer.stripeCustomerId);
  //   if (customer.deleted) {
  //     // Customer was deleted in Stripe, create a new one
  //     console.warn(`Stripe customer ${existingCustomer.stripeCustomerId} for user ${userId} was deleted. Creating new one.`);
  //   } else {
  //     return customer as Stripe.Customer;
  //   }
  // }

  // If no existing customer or it was deleted, create a new one
  const customer = await stripe.customers.create({
    email: email,
    metadata: {
      userId: userId,
    },
  });

  // In a real application, you would save this new customer.id to your database
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: { stripeCustomerId: customer.id },
  // });

  return customer;
}

/**
 * Creates a Stripe Checkout Session for a new subscription.
 * @param customerId The Stripe Customer ID.
 * @param priceId The Stripe Price ID for the subscription plan.
 * @param successUrl The URL to redirect to after successful checkout.
 * @param cancelUrl The URL to redirect to if checkout is cancelled.
 * @returns The URL of the Stripe Checkout Session.
 */
export async function createStripeCheckoutSession(
  customerId: string,
  priceId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      // Ensure client_reference_id is passed if you want to link back to your internal user ID
      // client_reference_id: userId,
    });

    if (!session.url) {
      throw new Error('Stripe Checkout session URL not found.');
    }
    return session.url;
  } catch (error: unknown) {
    console.error('Error creating Stripe Checkout session:', error);
    throw new Error('Failed to create Stripe Checkout session.');
  }
}

/**
 * Creates a Stripe Customer Portal Session for managing subscriptions.
 * @param customerId The Stripe Customer ID.
 * @param returnUrl The URL to return to after managing subscription.
 * @returns The URL of the Stripe Customer Portal Session.
 */
export async function createStripeCustomerPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    if (!session.url) {
      throw new Error('Stripe Customer Portal session URL not found.');
    }
    return session.url;
  } catch (error: unknown) {
    console.error('Error creating Stripe Customer Portal session:', error);
    throw new Error('Failed to create Stripe Customer Portal session.');
  }
}

/**
 * Handles Stripe Webhook events.
 * @param rawBody The raw request body from Stripe.
 * @param signature The 'stripe-signature' header.
 * @returns The Stripe Event object.
 */
export async function constructStripeWebhookEvent(rawBody: string | Buffer, signature: string): Promise<Stripe.Event> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new Error('Stripe webhook secret is not configured.');
  }

  try {
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
    return event;
  } catch (error: unknown) {
    console.error('Error constructing Stripe webhook event:', error);
    if (error instanceof Error) {
      throw new Error(`Webhook Error: ${error.message}`);
    }
    throw new Error('Unknown error constructing Stripe webhook event.');
  }
}

/**
 * Updates the user's subscription status in the database.
 * This is a placeholder and should be replaced with actual database logic (e.g., Prisma).
 * @param userId The internal ID of the user.
 * @param isPremium Whether the user is premium.
 * @param currentPeriodEnd The end date of the current subscription period (ISO string), or null if not premium.
 */
export async function updateSubscriptionInDatabase(
  userId: string,
  isPremium: boolean,
  currentPeriodEnd: string | null
): Promise<void> {
  console.log(`Updating subscription for user ${userId}: Premium=${isPremium}, PeriodEnd=${currentPeriodEnd}`);
  // In a real application, you would use Prisma to update your User model:
  // await prisma.user.update({
  //   where: { id: userId },
  //   data: {
  //     isPremium: isPremium,
  //     premiumExpiresAt: currentPeriodEnd ? new Date(currentPeriodEnd) : null,
  //   },
  // });
}

