import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { supabase } from '../utils/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { buyNumber } from '../utils/twilio';
import { importPhoneNumber } from '../utils/vapi';
import { getCompanyPlan, countActiveNumbers } from '../utils/plans';

const router = Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PLAN_PRICES: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC || '',
  pro: process.env.STRIPE_PRICE_PRO || '',
  business: process.env.STRIPE_PRICE_BUSINESS || '',
};

const PLAN_NAMES: Record<string, string> = {
  basic: 'Starter',
  pro: 'Pro',
  business: 'Business',
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
      success_url: `${process.env.FRONTEND_URL}/dashboard?welcome=true&plan=${plan}`,
      cancel_url: `${process.env.FRONTEND_URL}/trial?canceled=true`,
      metadata: {
        userId: req.user!.userId,
        plan,
      },
      subscription_data: {
        metadata: {
          userId: req.user!.userId,
          plan,
        },
        trial_period_days: 7,
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

          // If subscription is active (trial or paid), buy a dedicated number
          if (stripeSub.status === 'active' || stripeSub.status === 'trialing') {
            buyDedicatedNumber(userId).catch(e =>
              console.error('[billing] Failed to buy number for user:', userId, e)
            );
          }
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

// ─── POST /api/billing/trial-start ────────────────────────────────────────────
router.post('/trial-start', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // Check if subscription already exists
    const { data: existing } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', req.user!.userId)
      .single();

    if (existing) {
      return res.json({ success: true, message: 'Trial ya activo' });
    }

    const { error } = await supabase
      .from('subscriptions')
      .insert({
        user_id: req.user!.userId,
        plan: 'basic',
        status: 'trialing',
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
      });

    if (error) {
      console.error('[billing/trial-start] Error:', error);
      return res.status(500).json({ error: 'Failed to start trial' });
    }

    return res.json({ success: true, message: 'Trial iniciado — 7 días gratis' });
  } catch (err) {
    console.error('[billing/trial-start] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Helper: Buy dedicated number for a paying user ─────────────────────────
async function buyDedicatedNumber(userId: string) {
  const { data: company } = await supabase
    .from('companies')
    .select('id, name')
    .eq('user_id', userId)
    .single();

  if (!company) {
    console.warn('[billing] No company found for user:', userId);
    return;
  }

  // Check plan number limit before buying
  const planInfo = await getCompanyPlan(company.id);
  if (!planInfo?.active) {
    console.warn('[billing] Plan not active, skipping number buy for:', userId);
    return;
  }

  const usedNumbers = await countActiveNumbers(company.id);
  if (usedNumbers >= planInfo.limits.numbers) {
    console.warn(`[billing] Number limit reached for plan ${planInfo.plan} (${usedNumbers}/${planInfo.limits.numbers})`);
    return;
  }

  // Check if already has a number
  const { data: existing } = await supabase
    .from('phone_numbers')
    .select('id')
    .eq('company_id', company.id)
    .eq('active', true)
    .single();

  if (existing) {
    console.log('[billing] User already has a number');
    return;
  }

  try {
    const twilioNumber = await buyNumber('901');
    try {
      await importPhoneNumber(twilioNumber.phoneNumber, twilioNumber.sid, company.name);
    } catch (vapiErr) {
      console.error('[billing] Vapi import failed:', vapiErr);
    }
    await supabase.from('phone_numbers').insert({
      company_id: company.id,
      twilio_number: twilioNumber.phoneNumber,
      twilio_sid: twilioNumber.sid,
      friendly_name: company.name,
      active: true,
    });
    console.log(`[billing] Number ${twilioNumber.phoneNumber} assigned to ${company.name}`);
  } catch (err) {
    console.error('[billing] Failed to buy number:', err);
  }
}

export default router;
