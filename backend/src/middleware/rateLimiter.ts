import rateLimit from 'express-rate-limit';

export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de registro. Intenta de nuevo en 1 hora.' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.' },
});

export const apiLimiter = (maxRequests: number = 10) =>
  rateLimit({
    windowMs: 60 * 1000,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const payload = JSON.parse(Buffer.from(authHeader.split(' ')[1].split('.')[1], 'base64url').toString());
          return payload.userId || req.ip || 'unknown';
        } catch {
          return req.ip || 'unknown';
        }
      }
      return req.ip || 'unknown';
    },
    message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 1 minuto.' },
  });
