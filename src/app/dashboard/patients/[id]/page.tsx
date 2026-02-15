"use client";

import { useState, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpRight, User, Calendar, FileText, Stethoscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

interface Patient {
  id: string;
  name: string;
  dni?: string;
  dob?: string;
  requesterId?: string;
  status?: string;
}

interface Study {
  id: string;
  patientId: string;
  date: string;
  description?: string;
  isUrgent?: boolean;
}

interface User {
  id: string;
  name: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [studies, setStudies] = useState<Study[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFoundState, setNotFoundState] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [patientRes, studiesRes, usersRes] = await Promise.all([
          fetchWithAuth(`/api/patients/${id}`),
          fetchWithAuth("/api/studies"),
          fetchWithAuth("/api/users"),
        ]);

        if (!patientRes.ok || patientRes.status === 404) {
          setNotFoundState(true);
          return;
        }

        const patientData = await patientRes.json();
        setPatient(patientData);

        if (studiesRes.ok) {
          const studiesData = await studiesRes.json();
          setStudies(studiesData.filter((s: Study) => s.patientId === id));
        }
        if (usersRes.ok) {
          setUsers(await usersRes.json());
        }
      } catch (error) {
        console.error("Error loading patient data:", error);
        setNotFoundState(true);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (notFoundState || (!isLoading && !patient)) {
    notFound();
  }

  if (isLoading || !patient) {
    return (
      <div className="mx-auto grid w-full max-w-6xl gap-6">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const patientStudies = [...studies].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const requester = users.find((u) => u.id === patient.requesterId);

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-semibold text-2xl md:text-3xl">{patient.name}</h1>
        {patient.dni && <p className="text-muted-foreground">DNI: {patient.dni}</p>}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Paciente</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{patient.name}</span>
              </div>
              {patient.dob && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    Nacimiento: {format(parseISO(patient.dob), "PPP", { locale: es })}
                  </span>
                </div>
              )}
              {patient.requesterId && (
                <div className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-muted-foreground" />
                  <span>Solicitante: {requester?.name || "N/A"}</span>
                </div>
              )}
              <div>
                <Badge variant={patient.status === "active" ? "outline" : "secondary"}>
                  {patient.status === "active" ? "Activo" : "Archivado"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" /> Historial de Estudios
              </CardTitle>
              <CardDescription>
                Un listado de todos los estudios realizados para este paciente.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {patientStudies.length > 0 ? (
                patientStudies.map((study) => (
                  <Card key={study.id} className="flex flex-col sm:flex-row">
                    <div className="flex-shrink-0">
                      <Image
                        src="https://placehold.co/600x400.png"
                        alt="Placeholder de video de estudio"
                        width={150}
                        height={100}
                        className="rounded-l-lg object-cover aspect-video h-full w-full sm:w-[150px]"
                        data-ai-hint="heart ultrasound"
                      />
                    </div>
                    <div className="p-4 grid gap-2 flex-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold">{study.description || "Estudio"}</p>
                        {study.isUrgent ? (
                          <Badge variant="destructive" className="w-fit">
                            Urgente
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="w-fit">
                            Rutina
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(study.date), "PPP", { locale: es })}
                      </p>
                      <Button asChild size="sm" className="w-full sm:w-fit ml-auto mt-2 gap-1">
                        <Link href={`/dashboard/studies/${study.id}`}>
                          Ver Estudio
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No se encontraron estudios para este paciente.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
