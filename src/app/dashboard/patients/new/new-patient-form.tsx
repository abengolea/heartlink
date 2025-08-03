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

export function NewPatientForm() {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        try {
            const patientData = {
                name: formData.get('name') as string,
                age: parseInt(formData.get('age') as string),
                gender: formData.get('gender') as string,
                phone: formData.get('phone') as string,
                email: formData.get('email') as string || '',
                address: formData.get('address') as string || '',
            };

            const response = await fetch('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData),
            });

            if (response.ok) {
                toast({
                    title: 'Paciente creado',
                    description: 'El paciente ha sido agregado exitosamente.',
                });
                router.push('/dashboard/patients');
            } else {
                throw new Error('Failed to create patient');
            }
        } catch (error) {
            console.error('Error creating patient:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo crear el paciente. Intenta nuevamente.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información del Paciente</CardTitle>
                <CardDescription>
                    Completa los datos del nuevo paciente.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form action={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nombre Completo</Label>
                        <Input 
                            id="name" 
                            name="name" 
                            placeholder="Ana María López" 
                            required 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="age">Edad</Label>
                            <Input 
                                id="age" 
                                name="age" 
                                type="number" 
                                min="1" 
                                max="120" 
                                placeholder="45" 
                                required 
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="gender">Género</Label>
                            <Select name="gender" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar género" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Masculino">Masculino</SelectItem>
                                    <SelectItem value="Femenino">Femenino</SelectItem>
                                    <SelectItem value="Otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono</Label>
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
                            placeholder="ana.lopez@email.com" 
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="address">Dirección (opcional)</Label>
                        <Input 
                            id="address" 
                            name="address" 
                            placeholder="Av. Corrientes 1234, CABA" 
                        />
                    </div>

                    <div className="flex justify-between">
                        <Button variant="outline" asChild>
                            <Link href="/dashboard/patients">
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