'use client';

import { useEffect, Suspense } from 'react';
import { useSession } from '@/lib/session-provider';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Check, ArrowRight, Loader2, CreditCard, Shield } from 'lucide-react';

const BENEFITS = [
  'Asistente IA para llamadas y WhatsApp',
  'Atención al cliente 24/7 automatizada',
  'Panel de control con estadísticas',
  'Soporte técnico prioritario',
];

const PLAN_INFO: Record<string, { name: string; price: string }> = {
  basic: { name: 'Starter', price: '€49/mes' },
  pro: { name: 'Pro', price: '€99/mes' },
  business: { name: 'Business', price: '€199/mes' },
};

export default function TrialPage() {
  return (
    <Suspense fallback={null}>
      <TrialPageContent />
    </Suspense>
  );
}

function TrialPageContent() {
  const { session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get('plan') || 'basic';
  const planInfo = PLAN_INFO[plan] || PLAN_INFO.basic;

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.backendToken) {
      router.push('/login');
      return;
    }
    if (session.company?.onboarding_completed) {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading' || !session?.backendToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleStartTrial = () => {
    router.push(`/onboarding?plan=${plan}`);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <span className="font-bold text-xl">Recept.ai</span>
          </Link>
          <h1 className="text-3xl font-bold">Empieza con el plan {planInfo.name}</h1>
          <p className="text-muted-foreground mt-2">
            Configura tu empresa, elige tu recepcionista y activa tu plan. Cancela cuando quieras.
          </p>
        </div>

        <div className="card border-border/50">
          <div className="text-center mb-6">
            <span className="text-5xl font-black gradient-text">{planInfo.price.split('/')[0]}</span>
            <span className="text-muted-foreground ml-2">/mes</span>
            <p className="text-sm text-muted-foreground mt-1">{planInfo.name} — cancela en cualquier momento</p>
          </div>

          <ul className="space-y-3 mb-8">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm">
                <div className="w-5 h-5 rounded-full bg-success/15 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-success" />
                </div>
                {b}
              </li>
            ))}
          </ul>

          <button onClick={handleStartTrial} className="btn-primary w-full justify-center gap-2">
            <CreditCard className="w-4 h-4" />
            Continuar con {planInfo.name}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            Pago seguro procesado por Stripe
          </div>
        </div>
      </motion.div>
    </div>
  );
}
