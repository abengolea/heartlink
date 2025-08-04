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
    dni: string;
    dob: string;
    status?: string;
    operatorId: string;
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
        console.log('🔍 [EditPatientForm] Starting form submission...');
        
        try {
            const updatedData = {
                name: formData.get('name') as string,
                dni: formData.get('dni') as string,
                dob: formData.get('dob') as string,
                operatorId: formData.get('operatorId') as string,
                requesterId: formData.get('requesterId') as string,
            };

            console.log('🔍 [EditPatientForm] Form data extracted:', updatedData);

            // Validate required fields
            if (!updatedData.name || !updatedData.dni || !updatedData.dob || !updatedData.operatorId || !updatedData.requesterId) {
                throw new Error('Todos los campos son requeridos');
            }

            console.log('🔍 [EditPatientForm] Making API call to update patient...');
            const response = await fetch(`/api/patients/${patientId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            console.log('🔍 [EditPatientForm] API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [EditPatientForm] Patient updated successfully:', result);
                toast({
                    title: 'Paciente actualizado',
                    description: 'Los datos del paciente han sido actualizados exitosamente.',
                });
                console.log('🔍 [EditPatientForm] Redirecting to patients list...');
                router.push('/dashboard/patients');
            } else {
                const errorData = await response.text();
                console.error('❌ [EditPatientForm] API Error:', response.status, errorData);
                throw new Error(`Error ${response.status}: ${errorData}`);
            }
        } catch (error) {
            console.error('❌ [EditPatientForm] Error updating patient:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'No se pudo actualizar el paciente. Intenta nuevamente.',
            });
        } finally {
            console.log('🔍 [EditPatientForm] Form submission completed');
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Cargando información del paciente...</span>
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

    const doctors = users.filter(u => u.role !== 'admin');
    const operators = users.filter(u => u.role === 'operator' || u.role === 'admin');

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
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input 
                            id="name" 
                            name="name" 
                            defaultValue={patient.name}
                            placeholder="Juan Pérez" 
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input 
                            id="dni" 
                            name="dni" 
                            defaultValue={patient.dni}
                            placeholder="12345678" 
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="dob">Fecha de Nacimiento</Label>
                        <Input 
                            id="dob" 
                            name="dob" 
                            type="date"
                            defaultValue={patient.dob}
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="requesterId">Médico Solicitante</Label>
                        <Select name="requesterId" defaultValue={patient.requesterId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar médico solicitante" />
                            </SelectTrigger>
                            <SelectContent>
                                {doctors.map(doctor => (
                                    <SelectItem key={doctor.id} value={doctor.id}>
                                        {doctor.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="operatorId">Operador</Label>
                        <Select name="operatorId" defaultValue={patient.operatorId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar operador" />
                            </SelectTrigger>
                            <SelectContent>
                                {operators.map(operator => (
                                    <SelectItem key={operator.id} value={operator.id}>
                                        {operator.name}
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