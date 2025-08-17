
"use client";

import { useState, useEffect } from "react";
import { File, PlusCircle, Search } from "lucide-react";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MoreHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export default function AdminUsersPage() {
	const { toast } = useToast();
	const [searchTerm, setSearchTerm] = useState("");
	const [usersList, setUsersList] = useState<User[]>([]);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [form, setForm] = useState({
		name: "",
		email: "",
		phone: "",
		role: "solicitante" as User["role"],
		specialty: "",
		password: "",
	});

	useEffect(() => {
		loadUsers();
	}, []);

	const loadUsers = async () => {
		try {
			const res = await fetch('/api/users', { cache: 'no-store' });
			if (!res.ok) throw new Error('No se pudieron cargar los usuarios');
			const data = await res.json();
			setUsersList(data);
		} catch (error) {
			toast({ title: "Error", description: "No se pudieron cargar los usuarios", variant: "destructive" });
		}
	};

	const getSubscriptionBadge = (status: User["subscriptionStatus"] | any) => {
		switch (status) {
			case "active":
				return <Badge variant="default" className="bg-green-600">Activa</Badge>;
			case "trial":
				return <Badge variant="secondary">Trial</Badge>;
			case "suspended":
				return <Badge variant="destructive">Suspendida</Badge>;
			case "inactive":
				return <Badge variant="outline">Inactiva</Badge>;
			// Compat con datos viejos mock
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

	const filteredUsers = usersList.filter((user) =>
		user.name.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleCreate = async () => {
		if (!form.name || !form.role) {
			toast({ title: "Faltan datos", description: "Nombre y rol son obligatorios", variant: "destructive" });
			return;
		}
		setIsSubmitting(true);
		try {
			const res = await fetch('/api/users', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: form.name,
					email: form.email,
					phone: form.phone,
					role: form.role,
					specialty: form.specialty,
					status: 'active',
				}),
			});
			if (!res.ok) throw new Error('No se pudo crear el usuario en la base de datos');

			// Si hay credenciales, crear también en Firebase Auth
			if (form.email && form.password) {
				const resAuth = await fetch('/api/auth/register', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email: form.email, password: form.password, name: form.name }),
				});
				if (!resAuth.ok) {
					const j = await resAuth.json().catch(() => ({}));
					console.error('Error creando en Auth:', j);
					toast({ title: "Usuario creado (BD)", description: `Error en Auth: ${j.error || resAuth.statusText}` , variant: "destructive" });
				}
			}

			toast({ title: "Usuario creado", description: "Se creó correctamente" });
			setIsDialogOpen(false);
			setForm({ name: "", email: "", phone: "", role: "solicitante" as User["role"], specialty: "", password: "" });
			await loadUsers();
		} catch (e: any) {
			toast({ title: "Error", description: e.message || "No se pudo crear el usuario", variant: "destructive" });
		} finally {
			setIsSubmitting(false);
		}
	};

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
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button size="sm" className="h-8 gap-1">
								<PlusCircle className="h-3.5 w-3.5" />
								<span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
									Crear Usuario
								</span>
							</Button>
						</DialogTrigger>
						<DialogContent>
							<DialogHeader>
								<DialogTitle>Crear Usuario</DialogTitle>
								<DialogDescription>Completa los datos para crear un usuario nuevo.</DialogDescription>
							</DialogHeader>
							<div className="grid gap-4 py-2">
								<div className="grid gap-2">
									<Label>Nombre</Label>
									<Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
								</div>
								<div className="grid gap-2">
									<Label>Email</Label>
									<Input type="email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
								</div>
								<div className="grid gap-2">
									<Label>Teléfono</Label>
									<Input value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
								</div>
								<div className="grid gap-2">
									<Label>Rol</Label>
									<Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v as User["role"] }))}>
										<SelectTrigger>
											<SelectValue placeholder="Selecciona un rol" />
										</SelectTrigger>
										<SelectContent>
											<SelectItem value="admin">Admin</SelectItem>
											<SelectItem value="operator">Operador</SelectItem>
											<SelectItem value="solicitante">Solicitante</SelectItem>
											<SelectItem value="medico_solicitante">Médico Solicitante</SelectItem>
										</SelectContent>
									</Select>
								</div>
								<div className="grid gap-2">
									<Label>Especialidad</Label>
									<Input value={form.specialty} onChange={(e) => setForm((p) => ({ ...p, specialty: e.target.value }))} />
								</div>
								<div className="grid gap-2">
									<Label>Contraseña (opcional para Auth)</Label>
									<Input type="password" value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} />
								</div>
							</div>
							<div className="flex justify-end gap-2">
								<Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
								<Button onClick={handleCreate} disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear'}</Button>
							</div>
						</DialogContent>
					</Dialog>
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
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Nombre</TableHead>
								<TableHead>Rol</TableHead>
								<TableHead className="hidden md:table-cell">Estado</TableHead>
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
									<TableCell className="hidden md:table-cell">
										<Badge variant={user.status === 'active' ? 'outline' : 'destructive'}>
											{user.status === 'active' ? 'Activo' : 'Suspendido'}
										</Badge>
									</TableCell>
									<TableCell className="hidden md:table-cell">
										{getSubscriptionBadge(user.subscriptionStatus)}
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
												<DropdownMenuItem>Ver Detalles</DropdownMenuItem>
												<DropdownMenuItem>Editar</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem className="text-destructive">
													Suspender
												</DropdownMenuItem>
												<DropdownMenuItem className="text-destructive">
													Eliminar
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
