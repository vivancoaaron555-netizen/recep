'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Shield, Building2, Users, Phone, Calendar,
  TrendingUp, DollarSign, BarChart3, RefreshCw,
  CheckCircle, XCircle, Clock, Globe, Activity,
  UserPlus, ChevronRight, Bot, MessageCircle, CreditCard
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { api, setApiToken } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

function AdminStatCard({ title, value, icon: Icon, color, subtitle }: {
  title: string; value: number | string; icon: React.ElementType;
  color: string; subtitle?: string;
}) {
  return (
    <div className="card-hover">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-black">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

const STAGE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  registered: { label: 'Registrados', icon: UserPlus, color: 'text-muted-foreground' },
  company: { label: 'Empresa creada', icon: Building2, color: 'text-purple-400' },
  assistant: { label: 'Recepcionista lista', icon: Bot, color: 'text-primary' },
  phone_verified: { label: 'Teléfono verificado', icon: Phone, color: 'text-green-500' },
  onboarding_complete: { label: 'Onboarding completo', icon: CheckCircle, color: 'text-success' },
  trialing: { label: 'En prueba gratis', icon: Clock, color: 'text-warning' },
  active: { label: 'Suscripción activa', icon: CreditCard, color: 'text-secondary' },
};

function StageBadge({ stage }: { stage: string }) {
  const cfg = STAGE_CONFIG[stage] || STAGE_CONFIG.registered;
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${cfg.color} bg-muted/50`}>
      <Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [pipeline, setPipeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'companies' | 'pipeline'>('overview');
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user || session.user.role !== 'admin') {
      router.push('/dashboard');
    }
    if (session?.backendToken) setApiToken(session.backendToken);
  }, [session, status, router]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, companiesData, pipelineData] = await Promise.all([
        api.admin.stats(),
        api.admin.companies(),
        api.admin.pipeline(),
      ]);
      setStats(statsData);
      setCompanies(companiesData.companies || []);
      setPipeline(pipelineData.stages || []);
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const maxPipelineCount = Math.max(...pipeline.map(s => s.count), 1);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground text-sm">Vista global de la plataforma Recept.ai</p>
            </div>
          </div>
          <button onClick={loadData} className="btn-secondary btn-sm">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-border">
          {[
            { id: 'overview', label: 'Resumen', icon: BarChart3 },
            { id: 'pipeline', label: 'Etapas', icon: TrendingUp },
            { id: 'companies', label: 'Empresas', icon: Building2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all -mb-px ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            {/* MRR Banner */}
            <div className="card bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">MRR Estimado</p>
                  <p className="text-4xl font-black text-primary">
                    ${loading ? '—' : stats?.mrr?.toLocaleString() || 0}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Ingresos mensuales recurrentes</p>
                </div>
                <DollarSign className="w-12 h-12 text-primary/30" />
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <AdminStatCard title="Empresas totales" value={loading ? '—' : stats?.totalCompanies ?? 0}
                icon={Building2} color="bg-primary/15 text-primary" />
              <AdminStatCard title="Usuarios totales" value={loading ? '—' : stats?.totalUsers ?? 0}
                icon={Users} color="bg-secondary/15 text-secondary" />
              <AdminStatCard title="Llamadas totales" value={loading ? '—' : stats?.totalCalls ?? 0}
                icon={Phone} color="bg-success/15 text-success" />
              <AdminStatCard title="Citas totales" value={loading ? '—' : stats?.totalAppointments ?? 0}
                icon={Calendar} color="bg-warning/15 text-warning" />
              <AdminStatCard title="Llamadas hoy" value={loading ? '—' : stats?.callsToday ?? 0}
                icon={Activity} color="bg-pink-500/15 text-pink-500" />
              <AdminStatCard title="Empresas este mes" value={loading ? '—' : stats?.newCompaniesMonth ?? 0}
                icon={TrendingUp} color="bg-cyan-500/15 text-cyan-500" />
            </div>

            {/* Plans breakdown */}
            {stats?.planCounts && (
              <div className="card">
                <h2 className="font-semibold mb-4">Distribución de Planes</h2>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { plan: 'basic', label: 'Starter', price: '€49', color: 'text-primary' },
                    { plan: 'pro', label: 'Pro', price: '€99', color: 'text-secondary' },
                    { plan: 'business', label: 'Business', price: '€199', color: 'text-warning' },
                  ].map((p) => (
                    <div key={p.plan} className="text-center p-4 rounded-xl bg-muted/30 border border-border">
                      <p className={`text-3xl font-black ${p.color}`}>{stats.planCounts[p.plan] || 0}</p>
                      <p className="font-medium text-sm">{p.label}</p>
                      <p className="text-xs text-muted-foreground">{p.price}/mes</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'pipeline' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
            <h2 className="font-semibold mb-6">Embudo de activación</h2>
            <div className="space-y-2">
              {pipeline.map((stage, i) => {
                const cfg = STAGE_CONFIG[stage.id] || STAGE_CONFIG.registered;
                const Icon = cfg.icon;
                const pct = maxPipelineCount > 0 ? Math.round((stage.count / maxPipelineCount) * 100) : 0;
                return (
                  <div key={stage.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-36 text-right flex-shrink-0">
                      <p className="text-2xl font-black">{stage.count}</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                        <span className="text-sm font-medium">{cfg.label}</span>
                      </div>
                      <div className="h-3 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={`h-full rounded-full ${stage.count === maxPipelineCount ? 'bg-primary' : 'bg-primary/40'}`}
                        />
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-xs text-muted-foreground">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'companies' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <div className="card">
              <div className="table-container">
                <table className="w-full">
                  <thead>
                    <tr className="table-head">
                      <th className="text-left px-4 py-3">Empresa</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Sector</th>
                      <th className="text-left px-4 py-3">Plan</th>
                      <th className="text-left px-4 py-3">Etapa</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">Llamadas</th>
                      <th className="text-left px-4 py-3 hidden lg:table-cell">Registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="table-row">
                          {Array.from({ length: 6 }).map((_, j) => (
                            <td key={j} className="px-4 py-3">
                              <div className="h-4 bg-muted rounded animate-pulse" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : companies.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                          <Building2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
                          <p>No hay empresas registradas</p>
                        </td>
                      </tr>
                    ) : (
                      companies.map((company) => (
                        <tr key={company.id} className="table-row">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-sm">{company.name}</p>
                              <p className="text-xs text-muted-foreground">{(company.users as any)?.email || '—'}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                            {company.sector}
                          </td>
                          <td className="px-4 py-3">
                            {company.subscription ? (
                              <span className="badge-primary text-xs">{company.subscription.plan?.toUpperCase()}</span>
                            ) : (
                              <span className="badge-muted text-xs">Sin plan</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <StageBadge stage={company.stage} />
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                            {company.callCount || 0}
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                            {format(new Date(company.created_at), "d MMM yyyy", { locale: es })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}