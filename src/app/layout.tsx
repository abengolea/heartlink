import type {Metadata} from 'next';
import './globals.css';
import {Inter, Source_Code_Pro} from 'next/font/google';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { AuthProvider } from '@/contexts/auth-context';

const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontMono = Source_Code_Pro({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
  weight: ['400', '500', '600'],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://heartlink--heartlink-f4ftq.us-central1.hosted.app';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'HeartLink',
  description: 'Plataforma para la gestión de estudios cardiológicos.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${fontSans.variable} ${fontMono.variable}`} suppressHydrationWarning>
      <body className="antialiased flex flex-col min-h-screen overflow-x-hidden">
        <AuthProvider>
          <div className='flex-grow'>
            {children}
          </div>
          <footer className="w-full border-t bg-muted/40 p-4 px-4 sm:px-6">
              <div className="container mx-auto text-center text-sm text-muted-foreground flex flex-wrap justify-center items-center gap-4">
                <Link href="/terms" className="hover:text-primary transition-colors" prefetch={false}>
                  Términos
                </Link>
                <Link href="/privacy" className="hover:text-primary transition-colors" prefetch={false}>
                  Privacidad
                </Link>
                <Link href="/admin" className="flex items-center gap-2 hover:text-primary transition-colors" prefetch={false}>
                  <Shield className="h-4 w-4"/>
                  <span>Panel de administración</span>
                </Link>
              </div>
          </footer>
          <Toaster />
          <SonnerToaster 
            toastOptions={{
              classNames: { toast: 'w-[min(100vw-2rem,380px)] max-w-[min(100vw-2rem,380px)]' },
              style: { fontSize: '15px' },
              duration: 5000,
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
