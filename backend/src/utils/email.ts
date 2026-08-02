import { supabase } from './supabase';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@recept.ink';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailParams) {
  if (!RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not configured');
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[email] Send failed:', err);
  }
}

export async function sendNewAppointmentEmail(companyId: string, appointment: {
  patient_name: string;
  patient_phone: string;
  service: string;
  date: string;
}) {
  const { data: company } = await supabase
    .from('companies')
    .select('name, user_id')
    .eq('id', companyId)
    .single();

  if (!company) return;

  const { data: user } = await supabase
    .from('users')
    .select('email, name')
    .eq('id', company.user_id)
    .single();

  if (!user?.email) return;

  const dateObj = new Date(appointment.date);
  const dateStr = dateObj.toLocaleDateString('es-ES', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  await sendEmail({
    to: user.email,
    subject: `Nueva cita agendada — ${company.name}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#8B5CF6;">Nueva cita agendada</h2>
        <p>Hola <strong>${user.name || 'admin'}</strong>,</p>
        <p>Se ha agendado una nueva cita en <strong>${company.name}</strong>:</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Paciente</td><td style="padding:8px;border:1px solid #e5e7eb;">${appointment.patient_name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Teléfono</td><td style="padding:8px;border:1px solid #e5e7eb;">${appointment.patient_phone}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Servicio</td><td style="padding:8px;border:1px solid #e5e7eb;">${appointment.service}</td></tr>
          <tr><td style="padding:8px;border:1px solid #e5e7eb;font-weight:600;">Fecha</td><td style="padding:8px;border:1px solid #e5e7eb;">${dateStr}</td></tr>
        </table>
        <p style="color:#6b7280;font-size:14px;">Recept.ai — Tu recepcionista virtual</p>
      </div>
    `,
  });
}
