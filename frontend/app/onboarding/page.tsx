'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Building2, User, Radio, Check,
  ChevronRight, ChevronLeft, Loader2, Plus, X,
  Phone, MessageCircle, Globe, Volume2, CreditCard,
  Upload, Link
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
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Alejandro', gender: 'male', description: 'Formal y seguro', lang: 'es' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Carlos', gender: 'male', description: 'Amigable y directo', lang: 'es' },
];

const PERSONALITIES = [
  { id: 'professional', label: 'Profesional', desc: 'Formal, directa y eficiente' },
  { id: 'friendly', label: 'Amigable', desc: 'Cálida, cercana y empática' },
  { id: 'energetic', label: 'Energética', desc: 'Dinámica y entusiasta' },
  { id: 'calm', label: 'Tranquila', desc: 'Serena, pausada y confiable' },
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
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const result = await api.onboarding.uploadDoc(file);
      setCustomInfo(prev => prev ? prev + '\n\n' + result.text : result.text);
      toast.success('Archivo importado correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al importar archivo');
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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
                const defaultVoice = g === 'female' ? VOICES[0].id : VOICES[2].id;
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
          También puedes subir un archivo o importar de Google Docs.
        </p>
        <textarea className="input h-32 resize-none font-mono text-xs"
          value={customInfo}
          onChange={e => setCustomInfo(e.target.value)}
          placeholder="Ej: Precios: Consulta general $500, Limpieza dental $800. Aceptamos VISA y Mastercard. Promoción 2x1 en primera consulta..." />
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing}
            className="btn-secondary text-xs">
            {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Upload className="w-3 h-3" /> Subir archivo</>}
          </button>
          <button type="button" onClick={() => setShowGdocInput(!showGdocInput)}
            className="btn-secondary text-xs">
            <Link className="w-3 h-3" /> Google Docs
          </button>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp" className="hidden" onChange={handleFileUpload} />
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
function Step4({ router }: { router: ReturnType<typeof useRouter> }) {
  const [loading, setLoading] = useState(false);
  const [skipLoading, setSkipLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { url } = await api.billing.createCheckout('basic');
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar pago');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    setSkipLoading(true);
    try {
      await api.billing.startTrial();
      toast.success('¡Prueba gratis activada!');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar prueba');
    } finally {
      setSkipLoading(false);
    }
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-1">Último paso — configura tu pago</h2>
        <p className="text-muted-foreground">No te cobraremos hoy, solo guardamos tu tarjeta</p>
      </div>

      <div className="card bg-muted/50 border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-semibold">Plan Basic</span>
          <span className="text-lg font-bold">$99/mes</span>
        </div>
        <ul className="space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Asistente IA para llamadas y WhatsApp</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Atención al cliente 24/7 automatizada</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> Panel de control con estadísticas</li>
          <li className="flex items-center gap-2"><Check className="w-4 h-4 text-success" /> 7 días de prueba gratuita</li>
        </ul>
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Cancela cuando quieras durante los 7 días de prueba. No habrá cargos hasta que termine el periodo.
        </p>
      </div>

      <button onClick={handlePayment} disabled={loading} className="btn-primary w-full justify-center">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a pago...</> : <>Configurar método de pago <ChevronRight className="w-4 h-4" /></>}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">o</span>
        </div>
      </div>

      <button onClick={handleSkip} disabled={skipLoading} className="btn-ghost w-full justify-center text-sm">
        {skipLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Empezar prueba gratis sin tarjeta'}
      </button>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(1);

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
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Recept<span className="text-primary">.ai</span></span>
        </div>

        <ProgressBar step={currentStep} total={4} />

        <div className="card">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {currentStep === 1 && <Step1 onNext={() => setCurrentStep(2)} />}
              {currentStep === 2 && <Step2 onNext={() => setCurrentStep(3)} onBack={() => setCurrentStep(1)} />}
              {currentStep === 3 && <Step3 onNext={() => setCurrentStep(4)} onBack={() => setCurrentStep(2)} />}
              {currentStep === 4 && <Step4 router={router} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
