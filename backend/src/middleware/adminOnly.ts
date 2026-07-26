import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function adminOnly(req: AuthRequest, res: Response, next: NextFunction): void {
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }

  if (req.user.email !== adminEmail) {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }

  next();
}
