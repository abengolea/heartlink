import { getAllPatients, getAllUsers, getPatientById, getUserById } from "@/lib/firestore";
import { getStudyById } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Video } from "lucide-react";
import VideoPlayer from "./video-player";
import ShareButton from "./share-button";
import CommentsPanel from "./comments-panel";

export default async function StudyDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const study = await getStudyById(id);
    
    if (!study) {
        notFound();
    }

    const [patients, users] = await Promise.all([
        getAllPatients(),
        getAllUsers()
    ]);

    // patientId puede ser string o objeto (estudios antiguos)
    const patientIdRaw = study.patientId;
    let patient = null;
    if (typeof patientIdRaw === 'object' && patientIdRaw !== null && 'name' in patientIdRaw) {
        patient = patientIdRaw as { id: string; name?: string; dni?: string; requesterId?: string };
    } else {
        const pid = typeof patientIdRaw === 'string' ? patientIdRaw : (patientIdRaw as { id?: string })?.id;
        patient = pid ? (patients.find(p => p.id === pid) ?? await getPatientById(pid)) : null;
    }
    const requesterIdRaw = patient?.requesterId;
    const requesterId = typeof requesterIdRaw === 'string' ? requesterIdRaw : (requesterIdRaw as { id?: string })?.id;
    const requester = requesterId ? (users.find(u => u.id === requesterId) ?? await getUserById(requesterId)) : null;

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6 min-w-0 px-2 sm:px-0">
            <div className="flex-1 min-w-0">
                <h1 className="font-semibold text-xl sm:text-2xl md:text-3xl">Detalle del Estudio</h1>
                <p className="text-muted-foreground text-sm truncate">Paciente: {patient?.name || 'Desconocido'}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3 min-w-0">
                <div className="lg:col-span-2 grid gap-6 min-w-0">
                    <Card>
                         <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Video className="h-5 w-5 shrink-0"/> Video del Estudio
                                    </CardTitle>
                                    <CardDescription className="text-xs sm:text-sm truncate">
                                        Fecha: {format(parseISO(study.date), "PPP p", { locale: es })}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                     {study.isUrgent ? (
                                        <Badge variant="destructive" className="w-fit">Urgente</Badge>
                                    ) : (
                                        <Badge variant="outline" className="w-fit">Rutina</Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <VideoPlayer videoUrl={study.videoUrl || ''} />
                        </CardContent>
                    </Card>
                    

                    <CommentsPanel
                        studyId={study.id}
                        initialComments={study.comments ?? []}
                    />
                </div>
                <div className="lg:col-span-1 grid gap-6 content-start">
                     <Card>
                        <CardHeader>
                            <CardTitle>Información</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Paciente</span>
                                <span>{patient?.name || 'Desconocido'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">DNI</span>
                                <span className="font-mono">{patient?.dni || '—'}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Médico Solicitante</span>
                                <span>{requester?.name || 'Desconocido'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Especialidad</span>
                                <span>{requester?.specialty || '—'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Compartir</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <ShareButton studyId={study.id} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
