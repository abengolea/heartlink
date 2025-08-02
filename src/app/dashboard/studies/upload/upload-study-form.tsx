
"use client";

import { useRef, useState, useEffect } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { patients, users } from "@/lib/data";
import { cn } from "@/lib/utils";
import { CheckCircle, Loader2, Terminal, UploadCloud, Wand2 } from "lucide-react";
import { generateUploadUrlAction, uploadStudy } from "@/actions/upload-study";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudioAction } from "@/actions/transcribe-audio";
import { Progress } from "@/components/ui/progress";

const initialUploadState = {
  status: 'idle' as 'idle' | 'success' | 'error',
  message: '',
  data: null as any,
};

export function UploadStudyForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(uploadStudy, initialUploadState);
    
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [description, setDescription] = useState('');
    const requesters = users.filter(u => u.role === 'solicitante');
    const { toast } = useToast();

    useEffect(() => {
        if (state.status === 'success') {
            toast({
                title: 'Estudio Guardado',
                description: state.message,
            });
            // Reset form
            setVideoFile(null);
            setDescription('');
            setUploadProgress(0);
            formRef.current?.reset();
        } else if (state.status === 'error') {
            console.error('Upload error:', state.message);
            toast({
                variant: 'destructive',
                title: 'Error al Guardar',
                description: state.message,
            });
        }
    }, [state, toast]);

    const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            console.log(`Selected video file: ${file.name}, size: ${file.size}, type: ${file.type}`);
            
            // Validate file type
            const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/quicktime', 'video/x-msvideo'];
            if (!allowedTypes.includes(file.type)) {
                toast({
                    variant: 'destructive',
                    title: 'Tipo de archivo no válido',
                    description: 'Solo se permiten archivos de video (MP4, AVI, MOV).',
                });
                event.target.value = '';
                return;
            }
            
            // Validate file size (50MB limit)
            if (file.size > 50 * 1024 * 1024) {
                toast({
                    variant: 'destructive',
                    title: 'Archivo demasiado grande',
                    description: 'El tamaño máximo permitido es 50MB.',
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
                    
                    if (result.success && result.transcription) {
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

            // 2. Upload file directly to Firebase Storage
            console.log('Uploading file to Firebase Storage...');
            const xhr = new XMLHttpRequest();
            xhr.open('PUT', uploadUrl, true);
            xhr.setRequestHeader('Content-Type', videoFile.type);
            
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percentComplete = (event.loaded / event.total) * 100;
                    setUploadProgress(percentComplete);
                    console.log(`Upload progress: ${percentComplete.toFixed(1)}%`);
                }
            };

            xhr.onload = () => {
                setIsUploading(false);
                if (xhr.status >= 200 && xhr.status < 300) {
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
                        formRef.current.requestSubmit();
                    }
                } else {
                    console.error('Upload failed with status:', xhr.status, xhr.statusText);
                    throw new Error(`Error de subida: ${xhr.status} - ${xhr.statusText}`);
                }
            };

            xhr.onerror = () => {
                setIsUploading(false);
                console.error('Network error during upload');
                toast({ 
                    variant: 'destructive', 
                    title: "Error de Red", 
                    description: "Error de conexión durante la subida. Verifica tu conexión a internet." 
                });
            };

            xhr.send(videoFile);

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
        <form ref={formRef} onSubmit={handleFormSubmit} className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="video">Video del Estudio (MP4, WEBM)</Label>
                <Input id="video" name="video" type="file" accept="video/mp4,video/webm" required onChange={handleVideoChange}/>
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

             {state.status !== 'idle' && state.status !== 'success' && (
                <Alert variant={state.status === 'error' ? 'destructive' : 'default'} className={cn(state.status === 'success' && "bg-accent/50 border-accent")}>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>{state.status === 'error' ? 'Fallo al Guardar' : 'Información'}</AlertTitle>
                    <AlertDescription>
                        {state.message}
                    </AlertDescription>
                </Alert>
            )}
        </form>
    );
}
