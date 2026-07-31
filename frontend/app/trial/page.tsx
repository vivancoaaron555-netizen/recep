'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, Check, ArrowRight, Loader2, CreditCard, Shield } from 'lucide-react';

const BENEFITS = [
  'Asistente IA para llamadas y WhatsApp',
  'Atención al cliente 24/7 automatizada',
  'Panel de control con estadísticas',
  'Soporte técnico prioritario',
];

export default function TrialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

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
    router.push('/onboarding');
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
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">Recept.ai</span>
          </Link>
          <h1 className="text-3xl font-bold">Prueba gratuita por 7 días</h1>
          <p className="text-muted-foreground mt-2">
            Disfruta de todas las funciones sin compromiso. Cancela cuando quieras.
          </p>
        </div>

        <div className="card border-border/50">
          <div className="text-center mb-6">
            <span className="text-5xl font-black gradient-text">$0</span>
            <span className="text-muted-foreground ml-2">por 7 días</span>
            <p className="text-sm text-muted-foreground mt-1">Luego $99/mes — cancela en cualquier momento</p>
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
            Comenzar prueba gratis
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            Sin cargos hoy · Cancela cuando quieras
          </div>
        </div>
      </motion.div>
    </div>
  );
}
