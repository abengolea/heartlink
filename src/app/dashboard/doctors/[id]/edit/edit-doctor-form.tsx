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

interface Doctor {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: string;
    status?: string;
    subscriptionStatus?: string;
}

export function EditDoctorForm({ doctorId }: { doctorId: string }) {
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    // Load doctor data
    useEffect(() => {
        async function loadDoctor() {
            try {
                console.log('🔍 [EditDoctorForm] Loading doctor:', doctorId);
                const response = await fetch(`/api/users`);
                if (response.ok) {
                    const users = await response.json();
                    const foundDoctor = users.find((u: Doctor) => u.id === doctorId);
                    if (foundDoctor) {
                        console.log('✅ [EditDoctorForm] Doctor loaded:', foundDoctor);
                        setDoctor(foundDoctor);
                    } else {
                        throw new Error('Doctor no encontrado');
                    }
                } else {
                    throw new Error('Error al cargar datos');
                }
            } catch (error) {
                console.error('❌ [EditDoctorForm] Error loading doctor:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'No se pudo cargar la información del médico.',
                });
            } finally {
                setIsLoading(false);
            }
        }
        loadDoctor();
    }, [doctorId, toast]);

    async function handleSubmit(formData: FormData) {
        if (!doctor) return;
        
        setIsSaving(true);
        console.log('🔍 [EditDoctorForm] Starting form submission...');
        
        try {
            const updatedData = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                role: formData.get('role') as string,
            };

            console.log('🔍 [EditDoctorForm] Form data extracted:', updatedData);

            // Validate required fields
            if (!updatedData.name || !updatedData.email || !updatedData.phone || !updatedData.role) {
                throw new Error('Todos los campos son requeridos');
            }

            console.log('🔍 [EditDoctorForm] Making API call to update doctor...');
            const response = await fetch(`/api/users/${doctorId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedData),
            });

            console.log('🔍 [EditDoctorForm] API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [EditDoctorForm] Doctor updated successfully:', result);
                toast({
                    title: 'Médico actualizado',
                    description: 'Los datos del médico han sido actualizados exitosamente.',
                });
                console.log('🔍 [EditDoctorForm] Redirecting to doctors list...');
                router.push('/dashboard/doctors');
            } else {
                const errorData = await response.text();
                console.error('❌ [EditDoctorForm] API Error:', response.status, errorData);
                throw new Error(`Error ${response.status}: ${errorData}`);
            }
        } catch (error) {
            console.error('❌ [EditDoctorForm] Error updating doctor:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'No se pudo actualizar el médico. Intenta nuevamente.',
            });
        } finally {
            console.log('🔍 [EditDoctorForm] Form submission completed');
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Cargando información del médico...</span>
                </CardContent>
            </Card>
        );
    }

    if (!doctor) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <h3 className="text-lg font-semibold mb-2">Médico no encontrado</h3>
                    <p className="text-muted-foreground mb-4">
                        No se pudo encontrar el médico solicitado.
                    </p>
                    <Button asChild>
                        <Link href="/dashboard/doctors">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a la lista
                        </Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Editar Información del Médico</CardTitle>
                <CardDescription>
                    Actualiza los datos del médico {doctor.name}.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input 
                            id="name" 
                            name="name" 
                            defaultValue={doctor.name}
                            placeholder="Dr. Juan Pérez" 
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                            id="email" 
                            name="email" 
                            type="email" 
                            defaultValue={doctor.email}
                            placeholder="jperez@hospital.com" 
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input 
                            id="phone" 
                            name="phone" 
                            type="tel" 
                            defaultValue={doctor.phone}
                            placeholder="+54 9 11 1234-5678" 
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Especialidad</Label>
                        <Select name="role" defaultValue={doctor.role} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar especialidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cardiólogo">Cardiólogo</SelectItem>
                                <SelectItem value="Cardióloga">Cardióloga</SelectItem>
                                <SelectItem value="Cardiólogo Intervencionista">Cardiólogo Intervencionista</SelectItem>
                                <SelectItem value="Cardiólogo Pediatra">Cardiólogo Pediatra</SelectItem>
                                <SelectItem value="Electrofisiólogo">Electrofisiólogo</SelectItem>
                                <SelectItem value="solicitante">Médico Solicitante</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-between">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/doctors">
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
                                    Actualizar Médico
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}