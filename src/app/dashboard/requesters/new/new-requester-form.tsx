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
import { ArrowLeft, Save, Phone } from "lucide-react";
import Link from "next/link";

export function NewRequesterForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [quickMode, setQuickMode] = useState(false);
    const { toast } = useToast();
    const router = useRouter();

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);

        try {
            const phone = formData.get('phone') as string;
            if (!phone?.trim()) {
                throw new Error('El teléfono es obligatorio');
            }

            // Modo rápido: solo teléfono
            if (quickMode) {
                const response = await fetchWithAuth('/api/invite-solicitante', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ phone: phone.trim() }),
                });
                const result = await response.json();
                if (response.ok) {
                    toast({
                        title: 'Solicitante creado',
                        description: result.message || 'El médico puede completar su perfil en la app.',
                    });
                    router.push('/dashboard/requesters');
                } else {
                    throw new Error(result.error || `Error ${response.status}`);
                }
                return;
            }

            // Modo completo
            const requesterData = {
                name: formData.get('name') as string,
                email: formData.get('email') as string,
                phone: formData.get('phone') as string,
                specialty: formData.get('specialty') as string,
            };

            if (!requesterData.name || !requesterData.email || !requesterData.phone || !requesterData.specialty) {
                throw new Error('Todos los campos son requeridos');
            }

            const response = await fetchWithAuth('/api/invite-solicitante', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requesterData),
            });

            const result = await response.json();

            if (response.ok) {
                toast({
                    title: 'Solicitante invitado',
                    description: result.message || 'Se envió un email al médico para que genere su contraseña.',
                });
                router.push('/dashboard/requesters');
            } else {
                throw new Error(result.error || `Error ${response.status}`);
            }
        } catch (error) {
            console.error('Error creating requester:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error instanceof Error ? error.message : 'No se pudo crear el solicitante. Intenta nuevamente.',
            });
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Información del Solicitante</CardTitle>
                <CardDescription>
                    {quickMode
                        ? "Solo necesitas el teléfono de WhatsApp. El médico podrá completar el resto de sus datos después en la app."
                        : "Completa los datos. El médico recibirá un email para generar su contraseña. El teléfono es necesario para notificaciones por WhatsApp."}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setQuickMode(!quickMode)}
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                        <Phone className="h-4 w-4" />
                        {quickMode ? "Usar formulario completo" : "Solo teléfono (crear rápido)"}
                    </button>
                </div>
                <form action={handleSubmit} className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Teléfono (WhatsApp) *</Label>
                        <PhoneInputWithCountry
                            name="phone"
                            id="phone"
                            placeholder="9 336 451-3355"
                            required
                        />
                    </div>

                    {!quickMode && (
                        <>
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
                        </>
                    )}

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