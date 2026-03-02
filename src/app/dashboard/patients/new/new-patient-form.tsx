"use client";

import { useState, useEffect } from "react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface User {
    id: string;
    name: string;
    role: string;
}

/** Regla: médico solicitante y operador pueden registrar pacientes.
 * - Operador: debe indicar a qué médico solicitante corresponde el paciente.
 * - Solicitante: no indica operador (el vínculo ya existe entre médicos). */
export function NewPatientForm() {
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { dbUser } = useAuth();

    const isSolicitante = dbUser?.role === 'medico_solicitante' || dbUser?.role === 'solicitante';
    const isOperadorOAdmin = dbUser?.role === 'operator' || dbUser?.role === 'admin';

    // Solo operadores y admin cargan la lista de médicos solicitantes (para indicar a quién corresponde el paciente)
    useEffect(() => {
        if (!isOperadorOAdmin) {
            setIsLoading(false);
            return;
        }
        async function loadUsers() {
            try {
                const response = await fetchWithAuth('/api/operators/me/doctors');
                if (response.ok) {
                    const usersData = await response.json();
                    setUsers(usersData);
                } else {
                    throw new Error('Error al cargar médicos');
                }
            } catch (error) {
                console.error('Error loading doctors:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudieron cargar los médicos solicitantes.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        loadUsers();
    }, [toast, isOperadorOAdmin]);

    async function handleSubmit(formData: FormData) {
        setIsSaving(true);
        
        try {
            // Solicitante: requesterId = él mismo. Operador/Admin: del selector.
            const requesterId = isSolicitante && dbUser?.id
                ? dbUser.id
                : (formData.get('requesterId') as string);

            const patientData = {
                name: formData.get('name') as string,
                dni: formData.get('dni') as string || undefined, // Opcional
                dob: formData.get('dob') as string || undefined, // Opcional
                phone: formData.get('phone') as string,
                email: formData.get('email') as string || undefined, // Opcional
                requesterId,
                status: 'active'
            };

            console.log('💾 [NewPatientForm] Creating patient:', patientData);

            const response = await fetchWithAuth('/api/patients', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData),
            });

            if (response.ok) {
                toast({
                    title: 'Éxito',
                    description: 'Paciente creado correctamente.',
                });
                router.push('/dashboard/patients');
            } else {
                throw new Error('Error al crear el paciente');
            }

        } catch (error) {
            console.error('❌ [NewPatientForm] Error creating patient:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo crear el paciente. Inténtalo de nuevo.',
            });
        } finally {
            setIsSaving(false);
        }
    }

    // Esperar a tener usuario para saber el rol; operadores además cargan la lista de médicos
    if (!dbUser || isLoading) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p className="text-muted-foreground">Cargando formulario...</p>
                </CardContent>
            </Card>
        );
    }

    const requesters = users;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información del Paciente</CardTitle>
                <CardDescription>
                    Completa los datos del nuevo paciente. Los campos marcados con * son obligatorios.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre Completo *</Label>
                        <Input 
                            id="name" 
                            name="name" 
                            placeholder="Ana María López" 
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="dni">DNI (opcional)</Label>
                            <Input 
                                id="dni" 
                                name="dni" 
                                placeholder="12345678" 
                            />
                            <p className="text-xs text-muted-foreground">
                                Puedes dejarlo vacío si no lo tienes disponible
                            </p>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dob">Fecha de Nacimiento (opcional)</Label>
                            <Input 
                                id="dob" 
                                name="dob" 
                                type="date"
                            />
                            <p className="text-xs text-muted-foreground">
                                Puedes dejarlo vacío si no la tienes disponible
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono *</Label>
                        <Input 
                            id="phone" 
                            name="phone" 
                            type="tel" 
                            placeholder="+54 9 11 9999-1111" 
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email (opcional)</Label>
                        <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            placeholder="paciente@ejemplo.com" 
                        />
                    </div>

                    {isOperadorOAdmin && (
                        <div className="grid gap-2">
                            <Label htmlFor="requesterId">Médico Solicitante *</Label>
                            <p className="text-xs text-muted-foreground">
                                Indica a qué médico solicitante corresponde este paciente.
                            </p>
                            <Select name="requesterId" required={isOperadorOAdmin}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar médico solicitante" />
                                </SelectTrigger>
                                <SelectContent>
                                    {requesters.map(requester => (
                                        <SelectItem key={requester.id} value={requester.id}>
                                            {requester.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {requesters.length === 0 && (
                                <p className="text-xs text-muted-foreground text-amber-600">
                                    No hay médicos solicitantes disponibles. Crea uno primero.
                                </p>
                            )}
                        </div>
                    )}
                    {isSolicitante && (
                        <div className="rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                            El paciente se asignará automáticamente a tu perfil (médico solicitante).
                        </div>
                    )}

                    <div className="flex justify-between">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/patients">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Cancelar
                            </Link>
                        </Button>
                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Paciente
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}