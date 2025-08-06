
"use client";

import { useRef, useState, useEffect } from "react";
// Removed useActionState and useFormStatus imports since we call server action directly
import { useRouter } from "next/navigation";
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
import { generateUploadUrlAction, uploadStudy } from "@/actions/upload-study";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudioAction } from "@/actions/transcribe-audio";
import { Progress } from "@/components/ui/progress";
import { ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE, getUploadErrorMessage } from "@/lib/upload-constants";

// Removed initialUploadState since we don't use useActionState anymore

export function UploadStudyForm() {
    const formRef = useRef<HTMLFormElement>(null);
    // Calling uploadStudy directly instead of using useActionState
    const router = useRouter();
    const { toast } = useToast();
    
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [description, setDescription] = useState('');
    const [users, setUsers] = useState<any[]>([]);
    const [patients, setPatients] = useState<any[]>([]);

    // Removed useEffect since we handle success/error in direct server action call

    // Load users and patients from API endpoints
    useEffect(() => {
        async function loadData() {
            try {
                // Load data from API endpoints instead of direct Firestore
                const [usersResponse, patientsResponse] = await Promise.all([
                    fetch('/api/users'),
                    fetch('/api/patients')
                ]);
                
                if (usersResponse.ok && patientsResponse.ok) {
                    const usersData = await usersResponse.json();
                    const patientsData = await patientsResponse.json();
                    console.log('✅ Upload form loaded data:', { 
                        doctors: usersData.length, 
                        patients: patientsData.length,
                        doctorRoles: usersData.map(u => u.role)
                    });
                    setUsers(usersData);
                    setPatients(patientsData);
                } else {
                    console.error('❌ API failed:', { 
                        usersStatus: usersResponse.status, 
                        patientsStatus: patientsResponse.status 
                    });
                    throw new Error('Failed to load data from API');
                }
            } catch (error) {
                console.error('Error loading data:', error);
                toast({
                    variant: 'destructive',
                    title: 'Error',
                    description: 'Error al cargar datos. Usando datos predeterminados.'
                });
                // Fallback to hardcoded data
                setUsers([
                    { id: '1', name: 'Dr. Juan Carlos Martínez', email: 'jmartinez@hospital.com', role: 'Cardiólogo', phone: '+54 9 11 1234-5678' },
                    { id: '2', name: 'Dra. María Elena Rodríguez', email: 'mrodriguez@clinica.com', role: 'Cardióloga', phone: '+54 9 11 8765-4321' },
                    { id: '3', name: 'Dr. Carlos Alberto González', email: 'cgonzalez@hospital.com', role: 'Cardiólogo Intervencionista', phone: '+54 9 11 5555-1234' }
                ]);
                setPatients([
                    { id: '1', name: 'Ana María López', age: 45, gender: 'Femenino', phone: '+54 9 11 9999-1111' },
                    { id: '2', name: 'Roberto Carlos Fernández', age: 62, gender: 'Masculino', phone: '+54 9 11 8888-2222' },
                    { id: '3', name: 'Carmen Beatriz Silva', age: 38, gender: 'Femenino', phone: '+54 9 11 7777-3333' }
                ]);
            }
        }
        loadData();
    }, [toast]);

    // Filter doctors by medical specialties instead of 'solicitante'
    const requesters = users.filter(u => 
        u.role === 'solicitante' || 
        u.role === 'Cardiólogo' || 
        u.role === 'Cardióloga' || 
        u.role === 'Cardiólogo Intervencionista' ||
        u.role === 'Cardiólogo Pediatra' ||
        u.role === 'Electrofisiólogo'
    );

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

        if (isUploading) return;

        console.log('Starting upload process...');
        setIsUploading(true);
        setUploadProgress(0);

        try {
            // 1. Get signed URL from server action
            console.log('Getting signed upload URL...');
            const urlState = await generateUploadUrlAction(videoFile.type, videoFile.name, videoFile.size);

            if (!urlState.success || !urlState.uploadUrl || !urlState.filePath) {
                throw new Error(`No se pudo obtener la URL de subida: ${urlState.error}`);
            }
            
            const { uploadUrl, filePath } = urlState;
            console.log(`Got upload URL for file path: ${filePath}`);

            // 2. Upload file directly to Firebase Storage using fetch (more reliable than XMLHttpRequest)
            console.log('Uploading file to Firebase Storage with fetch...');
            
            try {
                const response = await fetch(uploadUrl, {
                    method: 'PUT',
                    body: videoFile,
                    headers: {
                        'Content-Type': videoFile.type,
                    },
                });

                setIsUploading(false);

                if (!response.ok) {
                    console.error('Upload failed with status:', response.status, response.statusText);
                    const errorText = await response.text();
                    const userFriendlyError = getUploadErrorMessage(response.status, errorText);
                    throw new Error(userFriendlyError);
                }

                console.log('File uploaded successfully to Firebase Storage');
                toast({ title: "Subida Completa", description: "El video se ha subido correctamente. Guardando detalles..." });
                
                if(formRef.current) {
                    // Add the filePath to the form data
                    const hiddenInput = document.createElement('input');
                    hiddenInput.type = 'hidden';
                    hiddenInput.name = 'filePath';
                    hiddenInput.value = filePath;
                    formRef.current.appendChild(hiddenInput);
                    
                    // Submit the form to save study details
                    console.log('Submitting form with file path:', filePath);
                    console.log('Form data before submit:', {
                        patientName: formRef.current.querySelector('[name="patientName"]')?.value,
                        requestingDoctorName: formRef.current.querySelector('[name="requestingDoctorName"]')?.value,
                        description: formRef.current.querySelector('[name="description"]')?.value,
                        filePath: filePath
                    });
                    
                    // Create FormData and call server action directly
                    const formData = new FormData(formRef.current);
                    console.log('🔍 Calling uploadStudy server action directly...');
                    
                    try {
                        const result = await uploadStudy(null, formData);
                        console.log('✅ Server action result:', result);
                        
                                                 if (result.status === 'success') {
                             toast({
                                 title: 'Estudio Guardado',
                                 description: result.message,
                             });
                             
                             // Reset form
                             setVideoFile(null);
                             setUploadProgress(0);
                             setIsUploading(false);
                             
                             // Redirect to study detail page if we have studyId
                             if (result.data?.studyId) {
                                 console.log('Redirecting to study detail:', result.data.studyId);
                                 setTimeout(() => {
                                     router.push(`/dashboard/studies/${result.data.studyId}`);
                                 }, 1500);
                             } else {
                                 // Fallback: redirect to studies list
                                 setTimeout(() => {
                                     router.push('/dashboard/studies');
                                 }, 1500);
                             }
                         } else {
                             throw new Error(result.message);
                         }
                                         } catch (serverActionError) {
                         console.error('❌ Server action error:', serverActionError);
                         setIsUploading(false);
                         toast({
                             variant: 'destructive',
                             title: 'Error',
                             description: `Error al guardar el estudio: ${serverActionError instanceof Error ? serverActionError.message : 'Error desconocido'}`
                         });
                     }
                }

            } catch (fetchError) {
                setIsUploading(false);
                console.error('Fetch upload error:', fetchError);
                toast({ 
                    variant: 'destructive', 
                    title: "Error de Subida", 
                    description: fetchError instanceof Error ? fetchError.message : 'Error desconocido durante la subida'
                });
                return;
            }

        } catch (error) {
            setIsUploading(false);
            console.error('Upload process error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido durante la subida';
            toast({ 
                variant: 'destructive', 
                title: "Error de Subida", 
                description: errorMessage
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
        <form ref={formRef} action={uploadStudy} onSubmit={handleFormSubmit} className="grid gap-6">
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
                <Select name="patientName" required>
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
                <Select name="requestingDoctorName" required>
                    <SelectTrigger id="requestingDoctorName">
                        <SelectValue placeholder="Seleccionar médico solicitante" />
                    </SelectTrigger>
                    <SelectContent>
                        {requesters.map(requester => (
                            <SelectItem key={requester.id} value={requester.name}>
                                {requester.name}
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
        </div>
    );
}
