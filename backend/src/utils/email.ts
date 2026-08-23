import { supabase } from './supabase';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@recept.ink';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://recept.ink';

interface EmailParams {
  from?: string;
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ from, to, subject, html }: EmailParams) {
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
      from: from || FROM_EMAIL,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error('[email] Send failed:', err);
  } else {
    console.log('[email] Email sent successfully');
  }
}

export async function sendWelcomeEmail(email: string) {
  console.log(`[email] Sending welcome email to ${email}...`);
  await sendEmail({
    from: 'aaron@recept.ink',
    to: email,
    subject: 'Bienvenido a Recept.ai — Tu recepcionista de IA está lista',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1f2937;">
        <h2 style="color:#8B5CF6;margin-bottom:4px;">Bienvenido a Recept.ai</h2>
        <p style="margin-top:0;">Nos alegra tenerte.</p>

        <p>Ya puedes configurar tu recepcionista de IA en menos de 5 minutos. Solo necesitas:</p>

        <ol style="line-height:1.8;">
          <li>Completar la información de tu empresa</li>
          <li>Elegir el nombre y la voz de tu recepcionista</li>
          <li>Activar los canales (llamadas y/o WhatsApp)</li>
        </ol>

        <p>Y listo — desde ese momento nunca más perderás una llamada.</p>

        <a href="${FRONTEND_URL}/onboarding" style="display:inline-block;background:#8B5CF6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0;">Completar configuración</a>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;"/>

        <h3 style="color:#8B5CF6;margin-bottom:4px;">📞 Tu número durante la prueba gratuita</h3>
        <p>Durante tus <strong>7 días de prueba</strong> te asignamos un número de teléfono predeterminado para que puedas probar Recept.ai desde el primer momento sin esperar nada.</p>
        <p>Una vez que decidas continuar y actives tu plan, te asignamos un número personalizado exclusivo para tu negocio — el que tus clientes llamarán directamente.</p>

        <p style="color:#6b7280;font-size:14px;">Si tienes cualquier duda, responde a este email directamente. Estoy aquí para ayudarte.</p>

        <p>Un saludo,<br/><strong>Aaron</strong><br/>Fundador de Recept.ai<br/><a href="mailto:aaron@recept.ink" style="color:#8B5CF6;">aaron@recept.ink</a></p>

        <p style="color:#9ca3af;font-size:12px;margin-top:24px;">P.D. Tu prueba gratuita de 7 días ya ha comenzado. Aprovéchala al máximo.</p>
      </div>
    `,
  });
  console.log(`[email] Welcome email sent to ${email}`);
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
