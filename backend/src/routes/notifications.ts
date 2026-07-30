import { Router, Response } from 'express';
import { supabase } from '../utils/supabase';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authMiddleware);

async function getUserCompanyId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', userId)
    .single();
  return data?.id || null;
}

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = await getUserCompanyId(req.user!.userId);
    if (!companyId) return res.status(404).json({ error: 'Company not found' });

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return res.status(500).json({ error: 'Failed to fetch notifications' });

    return res.json({ notifications: data || [] });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = await getUserCompanyId(req.user!.userId);
    if (!companyId) return res.json({ count: 0 });

    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('read', false);

    if (error) return res.status(500).json({ error: 'Failed to count' });

    return res.json({ count: count || 0 });
  } catch (err) {
    return res.json({ count: 0 });
  }
});

router.post('/read', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = await getUserCompanyId(req.user!.userId);
    if (!companyId) return res.status(404).json({ error: 'Company not found' });

    const { ids } = req.body;

    if (ids && Array.isArray(ids)) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('company_id', companyId)
        .in('id', ids);
    } else {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('company_id', companyId)
        .eq('read', false);
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

export async function createNotification(companyId: string, type: string, title: string, message: string, data?: any) {
  await supabase.from('notifications').insert({
    company_id: companyId,
    type,
    title,
    message,
    data: data || null,
  });
}
