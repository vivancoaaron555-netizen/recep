'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  Phone, MessageCircle, Calendar, Clock, Zap, Shield,
  ChevronRight, Check, Star, Menu, X, Bot,
  BarChart3, Globe, Headphones, ArrowRight, Sparkles
} from 'lucide-react';

// ─── Navigation ─────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-background/90 backdrop-blur-md border-b border-border shadow-card' : ''
    }`}>
      <div className="container-xl flex items-center justify-between h-16 px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Recept<span className="text-primary">.ai</span></span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'Características', href: '#features' },
            { label: 'Precios', href: '#pricing' },
            { label: 'Testimonios', href: '#testimonials' },
          ].map((link) => (
            <a key={link.href} href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => signIn('google')} className="btn-ghost text-sm">Iniciar Sesión</button>
          <button onClick={() => signIn('google', { callbackUrl: '/trial' })} className="btn-primary text-sm">
            Comenzar Gratis <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <button className="md:hidden btn-ghost p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-card border-t border-border p-4 space-y-2">
          {[
            { label: 'Características', href: '#features' },
            { label: 'Precios', href: '#pricing' },
            { label: 'Testimonios', href: '#testimonials' },
          ].map((link) => (
            <a key={link.href} href={link.href}
              className="block px-4 py-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}>
              {link.label}
            </a>
          ))}
          <div className="pt-2 space-y-2">
            <button onClick={() => signIn('google')} className="btn-secondary w-full justify-center">Iniciar Sesión</button>
            <button onClick={() => signIn('google', { callbackUrl: '/trial' })} className="btn-primary w-full justify-center">Comenzar Gratis</button>
          </div>
        </div>
      )}
    </nav>
  );
}

// ─── Hero Section ────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/8 blur-3xl" />
      </div>

      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] pointer-events-none" />

      <div className="container-xl relative z-10 text-center px-6 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm text-primary mb-8">
            <Sparkles className="w-4 h-4" />
            IA powered by Llama 3.1 · ElevenLabs · Vapi
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black leading-tight tracking-tight mb-6">
            Tu recepcionista{' '}
            <span className="gradient-text">nunca duerme</span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Atiende llamadas y WhatsApp{' '}
            <strong className="text-foreground">24/7 de forma automática.</strong>{' '}
            Agenda citas, responde dudas y captura leads mientras tú descansas.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center gap-4 mb-16">
            <div className="relative">
              <div className="absolute -top-8 -right-8 rotate-12">
                <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-glow whitespace-nowrap">
                  ← 7 días gratis
                </div>
              </div>
              <button onClick={() => signIn('google', { callbackUrl: '/trial' })} className="btn-primary btn-lg shadow-glow-lg animate-pulse-glow text-lg px-10">
                Regístrate gratis
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Social proof */}
          <p className="text-muted-foreground text-sm mb-12">
            Sin tarjeta de crédito · Configuración en 5 minutos · Cancela cuando quieras
          </p>
        </motion.div>

        {/* Floating mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative max-w-4xl mx-auto"
        >
          <div className="card border-primary/20 shadow-glow-lg overflow-hidden">
            {/* Mock dashboard header */}
            <div className="flex items-center gap-2 border-b border-border px-6 py-3 bg-muted/30">
              <div className="w-3 h-3 rounded-full bg-destructive" />
              <div className="w-3 h-3 rounded-full bg-warning" />
              <div className="w-3 h-3 rounded-full bg-success" />
              <span className="text-xs text-muted-foreground ml-4">recept.ai — Dashboard</span>
            </div>

            {/* Mock stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
              {[
                { label: 'Llamadas hoy', value: '24', icon: Phone, color: 'text-primary' },
                { label: 'Citas creadas', value: '8', icon: Calendar, color: 'text-success' },
                { label: 'WhatsApp', value: '47', icon: MessageCircle, color: 'text-accent' },
                { label: 'Minutos activo', value: '386', icon: Clock, color: 'text-warning' },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted/40 rounded-lg p-4 text-left">
                  <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Mock live call indicator */}
            <div className="px-6 pb-6">
              <div className="flex items-center gap-3 bg-success/10 border border-success/20 rounded-lg px-4 py-3">
                <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                <span className="text-sm text-success font-medium">Llamada activa</span>
                <span className="text-sm text-muted-foreground">— Sofia está atendiendo a +52 55 1234 5678</span>
              </div>
            </div>
          </div>

          {/* Floating notifications */}
          <motion.div
            animate={{ y: [-4, 4, -4] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-4 -right-4 card border-success/30 bg-card shadow-card px-4 py-3 text-sm hidden md:block"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="font-medium">Nueva cita agendada</span>
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">María López — Consulta dental, Lunes 10am</p>
          </motion.div>

          <motion.div
            animate={{ y: [4, -4, 4] }}
            transition={{ duration: 4, repeat: Infinity, delay: 1 }}
            className="absolute -bottom-4 -left-4 card border-primary/30 bg-card shadow-card px-4 py-3 text-sm hidden md:block"
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-primary" />
              <span className="font-medium">WhatsApp respondido</span>
            </div>
            <p className="text-muted-foreground text-xs mt-0.5">+52 33 9876 5432 — "¿Cuál es el horario?"</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Features Section ────────────────────────────────────────────────────────
const features = [
  {
    icon: Phone,
    title: 'Llamadas 24/7',
    description: 'Voz natural con IA. Atiende cada llamada de tu negocio con la misma calidad que un humano.',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp Automático',
    description: 'Responde mensajes al instante. Mantiene contexto de la conversación y agenda citas sin fricción.',
    color: 'from-green-500 to-emerald-600',
  },
  {
    icon: Calendar,
    title: 'Citas Automáticas',
    description: 'La IA recopila datos del cliente y agenda citas en tu calendario. Sin pérdida de leads.',
    color: 'from-purple-500 to-violet-600',
  },
  {
    icon: Clock,
    title: 'Disponible Siempre',
    description: 'Fines de semana, festivos, madrugadas. Tu negocio nunca pierde una oportunidad.',
    color: 'from-orange-500 to-amber-600',
  },
  {
    icon: BarChart3,
    title: 'Analytics en Tiempo Real',
    description: 'Dashboard completo con llamadas, transcripciones, citas y métricas de rendimiento.',
    color: 'from-pink-500 to-rose-600',
  },
  {
    icon: Globe,
    title: 'Multi-idioma',
    description: 'Configura el idioma de tu recepcionista. Español, inglés y más.',
    color: 'from-cyan-500 to-blue-600',
  },
];

function Features() {
  return (
    <section id="features" className="section bg-background">
      <div className="container-xl">
        <div className="text-center mb-16">
          <div className="badge-primary mb-4">Características</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Todo lo que necesita tu negocio
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Una plataforma completa para automatizar la atención al cliente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card-hover group"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── How It Works ────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Configura tu empresa',
      description: 'Ingresa los datos de tu negocio: horarios, servicios, FAQ y personalidad de tu recepcionista.',
      icon: Shield,
    },
    {
      step: '02',
      title: 'Activa los canales',
      description: 'Conecta tu número de teléfono y WhatsApp en minutos. Sin código, sin complicaciones.',
      icon: Zap,
    },
    {
      step: '03',
      title: 'La IA trabaja por ti',
      description: 'Tu recepcionista virtual atiende llamadas y mensajes 24/7 automáticamente.',
      icon: Bot,
    },
    {
      step: '04',
      title: 'Monitorea en tu dashboard',
      description: 'Revisa transcripciones, citas agendadas y métricas en tiempo real.',
      icon: BarChart3,
    },
  ];

  return (
    <section className="section bg-card/30 border-y border-border">
      <div className="container-xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Empieza en <span className="gradient-text">5 minutos</span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Sin configuración técnica. Sin código.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="relative text-center"
            >
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] h-px bg-gradient-to-r from-border to-transparent" />
              )}
              <div className="w-12 h-12 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="text-4xl font-black text-primary/20 mb-2">{step.step}</div>
              <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing Section ─────────────────────────────────────────────────────────
const plans = [
  {
    id: 'basic',
    name: 'Basic',
    price: 99,
    description: 'Ideal para negocios pequeños',
    color: 'border-border',
    badge: null,
    features: [
      '100 llamadas/mes',
      '500 mensajes WhatsApp',
      '1 número de teléfono',
      'Dashboard básico',
      'Historial 30 días',
      'Soporte por email',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 199,
    description: 'Para negocios en crecimiento',
    color: 'border-primary',
    badge: 'Más popular',
    features: [
      '500 llamadas/mes',
      'WhatsApp ilimitado',
      '3 números de teléfono',
      'Analytics avanzado',
      'Historial completo',
      'Soporte prioritario',
      'Personalidad avanzada',
      'Exportar transcripciones',
    ],
  },
  {
    id: 'business',
    name: 'Business',
    price: 349,
    description: 'Para empresas',
    color: 'border-accent/50',
    badge: 'Empresas',
    features: [
      'Llamadas ilimitadas',
      'WhatsApp ilimitado',
      '10 números de teléfono',
      'Multi-sucursal',
      'API access',
      'Soporte 24/7',
      'Integración CRM',
      'Reportes personalizados',
      'SLA garantizado',
    ],
  },
];

function Pricing() {
  const [billing] = useState<'monthly'>('monthly');

  return (
    <section id="pricing" className="section bg-background">
      <div className="container-xl">
        <div className="text-center mb-16">
          <div className="badge-primary mb-4">Precios</div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Simple y transparente
          </h2>
          <p className="text-xl text-muted-foreground">
            14 días gratis en todos los planes. Sin tarjeta de crédito.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className={`relative card border-2 ${plan.color} ${plan.id === 'pro' ? 'shadow-glow scale-105' : ''}`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`badge ${plan.id === 'pro' ? 'badge-primary' : 'badge-muted'} text-xs px-3 py-1`}>
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold mb-1">{plan.name}</h3>
                <p className="text-muted-foreground text-sm">{plan.description}</p>
              </div>

              <div className="mb-6">
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black">${plan.price}</span>
                  <span className="text-muted-foreground mb-1">/mes</span>
                </div>
              </div>

              <button
                onClick={() => signIn('google', { callbackUrl: `/trial?plan=${plan.id}` })}
                className={`${plan.id === 'pro' ? 'btn-primary' : 'btn-outline'} w-full justify-center mb-6`}
              >
                Comenzar gratis
              </button>

              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-success flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ────────────────────────────────────────────────────────────
const testimonials = [
  {
    name: 'Dr. Carlos Méndez',
    role: 'Dentista · Guadalajara',
    text: 'Antes perdía 20+ llamadas al día. Ahora la IA las atiende todas y me manda un resumen. Mis citas aumentaron 40%.',
    rating: 5,
    avatar: 'CM',
  },
  {
    name: 'Sofía Ramírez',
    role: 'Spa & Wellness · CDMX',
    text: 'Mis clientes dicen que la recepcionista es "muy amable". No saben que es IA. Es increíble.',
    rating: 5,
    avatar: 'SR',
  },
  {
    name: 'Roberto Torres',
    role: 'Consultorio Legal · Monterrey',
    text: 'Configuré todo en 10 minutos. Ahora mi número funciona 24/7 y los clientes pueden agendar consultas a cualquier hora.',
    rating: 5,
    avatar: 'RT',
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="section bg-card/30 border-y border-border">
      <div className="container-xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Lo que dicen nuestros clientes
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="card-hover"
            >
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 text-warning fill-warning" />
                ))}
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-semibold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Final ────────────────────────────────────────────────────────────────
function CTASection() {
  return (
    <section className="section bg-background relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/8 blur-3xl" />
      </div>
      <div className="container-xl text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Empieza hoy.<br />
            <span className="gradient-text">Es gratis por 14 días.</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Únete a cientos de negocios que ya automatizan su atención al cliente con Recept.ai.
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute -top-8 -right-8 rotate-12">
                <div className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full shadow-glow whitespace-nowrap">
                  ← 7 días gratis
                </div>
              </div>
              <button onClick={() => signIn('google', { callbackUrl: '/trial' })} className="btn-primary btn-lg shadow-glow-lg">
                Regístrate gratis
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            Sin tarjeta de crédito · Cancela cuando quieras · Soporte en español
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-border py-12 px-6">
      <div className="container-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold">Recept<span className="text-primary">.ai</span></span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Recept.ai — Tu recepcionista nunca duerme
          </p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacidad</a>
            <a href="#" className="hover:text-foreground transition-colors">Términos</a>
            <a href="#" className="hover:text-foreground transition-colors">Contacto</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <Testimonials />
      <CTASection />
      <Footer />
    </main>
  );
}
