import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../utils/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateSystemPrompt } from '../utils/generateSystemPrompt';

const router = Router();

// All onboarding routes require auth
router.use(authMiddleware);

// ─── POST /api/onboarding/company ────────────────────────────────────────────
const companySchema = z.object({
  name: z.string().min(2),
  sector: z.string().min(2),
  schedule: z.record(z.object({
    open: z.string(),
    close: z.string(),
    active: z.boolean(),
  })),
  services: z.array(z.string()).min(1),
  address: z.string().optional(),
  faq: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
});

router.post('/company', async (req: AuthRequest, res: Response) => {
  try {
    const body = companySchema.parse(req.body);

    // Check if company already exists for this user
    const { data: existing } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', req.user!.userId)
      .single();

    if (existing) {
      // Update existing company
      const { data: company, error } = await supabase
        .from('companies')
        .update(body)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: 'Failed to update company' });
      return res.json({ company });
    }

    // Create new company
    const { data: company, error } = await supabase
      .from('companies')
      .insert({ ...body, user_id: req.user!.userId })
      .select()
      .single();

    if (error || !company) {
      console.error('[onboarding/company] Error:', error);
      return res.status(500).json({ error: 'Failed to create company' });
    }

    return res.status(201).json({ company });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    console.error('[onboarding/company] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/onboarding/assistant ─────────────────────────────────────────
const assistantSchema = z.object({
  name: z.string().min(2),
  gender: z.enum(['female', 'male']),
  voice_id: z.string(),
  language: z.string().default('es'),
  personality: z.string(),
});

router.post('/assistant', async (req: AuthRequest, res: Response) => {
  try {
    const body = assistantSchema.parse(req.body);

    // Get company for this user
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', req.user!.userId)
      .single();

    if (companyError || !company) {
      return res.status(400).json({ error: 'Company not found. Complete step 1 first.' });
    }

    // Generate system prompt
    const systemPrompt = generateSystemPrompt(
      { name: body.name, gender: body.gender, voice_id: body.voice_id, language: body.language, personality: body.personality },
      company
    );

    // Check if assistant already exists
    const { data: existing } = await supabase
      .from('assistants')
      .select('id')
      .eq('company_id', company.id)
      .single();

    if (existing) {
      const { data: assistant, error } = await supabase
        .from('assistants')
        .update({ ...body, system_prompt: systemPrompt })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) return res.status(500).json({ error: 'Failed to update assistant' });
      return res.json({ assistant });
    }

    // Create assistant
    const { data: assistant, error } = await supabase
      .from('assistants')
      .insert({ ...body, company_id: company.id, system_prompt: systemPrompt })
      .select()
      .single();

    if (error || !assistant) {
      console.error('[onboarding/assistant] Error:', error);
      return res.status(500).json({ error: 'Failed to create assistant' });
    }

    return res.status(201).json({ assistant });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: err.errors });
    }
    console.error('[onboarding/assistant] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/onboarding/channels ──────────────────────────────────────────
router.post('/channels', async (req: AuthRequest, res: Response) => {
  try {
    // Get company for this user
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', req.user!.userId)
      .single();

    if (companyError || !company) {
      return res.status(400).json({ error: 'Company not found' });
    }

    // Mark onboarding as complete
    const { error } = await supabase
      .from('companies')
      .update({ onboarding_completed: true })
      .eq('id', company.id);

    if (error) {
      return res.status(500).json({ error: 'Failed to complete onboarding' });
    }

    // Get the assigned phone number if any
    const { data: phoneNumber } = await supabase
      .from('phone_numbers')
      .select('twilio_number')
      .eq('company_id', company.id)
      .single();

    return res.json({
      success: true,
      message: 'Onboarding completed!',
      phoneNumber: phoneNumber?.twilio_number || process.env.TWILIO_PHONE_NUMBER,
      whatsappInstructions: `Envía "JOIN recept-ai" al número ${process.env.TWILIO_WHATSAPP_NUMBER} para activar WhatsApp`,
    });
  } catch (err) {
    console.error('[onboarding/channels] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
