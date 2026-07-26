import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../utils/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLAN_PRICES: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  clinic: process.env.STRIPE_PRICE_CLINIC || '',
};

const PLAN_NAMES: Record<string, string> = {
  basic: 'Basic',
  pro: 'Pro',
  clinic: 'Clinic',
};

// ─── POST /api/billing/create-checkout ───────────────────────────────────────
router.post('/create-checkout', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLAN_PRICES[plan]) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Get or create Stripe customer
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user!.userId)
      .single();

    const { data: user } = await supabase
      .from('users')
      .select('email, name')
      .eq('id', req.user!.userId)
      .single();

    let customerId = subscription?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user?.email,
        name: user?.name,
        metadata: { userId: req.user!.userId },
      });
      customerId = customer.id;

      await supabase
        .from('subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('user_id', req.user!.userId);
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: PLAN_PRICES[plan],
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?success=true&plan=${plan}`,
      cancel_url: `${process.env.FRONTEND_URL}/register?canceled=true`,
      metadata: {
        userId: req.user!.userId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: req.user!.userId,
          plan,
        },
        trial_period_days: 14,
      },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('[billing/create-checkout] Error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ─── POST /api/billing/portal ─────────────────────────────────────────────────
router.post('/portal', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('user_id', req.user!.userId)
      .single();

    if (!subscription?.stripe_customer_id) {
      return res.status(400).json({ error: 'No active subscription found' });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${process.env.FRONTEND_URL}/settings`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('[billing/portal] Error:', err);
    return res.status(500).json({ error: 'Failed to create portal session' });
  }
});

// ─── POST /api/billing/webhook ────────────────────────────────────────────────
// Note: raw body parsing is set in index.ts for this route
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error('[billing/webhook] Signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('[billing/webhook] Event:', event.type);

  try {
    switch (event.type) {
      // ── Checkout completed → subscription created ──────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || 'basic';
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          await supabase
            .from('subscriptions')
            .update({
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: session.customer as string,
              plan,
              status: stripeSub.status,
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            })
            .eq('user_id', userId);
        }
        break;
      }

      // ── Subscription updated ───────────────────────────────────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.userId;

        if (userId) {
          const plan = sub.metadata?.plan || 'basic';
          await supabase
            .from('subscriptions')
            .update({
              status: sub.status,
              plan,
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              cancel_at_period_end: sub.cancel_at_period_end,
            })
            .eq('stripe_subscription_id', sub.id);
        }
        break;
      }

      // ── Subscription deleted/cancelled ─────────────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_subscription_id', sub.id);
        break;
      }

      // ── Invoice payment failed ─────────────────────────────────────────────
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      // ── Invoice paid ──────────────────────────────────────────────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        if (subscriptionId) {
          const stripeSub = await stripe.subscriptions.retrieve(subscriptionId);
          await supabase
            .from('subscriptions')
            .update({
              status: 'active',
              current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      default:
        console.log(`[billing/webhook] Unhandled event: ${event.type}`);
    }

    return res.json({ received: true });
  } catch (err) {
    console.error('[billing/webhook] Processing error:', err);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

export default router;
