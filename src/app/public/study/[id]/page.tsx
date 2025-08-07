import { getStudyById } from "@/lib/firestore";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Video } from "lucide-react";
import VideoPlayer from "@/app/dashboard/studies/[id]/video-player";

export default async function PublicStudyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    
    try {
        const study = await getStudyById(id);
        
        if (!study) {
            notFound();
        }

        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="mx-auto w-full max-w-4xl px-4">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Estudio Médico Compartido
                        </h1>
                        <p className="text-gray-600">
                            Fecha: {study.date ? format(parseISO(study.date), "PPP p", { locale: es }) : 'No disponible'}
                        </p>
                    </div>

                    {/* Video Card */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle className="flex items-center gap-2">
                                        <Video className="h-5 w-5"/> Video del Estudio
                                    </CardTitle>
                                    <CardDescription>
                                        Estudio médico - Visualización pública
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
                            <VideoPlayer videoUrl={study.videoUrl || ''} />
                        </CardContent>
                    </Card>

                    {/* Study Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Estudio</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">ID del Estudio:</span>
                                    <span className="font-mono text-xs">{study.id}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tipo:</span>
                                    <span>{study.isUrgent ? 'Urgente' : 'Rutina'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Estado:</span>
                                    <span>Disponible para visualización</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Descripción:</span>
                                    <span>{study.description || 'Sin descripción'}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    <div className="mt-8 text-center text-xs text-gray-500">
                        <p>Este es un enlace público para visualizar un estudio médico.</p>
                        <p>© 2025 HeartLink - Sistema de Gestión Médica</p>
                    </div>
                </div>
            </div>
        );
        
    } catch (error) {
        console.error('Error loading public study:', error);
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-semibold text-red-600 mb-4">Error de Carga</h1>
                    <p className="text-gray-600 mb-4">
                        No se pudo cargar el estudio solicitado.
                    </p>
                    <p className="text-xs text-gray-500">
                        ID del estudio: {id}
                    </p>
                </div>
            </div>
        );
    }
}