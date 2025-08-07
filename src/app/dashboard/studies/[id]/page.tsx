
import { getAllPatients, getAllUsers } from "@/lib/firestore";
import { getStudyById } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Link as LinkIcon, MessageSquare, Send, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
    
    const patient = patients.find(p => p.id === study.patientId);
    const operator = users.find(u => u.id === patient?.operatorId);
    const requester = users.find(u => u.id === patient?.requesterId);

    return (
        <div className="mx-auto grid w-full max-w-6xl gap-6">
            <div className="flex-1">
                <h1 className="font-semibold text-2xl md:text-3xl">Detalle del Estudio</h1>
                <p className="text-muted-foreground">Paciente: {patient?.name || 'Desconocido'}</p>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 grid gap-6">
                    <Card>
                         <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Video className="h-5 w-5"/> Video del Estudio
                                    </CardTitle>
                                    <CardDescription>
                                        Fecha: {format(parseISO(study.date), "PPP p", { locale: es })}
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                     {study.isUrgent ? (
                                        <Badge variant="destructive" className="w-fit">Urgente</Badge>
                                    ) : (
                                        <Badge variant="outline" className="w-fit">Rutina</Badge>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                             <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                                {study.videoUrl ? (
                                    <>
                                        <video 
                                            className="w-full h-full object-cover"
                                            controls
                                            preload="metadata"
                                            crossOrigin="anonymous"
                                        >
                                            <source src={study.videoUrl} type="video/mp4" />
                                            <source src={study.videoUrl} type="video/webm" />
                                            Tu navegador no soporta el elemento video.
                                        </video>
                                        <div className="mt-2 text-xs text-gray-500 break-all">
                                            <strong>Video URL:</strong> {study.videoUrl}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <p className="text-muted-foreground">Video no disponible</p>
                                    </div>
                                )}
                             </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                           <CardTitle className="flex items-center gap-2">
                                <MessageSquare className="h-5 w-5" /> Notas Internas
                            </CardTitle>
                            <CardDescription>
                                Comentarios entre el médico operador y el solicitante.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                           <div className="space-y-4 max-h-96 overflow-y-auto pr-4">
                             {study.comments.length > 0 ? (
                                study.comments.map(comment => (
                                    <div key={comment.id} className="flex items-start gap-3">
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger>
                                                    <Avatar>
                                                        <AvatarFallback>{comment.userName.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p>{comment.userName}</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>

                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-sm">{comment.userName} <span className="text-xs font-normal text-muted-foreground ml-1">{comment.role === 'operator' ? 'Operador' : 'Solicitante'}</span></p>
                                                <p className="text-xs text-muted-foreground">{format(parseISO(comment.timestamp), "p, PPP", { locale: es })}</p>
                                            </div>
                                            <div className="p-3 bg-muted/50 rounded-lg mt-1">
                                                <p className="text-sm">{comment.text}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                             ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">No hay comentarios en este estudio.</p>
                             )}
                           </div>
                           <div className="flex items-start gap-3 pt-4 border-t">
                                <Avatar>
                                    <AvatarFallback>U</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 grid gap-2">
                                     <Textarea placeholder="Escribe un comentario..."/>
                                     <Button size="sm" className="ml-auto w-fit">
                                        <Send className="mr-2 h-4 w-4"/>
                                        Enviar
                                     </Button>
                                </div>
                           </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-1 grid gap-6 content-start">
                     <Card>
                        <CardHeader>
                            <CardTitle>Información</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Paciente</span>
                                <span>{patient?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">DNI</span>
                                <span className="font-mono">{patient?.dni}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Médico Operador</span>
                                <span>{operator?.name}</span>
                            </div>
                             <div className="flex justify-between">
                                <span className="text-muted-foreground">Médico Solicitante</span>
                                <span>{requester?.name || 'No asignado'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Especialidad</span>
                                <span>{requester?.specialty || 'No especificada'}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Archivos Adjuntos</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-2">
                            <Button variant="outline" className="w-full justify-start gap-2">
                                <FileText className="h-4 w-4"/> Informe.pdf
                            </Button>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Compartir</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <Button className="w-full">
                                <LinkIcon className="mr-2 h-4 w-4"/>
                                Generar Link Público
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
