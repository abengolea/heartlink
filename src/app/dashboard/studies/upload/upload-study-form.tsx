
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// Removed Alert imports since we use toast notifications instead
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PhoneInputWithCountry } from "@/components/phone-input-with-country";
// Remove server-side Firestore imports from client component
import { CheckCircle, FileText, Loader2, UploadCloud, Wand2, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudioAction } from "@/actions/transcribe-audio";
import { Progress } from "@/components/ui/progress";
import {
  ALLOWED_VIDEO_TYPES,
  ALLOWED_PDF_TYPES,
  MAX_FILE_SIZE,
  MAX_PDF_SIZE,
  isVideoDurationAllowed,
  MIN_VIDEO_DURATION_USER_MESSAGE,
} from "@/lib/upload-constants";
import { probeVideoDurationSeconds } from "@/lib/video-duration-client";
import { useAuth } from "@/contexts/auth-context";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

type ListUser = { id: string; name: string; specialty?: string };
type ListPatient = { id: string; name: string };

// Removed initialUploadState since we don't use useActionState anymore

export function UploadStudyForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();
    const { toast } = useToast();
    const { dbUser } = useAuth();
    
    const [videoFile, setVideoFile] = useState<File | null>(null);
    /** Duración válida del video seleccionado (segundos); requerida para subir. */
    const [videoDurationSec, setVideoDurationSec] = useState<number | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState<ListUser[]>([]);
    const [patients, setPatients] = useState<ListPatient[]>([]);
    const [selectedPatientId, setSelectedPatientId] = useState<string>('');
    const [selectedRequesterId, setSelectedRequesterId] = useState<string>('');

    const [newPatientOpen, setNewPatientOpen] = useState(false);
    const [newRequesterOpen, setNewRequesterOpen] = useState(false);
    const [savingPatient, setSavingPatient] = useState(false);
    const [savingRequester, setSavingRequester] = useState(false);
    const [requesterQuickMode, setRequesterQuickMode] = useState(false);
    const [inviteSpecialty, setInviteSpecialty] = useState('');

    const canInviteRequester =
        dbUser?.role === 'operator' || dbUser?.role === 'admin';
    const isSolicitante =
        dbUser?.role === 'medico_solicitante' || dbUser?.role === 'solicitante';

    const loadLists = useCallback(async () => {
        try {
            const [doctorsRes, availableRes, patientsRes] = await Promise.all([
                fetchWithAuth('/api/operators/me/doctors'),
                fetchWithAuth('/api/operators/me/doctors/available').catch(() => null),
                fetchWithAuth('/api/patients'),
            ]);
            if (doctorsRes.ok && patientsRes.ok) {
                const [linkedDoctors, patientsData] = await Promise.all([
                    doctorsRes.json(),
                    patientsRes.json(),
                ]);
                let doctorsList = Array.isArray(linkedDoctors) ? linkedDoctors : [];
                let available: ListUser[] = [];
                if (availableRes?.ok) {
                    try {
                        const data = await availableRes.json();
                        available = Array.isArray(data) ? data : [];
                    } catch {
                        available = [];
                    }
                }
                if (doctorsList.length === 0 && available.length > 0) {
                    doctorsList = available;
                } else if (doctorsList.length > 0 && available.length > 0) {
                    const linkedIds = new Set(
                        doctorsList.map((d: { id: string }) => d.id)
                    );
                    const extra = available.filter((d) => !linkedIds.has(d.id));
                    doctorsList = [...doctorsList, ...extra].sort((a, b) =>
                        (a.name || '').localeCompare(b.name || '')
                    );
                }
                setUsers(
                    doctorsList.filter(
                        (u: { id?: string; name?: string }) => u?.id && u?.name
                    ) as ListUser[]
                );
                setPatients(patientsData as ListPatient[]);
            } else {
                throw new Error('Failed to load data from API');
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Error al cargar datos.',
            });
            setUsers([]);
            setPatients([]);
        }
    }, [toast]);

    useEffect(() => {
        loadLists();
    }, [loadLists]);

    // Removed useEffect for state since we handle success/error directly in server action call

    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        const input = event.target;

        if (!file) {
            setVideoFile(null);
            setVideoDurationSec(null);
            return;
        }

        console.log(`Selected video file: ${file.name}, size: ${file.size}, type: ${file.type}`);

        if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
            toast({
                variant: 'destructive',
                title: 'Tipo de archivo no válido',
                description: 'Solo se permiten archivos de video (MP4, WEBM, AVI, MOV).',
            });
            input.value = '';
            setVideoFile(null);
            setVideoDurationSec(null);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            toast({
                variant: 'destructive',
                title: 'Archivo demasiado grande',
                description: 'El tamaño máximo permitido es 100MB.',
            });
            input.value = '';
            setVideoFile(null);
            setVideoDurationSec(null);
            return;
        }

        void (async () => {
            try {
                const duration = await probeVideoDurationSeconds(file);
                if (!isVideoDurationAllowed(duration)) {
                    toast({
                        variant: 'destructive',
                        title: 'Video demasiado corto',
                        description: MIN_VIDEO_DURATION_USER_MESSAGE,
                    });
                    input.value = '';
                    setVideoFile(null);
                    setVideoDurationSec(null);
                    return;
                }
                setVideoFile(file);
                setVideoDurationSec(duration);
            } catch {
                toast({
                    variant: 'destructive',
                    title: 'No se pudo leer el video',
                    description:
                        'No se pudo obtener la duración. Probá con otro archivo o formato (MP4 recomendado).',
                });
                input.value = '';
                setVideoFile(null);
                setVideoDurationSec(null);
            }
        })();
    };

    const handlePdfChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!ALLOWED_PDF_TYPES.includes(file.type)) {
                toast({
                    variant: 'destructive',
                    title: 'Tipo de archivo no válido',
                    description: 'Solo se permiten archivos PDF.',
                });
                event.target.value = '';
                return;
            }
            if (file.size > MAX_PDF_SIZE) {
                toast({
                    variant: 'destructive',
                    title: 'Archivo demasiado grande',
                    description: 'El PDF no debe superar 50MB.',
                });
                event.target.value = '';
                return;
            }
            setPdfFile(file);
        }
    };

    const handleTranscribe = async () => {
        if (!videoFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un video primero.' });
            return;
        }

        setIsTranscribing(true);
        const reader = new FileReader();
        reader.onload = async (e) => {
            if (e.target?.result) {
                try {
                    const dataUri = e.target.result as string;
                    console.log('Starting transcription...');
                    const result = await transcribeAudioAction(dataUri);
                    
                    if (result.status === 'success' && result.transcription) {
                        setDescription(result.transcription);
                        toast({
                            title: 'Transcripción Completa',
                            description: 'El audio ha sido transcrito exitosamente.',
                        });
                    } else {
                        console.error('Transcription failed:', result.message);
                        toast({
                            variant: 'destructive',
                            title: 'Error de Transcripción',
                            description: result.message,
                        });
                    }
                } catch (error) {
                    console.error("Error al transcribir:", error);
                    toast({
                        variant: 'destructive',
                        title: 'Error Inesperado',
                        description: 'Ocurrió un problema durante la transcripción.',
                    });
                } finally {
                    setIsTranscribing(false);
                }
            }
        };
        reader.readAsDataURL(videoFile);
    };

    async function handleCreatePatient(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const requesterIdForPatient = isSolicitante ? dbUser?.id : selectedRequesterId;
        if (!requesterIdForPatient) {
            toast({
                variant: 'destructive',
                title: 'Falta médico solicitante',
                description: 'Selecciona primero el médico solicitante al que corresponde el paciente.',
            });
            return;
        }
        const fd = new FormData(event.currentTarget);
        const name = (fd.get('newPatientName') as string)?.trim();
        const phone = (fd.get('newPatientPhone') as string)?.trim();
        if (!name || !phone) {
            toast({
                variant: 'destructive',
                title: 'Datos incompletos',
                description: 'Nombre y teléfono del paciente son obligatorios.',
            });
            return;
        }
        setSavingPatient(true);
        try {
            const patientData = {
                name,
                phone,
                dni: (fd.get('newPatientDni') as string)?.trim() || undefined,
                dob: (fd.get('newPatientDob') as string)?.trim() || undefined,
                email: (fd.get('newPatientEmail') as string)?.trim() || undefined,
                requesterId: requesterIdForPatient,
                status: 'active',
            };
            const res = await fetchWithAuth('/api/patients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(patientData),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                toast({
                    variant: 'destructive',
                    title: 'No se pudo crear el paciente',
                    description: typeof data.error === 'string' ? data.error : `Error ${res.status}`,
                });
                return;
            }
            toast({ title: 'Paciente registrado', description: 'Ya puedes asignarlo al estudio.' });
            setNewPatientOpen(false);
            event.currentTarget.reset();
            await loadLists();
            if (data.id) setSelectedPatientId(data.id);
        } finally {
            setSavingPatient(false);
        }
    }

    async function handleInviteRequester(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!canInviteRequester) return;
        const fd = new FormData(event.currentTarget);
        setSavingRequester(true);
        try {
            let body: Record<string, string>;
            if (requesterQuickMode) {
                const phone = (fd.get('invitePhone') as string)?.trim();
                if (!phone) {
                    toast({
                        variant: 'destructive',
                        title: 'Teléfono obligatorio',
                        description: 'Indica el WhatsApp del médico solicitante.',
                    });
                    return;
                }
                body = { phone };
            } else {
                const name = (fd.get('inviteName') as string)?.trim();
                const email = (fd.get('inviteEmail') as string)?.trim();
                const phone = (fd.get('invitePhone') as string)?.trim();
                if (!name || !email || !phone || !inviteSpecialty) {
                    toast({
                        variant: 'destructive',
                        title: 'Datos incompletos',
                        description: 'Completa todos los campos del solicitante.',
                    });
                    return;
                }
                body = { name, email, phone, specialty: inviteSpecialty };
            }

            let res = await fetchWithAuth('/api/invite-solicitante', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            let data = await res.json().catch(() => ({}));

            if (res.status === 409 && data.userId && dbUser?.role === 'operator') {
                const linkRes = await fetchWithAuth('/api/operators/me/doctors', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ requesterId: data.userId }),
                });
                if (linkRes.ok) {
                    toast({
                        title: 'Médico vinculado',
                        description:
                            'Ya existía un solicitante con ese número; se añadió a tu lista.',
                    });
                    setNewRequesterOpen(false);
                    setInviteSpecialty('');
                    event.currentTarget.reset();
                    await loadLists();
                    setSelectedRequesterId(data.userId);
                    return;
                }
            }

            if (!res.ok) {
                toast({
                    variant: 'destructive',
                    title: 'No se pudo registrar el solicitante',
                    description: typeof data.error === 'string' ? data.error : `Error ${res.status}`,
                });
                return;
            }

            toast({
                title: requesterQuickMode ? 'Solicitante creado' : 'Solicitante invitado',
                description:
                    typeof data.message === 'string'
                        ? data.message
                        : 'El médico quedó disponible para asignar estudios.',
            });
            setNewRequesterOpen(false);
            setInviteSpecialty('');
            event.currentTarget.reset();
            await loadLists();
            if (data.userId) setSelectedRequesterId(data.userId);
        } finally {
            setSavingRequester(false);
        }
    }

    const newPatientNeedsRequesterFirst = !isSolicitante && !selectedRequesterId;

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!videoFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un video.' });
            return;
        }
        if (
            videoDurationSec == null ||
            !isVideoDurationAllowed(videoDurationSec)
        ) {
            toast({
                variant: 'destructive',
                title: 'Video no válido',
                description: MIN_VIDEO_DURATION_USER_MESSAGE,
            });
            return;
        }
        if (!selectedPatientId || !selectedRequesterId) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona paciente y médico solicitante.' });
            return;
        }
        const patient = patients.find((p) => p.id === selectedPatientId);
        const requester = users.find((u) => u.id === selectedRequesterId);
        if (!patient?.name || !requester?.name) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudieron resolver paciente o médico. Vuelve a cargar la página.',
            });
            return;
        }

        if (isUploading) return;

        console.log('Starting upload process...');
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // Enviar todo en una sola petición: el servidor sube el video a Firebase
            const formData = new FormData();
            formData.append('video', videoFile);
            formData.append('videoDurationSec', String(videoDurationSec));
            if (pdfFile) formData.append('pdf', pdfFile);
            formData.append('patientName', patient.name);
            formData.append('requestingDoctorName', requester.name);
            formData.append('description', description || '');
            
            console.log('Subiendo video y datos al servidor...');

            if (!dbUser?.id) {
                toast({
                    variant: 'destructive',
                    title: 'Error de sesión',
                    description: 'No se pudo verificar tu usuario. Por favor, inicia sesión nuevamente.',
                });
                setIsUploading(false);
                return;
            }

            let response: Response;
            try {
                response = await fetchWithAuth('/api/upload-study', {
                    method: 'POST',
                    body: formData
                });
            } catch (apiErr) {
                const err = apiErr instanceof Error ? apiErr : new Error(String(apiErr));
                const isNetwork = err.message === 'Failed to fetch' || err.name === 'TypeError';
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: isNetwork ? 'Error de conexión. Verifica que el servidor esté activo.' : err.message
                });
                setIsUploading(false);
                return;
            }

            setIsUploading(false);

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: errData.error || `Error ${response.status}`
                });
                return;
            }

            const responseData = await response.json();
            if (!responseData.success) {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: responseData.error || 'Error al guardar el estudio'
                });
                return;
            }

            const result = responseData.result;
            if (result && result.status === 'success') {
                toast({
                    title: 'Estudio Guardado',
                    description: result.message,
                });
                setVideoFile(null);
                setVideoDurationSec(null);
                setPdfFile(null);
                setUploadProgress(0);
                if (result.data?.studyId) {
                    setTimeout(() => router.push(`/dashboard/studies/${result.data.studyId}`), 1500);
                } else {
                    setTimeout(() => router.push('/dashboard/studies'), 1500);
                }
            } else {
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: result?.message || 'Error al guardar'
                });
            }

        } catch (error) {
            setIsUploading(false);
            console.error('Upload process error:', error);
            const err = error instanceof Error ? error : new Error(String(error));
            const isNetwork = err.message === 'Failed to fetch' || err.name === 'TypeError';
            toast({ 
                variant: 'destructive', 
                title: "Error de Subida", 
                description: isNetwork ? 'Error de conexión. Verifica tu conexión a internet.' : err.message
            });
        }
    };
    
    return (
        <div className="mx-auto grid w-full max-w-4xl gap-4">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Subir Nuevo Estudio</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Detalles del Estudio</CardTitle>
                    <CardDescription>
                        Completa el formulario para subir un nuevo estudio al sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
        <form ref={formRef} onSubmit={handleFormSubmit} className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="video">Video del Estudio (MP4, WEBM) — mínimo 1 minuto</Label>
                <Input id="video" name="video" type="file" accept="video/mp4,video/webm,video/avi,video/mov" required onChange={handleVideoChange}/>
                {isUploading && <Progress value={uploadProgress} className="w-full mt-2" />}
                {uploadProgress === 100 && !isUploading && (
                     <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Video subido exitosamente. Haz clic en Guardar estudio.</span>
                    </div>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="pdf" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF del Estudio (opcional)
                </Label>
                <Input id="pdf" name="pdf" type="file" accept="application/pdf" onChange={handlePdfChange} />
                {pdfFile && (
                    <p className="text-sm text-muted-foreground">{pdfFile.name}</p>
                )}
            </div>

            <div className="grid gap-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label htmlFor="requestingDoctorName" className="mb-0">Nombre del Médico Solicitante</Label>
                    {canInviteRequester && (
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="shrink-0 sm:w-auto w-full"
                            onClick={() => setNewRequesterOpen(true)}
                        >
                            <UserPlus className="mr-2 h-4 w-4" />
                            Nuevo solicitante
                        </Button>
                    )}
                </div>
                {users.length === 0 ? (
                    <div className="rounded-md border border-dashed border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium">No hay médicos solicitantes disponibles</p>
                        <p className="mt-1 text-muted-foreground">
                            {canInviteRequester ? (
                                <>Usa &quot;Nuevo solicitante&quot; arriba o gestiona la lista en{' '}
                                <Link href="/dashboard/requesters" className="underline font-medium">Médicos Solicitantes</Link>.</>
                            ) : (
                                <>Agrega médicos en <Link href="/dashboard/requesters" className="underline font-medium">Médicos Solicitantes</Link> para poder asignar estudios.</>
                            )}
                        </p>
                    </div>
                ) : (
                    <Select
                        name="requestingDoctorName"
                        required
                        value={selectedRequesterId || undefined}
                        onValueChange={setSelectedRequesterId}
                    >
                        <SelectTrigger id="requestingDoctorName">
                            <SelectValue placeholder="Seleccionar médico solicitante" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                    {user.name} - {user.specialty || 'Médico'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            </div>

            <div className="grid gap-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Label htmlFor="patientName" className="mb-0">Nombre Completo del Paciente</Label>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 sm:w-auto w-full"
                        disabled={newPatientNeedsRequesterFirst}
                        onClick={() => setNewPatientOpen(true)}
                    >
                        <UserPlus className="mr-2 h-4 w-4" />
                        Nuevo paciente
                    </Button>
                </div>
                {newPatientNeedsRequesterFirst && (
                    <p className="text-xs text-muted-foreground">
                        Elige primero el médico solicitante; el paciente quedará asociado a él.
                    </p>
                )}
                <Select
                    name="patientName"
                    required
                    value={selectedPatientId || undefined}
                    onValueChange={setSelectedPatientId}
                >
                    <SelectTrigger id="patientName">
                        <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                        {patients.map((patient) => (
                            <SelectItem key={patient.id} value={patient.id}>
                                {patient.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Descripción / Borrador de Informe</Label>
                <div className="grid gap-2">
                    <Textarea name="description" id="description" placeholder="Describe el estudio o utiliza la IA para transcribir el audio del video..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
                    <Button type="button" variant="outline" onClick={handleTranscribe} disabled={isTranscribing || !videoFile}>
                        {isTranscribing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                        {isTranscribing ? 'Transcribiendo...' : 'Transcribir desde Video'}
                    </Button>
                </div>
            </div>
            
            <Button type="submit" disabled={isUploading} className="w-full">
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              {isUploading ? "Subiendo Video..." : "Guardar Estudio"}
            </Button>

            {/* Removed Alert since we handle success/error with toast notifications */}
        </form>
                </CardContent>
            </Card>

            <Dialog open={newPatientOpen} onOpenChange={setNewPatientOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Registrar paciente</DialogTitle>
                        <DialogDescription>
                            Los datos se guardan en tu cuenta. Nombre y teléfono son obligatorios; el resto es opcional.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreatePatient} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="newPatientName">Nombre completo</Label>
                            <Input id="newPatientName" name="newPatientName" placeholder="Ana María López" required />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="newPatientPhone">Teléfono</Label>
                            <PhoneInputWithCountry
                                id="newPatientPhone"
                                name="newPatientPhone"
                                placeholder="341 203-3382"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="newPatientDni">DNI (opcional)</Label>
                                <Input id="newPatientDni" name="newPatientDni" placeholder="12345678" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="newPatientDob">Fecha de nac. (opcional)</Label>
                                <Input id="newPatientDob" name="newPatientDob" type="date" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="newPatientEmail">Email (opcional)</Label>
                            <Input id="newPatientEmail" name="newPatientEmail" type="email" placeholder="paciente@ejemplo.com" />
                        </div>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setNewPatientOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={savingPatient}>
                                {savingPatient ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                Guardar paciente
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={newRequesterOpen}
                onOpenChange={(open) => {
                    setNewRequesterOpen(open);
                    if (!open) {
                        setInviteSpecialty('');
                    }
                }}
            >
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nuevo médico solicitante</DialogTitle>
                        <DialogDescription>
                            {requesterQuickMode
                                ? 'Solo necesitas el WhatsApp. El médico podrá completar su perfil después.'
                                : 'Invitación completa: el médico recibirá un email para activar su cuenta.'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mb-2">
                        <Button
                            type="button"
                            variant="link"
                            className="h-auto p-0 text-sm"
                            onClick={() => setRequesterQuickMode((q) => !q)}
                        >
                            {requesterQuickMode ? 'Usar formulario completo (email)' : 'Solo teléfono (alta rápida)'}
                        </Button>
                    </div>
                    <form onSubmit={handleInviteRequester} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="invitePhone">Teléfono (WhatsApp)</Label>
                            <PhoneInputWithCountry
                                id="invitePhone"
                                name="invitePhone"
                                placeholder="9 336 451-3355"
                                required
                            />
                        </div>
                        {!requesterQuickMode && (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="inviteName">Nombre completo</Label>
                                    <Input id="inviteName" name="inviteName" placeholder="Dr. Juan Pérez" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="inviteEmail">Email</Label>
                                    <Input id="inviteEmail" name="inviteEmail" type="email" placeholder="jperez@hospital.com" required />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="inviteSpecialty">Especialidad</Label>
                                    <Select value={inviteSpecialty} onValueChange={setInviteSpecialty} required>
                                        <SelectTrigger id="inviteSpecialty">
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
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button type="button" variant="outline" onClick={() => setNewRequesterOpen(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={savingRequester}>
                                {savingRequester ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : null}
                                {requesterQuickMode ? 'Registrar' : 'Invitar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
