
"use client";

import { useRef, useState, useEffect } from "react";
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
// Remove server-side Firestore imports from client component
import { CheckCircle, Loader2, UploadCloud, Wand2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudioAction } from "@/actions/transcribe-audio";
import { Progress } from "@/components/ui/progress";
import { ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from "@/lib/upload-constants";
import { useAuth } from "@/contexts/auth-context";
import { fetchWithAuth } from "@/lib/fetch-with-auth";

// Removed initialUploadState since we don't use useActionState anymore

export function UploadStudyForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const router = useRouter();
    const { toast } = useToast();
    const { dbUser } = useAuth();
    
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);
    const [selectedPatientName, setSelectedPatientName] = useState<string>('');
    const [selectedRequestingDoctorName, setSelectedRequestingDoctorName] = useState<string>('');

    // Removed useEffect since we handle success/error in direct server action call

    // Load doctors (operadores: vinculados + disponibles; admin/solicitante: según API) y pacientes
    useEffect(() => {
        async function loadData() {
            try {
                const [doctorsRes, availableRes, patientsRes] = await Promise.all([
                    fetchWithAuth('/api/operators/me/doctors'),
                    fetchWithAuth('/api/operators/me/doctors/available').catch(() => ({ ok: false })),
                    fetchWithAuth('/api/patients')
                ]);
                if (doctorsRes.ok && patientsRes.ok) {
                    const [linkedDoctors, patientsData] = await Promise.all([
                        doctorsRes.json(),
                        patientsRes.json()
                    ]);
                    let doctorsList = Array.isArray(linkedDoctors) ? linkedDoctors : [];
                    let available: any[] = [];
                    if (availableRes?.ok) {
                        try {
                            const data = await availableRes.json();
                            available = Array.isArray(data) ? data : [];
                        } catch {
                            available = [];
                        }
                    }
                    // Combinar vinculados + disponibles (sin duplicados) para que el dropdown siempre tenga opciones
                    if (doctorsList.length === 0 && available.length > 0) {
                        doctorsList = available;
                    } else if (doctorsList.length > 0 && available.length > 0) {
                        const linkedIds = new Set(doctorsList.map((d: { id: string }) => d.id));
                        const extra = available.filter((d: { id: string }) => !linkedIds.has(d.id));
                        doctorsList = [...doctorsList, ...extra].sort((a: { name?: string }, b: { name?: string }) => (a.name || '').localeCompare(b.name || ''));
                    }
                    setUsers(doctorsList.filter((u: { id?: string; name?: string }) => u?.id && u?.name));
                    setPatients(patientsData);
                } else {
                    throw new Error('Failed to load data from API');
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Error al cargar datos.'
                });
                setUsers([]);
                setPatients([]);
            }
        }
        loadData();
    }, [toast]);

    const requesters = users;

    // Removed useEffect for state since we handle success/error directly in server action call

    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log(`Selected video file: ${file.name}, size: ${file.size}, type: ${file.type}`);
            
            // Validate file type
            if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
                toast({
                    variant: 'destructive',
                    title: 'Tipo de archivo no válido',
                    description: 'Solo se permiten archivos de video (MP4, WEBM, AVI, MOV).',
                });
                event.target.value = '';
                return;
            }
            
            // Validate file size
            if (file.size > MAX_FILE_SIZE) {
                toast({
                    variant: 'destructive',
                    title: 'Archivo demasiado grande',
                    description: 'El tamaño máximo permitido es 100MB.',
                });
                event.target.value = '';
                return;
            }
            
            setVideoFile(file);
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

    const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        
        if (!videoFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona un video.' });
            return;
        }
        if (!selectedPatientName || !selectedRequestingDoctorName) {
            toast({ variant: 'destructive', title: 'Error', description: 'Por favor, selecciona paciente y médico solicitante.' });
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
            formData.append('patientName', selectedPatientName);
            formData.append('requestingDoctorName', selectedRequestingDoctorName);
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
                <Label htmlFor="video">Video del Estudio (MP4, WEBM)</Label>
                <Input id="video" name="video" type="file" accept="video/mp4,video/webm,video/avi,video/mov" required onChange={handleVideoChange}/>
                {isUploading && <Progress value={uploadProgress} className="w-full mt-2" />}
                {uploadProgress === 100 && !isUploading && (
                     <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Video subido exitosamente. Haz clic en "Guardar Estudio".</span>
                    </div>
                )}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="patientName">Nombre Completo del Paciente</Label>
                <Select name="patientName" required value={selectedPatientName || undefined} onValueChange={setSelectedPatientName}>
                    <SelectTrigger id="patientName">
                        <SelectValue placeholder="Seleccionar paciente" />
                    </SelectTrigger>
                    <SelectContent>
                        {patients.map(patient => (
                            <SelectItem key={patient.id} value={patient.name}>
                                {patient.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="requestingDoctorName">Nombre del Médico Solicitante</Label>
                {users.length === 0 ? (
                    <div className="rounded-md border border-dashed border-amber-500/50 bg-amber-50 dark:bg-amber-950/20 p-4 text-sm text-amber-800 dark:text-amber-200">
                        <p className="font-medium">No hay médicos solicitantes disponibles</p>
                        <p className="mt-1 text-muted-foreground">
                            Agrega médicos en <Link href="/dashboard/requesters" className="underline font-medium">Médicos Solicitantes</Link> para poder asignar estudios.
                        </p>
                    </div>
                ) : (
                    <Select name="requestingDoctorName" required value={selectedRequestingDoctorName || undefined} onValueChange={setSelectedRequestingDoctorName}>
                        <SelectTrigger id="requestingDoctorName">
                            <SelectValue placeholder="Seleccionar médico solicitante" />
                        </SelectTrigger>
                        <SelectContent>
                            {users.map(user => (
                                <SelectItem key={user.id} value={user.name}>
                                    {user.name} - {user.specialty || 'Médico'}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
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
        </div>
    );
}
