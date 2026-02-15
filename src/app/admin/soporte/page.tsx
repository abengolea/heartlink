import { Webhook, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function AdminSoportePage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-semibold text-lg md:text-2xl">
          Soporte / Errores
        </h1>
        <p className="text-muted-foreground text-sm">
          Herramientas de soporte y diagnóstico.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Errores del sistema
            </CardTitle>
            <CardDescription>
              Logs y reportes de errores cuando estén disponibles.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">
              En desarrollo.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Probar correo
            </CardTitle>
            <CardDescription>
              Envía un correo de prueba para verificar la configuración.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/trigger-mail-test"
              className="text-primary hover:underline text-sm font-medium"
            >
              Ir a Probar Trigger Mail →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
