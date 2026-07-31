'use client';

import { useState, useEffect } from 'react';
import { Bot, Check, X, Loader2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

type ServiceStatus = {
  name: string;
  status: 'ok' | 'error';
  latency?: string;
};

export default function StatusPage() {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [timestamp, setTimestamp] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${API}/api/status`);
      const data = await res.json();
      setServices(data.services || []);
      setTimestamp(data.timestamp);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const allOk = services.every(s => s.status === 'ok');
  const timeAgo = timestamp ? Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <Link href="/" className="inline-flex items-center gap-2 mb-8 mx-auto justify-center w-full">
          <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Recept.ai</span>
        </Link>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold">Estado del sistema</h1>
              <p className="text-sm text-muted-foreground">
                {allOk ? 'Todos los servicios funcionando' : 'Algunos servicios presentan problemas'}
              </p>
            </div>
            <div className={`w-3 h-3 rounded-full ${allOk ? 'bg-success' : 'bg-destructive'} animate-pulse`} />
          </div>

          <div className="space-y-3">
            {services.map(s => (
              <div key={s.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                <div className="flex items-center gap-3">
                  {s.status === 'ok' ? (
                    <div className="w-8 h-8 rounded-full bg-success/15 flex items-center justify-center">
                      <Check className="w-4 h-4 text-success" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-destructive/15 flex items-center justify-center">
                      <X className="w-4 h-4 text-destructive" />
                    </div>
                  )}
                  <span className="font-medium capitalize">{s.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {s.latency && <span className="text-xs text-muted-foreground">{s.latency}</span>}
                  <span className={`badge ${s.status === 'ok' ? 'badge-success' : 'badge-error'}`}>
                    {s.status === 'ok' ? 'Operativo' : 'Error'}
                  </span>
                </div>
              </div>
            ))}

            {loading && services.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-6 pt-4 border-t border-border text-xs text-muted-foreground">
            <span>
              {timeAgo !== null ? `Actualizado hace ${timeAgo}s` : 'Sin datos'}
            </span>
            <button onClick={fetchStatus} disabled={loading} className="btn-ghost p-1.5">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
