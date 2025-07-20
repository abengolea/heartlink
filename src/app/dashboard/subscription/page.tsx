import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, X } from "lucide-react";

export default function SubscriptionPage() {
  const isSubscribed = true; // Placeholder
  const subscriptionEndDate = "30 de Junio de 2024"; // Placeholder

  return (
    <div className="flex flex-col gap-4">
      <div className="flex-1">
        <h1 className="font-semibold text-lg md:text-2xl">
          Gestionar Suscripción
        </h1>
        <p className="text-muted-foreground text-sm">
          Administra tu plan de suscripción para acceder a todas las
          funcionalidades.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tu Plan Actual</CardTitle>
          <CardDescription>
            {isSubscribed
              ? `Tu suscripción está activa y se renovará el ${subscriptionEndDate}.`
              : "No tienes una suscripción activa. Elige un plan para comenzar."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Card className="bg-muted/30">
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
                    <span>Subida de estudios ilimitada</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Acceso vía WhatsApp</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Generación de links públicos</span>
                </div>
                 <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>Soporte prioritario</span>
                </div>
            </CardContent>
            <CardFooter>
                 {isSubscribed ? (
                    <Button variant="destructive" className="w-full">Cancelar Suscripción</Button>
                 ) : (
                    <Button className="w-full">Suscribirse Ahora</Button>
                 )}
            </CardFooter>
          </Card>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
            <CardDescription>Aquí puedes ver tus pagos anteriores.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Aún no hay pagos registrados.</p>
        </CardContent>
      </Card>
    </div>
  );
}
