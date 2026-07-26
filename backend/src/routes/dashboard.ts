import { Router, Response } from 'express';
import { supabase } from '../utils/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

// Helper: get company for authenticated user
async function getUserCompany(userId: string) {
  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .single();
  return company;
}

// ─── GET /api/dashboard/stats ────────────────────────────────────────────────
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const company = await getUserCompany(req.user!.userId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString();

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // Calls today
    const { count: callsToday } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gte('created_at', todayISO);

    // Calls this month
    const { count: callsMonth } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gte('created_at', thisMonth);

    // Appointments pending
    const { count: appointmentsPending } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .eq('status', 'pending');

    // Appointments this month
    const { count: appointmentsMonth } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gte('created_at', thisMonth);

    // Total minutes (sum duration)
    const { data: durationData } = await supabase
      .from('calls')
      .select('duration_seconds')
      .eq('company_id', company.id)
      .gte('created_at', thisMonth);

    const totalSeconds = durationData?.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) || 0;
    const totalMinutes = Math.round(totalSeconds / 60);

    // WhatsApp messages this month
    const { count: whatsappCount } = await supabase
      .from('whatsapp_conversations')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', company.id)
      .gte('created_at', thisMonth);

    return res.json({
      callsToday: callsToday || 0,
      callsMonth: callsMonth || 0,
      appointmentsPending: appointmentsPending || 0,
      appointmentsMonth: appointmentsMonth || 0,
      minutesMonth: totalMinutes,
      whatsappMonth: whatsappCount || 0,
    });
  } catch (err) {
    console.error('[dashboard/stats] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/calls ──────────────────────────────────────────────────────────
router.get('/calls', async (req: AuthRequest, res: Response) => {
  try {
    const company = await getUserCompany(req.user!.userId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    const { data: calls, count, error } = await supabase
      .from('calls')
      .select('*', { count: 'exact' })
      .eq('company_id', company.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: 'Failed to fetch calls' });

    return res.json({
      calls: calls || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('[calls] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/appointments ───────────────────────────────────────────────────
router.get('/appointments', async (req: AuthRequest, res: Response) => {
  try {
    const company = await getUserCompany(req.user!.userId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('appointments')
      .select('*', { count: 'exact' })
      .eq('company_id', company.id)
      .order('date', { ascending: true });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: appointments, count, error } = await query.range(offset, offset + limit - 1);

    if (error) return res.status(500).json({ error: 'Failed to fetch appointments' });

    return res.json({
      appointments: appointments || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('[appointments] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── PATCH /api/appointments/:id ─────────────────────────────────────────────
router.patch('/appointments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const company = await getUserCompany(req.user!.userId);
    if (!company) return res.status(404).json({ error: 'Company not found' });

    const { id } = req.params;
    const { status, notes } = req.body;

    const { data, error } = await supabase
      .from('appointments')
      .update({ status, notes })
      .eq('id', id)
      .eq('company_id', company.id)
      .select()
      .single();

    if (error) return res.status(500).json({ error: 'Failed to update appointment' });

    return res.json({ appointment: data });
  } catch (err) {
    console.error('[appointments/patch] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
