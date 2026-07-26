'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Bot, Eye, EyeOff, ArrowRight, Check, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { saveAuth } from '@/lib/auth';
import { toast } from 'sonner';

const PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: '$49/mes',
    features: ['100 llamadas/mes', '500 WhatsApp', '1 número'],
    color: 'border-border hover:border-primary/50',
    selectedColor: 'border-primary bg-primary/10',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$99/mes',
    badge: 'Popular',
    features: ['500 llamadas/mes', 'WhatsApp ilimitado', '3 números'],
    color: 'border-primary/50 hover:border-primary',
    selectedColor: 'border-primary bg-primary/10',
  },
  {
    id: 'clinic',
    name: 'Clinic',
    price: '$199/mes',
    features: ['Llamadas ilimitadas', 'WhatsApp ilimitado', '10 números'],
    color: 'border-border hover:border-accent/50',
    selectedColor: 'border-accent bg-accent/10',
  },
];

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPlan = searchParams.get('plan') || 'pro';

  const [step, setStep] = useState<'form' | 'plan'>('form');
  const [selectedPlan, setSelectedPlan] = useState(defaultPlan);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error('Completa todos los campos');
      return;
    }
    if (form.password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }
    setStep('plan');
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const { token, user } = await api.auth.register({
        ...form,
        plan: selectedPlan,
      });

      saveAuth(token, user);

      // Create Stripe checkout session
      toast.loading('Redirigiendo a pago...');
      const { url } = await api.billing.createCheckout(selectedPlan);
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || 'Error al crear la cuenta');
      setStep('form');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl">Recept<span className="text-primary">.ai</span></span>
          </Link>
          <h1 className="text-3xl font-bold">
            {step === 'form' ? 'Crea tu cuenta' : 'Elige tu plan'}
          </h1>
          <p className="text-muted-foreground mt-2">
            {step === 'form'
              ? '14 días gratis, sin tarjeta de crédito'
              : 'Todos los planes incluyen 14 días de prueba gratuita'}
          </p>
        </div>

        <div className="card border-border/50">
          {step === 'form' ? (
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className="label" htmlFor="name">Nombre completo</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="input"
                  placeholder="Dr. Carlos Méndez"
                  value={form.name}
                  onChange={handleChange}
                  required
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="label" htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="input"
                  placeholder="carlos@clinica.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="label" htmlFor="password">Contraseña</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input pr-12"
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={handleChange}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full justify-center">
                Continuar
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all duration-200 ${
                    selectedPlan === plan.id ? plan.selectedColor : plan.color
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{plan.name}</span>
                      {plan.badge && (
                        <span className="badge-primary text-xs">{plan.badge}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-primary">{plan.price}</span>
                      {selectedPlan === plan.id && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </div>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1">
                    {plan.features.map((f) => (
                      <li key={f} className="text-xs text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-success" /> {f}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}

              <div className="pt-2 space-y-3">
                <button
                  onClick={handleRegister}
                  disabled={loading}
                  className="btn-primary w-full justify-center"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Procesando...</>
                  ) : (
                    <>Comenzar 14 días gratis <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
                <button
                  onClick={() => setStep('form')}
                  className="btn-ghost w-full justify-center text-sm"
                >
                  ← Volver
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Inicia sesión
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Al crear una cuenta aceptas nuestros{' '}
          <a href="#" className="text-primary hover:underline">Términos</a>{' '}
          y{' '}
          <a href="#" className="text-primary hover:underline">Privacidad</a>
        </p>
      </motion.div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <RegisterForm />
    </Suspense>
  );
}
