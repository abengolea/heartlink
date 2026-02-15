
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useAuth } from "@/contexts/auth-context";
import { File, PlusCircle, Search, Edit, Trash2, Plus, Mail } from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MoreHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  name: string;
  email: string;
  specialty?: string;
  phone?: string;
  role: string;
  status?: string;
}

export default function RequestersPage() {
  const router = useRouter();
  const { dbUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [requesters, setRequesters] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const isSolicitante =
    dbUser?.role === "medico_solicitante" || dbUser?.role === "solicitante";

  useEffect(() => {
    if (dbUser && isSolicitante) {
      router.replace("/dashboard/doctors");
      return;
    }
  }, [dbUser, isSolicitante, router]);

  // Cargar médicos solicitantes desde la API (solo operadores/admin)
  useEffect(() => {
    if (!dbUser || isSolicitante) return;
    loadRequesters();
  }, [dbUser, isSolicitante]);

  const loadRequesters = async () => {
    try {
      console.log('🔍 [RequestersPage] Loading requesters from API...');
      const response = await fetchWithAuth('/api/users');
      
      if (response.ok) {
        const users = await response.json();
        // Filtrar solo médicos solicitantes
        const solicitantes = users.filter((user: User) => 
          user.role === 'solicitante' || user.role === 'medico_solicitante'
        );
        console.log('✅ [RequestersPage] Requesters loaded:', solicitantes.length);
        setRequesters(solicitantes);
      } else {
        console.error('❌ [RequestersPage] Failed to load requesters:', response.status);
        toast({
          title: "Error",
          description: "No se pudieron cargar los médicos solicitantes",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [RequestersPage] Error loading requesters:', error);
      toast({
        title: "Error",
        description: "Error al cargar los médicos solicitantes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOrUpdate = async (userData: Partial<User>) => {
    try {
      const url = isCreating ? '/api/users' : `/api/users/${editingUser?.id}`;
      const method = isCreating ? 'POST' : 'PUT';
      
      const payload = {
        ...userData,
        role: 'solicitante', // Asegurar que el rol sea correcto
      };

      console.log(`🔄 [RequestersPage] ${isCreating ? 'Creating' : 'Updating'} requester:`, payload);
      
      const response = await fetchWithAuth(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: `Médico solicitante ${isCreating ? 'creado' : 'actualizado'} correctamente`,
        });
        setIsDialogOpen(false);
        setEditingUser(null);
        setIsCreating(false);
        loadRequesters(); // Recargar la lista
      } else {
        const errorData = await response.text();
        console.error(`❌ [RequestersPage] Error ${isCreating ? 'creating' : 'updating'} requester:`, errorData);
        toast({
          title: "Error",
          description: `Error al ${isCreating ? 'crear' : 'actualizar'} el médico solicitante`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(`❌ [RequestersPage] Error ${isCreating ? 'creating' : 'updating'} requester:`, error);
      toast({
        title: "Error",
        description: "Error en la operación",
        variant: "destructive",
      });
    }
  };

  const handleResendInvite = async (user: User) => {
    if (!user.email) {
      toast({
        title: "Error",
        description: "Este médico no tiene email registrado",
        variant: "destructive",
      });
      return;
    }
    setResendingId(user.id);
    try {
      const res = await fetchWithAuth(
        `/api/operators/me/doctors/${user.id}/resend-invite`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        toast({
          title: "Éxito",
          description: data.message,
        });
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al reenviar email",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error al reenviar email",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este médico solicitante?')) {
      return;
    }

    try {
      console.log('🗑️ [RequestersPage] Deleting requester:', userId);
      const response = await fetchWithAuth(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Médico solicitante eliminado correctamente",
        });
        loadRequesters(); // Recargar la lista
      } else {
        toast({
          title: "Error",
          description: "Error al eliminar el médico solicitante",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ [RequestersPage] Error deleting requester:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el médico solicitante",
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

  const filteredRequesters = requesters.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.specialty && user.specialty.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="font-semibold text-lg md:text-2xl">
            Médicos Solicitantes
          </h1>
          <p className="text-muted-foreground text-sm">
            Gestiona los médicos que pueden solicitar estudios cardiológicos.
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
              Nuevo Médico
            </span>
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <CardTitle>Médicos Solicitantes</CardTitle>
                <CardDescription>
                    Médicos autorizados para solicitar estudios cardiológicos.
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
              <div className="text-muted-foreground">Cargando médicos solicitantes...</div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Especialidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <span className="sr-only">Acciones</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequesters.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      {searchTerm ? 'No se encontraron médicos que coincidan con la búsqueda' : 'No hay médicos solicitantes registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRequesters.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div>
                          <span className="block">{user.name}</span>
                          <span className="text-xs text-muted-foreground md:hidden">{user.email || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                      <TableCell className="hidden lg:table-cell">{user.specialty || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === 'active' ? 'outline' : 'secondary'}>
                            {user.status === 'active' ? 'Activo' : 'Inactivo'}
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
                            <DropdownMenuItem onClick={() => openEditDialog(user)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResendInvite(user)}
                              disabled={!user.email || resendingId === user.id}
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              {resendingId === user.id
                                ? "Enviando..."
                                : "Reenviar email de invitación"}
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
              {isCreating ? 'Nuevo Médico Solicitante' : 'Editar Médico Solicitante'}
            </DialogTitle>
            <DialogDescription>
              {isCreating ? 'Completa los datos del nuevo médico solicitante.' : 'Modifica los datos del médico solicitante.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm
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

// Componente de formulario para crear/editar usuarios
function UserForm({ 
  user, 
  isCreating, 
  onSubmit, 
  onCancel 
}: { 
  user: User | null; 
  isCreating: boolean; 
  onSubmit: (data: Partial<User>) => void; 
  onCancel: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    specialty: user?.specialty || '',
    phone: user?.phone || '',
    status: user?.status || 'active',
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
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
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
            onChange={(e) => setFormData(prev => ({ ...prev, specialty: e.target.value }))}
            placeholder="Cardiología"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="+54 9 336 4123456"
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {isCreating ? 'Crear Médico' : 'Guardar Cambios'}
        </Button>
      </div>
    </form>
  );
}
