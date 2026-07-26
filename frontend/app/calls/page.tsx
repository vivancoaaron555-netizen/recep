'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone, Search, Filter, X, Clock, Calendar,
  CheckCircle, PhoneCall, ChevronLeft, ChevronRight,
  FileText, Bot
} from 'lucide-react';
import { AppLayout } from '@/components/AppLayout';
import { api } from '@/lib/api';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Call {
  id: string;
  phone_from: string;
  duration_seconds: number;
  transcript: string;
  summary: string;
  appointment_created: boolean;
  status: string;
  created_at: string;
}

function TranscriptModal({ call, onClose }: { call: Call; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="w-full max-w-2xl max-h-[90vh] flex flex-col"
        >
          <div className="card overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-semibold">{call.phone_from || 'Número desconocido'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(call.created_at), "d 'de' MMMM yyyy, HH:mm", { locale: es })}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="btn-ghost p-2">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Call metadata */}
            <div className="grid grid-cols-3 gap-3 p-6 border-b border-border">
              <div className="text-center">
                <Clock className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm font-medium">
                  {call.duration_seconds
                    ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                    : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Duración</p>
              </div>
              <div className="text-center">
                <Calendar className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm font-medium">
                  {call.appointment_created ? 'Sí' : 'No'}
                </p>
                <p className="text-xs text-muted-foreground">Cita agendada</p>
              </div>
              <div className="text-center">
                <CheckCircle className="w-4 h-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-sm font-medium capitalize">{call.status}</p>
                <p className="text-xs text-muted-foreground">Estado</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* AI Summary */}
              {call.summary && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Bot className="w-4 h-4 text-primary" />
                    <h3 className="font-medium text-sm">Resumen de IA</h3>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-sm text-muted-foreground leading-relaxed">
                    {call.summary}
                  </div>
                </div>
              )}

              {/* Transcript */}
              {call.transcript ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <h3 className="font-medium text-sm">Transcripción completa</h3>
                  </div>
                  <div className="bg-muted/30 border border-border rounded-lg p-4 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-mono">
                    {call.transcript}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-sm">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  No hay transcripción disponible para esta llamada
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CallsPage() {
  const [calls, setCalls] = useState<Call[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [search, setSearch] = useState('');

  const loadCalls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.dashboard.calls(page, 20);
      setCalls(data.calls || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Error loading calls:', err);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => { loadCalls(); }, [loadCalls]);

  const filteredCalls = calls.filter(c =>
    !search || (c.phone_from && c.phone_from.includes(search))
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Historial de llamadas</h1>
            <p className="text-muted-foreground text-sm">{total} llamadas en total</p>
          </div>
        </div>

        {/* Search */}
        <div className="card">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="input pl-10"
              placeholder="Buscar por número de teléfono..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Calls Table */}
        <div className="card">
          <div className="table-container">
            <table className="w-full">
              <thead>
                <tr className="table-head">
                  <th className="text-left px-4 py-3">Número</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Duración</th>
                  <th className="text-left px-4 py-3 hidden md:table-cell">Cita</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Transcripción</th>
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
                ) : filteredCalls.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                      <PhoneCall className="w-10 h-10 mx-auto mb-3 opacity-30" />
                      <p>No hay llamadas registradas</p>
                    </td>
                  </tr>
                ) : (
                  filteredCalls.map((call) => (
                    <motion.tr
                      key={call.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="table-row cursor-pointer"
                      onClick={() => setSelectedCall(call)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <span className="text-sm font-mono">{call.phone_from || 'Desconocido'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground hidden sm:table-cell">
                        {call.duration_seconds
                          ? `${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`
                          : '—'}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {call.appointment_created ? (
                          <span className="badge-success"><CheckCircle className="w-3 h-3" /> Sí</span>
                        ) : (
                          <span className="badge-muted">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`badge ${
                          call.status === 'completed' ? 'badge-success' :
                          call.status === 'missed' ? 'badge-error' :
                          'badge-warning'
                        }`}>
                          {call.status === 'completed' ? 'Completada' :
                           call.status === 'missed' ? 'Perdida' : call.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {format(new Date(call.created_at), "d MMM, HH:mm", { locale: es })}
                      </td>
                      <td className="px-4 py-3">
                        <button className="btn-ghost text-xs py-1 px-2">
                          {call.transcript ? 'Ver transcript' : 'Sin transcript'}
                        </button>
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
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary btn-sm"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-secondary btn-sm"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedCall && (
        <TranscriptModal call={selectedCall} onClose={() => setSelectedCall(null)} />
      )}
    </AppLayout>
  );
}
