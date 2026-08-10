import { supabase } from './supabase';

export interface PlanLimits {
  numbers: number;
  minutes: number;    // per month, Infinity = unlimited
  whatsapp: number;   // per month, Infinity = unlimited
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  trial: { numbers: 1, minutes: 100, whatsapp: 0 },
  basic: { numbers: 1, minutes: 100, whatsapp: 0 },
  pro: { numbers: 3, minutes: 300, whatsapp: Infinity },
  business: { numbers: 10, minutes: Infinity, whatsapp: Infinity },
};

export interface CompanyPlan {
  companyId: string;
  plan: string;
  status: string;
  active: boolean;
  limits: PlanLimits;
}

/**
 * Returns the active plan (with limits) for a company.
 * - 'active' subscription → the purchased plan
 * - 'trialing' → basic limits while the trial is valid
 * - anything else → inactive (blocked)
 */
export async function getCompanyPlan(companyId: string): Promise<CompanyPlan | null> {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('user_id')
      .eq('id', companyId)
      .single();

    if (!company) return null;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, plan, current_period_end, created_at')
      .eq('user_id', company.user_id)
      .single();

    if (!sub) return null;

    let active = false;

    if (sub.status === 'active') {
      active = true;
    } else if (sub.status === 'trialing') {
      const end = sub.current_period_end
        ? new Date(sub.current_period_end).getTime()
        : new Date(sub.created_at || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000;
      active = Date.now() < end;
    }

    const plan = sub.plan || 'basic';
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.basic;

    return { companyId, plan, status: sub.status, active, limits };
  } catch (err) {
    console.error('[plans] Error fetching plan:', err);
    return null;
  }
}

// ── Usage counters (current calendar month) ─────────────────────────────────

export async function countMinutesThisMonth(companyId: string): Promise<number> {
  try {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data } = await supabase
      .from('calls')
      .select('duration_seconds')
      .eq('company_id', companyId)
      .gte('created_at', thisMonth);
    const seconds = data?.reduce((acc, c) => acc + (c.duration_seconds || 0), 0) || 0;
    return Math.round(seconds / 60);
  } catch (err) {
    console.error('[plans] Error counting minutes:', err);
    return 0;
  }
}

export async function countWhatsAppThisMonth(companyId: string): Promise<number> {
  try {
    const thisMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { count } = await supabase
      .from('whatsapp_messages')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .gte('created_at', thisMonth);
    return count || 0;
  } catch (err) {
    console.error('[plans] Error counting whatsapp messages:', err);
    return 0;
  }
}

export async function countActiveNumbers(companyId: string): Promise<number> {
  try {
    const { count } = await supabase
      .from('phone_numbers')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('active', true);
    return count || 0;
  } catch (err) {
    console.error('[plans] Error counting numbers:', err);
    return 0;
  }
}
