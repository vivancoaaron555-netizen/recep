'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar, Check, X, Clock, User, Phone,
  ChevronLeft, ChevronRight, Filter, CheckCircle,
  XCircle, AlertCircle, RefreshCw
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

type Status = 'all' | 'pending' | 'confirmed' | 'cancelled' | 'completed';

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'confirmed', label: 'Confirmadas' },
  { value: 'cancelled', label: 'Canceladas' },
  { value: 'completed', label: 'Completadas' },
];

function AppointmentStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    pending: { label: 'Pendiente', className: 'badge-warning', icon: Clock },
    confirmed: { label: 'Confirmada', className: 'badge-success', icon: CheckCircle },
    cancelled: { label: 'Cancelada', className: 'badge-error', icon: XCircle },
    completed: { label: 'Completada', className: 'badge-primary', icon: CheckCircle },
  };
  const { label, className, icon: Icon } = config[status] || config.pending;
  return (
    <span className={`badge ${className}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Status>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.appointments(statusFilter, page);
      setAppointments(data.appointments || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => { loadAppointments(); }, [loadAppointments]);
  useEffect(() => { setPage(1); }, [statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    setUpdatingId(id);
    try {
      await api.dashboard.updateAppointment(id, { status });
      toast.success(`Cita ${status === 'confirmed' ? 'confirmada' : status === 'cancelled' ? 'cancelada' : 'actualizada'}`);
      await loadAppointments();
    } catch (err: any) {
      toast.error(err.message || 'Error al actualizar cita');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Citas</h1>
            <p className="text-muted-foreground text-sm">{total} citas en total</p>
          </div>
          <button onClick={loadAppointments} className="btn-secondary btn-sm">
            <RefreshCw className="w-4 h-4" />
            Actualizar
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`btn-sm flex-shrink-0 ${statusFilter === opt.value ? 'btn-primary' : 'btn-secondary'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card">
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-4 py-3">Paciente</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Servicio</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Origen</th>
                  <th className="text-left px-4 py-3">Acciones</th>
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
                ) : appointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No hay citas {statusFilter !== 'all' ? `con estado "${statusFilter}"` : 'registradas'}</p>
                    </td>
                  </tr>
                ) : (
                  appointments.map((apt) => (
                    <motion.tr
                      key={apt.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="table-row"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{apt.patient_name}</p>
                            <p className="text-xs text-muted-foreground">{apt.patient_phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {apt.service}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p>{format(new Date(apt.date), "d MMM yyyy", { locale: es })}</p>
                          <p className="text-xs text-muted-foreground">{format(new Date(apt.date), "HH:mm")}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <AppointmentStatusBadge status={apt.status} />
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell capitalize">
                        {apt.source === 'call' ? '📞 Llamada' : apt.source === 'whatsapp' ? '💬 WhatsApp' : apt.source}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {apt.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateStatus(apt.id, 'confirmed')}
                                disabled={updatingId === apt.id}
                                className="btn-sm bg-success/15 text-success hover:bg-success/25 border border-success/30 rounded-lg px-2 py-1"
                                title="Confirmar"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => updateStatus(apt.id, 'cancelled')}
                                disabled={updatingId === apt.id}
                                className="btn-sm bg-destructive/15 text-destructive hover:bg-destructive/25 border border-destructive/30 rounded-lg px-2 py-1"
                                title="Cancelar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {apt.status === 'confirmed' && (
                            <button
                              onClick={() => updateStatus(apt.id, 'completed')}
                              disabled={updatingId === apt.id}
                              className="btn-sm bg-primary/15 text-primary hover:bg-primary/25 border border-primary/30 rounded-lg px-2 py-1 text-xs"
                            >
                              Completar
                            </button>
                          )}
                          {(apt.status === 'cancelled' || apt.status === 'completed') && (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-border mt-4">
              <p className="text-sm text-muted-foreground">
                Página {page} de {totalPages}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary btn-sm">
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary btn-sm">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
