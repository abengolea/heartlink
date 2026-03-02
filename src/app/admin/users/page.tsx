
"use client";

import { useState, useEffect } from "react";
import { File, PlusCircle, Search, CheckCircle, Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      } else {
        toast.error("Error al cargar usuarios");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (userId: string, userName: string) => {
    if (!confirm(`¿Eliminar al usuario "${userName}"? Esta acción no se puede deshacer.`)) return;
    try {
      const response = await fetchWithAuth(`/api/users/${userId}`, { method: "DELETE" });
      if (response.ok) {
        toast.success("Usuario eliminado correctamente");
        loadUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Error al eliminar");
      }
    } catch {
      toast.error("Error al eliminar usuario");
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
  };

  const handleSaveEdit = async (data: Partial<User>) => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`/api/users/${editingUser.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        toast.success("Usuario actualizado correctamente");
        setEditingUser(null);
        loadUsers();
      } else {
        const err = await response.json();
        toast.error(err.error || "Error al actualizar");
      }
    } catch {
      toast.error("Error al actualizar usuario");
    } finally {
      setIsSaving(false);
    }
  };

  const handleApprove = async (userId: string) => {
    setApprovingId(userId);
    try {
      const response = await fetchWithAuth(`/api/admin/users/${userId}/approve`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok) {
        toast.success("Usuario autorizado correctamente");
        loadUsers();
      } else {
        toast.error(data.error || "Error al autorizar");
      }
    } catch (error) {
      toast.error("Error al autorizar usuario");
    } finally {
      setApprovingId(null);
    }
  };

  const getSubscriptionBadge = (status: User["subscriptionStatus"]) => {
    switch (status) {
      case "paid":
        return <Badge variant="default" className="bg-green-600">Al día</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "overdue":
        return <Badge variant="destructive">Vencido</Badge>;
      default:
        return <Badge variant="outline">N/A</Badge>;
    }
  };

  const getRoleName = (role: User["role"]) => {
      switch (role) {
        case "admin": return "Admin";
        case "operator": return "Operador";
        case "solicitante": return "Solicitante";
        case "medico_solicitante": return "Médico Solicitante";
        default: return role;
      }
  };

  const getStatusBadge = (status: User["status"]) => {
    switch (status) {
      case "active": return <Badge variant="outline" className="bg-green-50 text-green-700">Activo</Badge>;
      case "inactive": return <Badge variant="destructive">Suspendido</Badge>;
      case "pending_approval": return <Badge variant="secondary" className="bg-amber-100 text-amber-800">Pendiente</Badge>;
      default: return <Badge variant="outline">N/A</Badge>;
    }
  };

  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <div className="flex-1">
          <h1 className="font-semibold text-lg md:text-2xl">
            Gestión de Usuarios
          </h1>
          <p className="text-muted-foreground text-sm">
            Crea, edita y gestiona las cuentas de los usuarios del sistema.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Exportar
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Crear Usuario
            </span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div>
                <CardTitle>Directorio de Usuarios</CardTitle>
                <CardDescription>
                    Un listado de todos los médicos operadores y solicitantes en el
                    sistema.
                </CardDescription>
            </div>
            <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Buscar por nombre..."
                    className="w-full rounded-lg bg-background pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden sm:table-cell">Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">
                  Suscripción
                </TableHead>
                <TableHead>
                  <span className="sr-only">Acciones</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{user.email || '-'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "operator" ? "default" : "secondary"}
                      className={cn(
                        user.role === "admin" && "bg-destructive/80"
                      )}
                    >
                      {getRoleName(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.status)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {user.role === "operator"
                      ? getSubscriptionBadge(user.subscriptionStatus)
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    {user.status === 'pending_approval' ? (
                      <Button
                        size="sm"
                        variant="default"
                        className="gap-1"
                        onClick={() => handleApprove(user.id)}
                        disabled={approvingId === user.id}
                      >
                        {approvingId === user.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="h-3.5 w-3.5" />
                        )}
                        Autorizar
                      </Button>
                    ) : (
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
                        <DropdownMenuItem onClick={() => handleEdit(user)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          Suspender
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(user.id, user.name)}
                        >
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Editar Usuario */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Puedes cambiar el rol a Operador para que realice estudios.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <EditUserForm
              user={editingUser}
              onSave={handleSaveEdit}
              onCancel={() => setEditingUser(null)}
              isSaving={isSaving}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditUserForm({
  user,
  onSave,
  onCancel,
  isSaving,
}: {
  user: User;
  onSave: (data: Partial<User>) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || "");
  const validRoles: User["role"][] = ["admin", "operator", "solicitante", "medico_solicitante"];
  const normalizedRole = (): User["role"] => {
    if (user.role === "medico_solicitante") return "solicitante";
    return validRoles.includes(user.role) ? user.role : "operator";
  };
  const [role, setRole] = useState<User["role"]>(normalizedRole());
  const [status, setStatus] = useState<User["status"]>(user.status || "active");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email, role, status });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="edit-name">Nombre</Label>
        <Input
          id="edit-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Dr. Juan Pérez"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-email">Email</Label>
        <Input
          id="edit-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="doctor@ejemplo.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-role">Rol</Label>
        <Select value={role} onValueChange={(v) => setRole(v as User["role"])}>
          <SelectTrigger id="edit-role">
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="operator">Operador (realiza estudios)</SelectItem>
            <SelectItem value="solicitante">Solicitante (pide estudios)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="edit-status">Estado</Label>
        <Select value={status || "active"} onValueChange={(v) => setStatus(v as User["status"])}>
          <SelectTrigger id="edit-status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="inactive">Suspendido</SelectItem>
            <SelectItem value="pending_approval">Pendiente de aprobación</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
