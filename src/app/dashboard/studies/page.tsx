
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, PlusCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

interface Study {
    id: string;
    patientId: string;
    description: string;
    date: string;
    isUrgent: boolean;
    videoUrl?: string;
}

export default function StudiesPage() {
    const [studies, setStudies] = useState<Study[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                console.log('🔍 [StudiesPage] Loading studies and patients from API...');
                
                // Load studies and patients in parallel
                const [studiesResponse, patientsResponse] = await Promise.all([
                    fetch('/api/studies'),
                    fetch('/api/patients')
                ]);
                
                console.log('🔍 [StudiesPage] API response status:', studiesResponse.status, patientsResponse.status);
                
                if (studiesResponse.ok && patientsResponse.ok) {
                    const [studiesData, patientsData] = await Promise.all([
                        studiesResponse.json(),
                        patientsResponse.json()
                    ]);
                    
                    console.log('✅ [StudiesPage] Studies loaded:', studiesData.length, 'studies');
                    console.log('✅ [StudiesPage] Patients loaded:', patientsData.length, 'patients');
                    
                    setStudies(studiesData);
                    setPatients(patientsData);
                } else {
                    console.error('❌ [StudiesPage] API failed with status:', studiesResponse.status, patientsResponse.status);
                    setStudies([]);
                    setPatients([]);
                }
            } catch (error) {
                console.error('❌ [StudiesPage] Error loading data:', error);
                setStudies([]);
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        }
        loadData();
    }, []);

    const refreshStudies = () => {
        setIsLoading(true);
        
        const loadData = async () => {
            try {
                console.log('🔍 [StudiesPage] Refreshing data...');
                const [studiesResponse, patientsResponse] = await Promise.all([
                    fetch('/api/studies'),
                    fetch('/api/patients')
                ]);
                
                if (studiesResponse.ok && patientsResponse.ok) {
                    const [studiesData, patientsData] = await Promise.all([
                        studiesResponse.json(),
                        patientsResponse.json()
                    ]);
                    console.log('✅ [StudiesPage] Data refreshed:', studiesData.length, 'studies,', patientsData.length, 'patients');
                    setStudies(studiesData);
                    setPatients(patientsData);
                } else {
                    setStudies([]);
                    setPatients([]);
                }
            } catch (error) {
                console.error('❌ [StudiesPage] Error refreshing data:', error);
                setStudies([]);
                setPatients([]);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
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
