import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '../utils/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { registerLimiter, loginLimiter, apiLimiter } from '../middleware/rateLimiter';

const router = Router();

// Rate limiters
router.post('/register', registerLimiter);
router.post('/login', loginLimiter);

// ─── Schemas ────────────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  plan: z.enum(['basic', 'pro', 'business']).optional().default('basic'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const googleSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
  avatar: z.string().optional(),
});

// ─── POST /api/auth/google ──────────────────────────────────────────────────
router.post('/google', async (req: Request, res: Response) => {
  try {
    const body = googleSchema.parse(req.body);

    // Upsert user by email
    const { data: existing } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('email', body.email)
      .single();

    let user: { id: string; email: string; name: string; role: string; created_at?: string } | null = null;
    if (existing) {
      const { data: updated } = await supabase
        .from('users')
        .update({ name: body.name })
        .eq('id', existing.id)
        .select('id, email, name, role, created_at')
        .single();
      user = updated;
    } else {
      const { data: created, error } = await supabase
        .from('users')
        .insert({
          name: body.name,
          email: body.email,
          password_hash: '',
          role: body.email === process.env.ADMIN_EMAIL ? 'admin' : 'owner',
        })
        .select('id, email, name, role, created_at')
        .single();

      if (error || !created) {
        console.error('[google] Supabase error:', error);
        return res.status(500).json({ error: 'Failed to create user' });
      }

      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('subscriptions').insert({
        user_id: created.id,
        plan: 'basic',
        status: 'trialing',
        current_period_end: trialEnd,
      });

      user = created;
    }

    if (!user) {
      return res.status(500).json({ error: 'Failed to find or create user' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Get company
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, onboarding_completed')
      .eq('user_id', user.id)
      .single();

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      company: company || null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    console.error('[google] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/register ─────────────────────────────────────────────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const body = registerSchema.parse(req.body);

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', body.email)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(body.password, 12);

    // Create user
    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name: body.name,
        email: body.email,
        password_hash: passwordHash,
        role: body.email === process.env.ADMIN_EMAIL ? 'admin' : 'owner',
      })
      .select('id, email, name, role, created_at')
      .single();

    if (error || !user) {
      console.error('[register] Supabase error:', error);
      return res.status(500).json({ error: 'Failed to create user' });
    }

    // Create initial subscription record (trialing)
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('subscriptions').insert({
      user_id: user.id,
      plan: body.plan,
      status: 'trialing',
      current_period_end: trialEnd,
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    console.error('[register] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const body = loginSchema.parse(req.body);

    // Find user
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, password_hash')
      .eq('email', body.email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValid = await bcrypt.compare(body.password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('id, name, onboarding_completed')
      .eq('user_id', user.id)
      .single();

    return res.json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      company: company || null,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    console.error('[login] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role, created_at')
      .eq('id', req.user!.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { data: company } = await supabase
      .from('companies')
      .select('id, name, sector, onboarding_completed')
      .eq('user_id', user.id)
      .single();

    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan, status, current_period_end')
      .eq('user_id', user.id)
      .single();

    return res.json({ user, company: company || null, subscription: subscription || null });
  } catch (err) {
    console.error('[me] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
