"use client";

import { useState, useEffect } from "react";
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
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-12 animate-pulse rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4">
      <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Pacientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{patients.length}</div>
            <p className="text-xs text-muted-foreground">Pacientes registrados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Estudios</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studies.length}</div>
            <p className="text-xs text-muted-foreground">Estudios en la plataforma</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{urgentCount}</div>
            <p className="text-xs text-muted-foreground">Estudios marcados como urgentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actividad de la Plataforma</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-muted-foreground">Usuarios registrados</p>
          </CardContent>
        </Card>
      </div>
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
