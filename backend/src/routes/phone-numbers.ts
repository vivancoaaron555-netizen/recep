import { Router, Response } from 'express';
import { supabase } from '../utils/supabase';
import { importPhoneNumber } from '../utils/vapi';
import { buyNumber } from '../utils/twilio';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getCompanyPlan, countActiveNumbers } from '../utils/plans';

const router = Router();

// All routes require auth
router.use(authMiddleware);

/**
 * POST /api/phone-numbers/buy
 * Compra un número en Twilio, lo importa a Vapi y lo asigna a la compañía
 */
router.post('/buy', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user's company
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    if (!company) return res.status(404).json({ error: 'Compañía no encontrada' });

    // Check plan is active and number limit by plan
    const planInfo = await getCompanyPlan(company.id);
    if (!planInfo?.active) {
      return res.status(403).json({ error: 'Activa tu plan para comprar números' });
    }

    // Solo planes de pago (pro/business) pueden comprar un número dedicado
    if (planInfo.plan === 'trial' || planInfo.plan === 'basic') {
      return res.status(403).json({
        error: 'Los números dedicados están disponibles solo en los planes Pro y Business',
      });
    }

    const usedNumbers = await countActiveNumbers(company.id);
    if (usedNumbers >= planInfo.limits.numbers) {
      return res.status(400).json({
        error: `Tu plan (${planInfo.plan}) permite máximo ${planInfo.limits.numbers} número(s) activo(s)`,
      });
    }

    // 1. Buy number from Twilio
    const twilioNumber = await buyNumber('901');

    // 2. Import to Vapi
    let vapiId = '';
    try {
      const vapiNum: any = await importPhoneNumber(twilioNumber.phoneNumber, twilioNumber.sid, company.name);
      vapiId = vapiNum.id;
    } catch (vapiErr) {
      // If Vapi import fails, still keep the Twilio number
      console.error('[phone-numbers] Vapi import failed:', vapiErr);
    }

    // 3. Store in database
    const { data: phoneRecord, error: dbError } = await supabase
      .from('phone_numbers')
      .insert({
        company_id: company.id,
        twilio_number: twilioNumber.phoneNumber,
        twilio_sid: twilioNumber.sid,
        friendly_name: company.name,
        active: true,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return res.json({
      success: true,
      phoneNumber: twilioNumber.phoneNumber,
    });
  } catch (err: any) {
    console.error('[phone-numbers/buy] Error:', err);
    return res.status(500).json({ error: err.message || 'Error al comprar número' });
  }
});

/**
 * GET /api/phone-numbers/my
 * Devuelve el número asignado a la compañía del usuario autenticado
 */
router.get('/my', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!company) return res.status(404).json({ error: 'Compañía no encontrada' });

    const { data: phoneRecord } = await supabase
      .from('phone_numbers')
      .select('*')
      .eq('company_id', company.id)
      .eq('active', true)
      .single();

    return res.json({
      success: true,
      phoneNumber: phoneRecord?.twilio_number || null,
      friendlyName: phoneRecord?.friendly_name || null,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al obtener número' });
  }
});

/**
 * POST /api/phone-numbers/release
 * Libera un número asignado (desactiva). Si no se pasa `id`, libera todos.
 */
router.post('/release', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!company) return res.status(404).json({ error: 'Compañía no encontrada' });

    let query = supabase
      .from('phone_numbers')
      .update({ active: false })
      .eq('company_id', company.id)
      .eq('active', true);

    if (req.body?.id) {
      query = query.eq('id', req.body.id);
    }

    await query;

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al liberar número' });
  }
});

export default router;
