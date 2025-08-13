import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "sonner"
import Link from 'next/link';
import { Shield } from 'lucide-react';
import { AuthProvider } from '@/contexts/auth-context';

export const metadata: Metadata = {
  title: 'HeartLink',
  description: 'A platform for cardiac studies management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"></link>
        <link href="https://fonts.googleapis.com/css2?family=Source+Code+Pro&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased flex flex-col min-h-screen">
        <AuthProvider>
          <div className='flex-grow'>
            {children}
          </div>
          <footer className="w-full border-t bg-muted/40 p-4">
              <div className="container mx-auto text-center text-sm text-muted-foreground flex justify-center items-center">
                <Link href="/admin" className="flex items-center gap-2 hover:text-primary transition-colors" prefetch={false}>
                  <Shield className="h-4 w-4"/>
                  <span>Admin Panel</span>
                </Link>
              </div>
          </footer>
          <Toaster />
          <SonnerToaster />
        </AuthProvider>
      </body>
    </html>
  );
}
