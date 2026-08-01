import type { Metadata } from 'next';
import LegalShell from '@/components/LegalShell';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Política de Privacidad',
  description: 'Política de privacidad de Recept.ai conforme al Reglamento General de Protección de Datos (RGPD).',
};

const sections = [
  {
    title: '1. Responsable del tratamiento',
    body: `El responsable del tratamiento de los datos personales es ${LEGAL.legalName}, con NIF ${LEGAL.nif} y domicilio en ${LEGAL.address}, ${LEGAL.city}. Puedes contactarnos en ${LEGAL.email}.`,
  },
  {
    title: '2. Datos que recogemos',
    body: `Registro de cuenta: nombre, correo electrónico, nombre y sector de tu empresa, teléfono y datos de acceso. Configuración del asistente: preferencias de voz, personalidad e instrucciones personalizadas. Llamadas: grabaciones de audio y transcripciones de las llamadas gestionadas por tu asistente. WhatsApp: mensajes enviados y recibidos a través del canal conectado. Pagos: procesados por Stripe, que trata los datos de tarjeta; nosotros solo conservamos el identificador de suscripción y el estado del pago. Navegación: cookies y datos analíticos según nuestra Política de Cookies.`,
  },
  {
    title: '3. Finalidades y base legal',
    body: 'Tratamos tus datos para: (a) prestar y mantener el servicio contratado, base legal: ejecución del contrato; (b) facturar y gestionar los pagos, base legal: ejecución del contrato y obligación legal; (c) atender solicitudes de soporte, base legal: interés legítimo y ejecución del contrato; (d) enviar comunicaciones sobre el servicio, base legal: interés legítimo o consentimiento; (e) cumplir obligaciones legales aplicables.',
  },
  {
    title: '4. Grabación de llamadas y WhatsApp',
    body: 'El servicio graba o transcribe llamadas y conserva mensajes para prestar la recepción automatizada. Es tu responsabilidad, como cliente, informar a tus interlocutores de la grabación y del uso de un asistente automatizado con IA, de acuerdo con la normativa de telecomunicaciones y protección de datos aplicable.',
  },
  {
    title: '5. Conservación de los datos',
    body: 'Conservamos tus datos mientras mantengas la cuenta y durante los plazos legales aplicables. Las grabaciones y registros de llamadas se conservan el tiempo necesario para prestar el servicio y cumplir obligaciones legales, y se eliminan de forma segura después.',
  },
  {
    title: '6. Destinatarios y encargados',
    body: `Para prestar el servicio compartimos datos con encargados que los tratan bajo nuestras instrucciones: proveedor de base de datos (Supabase), alojamiento (Railway), proveedor de voz y transcripción (Vapi, ElevenLabs), modelos de lenguaje (Groq), telefonía (Twilio), pagos (Stripe) y, si instalas analítica, Google Analytics. No vendemos tus datos a terceros.`,
  },
  {
    title: '7. Transferencias internacionales',
    body: 'Algunos de nuestros proveedores pueden tratar datos fuera del Espacio Económico Europeo. En esos casos garantizamos la aplicación de medidas de seguridad adecuadas, como cláusulas contractuales tipo aprobadas por la Comisión Europea u otros mecanismos legalmente reconocidos.',
  },
  {
    title: '8. Derechos',
    body: `Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a ${LEGAL.email}, indicando el derecho que deseas ejercer. También puedes presentar una reclamación ante la Agencia Española de Protección de Datos (www.aepd.es).`,
  },
  {
    title: '9. Menores',
    body: 'El servicio no está dirigido a menores de 18 años. No recogemos conscientemente datos de menores. Si detectamos su tratamiento, los eliminaremos.',
  },
  {
    title: '10. Seguridad',
    body: 'Aplicamos medidas técnicas y organizativas adecuadas (cifrado en tránsito y reposo, control de accesos, monitorización) para proteger tus datos frente a accesos no autorizados. Ningún sistema es totalmente infalible, por lo que no podemos garantizar una seguridad absoluta.',
  },
  {
    title: '11. Cambios en esta política',
    body: `Podemos actualizar esta política para reflejar cambios legales o del servicio. La fecha de última actualización se indica al inicio de esta página.`,
  },
];

export default function PrivacidadPage() {
  return (
    <LegalShell>
      <h1 className="text-3xl font-bold mb-2">Política de Privacidad</h1>
      <p className="text-sm text-muted-foreground mb-8">Última actualización: {LEGAL.lastUpdated}</p>
      <div className="space-y-6">
        {sections.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{s.body}</p>
          </section>
        ))}
      </div>
    </LegalShell>
  );
}
