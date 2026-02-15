"use client";

import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, User, UserMinus, MoreHorizontal, Mail } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";

interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialty?: string;
  role?: string;
  status?: string;
}

export default function DoctorsPage() {
  const { dbUser } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [availableDoctors, setAvailableDoctors] = useState<Doctor[]>([]);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);

  const isOperator =
    dbUser?.role === "operator" || dbUser?.role === "medico_operador";
  const isSolicitante =
    dbUser?.role === "medico_solicitante" || dbUser?.role === "solicitante";

  useEffect(() => {
    loadMyDoctors();
  }, []);

  const loadMyDoctors = async () => {
    setIsLoading(true);
    try {
      const res = await fetchWithAuth("/api/operators/me/doctors");
      if (res.ok) {
        const data = await res.json();
        setDoctors(data);
      } else {
        setDoctors([]);
      }
    } catch (error) {
      console.error("Error loading doctors:", error);
      setDoctors([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAvailable = async () => {
    if (!isOperator) return;
    setLoadingAvailable(true);
    try {
      const res = await fetchWithAuth("/api/operators/me/doctors/available");
      if (res.ok) {
        const data = await res.json();
        setAvailableDoctors(data);
      } else {
        setAvailableDoctors([]);
      }
    } catch (error) {
      console.error("Error loading available doctors:", error);
      setAvailableDoctors([]);
    } finally {
      setLoadingAvailable(false);
    }
  };

  const handleAddDoctor = async (requesterId: string) => {
    try {
      const res = await fetchWithAuth("/api/operators/me/doctors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requesterId }),
      });
      if (res.ok) {
        toast.success("Médico agregado a tu lista");
        setIsAddOpen(false);
        loadMyDoctors();
      } else {
        const err = await res.json();
        toast.error(err.error || "Error al agregar");
      }
    } catch {
      toast.error("Error al agregar médico");
    }
  };

  const handleRemoveDoctor = async (requesterId: string, name: string) => {
    if (!confirm(`¿Quitar a ${name} de tu lista de médicos?`)) return;
    try {
      const res = await fetchWithAuth(
        `/api/operators/me/doctors/${requesterId}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Médico quitado de tu lista");
        loadMyDoctors();
      } else {
        toast.error("Error al quitar médico");
      }
    } catch {
      toast.error("Error al quitar médico");
    }
  };

  const handleResendInvite = async (doctor: Doctor) => {
    if (!doctor.email) {
      toast.error("Este médico no tiene email registrado");
      return;
    }
    setResendingId(doctor.id);
    try {
      const res = await fetchWithAuth(
        `/api/operators/me/doctors/${doctor.id}/resend-invite`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.error || "Error al reenviar email");
      }
    } catch {
      toast.error("Error al reenviar email");
    } finally {
      setResendingId(null);
    }
  };

  const openAddDialog = () => {
    setIsAddOpen(true);
    loadAvailable();
  };

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg md:text-2xl">
            {isOperator
              ? "Mis Médicos Solicitantes"
              : isSolicitante
                ? "Médicos"
                : "Médicos Solicitantes"}
          </h1>
          <p className="text-muted-foreground">
            {isOperator
              ? "Médicos con los que trabajas. Agrégalos desde el listado del sistema."
              : isSolicitante
                ? "Médicos operadores con los que trabajas para solicitar estudios."
                : "Todos los médicos solicitantes del sistema."}
          </p>
        </div>
        {isOperator && (
          <Button onClick={openAddDialog} className="shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" />
            Agregar médico
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Cargando médicos...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {doctors.map((doctor) => (
              <Card key={doctor.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {doctor.name}
                    </CardTitle>
                    {isOperator && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" title="Más opciones">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleResendInvite(doctor)}
                            disabled={!doctor.email || resendingId === doctor.id}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            {resendingId === doctor.id
                              ? "Enviando..."
                              : "Reenviar email de invitación"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleRemoveDoctor(doctor.id, doctor.name)
                            }
                            className="text-destructive focus:text-destructive"
                          >
                            <UserMinus className="mr-2 h-4 w-4" />
                            Quitar de mi lista
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                  <CardDescription>
                    {doctor.email || doctor.specialty || `ID: ${doctor.id}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {doctor.specialty && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Especialidad:</span>
                        <Badge variant="secondary">{doctor.specialty}</Badge>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Estado:</span>
                      <Badge
                        variant={
                          doctor.status === "active" ? "outline" : "secondary"
                        }
                      >
                        {doctor.status === "active" ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {doctors.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {isOperator
                    ? "No tienes médicos en tu lista"
                    : isSolicitante
                      ? "No tienes médicos operadores vinculados"
                      : "No hay médicos solicitantes"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isOperator
                    ? "Agrega médicos desde el listado del sistema o crea nuevos en Médicos Solicitantes."
                    : isSolicitante
                      ? "Contacta a un operador para que te vincule a su red y puedas solicitar estudios."
                      : "Los médicos solicitantes se gestionan en la sección correspondiente."}
                </p>
                {isOperator && (
                  <div className="flex gap-2 justify-center">
                    <Button onClick={openAddDialog}>
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Agregar médico
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href="/dashboard/requesters/new">
                        Crear nuevo solicitante
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Dialog Agregar médico */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar médico a tu lista</DialogTitle>
            <DialogDescription>
              Selecciona un médico solicitante del sistema para trabajar con él.
              Solo aparecen los que aún no están en tu lista.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-2">
            {loadingAvailable ? (
              <p className="text-sm text-muted-foreground">
                Cargando médicos disponibles...
              </p>
            ) : availableDoctors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay más médicos disponibles para agregar. Puedes crear uno
                nuevo en Médicos Solicitantes.
              </p>
            ) : (
              availableDoctors.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{doc.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {doc.email} {doc.specialty && `• ${doc.specialty}`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAddDoctor(doc.id)}
                  >
                    Agregar
                  </Button>
                </div>
              ))
            )}
          </div>
          <div className="pt-2">
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/requesters/new" onClick={() => setIsAddOpen(false)}>
                Crear nuevo médico solicitante
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
