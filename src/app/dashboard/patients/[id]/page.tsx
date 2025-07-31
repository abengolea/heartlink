
import { patients, studies, users } from "@/lib/data";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowUpRight, User, Calendar, FileText, Stethoscope } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PatientDetailPage({ params }: { params: { id: string } }) {
    const patient = patients.find(p => p.id === params.id);

    if (!patient) {
        notFound();
    }
    
    const patientStudies = studies.filter(s => s.patientId === patient.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const operator = users.find(u => u.id === patient.operatorId);
    const requester = users.find(u => u.id === patient.requesterId);

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="font-semibold text-2xl md:text-3xl">{patient.name}</h1>
                <p className="text-muted-foreground">DNI: {patient.dni}</p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3">
                <div className="md:col-span-1 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Paciente</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground"/>
                                <span>{patient.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground"/>
                                <span>Nacimiento: {format(parseISO(patient.dob), "PPP", { locale: es })}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-muted-foreground"/>
                                <span>Operador: {operator?.name || 'N/A'}</span>
                            </div>
                             <div className="flex items-center gap-2">
                                <Stethoscope className="h-4 w-4 text-muted-foreground"/>
                                <span>Solicitante: {requester?.name || 'N/A'}</span>
                            </div>
                            <div>
                                <Badge variant={patient.status === 'active' ? 'outline' : 'secondary'}>
                                    {patient.status === 'active' ? 'Activo' : 'Archivado'}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2">
                     <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5"/> Historial de Estudios
                            </CardTitle>
                            <CardDescription>
                                Un listado de todos los estudios realizados para este paciente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {patientStudies.length > 0 ? (
                                patientStudies.map(study => (
                                    <Card key={study.id} className="flex flex-col sm:flex-row">
                                         <div className="flex-shrink-0">
                                            <Image
                                                src="https://placehold.co/600x400.png"
                                                alt="Placeholder de video de estudio"
                                                width={150}
                                                height={100}
                                                className="rounded-l-lg object-cover aspect-video h-full w-full sm:w-[150px]"
                                                data-ai-hint="heart ultrasound"
                                            />
                                         </div>
                                        <div className="p-4 grid gap-2 flex-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-semibold">{study.description}</p>
                                                {study.isUrgent ? (
                                                    <Badge variant="destructive" className="w-fit">Urgente</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="w-fit">Rutina</Badge>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground">
                                                {format(parseISO(study.date), "PPP", { locale: es })}
                                            </p>
                                            <Button asChild size="sm" className="w-full sm:w-fit ml-auto mt-2 gap-1">
                                                <Link href={`/dashboard/studies/${study.id}`}>
                                                    Ver Estudio
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </div>
                                    </Card>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-8">No se encontraron estudios para este paciente.</p>
                            )}
                        </CardContent>
                     </Card>
                </div>
            </div>

        </div>
    )
}
