"use client";

import { useState, useEffect, type ComponentType } from "react";
import { ArrowUpRight, Activity, Users, FileText, AlertTriangle, PlusCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Patient {
  id: string;
  name: string;
  requesterId?: string;
}

interface Study {
  id: string;
  patientId: string;
  date: string;
  isUrgent: boolean;
  description?: string;
}

interface User {
  id: string;
  name: string;
  role?: string;
}

function StatCell({
  label,
  value,
  hint,
  icon: Icon,
  className,
}: {
  label: string;
  value: number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 min-w-0", className)}>
      <div className="flex items-center justify-between gap-2 text-muted-foreground">
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
        <Icon className="h-4 w-4 shrink-0 opacity-80" />
      </div>
      <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground leading-snug">{hint}</p>
    </div>
  );
}

export default function Dashboard() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [studies, setStudies] = useState<Study[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [patientsRes, studiesRes, usersRes] = await Promise.all([
          fetchWithAuth("/api/patients"),
          fetchWithAuth("/api/studies"),
          fetchWithAuth("/api/users"),
        ]);
        if (patientsRes.ok) setPatients(await patientsRes.json());
        if (studiesRes.ok) setStudies(await studiesRes.json());
        if (usersRes.ok) setUsers(await usersRes.json());
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const recentStudies = [...studies]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const getPatientName = (patientId: string) =>
    patients.find((p) => p.id === patientId)?.name || "Paciente Desconocido";

  const getRequesterName = (patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    if (!patient?.requesterId) return "Doctor Desconocido";
    return users.find((u) => u.id === patient.requesterId)?.name || "Doctor Desconocido";
  };

  const urgentCount = studies.filter((s) => s.isUrgent).length;

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="h-4 w-40 animate-pulse rounded bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                  <div className="h-8 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full max-w-[8rem] animate-pulse rounded bg-muted" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Resumen</CardTitle>
          <CardDescription>Vista rápida de pacientes, estudios, urgencias y usuarios.</CardDescription>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="grid grid-cols-2 gap-6 sm:gap-8 lg:grid-cols-4 lg:gap-10">
            <StatCell
              label="Pacientes"
              value={patients.length}
              hint="Registrados en la plataforma"
              icon={Users}
            />
            <StatCell
              label="Estudios"
              value={studies.length}
              hint="Total en la plataforma"
              icon={FileText}
            />
            <StatCell
              label="Urgentes"
              value={urgentCount}
              hint="Marcados como urgencia"
              icon={AlertTriangle}
            />
            <StatCell
              label="Usuarios"
              value={users.length}
              hint="Cuentas registradas"
              icon={Activity}
            />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="grid gap-2 flex-1">
            <CardTitle>Estudios Recientes</CardTitle>
            <CardDescription>Un resumen de los estudios más recientes.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button asChild size="sm" className="gap-1">
              <Link href="/dashboard/studies/upload">
                <PlusCircle className="h-4 w-4" />
                Subir Estudio
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="gap-1">
              <Link href="/dashboard/studies">
                Ver Todos
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paciente</TableHead>
                <TableHead className="hidden md:table-cell">Solicitante</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
                <TableHead className="text-right">Urgencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentStudies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No hay estudios recientes.
                  </TableCell>
                </TableRow>
              ) : (
                recentStudies.map((study) => (
                  <TableRow key={study.id}>
                    <TableCell>
                      <div className="font-medium">{getPatientName(study.patientId)}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {getRequesterName(study.patientId)}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(parseISO(study.date), "PPP", { locale: es })}
                    </TableCell>
                    <TableCell className="text-right">
                      {study.isUrgent ? (
                        <Badge variant="destructive">Urgente</Badge>
                      ) : (
                        <Badge variant="outline">Rutina</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
