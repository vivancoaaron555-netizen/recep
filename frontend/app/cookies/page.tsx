import type { Metadata } from 'next';
import LegalShell from '@/components/LegalShell';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Política de Cookies',
  description: 'Política de cookies de Recept.ai conforme al RGPD y la LSSI-CE.',
};

const cookiesTable = [
  { name: 'next-auth.session-token', provider: 'Propia', type: 'Técnica', purpose: 'Mantener tu sesión iniciada.', duration: 'Sesión' },
  { name: 'recept-ai-cookies-consent', provider: 'Propia', type: 'Técnica', purpose: 'Recordar tu elección sobre cookies.', duration: '1 año' },
  { name: '_ga', provider: 'Google Analytics', type: 'Analítica', purpose: 'Distinguir usuarios y medir uso del sitio (solo con consentimiento).', duration: '2 años' },
  { name: '_ga_<ID>', provider: 'Google Analytics', type: 'Analítica', purpose: 'Persistir el estado de la sesión de analítica (solo con consentimiento).', duration: '2 años' },
];

export default function CookiesPage() {
  return (
    <LegalShell>
      <h1 className="text-3xl font-bold mb-2">Política de Cookies</h1>
      <p className="text-sm text-muted-foreground mb-8">Última actualización: {LEGAL.lastUpdated}</p>

      <div className="space-y-6">
        <section>
          <h2 className="text-lg font-semibold mb-2">1. ¿Qué son las cookies?</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Las cookies son pequeños archivos que se guardan en tu dispositivo al visitar un sitio web.
            Permiten que el sitio recuerde información sobre tu visita para facilitar su uso y, en
            algunos casos, medir la audiencia.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">2. Tipos de cookies que usamos</h2>
          <p className="text-sm leading-relaxed text-muted-foreground mb-4">
            <strong className="text-foreground">Técnicas (necesarias):</strong> imprescindibles para el
            funcionamiento del sitio (sesión, preferencias de consentimiento). No requieren tu
            consentimiento. <strong className="text-foreground">Analíticas:</strong> utilizamos Google
            Analytics solo si aceptas, para entender cómo se usa la web y mejorarla.
          </p>
          <div className="table-container overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="table-head">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Cookie</th>
                  <th className="px-4 py-3 text-left font-semibold">Proveedor</th>
                  <th className="px-4 py-3 text-left font-semibold">Tipo</th>
                  <th className="px-4 py-3 text-left font-semibold">Finalidad</th>
                  <th className="px-4 py-3 text-left font-semibold">Duración</th>
                </tr>
              </thead>
              <tbody>
                {cookiesTable.map((c) => (
                  <tr key={c.name} className="table-row">
                    <td className="px-4 py-3 align-top">{c.name}</td>
                    <td className="px-4 py-3 align-top">{c.provider}</td>
                    <td className="px-4 py-3 align-top">{c.type}</td>
                    <td className="px-4 py-3 align-top">{c.purpose}</td>
                    <td className="px-4 py-3 align-top">{c.duration}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">3. Cómo gestionar las cookies</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Al entrar en la web verás un banner donde puedes aceptar o rechazar las cookies analíticas.
            También puedes configurar o bloquear las cookies desde los ajustes de tu navegador
            (Chrome, Firefox, Safari, Edge). Bloquear las cookies técnicas puede impedir el correcto
            funcionamiento de la web.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold mb-2">4. Más información</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Para cualquier duda sobre el uso de cookies, escríbenos a {LEGAL.email}.
          </p>
        </section>
      </div>
    </LegalShell>
  );
}
