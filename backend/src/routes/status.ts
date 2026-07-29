import { Router, Request, Response } from 'express';

const router = Router();

async function pingService(name: string, check: () => Promise<{ ok: boolean; latency?: string }>) {
  const start = Date.now();
  try {
    const result = await check();
    return { name, status: result.ok ? 'ok' : 'error', latency: `${Date.now() - start}ms`, ...result };
  } catch {
    return { name, status: 'error', latency: `${Date.now() - start}ms` };
  }
}

router.get('/', async (_req: Request, res: Response) => {
  const checks = await Promise.all([
    pingService('supabase', async () => {
      const { supabase } = await import('../utils/supabase');
      const { error } = await supabase.from('users').select('id').limit(1);
      return { ok: !error };
    }),
    pingService('groq', async () => {
      const { default: Groq } = await import('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      await groq.models.list();
      return { ok: true };
    }),
    pingService('stripe', async () => {
      const { default: Stripe } = await import('stripe');
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-12-18.acacia' as any });
      await stripe.balance.retrieve();
      return { ok: true };
    }),
    pingService('twilio', async () => {
      const twilio = await import('twilio');
      const client = twilio.default(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
      await client.api.accounts(process.env.TWILIO_ACCOUNT_SID!).fetch();
      return { ok: true };
    }),
    pingService('vapi', async () => {
      const res = await fetch('https://api.vapi.ai/assistant', {
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` },
      });
      return { ok: res.ok };
    }),
  ]);

  res.json({ services: checks, timestamp: new Date().toISOString() });
});

export default router;
