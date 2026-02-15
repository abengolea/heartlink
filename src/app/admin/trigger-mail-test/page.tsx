'use client';

import { useState } from 'react';
import { Mail, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { fetchWithAuth } from '@/lib/fetch-with-auth';
import { toast } from 'sonner';

export default function AdminTriggerMailTestPage() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error('Ingresa un email');
      return;
    }
    setIsSending(true);
    try {
      const res = await fetchWithAuth('/api/admin/trigger-mail-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: email.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setEmail('');
      } else {
        toast.error(data.error || 'Error al enviar');
      }
    } catch {
      toast.error('Error de conexión');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Probar Trigger Mail
        </h1>
        <p className="text-muted-foreground">
          Envía un email de prueba para verificar que la extensión Firebase
          Trigger Email funciona correctamente.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email de prueba
          </CardTitle>
          <CardDescription>
            El email se escribe en la colección <code>mail</code> de Firestore.
            La extensión lo procesa y lo envía por SMTP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="email">Email destino</Label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSending}
              />
            </div>
            <Button type="submit" disabled={isSending}>
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar email de prueba
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
