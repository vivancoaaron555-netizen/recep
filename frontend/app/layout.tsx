import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/lib/auth-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#0a0a0f',
};

export const metadata: Metadata = {
  title: {
    default: 'Recept.ai — Tu Recepcionista 24/7 con IA',
    template: '%s | Recept.ai',
  },
  description:
    'Automatiza la atención de llamadas y WhatsApp de tu negocio con inteligencia artificial. Citas, consultas y atención al cliente 24/7 sin contratar personal.',
  keywords: ['recepcionista IA', 'chatbot WhatsApp', 'atención al cliente', 'automatización', 'citas online'],
  openGraph: {
    title: 'Recept.ai — Tu Recepcionista 24/7 con IA',
    description: 'Automatiza la atención de llamadas y WhatsApp con IA',
    type: 'website',
    locale: 'es_ES',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster
          theme="dark"
          position="top-right"
          toastOptions={{
            style: {
              background: '#111118',
              border: '1px solid #1e1e2e',
              color: '#f8fafc',
            },
          }}
        />
      </body>
    </html>
  );
}
