"use client";

import { useState } from "react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PhoneInputWithCountry } from "@/components/phone-input-with-country";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export function NewDoctorForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        console.log('🔍 [NewDoctorForm] Starting form submission...');
        
        try {
            const role = formData.get('role') as string;
            const specialty = formData.get('specialty') as string;
            const doctorData: Record<string, string> = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                role,
                status: 'active',
            };
            if (specialty) doctorData.specialty = specialty;

            console.log('🔍 [NewDoctorForm] Form data extracted:', doctorData);

            // Validate required fields
            if (!doctorData.name || !doctorData.email || !doctorData.phone || !doctorData.role) {
                throw new Error('Todos los campos son requeridos');
            }

            console.log('🔍 [NewDoctorForm] Making API call...');
            const response = await fetchWithAuth('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(doctorData),
            });

            console.log('🔍 [NewDoctorForm] API response status:', response.status);

            if (response.ok) {
                const result = await response.json();
                console.log('✅ [NewDoctorForm] Doctor created successfully:', result);
                toast({
                    title: 'Médico creado',
                    description: 'El médico ha sido agregado exitosamente.',
                });
                console.log('🔍 [NewDoctorForm] Redirecting to doctors list...');
                router.push('/dashboard/doctors');
            } else {
                const errorData = await response.text();
                console.error('❌ [NewDoctorForm] API Error:', response.status, errorData);
                throw new Error(`Error ${response.status}: ${errorData}`);
            }
        } catch (error) {
            console.error('❌ [NewDoctorForm] Error creating doctor:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'No se pudo crear el médico. Intenta nuevamente.',
            });
        } finally {
            console.log('🔍 [NewDoctorForm] Form submission completed');
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información del Médico</CardTitle>
                <CardDescription>
                    Completa los datos del nuevo médico. El teléfono (WhatsApp) es obligatorio para operadores (subir estudios) y solicitantes (recibir notificaciones).
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
                        <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
                        <PhoneInputWithCountry
                            name="phone"
                            id="phone"
                            placeholder="9 336 451-3355"
                            required
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="role">Tipo de médico</Label>
                        <Select name="role" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="operator">Operador (realiza estudios)</SelectItem>
                                <SelectItem value="solicitante">Solicitante (pide estudios)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="specialty">Especialidad</Label>
                        <Select name="specialty">
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar especialidad (opcional)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cardiólogo">Cardiólogo</SelectItem>
                                <SelectItem value="Cardióloga">Cardióloga</SelectItem>
                                <SelectItem value="Cardiólogo Intervencionista">Cardiólogo Intervencionista</SelectItem>
                                <SelectItem value="Cardiólogo Pediatra">Cardiólogo Pediatra</SelectItem>
                                <SelectItem value="Electrofisiólogo">Electrofisiólogo</SelectItem>
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
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>Guardando...</>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Médico
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}