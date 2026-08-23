'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, User, Radio, Check,
  ChevronRight, ChevronLeft, Loader2, Plus, X,
  Phone, MessageCircle, Globe, Volume2, CreditCard,
  Link
} from 'lucide-react';
import { api, setApiToken } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────
const SECTORS = [
  'Clínica / Consultorio médico',
  'Odontología / Dental',
  'Spa & Belleza',
  'Restaurante / Comida',
  'Abogados / Legal',
  'Contabilidad / Finanzas',
  'Inmobiliaria',
  'Educación',
  'Gimnasio / Fitness',
  'Veterinaria',
  'Otro',
];

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sofia', gender: 'female', description: 'Profesional y cálida', lang: 'es' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female', description: 'Elegante y clara', lang: 'es' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Valentina', gender: 'female', description: 'Cercana y serena', lang: 'es' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilde', gender: 'female', description: 'Tranquila y confiable', lang: 'es' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lucía', gender: 'female', description: 'Joven y amable', lang: 'es' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alicia', gender: 'female', description: 'Suave y delicada', lang: 'es' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Alejandro', gender: 'male', description: 'Formal y seguro', lang: 'es' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Carlos', gender: 'male', description: 'Amigable y directo', lang: 'es' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Javier', gender: 'male', description: 'Serio y profesional', lang: 'es' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male', description: 'Natural y tranquilo', lang: 'es' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Diego', gender: 'male', description: 'Sólido y seguro', lang: 'es' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Jorge', gender: 'male', description: 'Cálido y pausado', lang: 'es' },
];

const PERSONALITIES = [
  { id: 'professional', label: 'Profesional', desc: 'Formal, directa y eficiente' },
  { id: 'friendly', label: 'Amigable', desc: 'Cálida, cercana y empática' },
  { id: 'energetic', label: 'Energética', desc: 'Dinámica y entusiasta' },
  { id: 'calm', label: 'Tranquila', desc: 'Serena, pausada y confiable' },
];

const PLANS = [
  {
    id: 'basic',
    name: 'Starter',
    price: '€49',
    period: '/mes',
    desc: 'Ideal para negocios pequeños',
    features: ['100 minutos/mes', '1 número de teléfono', 'Dashboard básico', 'Historial 30 días', 'Soporte por email'],
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '€99',
    period: '/mes',
    desc: 'Para negocios en crecimiento',
    features: ['300 minutos/mes', 'WhatsApp incluido', '3 números de teléfono', 'Analytics avanzado', 'Historial completo', 'Soporte prioritario'],
    highlighted: true,
  },
  {
    id: 'business',
    name: 'Business',
    price: '€199',
    period: '/mes',
    desc: 'Para empresas',
    features: ['Minutos ilimitados', 'WhatsApp ilimitado', '10 números de teléfono', 'Multi-sucursal', 'API access', 'Soporte 24/7'],
    highlighted: false,
  },
];

const DEFAULT_SCHEDULE = {
  monday: { open: '09:00', close: '18:00', active: true },
  tuesday: { open: '09:00', close: '18:00', active: true },
  wednesday: { open: '09:00', close: '18:00', active: true },
  thursday: { open: '09:00', close: '18:00', active: true },
  friday: { open: '09:00', close: '18:00', active: true },
  saturday: { open: '09:00', close: '13:00', active: false },
  sunday: { open: '09:00', close: '13:00', active: false },
};

const DAY_LABELS: Record<string, string> = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles',
  thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo',
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">Paso {step} de {total}</span>
        <span className="text-sm font-medium text-primary">{Math.round((step / total) * 100)}%</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-primary rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${(step / total) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex items-center justify-between mt-3">
        {[
          { label: 'Plan', icon: CreditCard },
          { label: 'Empresa', icon: Building2 },
          { label: 'Recepcionista', icon: User },
          { label: 'Canales', icon: Radio },
          { label: 'Pago', icon: CreditCard },
        ].map((s, i) => (
          <div key={s.label} className={`flex flex-col items-center gap-1 ${i + 1 <= step ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
              i + 1 < step ? 'bg-primary border-primary text-white' :
              i + 1 === step ? 'border-primary text-primary bg-primary/10' :
              'border-border text-muted-foreground'
            }`}>
              <s.icon className="w-4 h-4" />
            </div>
            <span className="text-xs hidden sm:block">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Step 0: Plan Selection ────────────────────────────────────────────────────
function Step0({ selectedPlan, onSelect, onNext }: { selectedPlan: string; onSelect: (plan: string) => void; onNext: () => void }) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-1">Elige tu plan</h2>
        <p className="text-muted-foreground">Comienza con 7 días gratis. Sin compromiso.</p>
      </div>
      <div className="grid gap-4">
        {PLANS.map((p) => (
          <button key={p.id} type="button" onClick={() => onSelect(p.id)}
            className={`card text-left transition-all relative ${
              selectedPlan === p.id
                ? 'border-2 border-primary bg-primary/5 ring-1 ring-primary/20'
                : 'border border-border hover:border-border/80'
            }`}>
            {p.highlighted && (
              <span className="absolute -top-3 right-4 bg-primary text-white text-xs font-bold px-3 py-0.5 rounded-full">
                Más popular
              </span>
            )}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold text-lg">{p.name}</div>
                <div className="text-sm text-muted-foreground">{p.desc}</div>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold">{p.price}</span>
                <span className="text-muted-foreground">{p.period}</span>
              </div>
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-1">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Check className="w-3 h-3 text-success shrink-0" /> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">7 días gratis incluidos en cualquier plan. Cancela cuando quieras.</p>
      <button type="button" onClick={onNext} className="btn-primary w-full justify-center">
        Continuar <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Step 1: Company Info ─────────────────────────────────────────────────────
function Step1({ onNext }: { onNext: (data: any) => void }) {
  const [form, setForm] = useState({
    name: '', sector: '', address: '', phone: '', website: '',
  });
  const [schedule, setSchedule] = useState(DEFAULT_SCHEDULE);
  const [services, setServices] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const addService = () => setServices([...services, '']);
  const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));
  const updateService = (i: number, val: string) => {
    const s = [...services];
    s[i] = val;
    setServices(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredServices = services.filter(s => s.trim());
    if (filteredServices.length === 0) {
      toast.error('Agrega al menos un servicio');
      return;
    }
    setLoading(true);
    try {
      await api.onboarding.saveCompany({
        ...form,
        schedule,
        services: filteredServices,
      });
      onNext({ ...form, schedule, services: filteredServices });
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar empresa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Información de tu empresa</h2>
        <p className="text-muted-foreground">La IA usará estos datos para atender a tus clientes</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre del negocio *</label>
          <input className="input" placeholder="Clínica Dental Méndez" required
            value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Sector *</label>
          <select className="input" required value={form.sector}
            onChange={e => setForm({ ...form, sector: e.target.value })}>
            <option value="">Selecciona un sector</option>
            {SECTORS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input" placeholder="+52 55 1234 5678"
            value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Sitio web</label>
          <input className="input" placeholder="www.miclinica.com"
            value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Dirección</label>
          <input className="input" placeholder="Av. Insurgentes 123, Col. Roma, CDMX"
            value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
      </div>

      {/* Services */}
      <div>
        <label className="label">Servicios que ofreces *</label>
        <div className="space-y-2">
          {services.map((s, i) => (
            <div key={i} className="flex gap-2">
              <input className="input flex-1" placeholder={`Ej: Consulta general, Limpieza dental...`}
                value={s} onChange={e => updateService(i, e.target.value)} />
              {services.length > 1 && (
                <button type="button" onClick={() => removeService(i)} className="btn-ghost p-2 text-destructive">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addService} className="btn-secondary text-sm">
            <Plus className="w-4 h-4" /> Agregar servicio
          </button>
        </div>
      </div>

      {/* Schedule */}
      <div>
        <label className="label">Horario de atención</label>
        <div className="space-y-2">
          {Object.entries(schedule).map(([day, config]) => (
            <div key={day} className="flex items-center gap-3">
              <label className="flex items-center gap-2 w-28 cursor-pointer">
                <input type="checkbox" checked={config.active}
                  onChange={e => setSchedule({ ...schedule, [day]: { ...config, active: e.target.checked } })}
                  className="w-4 h-4 accent-primary" />
                <span className="text-sm">{DAY_LABELS[day]}</span>
              </label>
              {config.active && (
                <>
                  <input type="time" className="input w-32 text-sm" value={config.open}
                    onChange={e => setSchedule({ ...schedule, [day]: { ...config, open: e.target.value } })} />
                  <span className="text-muted-foreground text-sm">a</span>
                  <input type="time" className="input w-32 text-sm" value={config.close}
                    onChange={e => setSchedule({ ...schedule, [day]: { ...config, close: e.target.value } })} />
                </>
              )}
              {!config.active && <span className="text-sm text-muted-foreground">Cerrado</span>}
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <>Continuar <ChevronRight className="w-4 h-4" /></>}
      </button>
    </form>
  );
}

// ─── Step 2: Assistant Config ─────────────────────────────────────────────────
function Step2({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [form, setForm] = useState({
    name: 'Sofia',
    gender: 'female' as 'female' | 'male',
    voice_id: VOICES[0].id,
    language: 'es',
    personality: 'professional',
  });
  const [customInfo, setCustomInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [gdocUrl, setGdocUrl] = useState('');
  const [showGdocInput, setShowGdocInput] = useState(false);

  const femaleVoices = VOICES.filter(v => v.gender === 'female');
  const maleVoices = VOICES.filter(v => v.gender === 'male');
  const voicesForGender = form.gender === 'female' ? femaleVoices : maleVoices;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Save assistant config + custom info together
      await api.onboarding.saveAssistant({ ...form, custom_info: customInfo });
      onNext({ ...form, customInfo });
    } catch (err: any) {
      toast.error(err.message || 'Error al configurar asistente');
    } finally {
      setLoading(false);
    }
  };

  const handleImportGdoc = async () => {
    if (!gdocUrl.trim()) return;
    setImporting(true);
    try {
      const result = await api.onboarding.importGdoc(gdocUrl.trim());
      setCustomInfo(prev => prev ? prev + '\n\n' + result.text : result.text);
      toast.success('Documento importado correctamente');
      setShowGdocInput(false);
      setGdocUrl('');
    } catch (err: any) {
      toast.error(err.message || 'Error al importar documento');
    } finally {
      setImporting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Configura tu recepcionista</h2>
        <p className="text-muted-foreground">Personaliza la IA que atenderá a tus clientes</p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre de la recepcionista *</label>
          <input className="input" placeholder="Sofia, Alejandra, Carlos..."
            value={form.name} required
            onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Idioma *</label>
          <select className="input" value={form.language}
            onChange={e => setForm({ ...form, language: e.target.value })}>
            <option value="es">Español</option>
            <option value="en">English</option>
            <option value="es-mx">Español México</option>
          </select>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="label">Género de la voz</label>
        <div className="grid grid-cols-2 gap-3">
          {(['female', 'male'] as const).map((g) => (
            <button key={g} type="button"
              onClick={() => {
                const defaultVoice = g === 'female' ? VOICES[0].id : VOICES.find((v) => v.gender === 'male')!.id;
                setForm({ ...form, gender: g, voice_id: defaultVoice });
              }}
              className={`rounded-xl border-2 p-4 text-center transition-all ${
                form.gender === g ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-border/80'
              }`}>
              <div className="text-2xl mb-1">{g === 'female' ? '👩' : '👨'}</div>
              <div className="font-medium capitalize">{g === 'female' ? 'Femenino' : 'Masculino'}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Voice selection */}
      <div>
        <label className="label">Voz</label>
        <div className="grid grid-cols-2 gap-3">
          {voicesForGender.map((voice) => (
            <button key={voice.id} type="button"
              onClick={() => setForm({ ...form, voice_id: voice.id })}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                form.voice_id === voice.id ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm">{voice.name}</span>
                <Volume2 className={`w-4 h-4 ${form.voice_id === voice.id ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <span className="text-xs text-muted-foreground">{voice.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Personality */}
      <div>
        <label className="label">Personalidad</label>
        <div className="grid grid-cols-2 gap-3">
          {PERSONALITIES.map((p) => (
            <button key={p.id} type="button"
              onClick={() => setForm({ ...form, personality: p.id })}
              className={`rounded-xl border-2 p-3 text-left transition-all ${
                form.personality === p.id ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80'
              }`}>
              <div className="font-medium text-sm mb-0.5">{p.label}</div>
              <div className="text-xs text-muted-foreground">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Company additional info */}
      <div>
        <label className="label">Información adicional de la empresa</label>
        <p className="text-xs text-muted-foreground mb-2">
          Escribe precios, políticas, promociones o cualquier info que deba saber la recepcionista.
          También puedes importar de Google Docs.
        </p>
        <textarea className="input h-32 resize-none font-mono text-xs"
          value={customInfo}
          onChange={e => setCustomInfo(e.target.value)}
          placeholder="Ej: Precios: Consulta general $500, Limpieza dental $800. Aceptamos VISA y Mastercard. Promoción 2x1 en primera consulta..." />
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => setShowGdocInput(!showGdocInput)}
            className="btn-secondary text-xs">
            <Link className="w-3 h-3" /> Google Docs
          </button>
        </div>
        {showGdocInput && (
          <div className="flex gap-2 mt-2">
            <input className="input text-sm flex-1" placeholder="Pega la URL de Google Docs..."
              value={gdocUrl} onChange={e => setGdocUrl(e.target.value)} />
            <button type="button" onClick={handleImportGdoc} disabled={importing || !gdocUrl.trim()}
              className="btn-primary text-xs">
              {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Importar'}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-secondary flex-1 justify-center">
          <ChevronLeft className="w-4 h-4" /> Atrás
        </button>
        <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <>Continuar <ChevronRight className="w-4 h-4" /></>}
        </button>
      </div>
    </form>
  );
}

// ─── Step 3: Channels + Phone Verification ────────────────────────────────────
function Step3({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [loading, setLoading] = useState(false);
  const [channelData, setChannelData] = useState<any>(null);

  const SHARED_NUMBER = '+1 901 799 6050';

  const handleActivate = async () => {
    setLoading(true);
    try {
      const data = await api.onboarding.completeChannels();
      setChannelData(data);
      toast.success('¡Canales activados!');
    } catch (err: any) {
      toast.error(err.message || 'Error al activar canales');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-1">Activa tus canales</h2>
        <p className="text-muted-foreground">Conecta los canales por donde atenderás a tus clientes</p>
      </div>

      <div className="space-y-4">
        {/* Phone Channel */}
        <div className="card border-primary/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Llamadas telefónicas</h3>
                <span className={`badge ${channelData ? 'badge-success' : 'badge-primary'}`}>
                  {channelData ? 'Activo' : 'Incluido'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Recibe llamadas con voz IA las 24/7
              </p>
            </div>
          </div>
        </div>

        {/* WhatsApp Channel */}
        <div className="card border-green-500/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-5 h-5 text-green-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">WhatsApp</h3>
                <span className={`badge ${channelData ? 'badge-success' : 'badge-muted'}`}>
                  {channelData ? 'Activo' : 'Pendiente'}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Respuesta automática a mensajes de WhatsApp 24/7
              </p>
            </div>
          </div>
        </div>

        {/* Web Widget */}
        <div className="card border-accent/20">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Widget Web</h3>
                <span className="badge badge-muted">Próximamente</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Incrusta un chat con IA en tu sitio web
              </p>
            </div>
          </div>
        </div>
      </div>

      {channelData ? (
        <>
          <div className="card border-primary/30 bg-primary/5 text-center">
            <Phone className="w-10 h-10 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Tu número temporal</p>
            <p className="text-2xl font-bold tracking-wide">{SHARED_NUMBER}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Este es tu número por <strong>7 días de prueba</strong>. Cuando actives tu plan, recibirás un número dedicado permanente.
            </p>
          </div>
          <button onClick={() => onNext(channelData)} className="btn-primary w-full justify-center">
            Continuar al pago <ChevronRight className="w-4 h-4" />
          </button>
        </>
      ) : (
        <button onClick={handleActivate} disabled={loading} className="btn-primary w-full justify-center">
          {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Activando...</> : <>Obtener mi número temporal <ChevronRight className="w-4 h-4" /></>}
        </button>
      )}

      <button onClick={onBack} className="btn-ghost w-full justify-center text-sm">
        <ChevronLeft className="w-4 h-4" /> Atrás
      </button>
    </div>
  );
}

// ─── Step 4: Payment ──────────────────────────────────────────────────────────
const STEP4_PLANS: Record<string, { name: string; price: string; features: string[] }> = {
  basic: { name: 'Starter', price: '€49/mes', features: ['100 minutos/mes', '1 número de teléfono', 'Dashboard básico', 'Historial 30 días'] },
  pro: { name: 'Pro', price: '€99/mes', features: ['300 minutos/mes', 'WhatsApp incluido', '3 números de teléfono', 'Analytics avanzado', 'Personalidad avanzada'] },
  business: { name: 'Business', price: '€199/mes', features: ['Minutos ilimitados', 'WhatsApp ilimitado', '10 números de teléfono', 'Multi-sucursal', 'API access', 'Soporte 24/7'] },
};

function Step4({ plan }: { plan: string }) {
  const [loading, setLoading] = useState(false);
  const planInfo = STEP4_PLANS[plan] || STEP4_PLANS.basic;

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { url } = await api.billing.createCheckout(plan);
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Último paso — pago seguro</h2>
        <p className="text-muted-foreground">Tu plan quedará activo al instante. Pago procesado por Stripe.</p>
      </div>

      <div className="card bg-muted/50 border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Plan {planInfo.name}</span>
          <span className="text-lg font-bold">{planInfo.price}</span>
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          {planInfo.features.map((f) => (
            <li key={f} className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> {f}</li>
          ))}
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Recepcionista IA 24/7</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Panel de control con estadísticas</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> 7 días gratis incluidos</li>
        </ul>
      </div>

      <button onClick={handlePayment} disabled={loading} className="btn-primary w-full justify-center">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a pago...</> : <>Pagar {planInfo.price} <ChevronRight className="w-4 h-4" /></>}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingPageContent />
    </Suspense>
  );
}

function OnboardingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialPlan = searchParams.get('plan') || 'basic';
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState(initialPlan);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.backendToken) { router.push('/login'); return; }
    setApiToken(session.backendToken);
  }, [session, status, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full bg-primary/4 blur-3xl" />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-8">
          <span className="font-bold text-lg">Recept.ai</span>
        </div>

        <ProgressBar step={currentStep + 1} total={5} />

        <div className="card">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 0 && <Step0 selectedPlan={selectedPlan} onSelect={setSelectedPlan} onNext={() => setCurrentStep(1)} />}
              {currentStep === 1 && <Step1 onNext={() => setCurrentStep(2)} />}
              {currentStep === 2 && <Step2 onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />}
              {currentStep === 3 && <Step3 onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />}
              {currentStep === 4 && <Step4 plan={selectedPlan} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
