'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

const STORAGE_KEY = 'recept-ai-cookies-consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const decide = (value: 'accepted' | 'rejected') => {
    window.localStorage.setItem(STORAGE_KEY, value);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 inset-x-4 z-[100] flex justify-center">
      <div className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-glow p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            Usamos cookies técnicas necesarias para el funcionamiento de la web y, si lo aceptas,
            cookies analíticas (Google Analytics) para entender cómo se usa. Puedes rechazarlas en
            cualquier momento.{' '}
            <Link href="/cookies" className="text-primary hover:underline font-medium">
              Más información
            </Link>
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => decide('rejected')}
            className="btn-secondary text-xs"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => decide('accepted')}
            className="btn-primary text-xs"
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}
