import { Download, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

import { backups } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function AdminBackupsPage() {
  const getStatusBadge = (status: (typeof backups)[0]["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-600">
            Completado
          </Badge>
        );
      case "in-progress":
        return <Badge variant="secondary">En Progreso</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallido</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-2xl">
            Gestión de Copias de Seguridad
          </h1>
          <p className="text-muted-foreground text-sm">
            Supervisa y gestiona las copias de seguridad automáticas y
            manuales.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 gap-1">
            <PlayCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Iniciar Backup Manual
            </span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Historial de Backups</CardTitle>
          <CardDescription>
            Listado de todas las copias de seguridad generadas por el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">
                  Tamaño (Firestore)
                </TableHead>
                <TableHead className="hidden md:table-cell">
                  N° Archivos
                </TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {backups.map((backup) => (
                <TableRow key={backup.id}>
                  <TableCell className="font-medium">
                    {format(parseISO(backup.date), "PPP p", { locale: es })}
                  </TableCell>
                  <TableCell>{getStatusBadge(backup.status)}</TableCell>
                  <TableCell className="hidden md:table-cell font-mono font-code">
                    {backup.firestoreSize}
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono font-code">
                    {backup.fileCount}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          aria-haspopup="true"
                          size="icon"
                          variant="ghost"
                          disabled={backup.status !== 'completed'}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Descargar Backup
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
