// This file contains server actions for subscription management.
// These actions should be called from Next.js API Routes or Server Components.

import {
  stripe,
  getOrCreateStripeCustomer,
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  updateSubscriptionInDatabase,
} from '@/src/lib/stripe';
import { type SubscriptionStatus } from '@/types/subscription'; // Assuming you have this type

// Mock user data for demonstration. In a real app, this would come from NextAuth.js session.
interface MockUser {
  id: string;
  email: string;
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  stripeCustomerId: string | null;
}

// In a real app, this would fetch user from DB based on session
const mockUser: MockUser = {
  id: 'user_123',
  email: 'test@example.com',
  isPremium: false,
  premiumExpiresAt: null,
  stripeCustomerId: null, // This would be populated from DB
};

/**
 * Fetches the current subscription status for the authenticated user.
 * @returns The subscription status.
 */
export async function fetchUserSubscriptionStatus(): Promise<SubscriptionStatus> {
  // In a real app, you'd get the user ID from the session
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.id) {
  //   return { isPremium: false, currentPeriodEnd: null };
  // }
  // const userId = session.user.id;

  // Simulate fetching user from DB
  // const user = await prisma.user.findUnique({
  //   where: { id: userId },
  //   select: { isPremium: true, premiumExpiresAt: true, stripeCustomerId: true },
  // });

  // For mock:
  const user = mockUser;

  if (!user) {
    return { isPremium: false, currentPeriodEnd: null };
  }

  return {
    isPremium: user.isPremium,
    currentPeriodEnd: user.premiumExpiresAt?.toISOString() ?? null,
  };
}

/**
 * Initiates a Stripe Checkout session for a new subscription.
 * @param priceId The Stripe Price ID for the desired plan.
 * @param userId The ID of the user.
 * @param userEmail The email of the user.
 * @returns The URL to redirect the user to Stripe Checkout.
 */
export async function initiateStripeCheckout(priceId: string, userId: string, userEmail: string): Promise<{ url: string }> {
  try {
    const customer = await getOrCreateStripeCustomer(userId, userEmail);
    mockUser.stripeCustomerId = customer.id; // Update mock user

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL}/cancel`;

    const checkoutUrl = await createStripeCheckoutSession(
      customer.id,
      priceId,
      successUrl,
      cancelUrl
    );

    return { url: checkoutUrl };
  } catch (error: unknown) {
    console.error('Error in initiateStripeCheckout:', error);
    throw new Error('Failed to initiate subscription checkout.');
  }
}

/**
 * Creates a Stripe Customer Portal session for the user to manage their subscription.
 * @param userId The ID of the user.
 * @param userEmail The email of the user.
 * @returns The URL to redirect the user to the Stripe Customer Portal.
 */
export async function initiateStripeCustomerPortal(userId: string, userEmail: string): Promise<{ url: string }> {
  try {
    const customer = await getOrCreateStripeCustomer(userId, userEmail);
    mockUser.stripeCustomerId = customer.id; // Update mock user

    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscription`;

    const portalUrl = await createStripeCustomerPortalSession(
      customer.id,
      returnUrl
    );

    return { url: portalUrl };
  } catch (error: unknown) {
    console.error('Error in initiateStripeCustomerPortal:', error);
    throw new Error('Failed to initiate customer portal.');
  }
}

/**
 * Processes a Stripe Webhook event to update subscription status.
 * This function should be called by your Stripe webhook API route.
 * @param event The Stripe Event object.
 */
export async function handleStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const data = event.data.object as Stripe.Subscription | Stripe.Checkout.Session;

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = data as Stripe.Checkout.Session;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;

      if (session.mode === 'subscription' && customerId && subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata?.userId || mockUser.id; // Fallback to mock user ID
        const isPremium = subscription.status === 'active';
        const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

        await updateSubscriptionInDatabase(userId, isPremium, currentPeriodEnd);
        mockUser.isPremium = isPremium;
        mockUser.premiumExpiresAt = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
        console.log(`Checkout session completed for customer ${customerId}. Subscription ID: ${subscriptionId}`);
      }
      break;
    }
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const subscription = data as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const userId = subscription.metadata?.userId || mockUser.id; // Fallback to mock user ID
      const isPremium = subscription.status === 'active';
      const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

      await updateSubscriptionInDatabase(userId, isPremium, currentPeriodEnd);
      mockUser.isPremium = isPremium;
      mockUser.premiumExpiresAt = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
      console.log(`Subscription ${subscription.id} updated for customer ${customerId}. Status: ${subscription.status}`);
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = data as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const userId = subscription.metadata?.userId || mockUser.id; // Fallback to mock user ID

      await updateSubscriptionInDatabase(userId, false, null);
      mockUser.isPremium = false;
      mockUser.premiumExpiresAt = null;
      console.log(`Subscription ${subscription.id} deleted for customer ${customerId}.`);
      break;
    }
    default:
      console.log(`Unhandled event type ${event.type}`);
  }
}

