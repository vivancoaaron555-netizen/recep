import { Router, Response } from 'express';
import { supabase } from '../utils/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();

router.use(authMiddleware);
router.use(adminOnly);

// ─── GET /api/admin/companies ─────────────────────────────────────────────────
router.get('/companies', async (_req: AuthRequest, res: Response) => {
  try {
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        id,
        name,
        sector,
        created_at,
        onboarding_completed,
        users!companies_user_id_fkey (
          id,
          email,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) return res.status(500).json({ error: 'Failed to fetch companies' });

    // Get subscription status for each company
    const companiesWithSubs = await Promise.all(
      (companies || []).map(async (company) => {
        const userId = (company.users as any)?.id;
        if (!userId) return { ...company, subscription: null };

        const { data: sub } = await supabase
          .from('subscriptions')
          .select('plan, status, current_period_end')
          .eq('user_id', userId)
          .single();

        // Get call count
        const { count: callCount } = await supabase
          .from('calls')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', company.id);

        return { ...company, subscription: sub, callCount: callCount || 0 };
      })
    );

    return res.json({ companies: companiesWithSubs });
  } catch (err) {
    console.error('[admin/companies] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── GET /api/admin/stats ─────────────────────────────────────────────────────
router.get('/stats', async (_req: AuthRequest, res: Response) => {
  try {
    // Total companies
    const { count: totalCompanies } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    // Total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Active subscriptions by plan
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('plan, status')
      .in('status', ['active', 'trialing']);

    const planCounts: Record<string, number> = { basic: 0, pro: 0, business: 0 };
    const PLAN_PRICES_MRR: Record<string, number> = {
      basic: 99,
      pro: 199,
      business: 349,
    };

    let mrr = 0;
    subscriptions?.forEach((sub) => {
      if (sub.status === 'active') {
        planCounts[sub.plan] = (planCounts[sub.plan] || 0) + 1;
        mrr += PLAN_PRICES_MRR[sub.plan] || 0;
      }
    });

    // Total calls
    const { count: totalCalls } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true });

    // Total appointments
    const { count: totalAppointments } = await supabase
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    // Calls today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: callsToday } = await supabase
      .from('calls')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // New companies this month
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const { count: newCompaniesMonth } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', thisMonth);

    return res.json({
      totalCompanies: totalCompanies || 0,
      totalUsers: totalUsers || 0,
      totalCalls: totalCalls || 0,
      totalAppointments: totalAppointments || 0,
      callsToday: callsToday || 0,
      newCompaniesMonth: newCompaniesMonth || 0,
      mrr,
      planCounts,
    });
  } catch (err) {
    console.error('[admin/stats] Error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
