'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, ExternalLink, Loader2 } from "lucide-react";

export default function TestPaymentPage() {
  const [loading, setLoading] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('test@heartlink.app');
  const [name, setName] = useState('Usuario Test');

  const createTestPayment = async () => {
    setLoading(true);
    setError(null);
    setPaymentLink(null);

    try {
      console.log('🧪 Creating test payment...');
      
      const response = await fetch('/api/test-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          name
        }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log('✅ Payment link created:', data);
        setPaymentLink(data.paymentUrl);
      } else {
        throw new Error(data.error || 'Failed to create payment');
      }
    } catch (err) {
      console.error('❌ Error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <CreditCard className="h-6 w-6" />
            Prueba de Pago MercadoPago
          </CardTitle>
          <CardDescription>
            Crea un link de pago real para probar la integración con MercadoPago
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-800 mb-2">💰 Información del Pago</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Monto:</strong> $20,000 ARS</li>
              <li>• <strong>Concepto:</strong> Suscripción Mensual HeartLink</li>
              <li>• <strong>Tipo:</strong> Pago real (se cobrará)</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre completo"
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {paymentLink && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-semibold text-green-800 mb-2">✅ Link de Pago Creado</h3>
              <p className="text-sm text-green-700 mb-3">
                Tu link de pago está listo. Haz clic para ir a MercadoPago:
              </p>
              <Button 
                asChild 
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <a href={paymentLink} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Pagar $20,000 en MercadoPago
                </a>
              </Button>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button 
            onClick={createTestPayment}
            disabled={loading || !email || !name}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generando Link de Pago...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Crear Link de Pago ($20,000)
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      <div className="fixed bottom-4 right-4">
        <Card className="w-80">
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-2">🔄 Proceso:</h3>
            <ol className="text-xs text-muted-foreground space-y-1">
              <li>1. Completa tus datos</li>
              <li>2. Clic en "Crear Link de Pago"</li>
              <li>3. Clic en "Pagar en MercadoPago"</li>
              <li>4. Completa el pago en MercadoPago</li>
              <li>5. Regresa automáticamente a HeartLink</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}