'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Phone, Calendar, MessageCircle, Clock,
  TrendingUp, ArrowUpRight, Bot, Activity,
  CheckCircle, AlertCircle, PhoneCall, Users
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Stats {
  callsToday: number;
  callsMonth: number;
  appointmentsPending: number;
  appointmentsMonth: number;
  minutesMonth: number;
  whatsappMonth: number;
}

function StatCard({
  title, value, subtitle, icon: Icon, color, trend
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card-hover"
    >
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
      {trend && (
        <div className="flex items-center gap-1 mt-3 text-xs text-success">
          <TrendingUp className="w-3 h-3" />
          {trend}
        </div>
      )}
    </motion.div>
  );
}

function RecentCallsTable({ calls }: { calls: any[] }) {
  if (calls.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <PhoneCall className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p>No hay llamadas registradas aún</p>
        <p className="text-xs mt-1">Las llamadas aparecerán aquí automáticamente</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="table-head">
            <th className="text-left px-4 py-3">Número</th>
            <th className="text-left px-4 py-3">Duración</th>
            <th className="text-left px-4 py-3">Cita</th>
            <th className="text-left px-4 py-3">Fecha</th>
            <th className="text-left px-4 py-3">Estado</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => (
            <tr key={call.id} className="table-row">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <Phone className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-mono">{call.phone_from || 'Desconocido'}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {call.duration_seconds ? `${Math.round(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s` : '—'}
              </td>
              <td className="px-4 py-3">
                {call.appointment_created ? (
                  <span className="badge-success"><CheckCircle className="w-3 h-3" /> Agendada</span>
                ) : (
                  <span className="badge-muted">No</span>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {format(new Date(call.created_at), "d MMM, HH:mm", { locale: es })}
              </td>
              <td className="px-4 py-3">
                <span className={`badge ${call.status === 'completed' ? 'badge-success' : call.status === 'missed' ? 'badge-error' : 'badge-warning'}`}>
                  {call.status === 'completed' ? 'Completada' : call.status === 'missed' ? 'Perdida' : call.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UpcomingAppointments({ appointments }: { appointments: any[] }) {
  if (appointments.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
        <p className="text-sm">No hay citas próximas</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {appointments.slice(0, 5).map((apt) => (
        <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex flex-col items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary">{format(new Date(apt.date), 'd')}</span>
            <span className="text-[10px] text-muted-foreground">{format(new Date(apt.date), 'MMM', { locale: es })}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{apt.patient_name}</p>
            <p className="text-xs text-muted-foreground truncate">{apt.service} · {format(new Date(apt.date), 'HH:mm')}</p>
          </div>
          <span className={`badge flex-shrink-0 ${apt.status === 'confirmed' ? 'badge-success' : apt.status === 'pending' ? 'badge-warning' : 'badge-muted'}`}>
            {apt.status === 'confirmed' ? 'Confirmada' : apt.status === 'pending' ? 'Pendiente' : apt.status}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChannelStatus() {
  return (
    <div className="space-y-3">
      {[
        { name: 'Llamadas (Vapi)', status: 'active', icon: Phone, color: 'text-primary' },
        { name: 'WhatsApp', status: 'active', icon: MessageCircle, color: 'text-green-500' },
        { name: 'Widget Web', status: 'inactive', icon: Bot, color: 'text-muted-foreground' },
      ].map((channel) => (
        <div key={channel.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
          <div className="flex items-center gap-2">
            <channel.icon className={`w-4 h-4 ${channel.color}`} />
            <span className="text-sm">{channel.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${channel.status === 'active' ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`} />
            <span className={`text-xs ${channel.status === 'active' ? 'text-success' : 'text-muted-foreground'}`}>
              {channel.status === 'active' ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCalls, setRecentCalls] = useState<any[]>([]);
  const [upcomingApts, setUpcomingApts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      const [statsData, callsData, aptsData] = await Promise.all([
        api.dashboard.stats(),
        api.dashboard.calls(1, 5),
        api.dashboard.appointments('pending', 1),
      ]);
      setStats(statsData);
      setRecentCalls(callsData.calls || []);
      setUpcomingApts(aptsData.appointments || []);
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              {format(new Date(), "EEEE d 'de' MMMM, yyyy", { locale: es })}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-success">
            <Activity className="w-4 h-4" />
            <span>Recepcionista activa</span>
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Llamadas hoy"
            value={loading ? '—' : stats?.callsToday ?? 0}
            subtitle={`${stats?.callsMonth ?? 0} este mes`}
            icon={Phone}
            color="bg-primary/15 text-primary"
          />
          <StatCard
            title="Citas pendientes"
            value={loading ? '—' : stats?.appointmentsPending ?? 0}
            subtitle={`${stats?.appointmentsMonth ?? 0} este mes`}
            icon={Calendar}
            color="bg-success/15 text-success"
          />
          <StatCard
            title="WhatsApp (mes)"
            value={loading ? '—' : stats?.whatsappMonth ?? 0}
            subtitle="Mensajes respondidos"
            icon={MessageCircle}
            color="bg-green-500/15 text-green-500"
          />
          <StatCard
            title="Minutos activa"
            value={loading ? '—' : `${stats?.minutesMonth ?? 0}m`}
            subtitle="Este mes"
            icon={Clock}
            color="bg-warning/15 text-warning"
          />
        </div>

        {/* Main content grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recent Calls - 2/3 */}
          <div className="lg:col-span-2">
            <div className="card h-full">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Llamadas recientes</h2>
                <a href="/calls" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Ver todas <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
              <div className="table-container">
                <RecentCallsTable calls={recentCalls} />
              </div>
            </div>
          </div>

          {/* Right column - 1/3 */}
          <div className="space-y-6">
            {/* Upcoming Appointments */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">Próximas citas</h2>
                <a href="/appointments" className="text-sm text-primary hover:underline flex items-center gap-1">
                  Ver todas <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
              <UpcomingAppointments appointments={upcomingApts} />
            </div>

            {/* Channel Status */}
            <div className="card">
              <h2 className="font-semibold mb-4">Estado de canales</h2>
              <ChannelStatus />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
