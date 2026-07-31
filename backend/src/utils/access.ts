import { supabase } from '../utils/supabase';

/**
 * Checks whether a company still has access to the AI receptionist.
 * - 'active' subscription → always allowed
 * - 'trialing' → allowed while current_period_end is in the future
 * - any other status (past_due, canceled, ...) → blocked
 */
export async function isCompanyAccessActive(companyId: string): Promise<boolean> {
  try {
    const { data: company } = await supabase
      .from('companies')
      .select('user_id')
      .eq('id', companyId)
      .single();

    if (!company) return false;

    const { data: sub } = await supabase
      .from('subscriptions')
      .select('status, current_period_end, created_at')
      .eq('user_id', company.user_id)
      .single();

    if (!sub) return false;

    if (sub.status === 'active') return true;

    if (sub.status === 'trialing') {
      const end = sub.current_period_end
        ? new Date(sub.current_period_end).getTime()
        : new Date(sub.created_at || Date.now()).getTime() + 7 * 24 * 60 * 60 * 1000;
      return Date.now() < end;
    }

    return false;
  } catch (err) {
    console.error('[access] Error checking access:', err);
    return true; // Fail open to avoid blocking valid calls on transient errors
  }
}
