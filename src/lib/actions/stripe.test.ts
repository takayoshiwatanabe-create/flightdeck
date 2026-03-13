import Stripe from 'stripe';
import { auth } from '@/src/auth';
import { prisma } from '@/src/lib/prisma';
import {
  createStripeCheckoutSession,
  createStripeCustomerPortalSession,
  fetchSubscriptionStatus,
} from './stripe';

// Mock external dependencies
jest.mock('stripe');
jest.mock('@/src/auth');
jest.mock('@/src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

const mockStripe = new Stripe('sk_test_mock');
(Stripe as jest.Mock).mockImplementation(() => mockStripe);

describe('Stripe Actions', () => {
  const mockUserId = 'user123';
  const mockUserEmail = 'test@example.com';
  const mockStripeCustomerId = 'cus_mock123';

  beforeEach(() => {
    jest.clearAllMocks();
    (auth as jest.Mock).mockResolvedValue({ user: { id: mockUserId, email: mockUserEmail } });
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: mockUserId,
      email: mockUserEmail,
      stripeCustomerId: mockStripeCustomerId,
      subscriptionStatus: null,
      currentPeriodEnd: null,
    });
    (mockStripe.customers.create as jest.Mock).mockResolvedValue({ id: mockStripeCustomerId });
  });

  describe('createStripeCheckoutSession', () => {
    const mockPriceId = 'price_123';
    const mockCheckoutSessionUrl = 'https://checkout.stripe.com/session_123';

    it('should create a checkout session for an existing customer', async () => {
      (mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({ url: mockCheckoutSessionUrl });

      const result = await createStripeCheckoutSession(mockPriceId);

      expect(auth).toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUserId } });
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        customer: mockStripeCustomerId,
        line_items: [{ price: mockPriceId, quantity: 1 }],
        mode: 'subscription',
        success_url: expect.any(String),
        cancel_url: expect.any(String),
      });
      expect(result).toEqual({ url: mockCheckoutSessionUrl });
    });

    it('should create a new Stripe customer if one does not exist', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        stripeCustomerId: null, // No customer ID
      });
      (mockStripe.checkout.sessions.create as jest.Mock).mockResolvedValue({ url: mockCheckoutSessionUrl });

      const result = await createStripeCheckoutSession(mockPriceId);

      expect(mockStripe.customers.create).toHaveBeenCalledWith({ email: mockUserEmail });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { stripeCustomerId: mockStripeCustomerId },
      });
      expect(result).toEqual({ url: mockCheckoutSessionUrl });
    });

    it('should return null if user is not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);
      const result = await createStripeCheckoutSession(mockPriceId);
      expect(result).toBeNull();
      expect(mockStripe.checkout.sessions.create).not.toHaveBeenCalled();
    });

    it('should return null if Stripe API call fails', async () => {
      (mockStripe.checkout.sessions.create as jest.Mock).mockRejectedValue(new Error('Stripe error'));
      const result = await createStripeCheckoutSession(mockPriceId);
      expect(result).toBeNull();
    });
  });

  describe('createStripeCustomerPortalSession', () => {
    const mockPortalSessionUrl = 'https://billing.stripe.com/portal_123';

    it('should create a customer portal session for an existing customer', async () => {
      (mockStripe.billingPortal.sessions.create as jest.Mock).mockResolvedValue({ url: mockPortalSessionUrl });

      const result = await createStripeCustomerPortalSession();

      expect(auth).toHaveBeenCalled();
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: mockUserId } });
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: mockStripeCustomerId,
        return_url: expect.any(String),
      });
      expect(result).toEqual({ url: mockPortalSessionUrl });
    });

    it('should return null if user is not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);
      const result = await createStripeCustomerPortalSession();
      expect(result).toBeNull();
      expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
    });

    it('should return null if user has no Stripe customer ID', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        stripeCustomerId: null,
      });
      const result = await createStripeCustomerPortalSession();
      expect(result).toBeNull();
      expect(mockStripe.billingPortal.sessions.create).not.toHaveBeenCalled();
    });

    it('should return null if Stripe API call fails', async () => {
      (mockStripe.billingPortal.sessions.create as jest.Mock).mockRejectedValue(new Error('Stripe error'));
      const result = await createStripeCustomerPortalSession();
      expect(result).toBeNull();
    });
  });

  describe('fetchSubscriptionStatus', () => {
    it('should return premium status if user has active subscription', async () => {
      const mockEndDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString();
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        stripeCustomerId: mockStripeCustomerId,
        subscriptionStatus: 'active',
        currentPeriodEnd: new Date(mockEndDate),
      });

      const result = await fetchSubscriptionStatus();
      expect(result).toEqual({ isPremium: true, currentPeriodEnd: mockEndDate });
    });

    it('should return free status if user has no subscription', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: mockUserId,
        email: mockUserEmail,
        stripeCustomerId: mockStripeCustomerId,
        subscriptionStatus: null,
        currentPeriodEnd: null,
      });

      const result = await fetchSubscriptionStatus();
      expect(result).toEqual({ isPremium: false, currentPeriodEnd: null });
    });

    it('should return free status if user is not authenticated', async () => {
      (auth as jest.Mock).mockResolvedValueOnce(null);
      const result = await fetchSubscriptionStatus();
      expect(result).toEqual({ isPremium: false, currentPeriodEnd: null });
    });

    it('should handle database errors gracefully', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('DB error'));
      const result = await fetchSubscriptionStatus();
      expect(result).toEqual({ isPremium: false, currentPeriodEnd: null });
    });
  });
});

