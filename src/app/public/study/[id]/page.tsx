import { getStudyById, getPatientById, getUserById } from "@/lib/firestore";
import type { Patient } from "@/lib/types";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Video, ShieldAlert } from "lucide-react";
import VideoPlayer from "@/app/dashboard/studies/[id]/video-player";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; paciente?: string; medico?: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const urlParams = await searchParams;
  let patientName = urlParams.paciente || '';
  let doctorName = urlParams.medico || '';

  // Obtener de la DB si no vienen en la URL (crawlers a veces no pasan query params)
  if (!patientName || !doctorName) {
    try {
      const study = await getStudyById(id);
      if (study) {
        const patientIdRaw = study.patientId;
        let patient: { name?: string; requesterId?: string | { id?: string } } | null = null;
        if (typeof patientIdRaw === 'object' && patientIdRaw !== null && 'name' in patientIdRaw) {
          patient = patientIdRaw as { name?: string; requesterId?: string | { id?: string } };
        } else {
          const pid = typeof patientIdRaw === 'string' ? patientIdRaw : (patientIdRaw as { id?: string })?.id;
          patient = pid ? await getPatientById(pid) : null;
        }
        if (patient && !patientName) patientName = patient.name || '';
        const studyDoctorId = (study as { requestingDoctorId?: string }).requestingDoctorId;
        const reqIdRaw = patient?.requesterId;
        const reqId = studyDoctorId || (typeof reqIdRaw === 'string' ? reqIdRaw : reqIdRaw?.id);
        if (reqId && !doctorName) {
          const doctor = await getUserById(reqId);
          doctorName = doctor?.name || '';
        }
      }
    } catch {
      // Ignorar errores de DB para metadata
    }
  }

  const title = patientName && doctorName
    ? `Estudio de ${patientName} | ${doctorName} - HeartLink`
    : patientName
      ? `Estudio de ${patientName} - HeartLink`
      : doctorName
        ? `Estudio | ${doctorName} - HeartLink`
        : 'Estudio Médico Compartido | HeartLink';
  const description = patientName && doctorName
    ? `Estudio cardiológico de ${patientName} solicitado por ${doctorName}`
    : 'Visualización de estudio médico compartido';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PublicStudyPage({ 
    params, 
    searchParams 
}: { 
    params: Promise<{ id: string }>; 
    searchParams: Promise<{ token?: string; paciente?: string; medico?: string }>; 
}) {
    const { id } = await params;
    const { token, paciente: pacienteUrl, medico: medicoUrl } = await searchParams;
    
    try {
        const study = await getStudyById(id);
        
        if (!study) {
            notFound();
        }

        // Obtener datos del paciente y médico solicitante
        const patientIdRaw = study.patientId;
        let patient: Patient | null = null;
        if (typeof patientIdRaw === 'object' && patientIdRaw !== null && 'name' in patientIdRaw) {
            patient = patientIdRaw as Patient;
        } else {
            const patientId = typeof patientIdRaw === 'string' ? patientIdRaw : (patientIdRaw as { id?: string })?.id;
            patient = patientId ? await getPatientById(patientId) : null;
        }
        // Médico: primero study.requestingDoctorId, luego patient.requesterId
        const studyDoctorId = (study as { requestingDoctorId?: string }).requestingDoctorId;
        const requesterIdRaw = patient?.requesterId;
        const requesterId = studyDoctorId || (typeof requesterIdRaw === 'string' ? requesterIdRaw : (requesterIdRaw as { id?: string })?.id);
        let requestingDoctor = requesterId ? await getUserById(requesterId) : null;
        // Fallback: usar nombres de la URL si la DB no devolvió datos
        const patientName = patient?.name || pacienteUrl || '';
        const doctorName = requestingDoctor?.name || medicoUrl || '';

        // Requiere token válido para acceder (protección de datos médicos)
        if (!token || token !== study.shareToken) {
            return (
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md mx-auto px-4">
                        <ShieldAlert className="h-16 w-16 text-amber-500 mx-auto mb-4" />
                        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                            Enlace no válido o expirado
                        </h1>
                        <p className="text-gray-600 mb-4">
                            Este enlace requiere un token de acceso válido. Solicita un nuevo enlace al médico que compartió el estudio.
                        </p>
                        <p className="text-xs text-gray-500">
                            Si tienes el enlace correcto, asegúrate de que incluye el parámetro ?token=...
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-gray-50 py-6 sm:py-8 overflow-x-hidden">
                <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 min-w-0">
                    {/* Header */}
                    <div className="mb-6 text-center">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 px-2">
                            Estudio Médico Compartido
                        </h1>
                        <p className="text-gray-600">
                            Fecha: {study.date ? format(parseISO(study.date), "PPP p", { locale: es }) : 'No disponible'}
                        </p>
                    </div>

                    {/* Video Card */}
                    <Card className="mb-6">
                        <CardHeader>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                                        <Video className="h-5 w-5"/> Video del Estudio
                                    </CardTitle>
                                    <CardDescription>
                                        Estudio médico - Visualización pública
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

                    {/* Study Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Estudio</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4 text-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {patientName && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Paciente:</span>
                                        <span className="font-medium">{patientName}</span>
                                    </div>
                                )}
                                {doctorName && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Médico Solicitante:</span>
                                        <span className="font-medium">{doctorName}{requestingDoctor?.specialty ? ` - ${requestingDoctor.specialty}` : ''}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Fecha:</span>
                                    <span>{study.date ? format(parseISO(study.date), "PPP", { locale: es }) : 'No disponible'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tipo:</span>
                                    <span>{study.isUrgent ? 'Urgente' : 'Rutina'}</span>
                                </div>
                                <div className="flex justify-between md:col-span-2">
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