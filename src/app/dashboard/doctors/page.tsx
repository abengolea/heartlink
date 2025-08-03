"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, User } from "lucide-react";
import Link from "next/link";

export default function DoctorsPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadUsers() {
            try {
                const response = await fetch('/api/users');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data);
                } else {
                    setUsers([]);
                }
            } catch (error) {
                console.error('Error loading users:', error);
                setUsers([]);
            } finally {
                setIsLoading(false);
            }
        }
        loadUsers();
    }, []);
    
    const getRoleColor = (role: string) => {
        switch (role) {
            case 'solicitante': return 'bg-blue-100 text-blue-800';
            case 'operator': return 'bg-green-100 text-green-800';
            case 'admin': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Gestión de Médicos</h1>
                    <p className="text-muted-foreground">
                        Administra los médicos solicitantes y operadores del sistema
                    </p>
                </div>
                <Link href="/dashboard/doctors/new">
                    <Button>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Agregar Médico
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="text-center py-8">
                    <p>Cargando médicos...</p>
                </div>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {users.map((user) => (
                    <Card key={user.id} className="relative">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <User className="h-4 w-4" />
                                    {user.name}
                                </CardTitle>
                                <Link href={`/dashboard/doctors/${user.id}/edit`}>
                                    <Button variant="ghost" size="sm">
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                            <CardDescription>
                                ID: {user.id}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Rol:</span>
                                    <Badge className={getRoleColor(user.role)}>
                                        {user.role === 'solicitante' ? 'Médico Solicitante' : 
                                         user.role === 'operator' ? 'Operador' : 'Administrador'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Estado:</span>
                                    <Badge className={getStatusColor(user.status)}>
                                        {user.status === 'active' ? 'Activo' : 'Suspendido'}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">Suscripción:</span>
                                    <Badge variant={user.subscriptionStatus === 'paid' ? 'default' : 'destructive'}>
                                        {user.subscriptionStatus === 'paid' ? 'Pagada' : 'Vencida'}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    ))}
                </div>

                {users.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center">
                            <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">No hay médicos registrados</h3>
                            <p className="text-muted-foreground mb-4">
                                Comienza agregando el primer médico al sistema
                            </p>
                            <Link href="/dashboard/doctors/new">
                                <Button>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Agregar Primer Médico
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            )}
        </div>
    );
}