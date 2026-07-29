import { Router, Request, Response } from 'express';
import { supabase } from '../utils/supabase';
import { buyPhoneNumber, listPhoneNumbers } from '../utils/vapi';

const router = Router();

/**
 * POST /api/phone-numbers/buy
 * Compra un número en Vapi y lo asigna a la compañía del usuario autenticado
 */
router.post('/buy', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    // Get user's company
    const { data: company } = await supabase
      .from('companies')
      .select('id, name')
      .eq('user_id', userId)
      .single();

    if (!company) return res.status(404).json({ error: 'Compañía no encontrada' });

    // Check if company already has a number
    const { data: existing } = await supabase
      .from('phone_numbers')
      .select('id')
      .eq('company_id', company.id)
      .eq('active', true)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'Ya tienes un número asignado' });
    }

    // Buy number via Vapi
    const vapiNumber: any = await buyPhoneNumber('901', 'US', company.name);

    // Store in our database
    const { data: phoneRecord, error: dbError } = await supabase
      .from('phone_numbers')
      .insert({
        company_id: company.id,
        twilio_number: vapiNumber.number || vapiNumber.id,
        twilio_sid: vapiNumber.id,
        friendly_name: company.name,
        active: true,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return res.json({
      success: true,
      phoneNumber: phoneRecord?.twilio_number || vapiNumber.number,
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
router.get('/my', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

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
 * Libera el número asignado (desactiva, no elimina)
 */
router.post('/release', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) return res.status(401).json({ error: 'No autenticado' });

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!company) return res.status(404).json({ error: 'Compañía no encontrada' });

    await supabase
      .from('phone_numbers')
      .update({ active: false })
      .eq('company_id', company.id)
      .eq('active', true);

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error al liberar número' });
  }
});

export default router;
