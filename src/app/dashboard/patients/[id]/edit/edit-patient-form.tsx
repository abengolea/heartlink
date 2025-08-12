"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";

interface Patient {
    id: string;
    name: string;
    dni?: string; // Hacer opcional
    dob?: string; // Hacer opcional
    status?: string;
    requesterId: string;
}

interface User {
    id: string;
    name: string;
    role: string;
}

export function EditPatientForm({ patientId }: { patientId: string }) {
    const [patient, setPatient] = useState<Patient | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Load patient and users data
    useEffect(() => {
        async function loadData() {
            try {
                console.log('🔍 [EditPatientForm] Loading patient and users:', patientId);
                const [patientsResponse, usersResponse] = await Promise.all([
                    fetch('/api/patients'),
                    fetch('/api/users')
                ]);
                
                if (patientsResponse.ok && usersResponse.ok) {
                    const [patients, usersData] = await Promise.all([
                        patientsResponse.json(),
                        usersResponse.json()
                    ]);
                    
                    const foundPatient = patients.find((p: Patient) => p.id === patientId);
                    if (foundPatient) {
                        console.log('✅ [EditPatientForm] Patient loaded:', foundPatient);
                        setPatient(foundPatient);
                        setUsers(usersData);
                    } else {
                        throw new Error('Paciente no encontrado');
                    }
                } else {
                    throw new Error('Error al cargar datos');
                }
            } catch (error) {
                console.error('❌ [EditPatientForm] Error loading data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudo cargar la información del paciente.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, [patientId, toast]);

    async function handleSubmit(formData: FormData) {
        if (!patient) return;
        
        setIsSaving(true);
        
        try {
            const patientData = {
                name: formData.get('name') as string,
                dni: formData.get('dni') as string || undefined, // Permitir vacío
                dob: formData.get('dob') as string || undefined, // Permitir vacío
                requesterId: formData.get('requesterId') as string,
                status: 'active' // Mantener estado activo
            };

            console.log('💾 [EditPatientForm] Updating patient:', patientData);

            const response = await fetch(`/api/patients/${patientId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData),
            });

            if (response.ok) {
                toast({
                    title: 'Éxito',
                    description: 'Paciente actualizado correctamente.',
                });
                router.push('/dashboard/patients');
            } else {
                throw new Error('Error al actualizar el paciente');
            }

        } catch (error) {
            console.error('❌ [EditPatientForm] Error updating patient:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo actualizar el paciente. Inténtalo de nuevo.',
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p className="text-muted-foreground">Cargando información del paciente...</p>
                </CardContent>
            </Card>
        );
    }

    if (!patient) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Paciente no encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                        No se pudo encontrar el paciente solicitado.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/patients">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a la lista
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    // Solo médicos solicitantes para el campo requesterId
    const requesters = users.filter(u => u.role === 'solicitante' || u.role === 'medico_solicitante');

    return (
        <Card>
            <CardHeader>
                <CardTitle>Editar Información del Paciente</CardTitle>
                <CardDescription>
                    Actualiza los datos del paciente {patient.name}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre Completo *</Label>
                        <Input 
                            id="name" 
                            name="name" 
                            defaultValue={patient.name}
                            placeholder="Juan Pérez" 
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dni">DNI (opcional)</Label>
                        <Input 
                            id="dni" 
                            name="dni" 
                            defaultValue={patient.dni || ''}
                            placeholder="12345678" 
                        />
                        <p className="text-xs text-muted-foreground">
                            Puedes dejarlo vacío si no tienes el DNI disponible
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dob">Fecha de Nacimiento (opcional)</Label>
                        <Input 
                            id="dob" 
                            name="dob" 
                            type="date"
                            defaultValue={patient.dob || ''}
                        />
                        <p className="text-xs text-muted-foreground">
                            Puedes dejarlo vacío si no tienes la fecha disponible
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="requesterId">Médico Solicitante *</Label>
                        <Select name="requesterId" defaultValue={patient.requesterId} required>
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
                    </div>

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
                                    Actualizar Paciente
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}