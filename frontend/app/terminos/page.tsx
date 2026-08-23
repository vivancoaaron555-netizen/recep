import type { Metadata } from 'next';
import LegalShell from '@/components/LegalShell';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Términos y Condiciones',
  description: 'Términos y condiciones de uso del servicio de recepcionista virtual con IA de Recept.ai.',
};

const sections = [
  {
    title: '1. Aceptación de los términos',
    body: `Al acceder o utilizar ${LEGAL.brand} aceptas estos Términos y Condiciones. Si no estás de acuerdo con alguna parte, no debes usar el servicio. Estos términos constituyen un acuerdo legal entre tú y ${LEGAL.legalName}.`,
  },
  {
    title: '2. Descripción del servicio',
    body: `${LEGAL.brand} es un servicio de recepción automatizada con inteligencia artificial que gestiona llamadas telefónicas y mensajes de WhatsApp de tu negocio: saludo, toma de citas, resolución de consultas frecuentes y derivación cuando sea necesario. El servicio se presta mediante la conexión de números de teléfono y canales de WhatsApp proporcionados o configurados por el cliente.`,
  },
  {
    title: '3. Registro y cuentas',
    body: 'Para usar el servicio debes crear una cuenta proporcionando datos veraces y mantenerlos actualizados. Eres responsable de la confidencialidad de tus credenciales y de toda actividad realizada en tu cuenta. Debes tener al menos 18 años y capacidad legal para contratar.',
  },
  {
    title: '4. Prueba gratuita',
    body: 'Podemos ofrecer un período de prueba gratuito de 7 días con funcionalidades limitadas. Al finalizar, la prueba se desactiva automáticamente a menos que contrates un plan de pago. No solicitamos datos de pago para activar la prueba.',
  },
  {
    title: '5. Planes, precios y pagos',
    body: 'Los planes disponibles y sus precios se muestran en el sitio web y pueden modificarse con preaviso razonable. Los pagos se procesan de forma segura a través de Stripe. No almacenamos los datos de tu tarjeta; Stripe los gestiona conforme a sus propias políticas.',
  },
  {
    title: '6. Renovación y cancelación',
    body: 'Los planes de pago se renuevan automáticamente al finalizar cada período. Puedes cancelar en cualquier momento desde tu panel; el servicio seguirá activo hasta el final del período ya pagado. No se realizan reembolsos parciales por períodos no consumidos, salvo que la ley aplicable disponga lo contrario.',
  },
  {
    title: '7. Uso permitido',
    body: 'Te comprometes a usar el servicio solo con fines legítimos y de acuerdo con la ley. No puedes usarlo para actividades ilícitas, acoso, fraude, suplantación de identidad, spam, contenido difamatorio o cualquier finalidad ajena a la recepción de negocios legítimos.',
  },
  {
    title: '8. Responsabilidad del cliente',
    body: 'Eres responsable de la exactitud de la información de tu empresa (horarios, servicios, precios) que el asistente comunica a tus clientes. Debes informar a tus clientes de que las llamadas pueden ser atendidas por un asistente automatizado con IA y grabadas, de acuerdo con la normativa vigente.',
  },
  {
    title: '9. Limitación de responsabilidad',
    body: `La inteligencia artificial puede cometer errores: no ofrecemos garantía de disponibilidad ininterrumpida, de exactitud absoluta en las respuestas ni de cumplimiento de determinados resultados comerciales. ${LEGAL.brand} no será responsable de daños indirectos o pérdidas derivadas del uso del servicio, dentro de los límites permitidos por la ley.`,
  },
  {
    title: '10. Propiedad intelectual',
    body: 'El software, la marca, el diseño y todos los contenidos del servicio son propiedad de su titular o licenciantes. No adquieres ningún derecho sobre ellos, solo una licencia limitada de uso mientras dure la suscripción.',
  },
  {
    title: '11. Suspensión y terminación',
    body: 'Podemos suspender o terminar tu cuenta si incumples estos términos, si no realizas los pagos, o si nuestro proveedor de telefonía o WhatsApp interrumpe el servicio. En caso de cierre, conservarás los derechos adquiridos hasta la fecha efectiva, salvo incumplimiento.',
  },
  {
    title: '12. Modificaciones',
    body: 'Podemos actualizar estos términos en cualquier momento. Los cambios se publicarán en esta página con su fecha de actualización. El uso continuado del servicio tras los cambios implica su aceptación.',
  },
  {
    title: '13. Ley aplicable y jurisdicción',
    body: `Estos términos se rigen por las leyes del Estado de ${LEGAL.city}. Para cualquier controversia, ambas partes se someten a los juzgados y tribunales competentes de ${LEGAL.city}, salvo que la ley disponga un fuero necesario distinto.`,
  },
  {
    title: '14. Arbitraje',
    body: 'Cualquier controversia derivada de estos términos o del uso del servicio se resolverá mediante arbitraje conforme a las leyes del Estado de New Jersey, renunciando a la vía judicial, salvo que la ley disponga un fuero necesario distinto.',
  },
  {
    title: '15. Contenido de los usuarios',
    body: 'Eres el único responsable del contenido que configures, subas o introduzcas en el servicio (instrucciones, prompts, datos, mensajes). Recept.ai no se hace responsable si dicho contenido infringe derechos de autor de terceros o resulta ilícito, inapropiado o indebido: tú respondes íntegramente del mismo y de sus consecuencias legales. Colaboraremos con las autoridades competentes ante cualquier contenido ilegal que se detecte.',
  },
  {
    title: '16. Uso de inteligencia artificial',
    body: 'El servicio utiliza inteligencia artificial (a través de proveedores como Vapi, ElevenLabs y Groq) para atender llamadas y mensajes de WhatsApp y generar respuestas automáticas. Las respuestas generadas son automáticas y pueden contener errores; revisa la sección de limitación de responsabilidad.',
  },
  {
    title: '17. Contacto',
    body: `Para cualquier consulta sobre estos términos, escríbenos a ${LEGAL.email}.`,
  },
];

export default function TerminosPage() {
  return (
    <LegalShell>
      <h1 className="text-3xl font-bold mb-2">Términos y Condiciones</h1>
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
