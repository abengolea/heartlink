import { HelpCircle, Mail } from "lucide-react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function SoportePage() {
  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto py-6 sm:py-8 px-4 sm:px-6 min-w-0">
      <div>
        <h1 className="font-semibold text-lg md:text-2xl">
          Soporte
        </h1>
        <p className="text-muted-foreground text-sm">
          ¿Necesitas ayuda? Estamos aquí para asistirte.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Centro de ayuda
          </CardTitle>
          <CardDescription>
            Consulta la documentación o contacta al equipo de soporte.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Para soporte técnico o consultas sobre tu suscripción, envía un correo a:
          </p>
          <a
            href="mailto:soporte@heartlink.com"
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <Mail className="h-4 w-4" />
            soporte@heartlink.com
          </a>
          <p className="text-sm text-muted-foreground">
            Si eres administrador, puedes acceder a herramientas adicionales en la sección Admin.
          </p>
          <Button variant="outline" asChild>
            <Link href="/dashboard">Volver al panel</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
