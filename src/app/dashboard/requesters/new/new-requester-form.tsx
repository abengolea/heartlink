"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export function NewRequesterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        console.log('🔍 [NewRequesterForm] Starting form submission...');
        
        try {
            const requesterData = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                role: 'solicitante', // Fixed role for requesters
                specialty: formData.get('specialty') as string,
            };

            console.log('🔍 [NewRequesterForm] Form data extracted:', requesterData);

            // Validate required fields
            if (!requesterData.name || !requesterData.email || !requesterData.phone || !requesterData.specialty) {
                throw new Error('Todos los campos son requeridos');
            }

            console.log('🔍 [NewRequesterForm] Making API call...');
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requesterData),
            });

            console.log('🔍 [NewRequesterForm] API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [NewRequesterForm] Requester created successfully:', result);
                toast({
                    title: 'Solicitante creado',
                    description: 'El médico solicitante ha sido agregado exitosamente.',
                });
                console.log('🔍 [NewRequesterForm] Redirecting to requesters list...');
                router.push('/dashboard/requesters');
            } else {
                const errorData = await response.text();
                console.error('❌ [NewRequesterForm] API Error:', response.status, errorData);
                throw new Error(`Error ${response.status}: ${errorData}`);
            }
        } catch (error) {
            console.error('❌ [NewRequesterForm] Error creating requester:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'No se pudo crear el solicitante. Intenta nuevamente.',
            });
        } finally {
            console.log('🔍 [NewRequesterForm] Form submission completed');
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información del Solicitante</CardTitle>
                <CardDescription>
                    Completa los datos del nuevo médico solicitante.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input 
                            id="name" 
                            name="name" 
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
                            placeholder="+54 9 11 1234-5678" 
                            required 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="specialty">Especialidad</Label>
                        <Select name="specialty" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar especialidad" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Medicina Interna">Medicina Interna</SelectItem>
                                <SelectItem value="Cardiología">Cardiología</SelectItem>
                                <SelectItem value="Neurología">Neurología</SelectItem>
                                <SelectItem value="Oncología">Oncología</SelectItem>
                                <SelectItem value="Pediatría">Pediatría</SelectItem>
                                <SelectItem value="Ginecología">Ginecología</SelectItem>
                                <SelectItem value="Traumatología">Traumatología</SelectItem>
                                <SelectItem value="Dermatología">Dermatología</SelectItem>
                                <SelectItem value="Oftalmología">Oftalmología</SelectItem>
                                <SelectItem value="Otorrinolaringología">Otorrinolaringología</SelectItem>
                                <SelectItem value="Psiquiatría">Psiquiatría</SelectItem>
                                <SelectItem value="Urología">Urología</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-between">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/requesters">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Cancelar
                            </Link>
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>Guardando...</>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Solicitante
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}