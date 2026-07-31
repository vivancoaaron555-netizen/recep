'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Building2, Bot, Radio, CreditCard, Save, Loader2,
  ExternalLink, Check, AlertCircle, Phone, MessageCircle, Globe,
  Upload, Link
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { api } from '@/lib/api';
import { toast } from 'sonner';

type Tab = 'company' | 'assistant' | 'channels' | 'billing';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'assistant', label: 'Recepcionista', icon: Bot },
  { id: 'channels', label: 'Canales', icon: Radio },
  { id: 'billing', label: 'Plan y Facturación', icon: CreditCard },
];

const PERSONALITIES = [
  { id: 'professional', label: 'Profesional' },
  { id: 'friendly', label: 'Amigable' },
  { id: 'energetic', label: 'Energética' },
  { id: 'calm', label: 'Tranquila' },
];

const VOICES = [
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sofia', gender: 'female' },
  { id: 'XB0fDUnXU5powFXDhCwa', name: 'Charlotte', gender: 'female' },
  { id: 'MF3mGyEYCl7XYWbV9V6O', name: 'Valentina', gender: 'female' },
  { id: 'XrExE9yKIg1WjnnlVkGX', name: 'Matilde', gender: 'female' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lucía', gender: 'female' },
  { id: 'Xb7hH8MSUJpSbSDYk0k2', name: 'Alicia', gender: 'female' },
  { id: 'pNInz6obpgDQGcFmaJgB', name: 'Alejandro', gender: 'male' },
  { id: 'N2lVS1w4EtoT3dr4eOWO', name: 'Carlos', gender: 'male' },
  { id: 'TxGEqnHWrfWFTfGW9XjX', name: 'Javier', gender: 'male' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel', gender: 'male' },
  { id: 'AZnzlk1XvdvUeBnXmlld', name: 'Diego', gender: 'male' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'Jorge', gender: 'male' },
];

function CompanyTab({ data }: { data: any }) {
  const [form, setForm] = useState({
    name: data?.name || '',
    sector: data?.sector || '',
    address: data?.address || '',
    phone: data?.phone || '',
    website: data?.website || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.onboarding.saveCompany({
        ...form,
        schedule: data?.schedule || {},
        services: data?.services || [],
      });
      toast.success('Empresa actualizada correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Información de la Empresa</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre del negocio</label>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Sector</label>
          <input className="input" value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input className="input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>
        <div>
          <label className="label">Sitio web</label>
          <input className="input" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="label">Dirección</label>
          <input className="input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>
      </div>
      <button onClick={handleSave} disabled={loading} className="btn-primary">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
      </button>
    </div>
  );
}

function AssistantTab() {
  const [form, setForm] = useState({
    name: 'Sofia',
    gender: 'female',
    voice_id: VOICES[0].id,
    language: 'es',
    personality: 'professional',
    system_prompt: '',
    custom_info: '',
  });
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [gdocUrl, setGdocUrl] = useState('');
  const [showGdocInput, setShowGdocInput] = useState(false);

  useEffect(() => {
    Promise.all([
      api.onboarding.getAssistant(),
      api.auth.me(),
    ]).then(([{ assistant }, { company }]) => {
      if (assistant) {
        setForm(prev => ({
          ...prev,
          name: assistant.name || 'Sofia',
          gender: assistant.gender || 'female',
          voice_id: assistant.voice_id || VOICES[0].id,
          language: assistant.language || 'es',
          personality: assistant.personality || 'professional',
          system_prompt: assistant.system_prompt || '',
          custom_info: assistant.custom_info || company?.custom_info || '',
        }));
      }
    })
    .catch(() => {})
    .finally(() => setFetching(false));
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      await api.onboarding.saveAssistant({
        name: form.name, gender: form.gender, voice_id: form.voice_id,
        language: form.language, personality: form.personality,
        system_prompt: form.system_prompt,
        custom_info: form.custom_info,
      });
      toast.success('Recepcionista actualizada correctamente');
    } catch (err: any) {
      toast.error(err.message || 'Error al guardar');
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
      setForm(prev => ({ ...prev, custom_info: prev.custom_info ? prev.custom_info + '\n\n' + result.text : result.text }));
      toast.success('Archivo importado');
    } catch (err: any) {
      toast.error(err.message || 'Error al importar');
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
      setForm(prev => ({ ...prev, custom_info: prev.custom_info ? prev.custom_info + '\n\n' + result.text : result.text }));
      toast.success('Documento importado');
      setShowGdocInput(false);
      setGdocUrl('');
    } catch (err: any) {
      toast.error(err.message || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  if (fetching) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Configuración de Recepcionista</h2>
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre</label>
          <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Idioma</label>
          <select className="input" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
        <div>
          <label className="label">Género</label>
          <select className="input" value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
            <option value="female">Femenino</option>
            <option value="male">Masculino</option>
          </select>
        </div>
        <div>
          <label className="label">Voz</label>
          <select className="input" value={form.voice_id} onChange={e => setForm({ ...form, voice_id: e.target.value })}>
            {VOICES.filter(v => v.gender === form.gender).map(v => (
              <option key={v.id} value={v.id}>{v.name}</option>
            ))}
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="label">Personalidad</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {PERSONALITIES.map(p => (
              <button key={p.id} type="button" onClick={() => setForm({ ...form, personality: p.id })}
                className={`rounded-lg border-2 px-3 py-2 text-sm transition-all ${form.personality === p.id ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:border-border/80'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <label className="label">Instrucciones personalizadas (system prompt)</label>
          <textarea className="input h-32 resize-none font-mono text-xs"
            value={form.system_prompt}
            onChange={e => setForm({ ...form, system_prompt: e.target.value })}
            placeholder="Escribe instrucciones personalizadas para tu recepcionista..." />
          <p className="text-xs text-muted-foreground mt-1">Si lo dejas vacío, se genera automáticamente según la personalidad y datos de la empresa</p>
        </div>
        <div className="md:col-span-2">
          <label className="label">Información adicional de la empresa</label>
          <p className="text-xs text-muted-foreground mb-2">Precios, políticas, horarios especiales, promociones — todo lo que debe saber la recepcionista.</p>
          <textarea className="input h-32 resize-none font-mono text-xs"
            value={form.custom_info}
            onChange={e => setForm({ ...form, custom_info: e.target.value })}
            placeholder="Ej: Precios, promociones, políticas de cancelación..." />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={importing} className="btn-secondary text-xs">
              {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Upload className="w-3 h-3" /> Subir archivo</>}
            </button>
            <button type="button" onClick={() => setShowGdocInput(!showGdocInput)} className="btn-secondary text-xs">
              <Link className="w-3 h-3" /> Google Docs
            </button>
            <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.gif,.webp" className="hidden" onChange={handleFileUpload} />
          </div>
          {showGdocInput && (
            <div className="flex gap-2 mt-2">
              <input className="input text-sm flex-1" placeholder="Pega la URL de Google Docs..."
                value={gdocUrl} onChange={e => setGdocUrl(e.target.value)} />
              <button type="button" onClick={handleImportGdoc} disabled={importing || !gdocUrl.trim()} className="btn-primary text-xs">
                {importing ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Importar'}
              </button>
            </div>
          )}
        </div>
      </div>
      <button onClick={handleSave} disabled={loading} className="btn-primary">
        {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Guardando...</> : <><Save className="w-4 h-4" /> Guardar cambios</>}
      </button>
    </div>
  );
}

function ChannelsTab() {
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.phoneNumbers.my()
      .then(data => setPhoneNumber(data.phoneNumber))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Canales de Atención</h2>

      {/* Phone channel with number display */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Phone className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">Llamadas telefónicas</p>
              <p className="text-sm text-muted-foreground">
                {loading ? 'Cargando...' : phoneNumber || 'Sin número asignado'}
              </p>
            </div>
          </div>
          <span className="badge-success"><Check className="w-3 h-3" /> Activo</span>
        </div>
      </div>

      {[
        {
          name: 'WhatsApp', icon: MessageCircle, status: 'active', color: 'text-green-500',
          desc: 'Respuesta automática a mensajes de WhatsApp',
        },
        {
          name: 'Widget Web', icon: Globe, status: 'coming_soon', color: 'text-muted-foreground',
          desc: 'Chat con IA incrustado en tu sitio web',
        },
      ].map((channel) => (
        <div key={channel.name} className="card flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <channel.icon className={`w-5 h-5 ${channel.color}`} />
            </div>
            <div>
              <p className="font-medium">{channel.name}</p>
              <p className="text-sm text-muted-foreground">{channel.desc}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {channel.status === 'active' ? (
              <span className="badge-success"><Check className="w-3 h-3" /> Activo</span>
            ) : (
              <span className="badge-muted">Próximamente</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function BillingTab({ subscription }: { subscription: any }) {
  const [loading, setLoading] = useState(false);

  const openPortal = async () => {
    setLoading(true);
    try {
      const { url } = await api.billing.openPortal();
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.message || 'Error al abrir portal');
    } finally {
      setLoading(false);
    }
  };

  const PLAN_INFO: Record<string, { name: string; price: string; features: string[] }> = {
    basic: { name: 'Basic', price: '$99/mes', features: ['100 llamadas/mes', '500 WhatsApp', '1 número'] },
    pro: { name: 'Pro', price: '$199/mes', features: ['500 llamadas/mes', 'WhatsApp ilimitado', '3 números'] },
    business: { name: 'Business', price: '$349/mes', features: ['Llamadas ilimitadas', 'WhatsApp ilimitado', '10 números'] },
  };

  const planInfo = subscription?.plan ? PLAN_INFO[subscription.plan] : null;

  return (
    <div className="space-y-4">
      <h2 className="font-semibold text-lg">Plan y Facturación</h2>

      {planInfo ? (
        <div className="card border-primary/30">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-bold text-xl">{planInfo.name}</h3>
              <p className="text-muted-foreground">{planInfo.price}</p>
            </div>
            <span className={`badge ${
              subscription?.status === 'active' ? 'badge-success' :
              subscription?.status === 'trialing' ? 'badge-warning' :
              'badge-error'
            }`}>
              {subscription?.status === 'active' ? 'Activo' :
               subscription?.status === 'trialing' ? 'Trial' :
               subscription?.status || 'Inactivo'}
            </span>
          </div>
          <ul className="space-y-2 mb-6">
            {planInfo.features.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-success" /> {f}
              </li>
            ))}
          </ul>
          <button onClick={openPortal} disabled={loading} className="btn-primary">
            {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Cargando...</> : <><ExternalLink className="w-4 h-4" /> Gestionar suscripción</>}
          </button>
        </div>
      ) : (
        <div className="card border-warning/30">
          <div className="flex items-center gap-2 text-warning mb-3">
            <AlertCircle className="w-5 h-5" />
            <span className="font-medium">Sin suscripción activa</span>
          </div>
          <p className="text-muted-foreground text-sm mb-4">Activa un plan para continuar usando Recept.ai.</p>
          <a href="/register" className="btn-primary inline-flex">Ver planes</a>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('company');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.auth.me().then((data) => {
      setUserData(data);
      setLoading(false);
    });
  }, []);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Configuración</h1>
          <p className="text-muted-foreground text-sm">Gestiona tu empresa, recepcionista y plan</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border overflow-x-auto pb-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all flex-shrink-0 ${
                activeTab === tab.id
                  ? 'bg-card border border-b-card border-border text-foreground -mb-px'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'company' && <CompanyTab data={userData?.company} />}
              {activeTab === 'assistant' && <AssistantTab />}
              {activeTab === 'channels' && <ChannelsTab />}
              {activeTab === 'billing' && <BillingTab subscription={userData?.subscription} />}
            </motion.div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
