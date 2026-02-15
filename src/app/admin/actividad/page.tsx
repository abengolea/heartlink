import { ListOrdered } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AdminActividadPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-semibold text-lg md:text-2xl">
          Actividad
        </h1>
        <p className="text-muted-foreground text-sm">
          Registro de actividad del sistema y acciones de usuarios.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListOrdered className="h-5 w-5" />
            Log de actividad
          </CardTitle>
          <CardDescription>
            Esta sección mostrará el historial de acciones cuando esté implementada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-12">
            En desarrollo. Aquí se mostrará el registro de actividad del sistema.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
