
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { patients } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, PlusCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function StudiesPage() {
    const [studies, setStudies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStudies() {
            try {
                console.log('🔍 [StudiesPage] Loading studies from API...');
                const response = await fetch('/api/studies');
                console.log('🔍 [StudiesPage] API response status:', response.status);
                
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ [StudiesPage] Studies loaded:', data.length, 'studies');
                    console.log('🔍 [StudiesPage] Studies data:', data);
                    setStudies(data);
                } else {
                    console.error('❌ [StudiesPage] API failed with status:', response.status);
                    const errorText = await response.text();
                    console.error('❌ [StudiesPage] Error response:', errorText);
                    setStudies([]);
                }
            } catch (error) {
                console.error('❌ [StudiesPage] Error loading studies:', error);
                setStudies([]);
            } finally {
                setIsLoading(false);
            }
        }
        loadStudies();
    }, []);

    const refreshStudies = () => {
        setIsLoading(true);
        const loadStudies = async () => {
            try {
                console.log('🔍 [StudiesPage] Refreshing studies...');
                const response = await fetch('/api/studies');
                if (response.ok) {
                    const data = await response.json();
                    console.log('✅ [StudiesPage] Studies refreshed:', data.length, 'studies');
                    setStudies(data);
                } else {
                    setStudies([]);
                }
            } catch (error) {
                console.error('❌ [StudiesPage] Error refreshing studies:', error);
                setStudies([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadStudies();
    };
    
    const getPatientName = (patientId: string) => {
        return patients.find(p => p.id === patientId)?.name || "Paciente Desconocido";
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Estudios</h1>
                    <p className="text-muted-foreground text-sm">
                        {isLoading ? 'Cargando estudios...' : `${studies.length} estudios encontrados`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={refreshStudies} disabled={isLoading}>
                        <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                    <Button asChild>
                        <Link href="/dashboard/studies/upload">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Subir Estudio
                        </Link>
                    </Button>
                </div>
            </div>
            {studies.length === 0 && !isLoading ? (
                <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <h3 className="text-lg font-semibold mb-2">No hay estudios</h3>
                        <p className="text-muted-foreground mb-4 text-center">
                            No se encontraron estudios médicos. Sube tu primer estudio para comenzar.
                        </p>
                        <Button asChild>
                            <Link href="/dashboard/studies/upload">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Subir Primer Estudio
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
                    {studies.map(study => (
                    <Card key={study.id}>
                        <CardHeader className="p-0">
                           <Image
                            src="https://placehold.co/600x400.png"
                            alt="Placeholder de video de estudio"
                            width={600}
                            height={400}
                            className="rounded-t-lg object-cover aspect-video"
                            data-ai-hint="heart ultrasound"
                           />
                        </CardHeader>
                        <CardContent className="p-4 grid gap-2">
                             {study.isUrgent ? (
                                <Badge variant="destructive" className="w-fit">Urgente</Badge>
                            ) : (
                                <Badge variant="outline" className="w-fit">Rutina</Badge>
                            )}
                            <CardTitle className="text-lg">{getPatientName(study.patientId)}</CardTitle>
                            <CardDescription>
                                {study.description}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground">
                                {format(parseISO(study.date), "PPP")}
                            </p>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Button asChild size="sm" className="w-full gap-1">
                                <Link href={`/dashboard/studies/${study.id}`}>
                                Ver Estudio
                                <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
