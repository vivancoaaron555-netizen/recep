const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

let cachedToken: string | null = null;

export function setApiToken(token: string | null) {
  cachedToken = token;
}

export function getApiToken(): string | null {
  if (typeof window === 'undefined') return null;
  return cachedToken || localStorage.getItem('recept_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getApiToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    register: (data: { name: string; email: string; password: string; plan?: string }) =>
      request<{ token: string; user: any }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    login: (data: { email: string; password: string }) =>
      request<{ token: string; user: any; company: any }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    me: () => request<{ user: any; company: any; subscription: any }>('/api/auth/me'),
  },

  onboarding: {
    saveCompany: (data: any) =>
      request<{ company: any }>('/api/onboarding/company', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    saveAssistant: (data: any) =>
      request<{ assistant: any }>('/api/onboarding/assistant', {
        method: 'POST',
        body: JSON.stringify(data),
      }),

    completeChannels: () =>
      request<any>('/api/onboarding/channels', { method: 'POST' }),

    sendCode: () =>
      request<{ sent: boolean; message: string }>('/api/onboarding/send-code', { method: 'POST' }),

    verifyCode: (code: string) =>
      request<{ verified: boolean; message: string }>('/api/onboarding/verify-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  },

  dashboard: {
    stats: () => request<any>('/api/dashboard/stats'),
    calls: (page = 1, limit = 20) =>
      request<any>(`/api/calls?page=${page}&limit=${limit}`),
    appointments: (status = 'all', page = 1) =>
      request<any>(`/api/appointments?status=${status}&page=${page}`),
    updateAppointment: (id: string, data: any) =>
      request<any>(`/api/appointments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  billing: {
    createCheckout: (plan: string) =>
      request<{ url: string }>('/api/billing/create-checkout', {
        method: 'POST',
        body: JSON.stringify({ plan }),
      }),

    openPortal: () =>
      request<{ url: string }>('/api/billing/portal', { method: 'POST' }),
  },

  admin: {
    companies: () => request<any>('/api/admin/companies'),
    stats: () => request<any>('/api/admin/stats'),
    pipeline: () => request<{ stages: any[] }>('/api/admin/pipeline'),
  },
};
