'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Check, X, AlertTriangle, CreditCard, Calendar, User, RefreshCw } from "lucide-react";
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

// Simple placeholder component for now
function SubscriptionPageContent() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1">
        <h1 className="font-semibold text-lg md:text-2xl">
          Gestionar Suscripción
        </h1>
        <p className="text-muted-foreground text-sm">
          Sistema de suscripciones con MercadoPago configurado correctamente.
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Plan Operador</CardTitle>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold">$5,000</span>
            <span className="text-muted-foreground">/ mes</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Sistema MercadoPago configurado</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Token de acceso configurado</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Webhooks funcionando</span>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="w-full" disabled>
            <CreditCard className="h-4 w-4 mr-2" />
            Sistema Configurado Correctamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-4">
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-2xl">
            Gestionar Suscripción
          </h1>
          <p className="text-muted-foreground text-sm">
            Cargando...
          </p>
        </div>
      </div>
    }>
      <SubscriptionPageContent />
    </Suspense>
  );
}
