import { Router, Response } from 'express';
import { z } from 'zod';
import { supabase } from '../utils/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { generateSystemPrompt } from '../utils/generateSystemPrompt';
import { lookupPhone, sendSMS, generateCode } from '../utils/twilio';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const upload = multer({ dest: path.join(__dirname, '../../uploads') });

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
  phone: z.string().min(7, 'Número de teléfono inválido'),
  website: z.string().optional(),
  custom_info: z.string().optional(),
});

router.post('/company', async (req: AuthRequest, res: Response) => {
  try {
    const body = companySchema.parse(req.body);

    // Validate phone number with Twilio Lookup
    if (body.phone) {
      const lookup = await lookupPhone(body.phone);
      if (!lookup.valid) {
        return res.status(400).json({ error: 'El número de teléfono no es válido. Verifica el formato e intenta de nuevo.' });
      }
      body.phone = lookup.formatted || body.phone;
    }

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

// ─── GET /api/onboarding/assistant ──────────────────────────────────────────
router.get('/assistant', async (req: AuthRequest, res: Response) => {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', req.user!.userId)
      .single();

    if (!company) return res.status(404).json({ error: 'Company not found' });

    const { data: assistant } = await supabase
      .from('assistants')
      .select('*')
      .eq('company_id', company.id)
      .single();

    return res.json({ assistant });
  } catch (err) {
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
  system_prompt: z.string().optional(),
  custom_info: z.string().optional(),
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

    // Generate system prompt (or use custom one)
    const systemPrompt = body.system_prompt || generateSystemPrompt(
      { name: body.name, gender: body.gender, voice_id: body.voice_id, language: body.language, personality: body.personality },
      company
    );

    // Save custom_info to company if provided
    if (body.custom_info !== undefined) {
      await supabase
        .from('companies')
        .update({ custom_info: body.custom_info })
        .eq('id', company.id);
    }

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
    const { data: company } = await supabase
      .from('companies')
      .select('id, phone')
      .eq('user_id', req.user!.userId)
      .single();

    if (!company) {
      return res.status(400).json({ error: 'Company not found' });
    }

    return res.json({
      success: true,
      message: 'Canales activados',
      phoneNumber: company.phone,
      whatsappNumber: process.env.TWILIO_WHATSAPP_NUMBER ? process.env.TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', '') : null,
      whatsappInstructions: process.env.TWILIO_WHATSAPP_NUMBER
        ? `Tus clientes pueden escribir al ${process.env.TWILIO_WHATSAPP_NUMBER.replace('whatsapp:', '')} en WhatsApp para ser atendidos por la IA.`
        : null,
    });
  } catch (err) {
    console.error('[onboarding/channels] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/onboarding/send-code ─────────────────────────────────────────
router.post('/send-code', async (req: AuthRequest, res: Response) => {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('id, phone')
      .eq('user_id', req.user!.userId)
      .single();

    if (!company || !company.phone) {
      return res.status(400).json({ error: 'Company or phone number not found. Complete step 1 first.' });
    }

    const code = generateCode();

    const { error: updateError } = await supabase
      .from('companies')
      .update({ phone_verification_code: code })
      .eq('id', company.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to save verification code' });
    }

    // Admin bypass: skip SMS, show code in response
    if (req.user!.email === process.env.ADMIN_EMAIL) {
      console.log('[onboarding/send-code] Admin bypass — code:', code);
      return res.json({ sent: true, devCode: code, message: `Modo desarrollo — código: ${code}` });
    }

    const sent = await sendSMS(company.phone, `Tu código de verificación de Recept.ai es: ${code}. Este código expira en 10 minutos.`);

    if (!sent) {
      return res.status(500).json({ error: 'Error al enviar el SMS. Verifica el número de teléfono.' });
    }

    return res.json({ sent: true, message: `Código enviado a ${company.phone.replace(/\d(?=\d{4})/g, '*')}` });
  } catch (err) {
    console.error('[onboarding/send-code] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/onboarding/verify-code ───────────────────────────────────────
const verifySchema = z.object({
  code: z.string().length(6),
});

router.post('/verify-code', async (req: AuthRequest, res: Response) => {
  try {
    const { code } = verifySchema.parse(req.body);

    const { data: company } = await supabase
      .from('companies')
      .select('id, phone_verification_code, phone_verified')
      .eq('user_id', req.user!.userId)
      .single();

    if (!company) {
      return res.status(400).json({ error: 'Company not found' });
    }

    if (company.phone_verified) {
      return res.json({ verified: true, message: 'Teléfono ya verificado' });
    }

    if (company.phone_verification_code !== code) {
      return res.status(400).json({ error: 'Código incorrecto. Intenta de nuevo.' });
    }

    const { error: updateError } = await supabase
      .from('companies')
      .update({ phone_verified: true, phone_verification_code: null, onboarding_completed: true })
      .eq('id', company.id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to verify code' });
    }

    return res.json({ verified: true, message: 'Teléfono verificado correctamente' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'El código debe tener 6 dígitos' });
    }
    console.error('[onboarding/verify-code] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── POST /api/onboarding/upload-doc ──────────────────────────────────────────
router.post('/upload-doc', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No se subió ningún archivo' });

    const ext = path.extname(file.originalname).toLowerCase();
    let text = '';

    if (ext === '.txt') {
      text = fs.readFileSync(file.path, 'utf8');
    } else if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const pdfBuffer = fs.readFileSync(file.path);
      const pdfData = await pdfParse(pdfBuffer);
      text = pdfData.text;
    } else if (ext === '.docx') {
      const mammoth = require('mammoth');
      const docxBuffer = fs.readFileSync(file.path);
      const result = await mammoth.extractRawText({ buffer: docxBuffer });
      text = result.value;
    } else {
      fs.unlinkSync(file.path);
      return res.status(400).json({ error: 'Formato no soportado. Usa PDF, DOCX o TXT.' });
    }

    fs.unlinkSync(file.path);
    return res.json({ text: text.trim() });
  } catch (err: any) {
    console.error('[onboarding/upload-doc] Error:', err);
    return res.status(500).json({ error: 'Error al procesar el archivo' });
  }
});

// ─── POST /api/onboarding/import-gdoc ─────────────────────────────────────────
router.post('/import-gdoc', async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'URL requerida' });

    // Extract document ID from Google Docs URL
    const match = url.match(/\/document\/d\/([a-zA-Z0-9_-]+)/);
    if (!match) return res.status(400).json({ error: 'URL de Google Docs inválida' });

    const docId = match[1];
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;

    const response = await fetch(exportUrl);
    if (!response.ok) {
      return res.status(400).json({ error: 'No se pudo acceder al documento. Asegúrate de que sea público.' });
    }

    const text = await response.text();
    return res.json({ text: text.trim() });
  } catch (err: any) {
    console.error('[onboarding/import-gdoc] Error:', err);
    return res.status(500).json({ error: 'Error al importar el documento' });
  }
});

export default router;
