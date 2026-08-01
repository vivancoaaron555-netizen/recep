import Link from 'next/link';
import { LEGAL } from '@/lib/legal';

export default function LegalShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container-xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl">
            {LEGAL.brand}
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Volver al inicio
          </Link>
        </div>
      </header>

      <main className="container-xl px-6 py-12 max-w-3xl">{children}</main>

      <footer className="border-t border-border py-8 px-6">
        <div className="container-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} {LEGAL.brand}</p>
          <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <Link href="/aviso-legal" className="hover:text-foreground transition-colors">Aviso legal</Link>
            <Link href="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
            <Link href="/terminos" className="hover:text-foreground transition-colors">Términos</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
