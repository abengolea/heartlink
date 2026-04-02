"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useAuth } from "@/contexts/auth-context";
import { File, PlusCircle, Search, Edit, Trash2, MoreHorizontal, Mail } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInputWithCountry } from "@/components/phone-input-with-country";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

interface User {
  id: string;
  name: string;
  email: string;
  specialty?: string;
  phone?: string;
  role: string;
  status?: string;
}

export default function OperatorsPage() {
  const router = useRouter();
  const { dbUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [operators, setOperators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [sendingLinkId, setSendingLinkId] = useState<string | null>(null);
  const { toast } = useToast();

  const isAdmin = dbUser?.role === "admin";

  useEffect(() => {
    if (dbUser && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
  }, [dbUser, isAdmin, router]);

  useEffect(() => {
    if (!dbUser || !isAdmin) return;
    loadOperators();
  }, [dbUser, isAdmin]);

  const loadOperators = async () => {
    try {
      const response = await fetchWithAuth("/api/users");

      if (response.ok) {
        const users = await response.json();
        const operadores = users.filter(
          (user: User) =>
            user.role === "operator"
        );
        setOperators(operadores);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los médicos operadores",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al cargar los médicos operadores",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (userData: Partial<User>) => {
    try {
      const url = isCreating ? "/api/users" : `/api/users/${editingUser?.id}`;
      const method = isCreating ? "POST" : "PUT";

      const payload = {
        ...userData,
        role: "operator",
      };

      const response = await fetchWithAuth(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Médico operador ${isCreating ? "creado" : "actualizado"} correctamente`,
        });
        setIsDialogOpen(false);
        setEditingUser(null);
        setIsCreating(false);
        loadOperators();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || `Error al ${isCreating ? "crear" : "actualizar"} el médico operador`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error en la operación",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (userId: string) => {
    if (
      !confirm(
        "¿Estás seguro de que quieres eliminar este médico operador?"
      )
    ) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Médico operador eliminado correctamente",
        });
        loadOperators();
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el médico operador",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error al eliminar el médico operador",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(null);
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const handleSendPasswordLink = async (user: User) => {
    if (!user.email) {
      toast({
        title: "Error",
        description: "Este operador no tiene email registrado",
        variant: "destructive",
      });
      return;
    }
    setSendingLinkId(user.id);
    try {
      const response = await fetchWithAuth(
        `/api/users/${user.id}/send-password-link`,
        { method: "POST" }
      );
      const data = await response.json();
      if (response.ok) {
        if (data.resetLink && typeof navigator?.clipboard?.writeText === "function") {
          await navigator.clipboard.writeText(data.resetLink);
          toast({
            title: "Enlace enviado y copiado",
            description: "El email se envió y el enlace se copió al portapapeles. Podés pegarlo en WhatsApp.",
          });
        } else {
          toast({
            title: "Éxito",
            description: data.message,
          });
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al enviar el enlace",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al enviar el enlace",
        variant: "destructive",
      });
    } finally {
      setSendingLinkId(null);
    }
  };

  const filteredOperators = operators.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email &&
        user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.specialty &&
        user.specialty.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.phone &&
        user.phone.includes(searchTerm.replace(/\s/g, "")))
  );

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg md:text-2xl">
            Médicos Operadores
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestiona los médicos que realizan y envían estudios cardiológicos.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={openCreateDialog}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Nuevo Operador
            </span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
              <CardTitle>Médicos Operadores</CardTitle>
              <CardDescription>
                Médicos autorizados para realizar y subir estudios por
                WhatsApp o desde la app.
              </CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar médico..."
                className="w-full rounded-lg bg-background pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                Cargando médicos operadores...
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Teléfono (WhatsApp)</TableHead>
                  <TableHead className="hidden lg:table-cell">Especialidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOperators.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchTerm
                        ? "No se encontraron médicos que coincidan con la búsqueda"
                        : "No hay médicos operadores registrados"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOperators.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>
                          <span className="block">{user.name}</span>
                          <span className="text-xs text-muted-foreground md:hidden">
                            {user.email || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {user.phone || "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {user.specialty || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            user.status === "active" ? "outline" : "secondary"
                          }
                        >
                          {user.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              aria-haspopup="true"
                              size="icon"
                              variant="ghost"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(user)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSendPasswordLink(user)}
                              disabled={!user.email || sendingLinkId === user.id}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {sendingLinkId === user.id
                                ? "Enviando..."
                                : "Enviar generar por email (y copiar enlace)"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(user.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog for Create/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCreating
                ? "Nuevo Médico Operador"
                : "Editar Médico Operador"}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Completa los datos del nuevo médico operador. El teléfono (WhatsApp) es obligatorio para subir estudios."
                : "Modifica los datos del médico operador."}
            </DialogDescription>
          </DialogHeader>
          <OperatorForm
            key={`${isCreating ? "c" : "e"}-${editingUser?.id ?? "new"}`}
            user={editingUser}
            isCreating={isCreating}
            onSubmit={handleCreateOrUpdate}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function OperatorForm({
  user,
  isCreating,
  onSubmit,
  onCancel,
}: {
  user: User | null;
  isCreating: boolean;
  onSubmit: (data: Partial<User>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    specialty: user?.specialty || "",
    phone: user?.phone || "",
    status: user?.status || "active",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nombre *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Dr. Juan Pérez"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            placeholder="doctor@ejemplo.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="specialty">Especialidad</Label>
          <Input
            id="specialty"
            value={formData.specialty}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, specialty: e.target.value }))
            }
            placeholder="Cardiología"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
          <PhoneInputWithCountry
            id="phone"
            value={formData.phone}
            onChange={(v) =>
              setFormData((prev) => ({ ...prev, phone: v }))
            }
            placeholder="9 336 451-3355"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {isCreating ? "Crear Operador" : "Guardar Cambios"}
        </Button>
      </div>
    </form>
  );
}
