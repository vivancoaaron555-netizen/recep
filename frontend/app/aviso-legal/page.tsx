import type { Metadata } from 'next';
import LegalShell from '@/components/LegalShell';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Aviso Legal',
  description: 'Aviso legal de Recept.ai conforme a la Ley de Servicios de la Sociedad de la Información (LSSI-CE).',
};

const sections = [
  {
    title: '1. Identificación del titular',
    body: `En cumplimiento de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI-CE), se informa de que el titular de este sitio web es ${LEGAL.legalName}, con NIF ${LEGAL.nif}, domicilio en ${LEGAL.address}, ${LEGAL.city}. Contacto: ${LEGAL.email}.`,
  },
  {
    title: '2. Objeto',
    body: `Este sitio web, ${LEGAL.website}, tiene por objeto presentar y prestar el servicio de recepción automatizada con inteligencia artificial (${LEGAL.brand}): atención de llamadas y mensajes de WhatsApp para negocios.`,
  },
  {
    title: '3. Propiedad intelectual',
    body: `Todos los contenidos del sitio — textos, diseño, logotipo, código, gráficos y estructura — son propiedad del titular o de sus licenciantes y están protegidos por la normativa de propiedad intelectual e industrial. Queda prohibida su reproducción, distribución o transformación sin autorización expresa.`,
  },
  {
    title: '4. Exención de responsabilidad',
    body: `El servicio emplea inteligencia artificial. El titular no garantiza la ausencia de errores en las respuestas del asistente ni su disponibilidad ininterrumpida. La responsabilidad por el contenido que los clientes configuran en sus asistentes corresponde a cada cliente. El titular no se hace responsable del uso indebido del servicio ni de los daños derivados de decisiones tomadas a partir de la información que genere.`,
  },
  {
    title: '5. Enlaces',
    body: 'Este sitio puede contener enlaces a páginas de terceros. El titular no se responsabiliza de su contenido ni de sus políticas, siendo el acceso a dichas páginas responsabilidad del usuario.',
  },
  {
    title: '6. Legislación aplicable y jurisdicción',
    body: `Este aviso legal se rige por la legislación española. Para la resolución de controversias, las partes se someten a los juzgados y tribunales de ${LEGAL.city || 'España'}.`,
  },
];

export default function AvisoLegalPage() {
  return (
    <LegalShell>
      <h1 className="text-3xl font-bold mb-2">Aviso Legal</h1>
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
