
"use client";

import { useRef, useState, useActionState, useEffect } from "react";
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


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UploadCloud className="mr-2 h-4 w-4" />
      )}
      {pending ? "Guardando..." : "Guardar Estudio"}
    </Button>
  );
}

const initialUploadState = {
  status: 'idle' as 'idle' | 'success' | 'error',
  message: '',
  data: null as any,
};

export function UploadStudyForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(uploadStudy, initialUploadState);
    
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [filePath, setFilePath] = useState<string | null>(null);
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
            formRef.current?.reset();
            setVideoFile(null);
            setFilePath(null);
            setDescription('');
            setUploadProgress(0);
        } else if (state.status === 'error') {
            toast({
                variant: 'destructive',
                title: 'Error al guardar',
                description: state.message,
            });
        }
    }, [state, toast]);

    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
            setFilePath(null); // Reset file path if a new file is selected
            setUploadProgress(0);
        } else {
            setVideoFile(null);
        }
    };
    
    const handleTranscribeFromVideo = async () => {
        if (!videoFile) {
            toast({
                variant: 'destructive',
                title: 'No se ha seleccionado ningún video',
                description: 'Por favor, selecciona un archivo de video para transcribir.',
            });
            return;
        }

        const reader = new FileReader();
        reader.onload = async (event) => {
            if (event.target?.result) {
                const dataUri = event.target.result as string;
                setIsTranscribing(true);
                 try {
                    const result = await transcribeAudioAction(dataUri);
                    if (result.status === 'success' && result.transcription) {
                        setDescription(result.transcription);
                        toast({
                            title: 'Transcripción completa',
                            description: 'El borrador del informe se ha rellenado con el texto del video.',
                        });
                    } else {
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

        setIsUploading(true);
        setUploadProgress(0);

        // 1. Get signed URL
        const getUrlFormData = new FormData();
        getUrlFormData.append('fileType', videoFile.type);
        getUrlFormData.append('fileName', videoFile.name);
        getUrlFormData.append('fileSize', videoFile.size.toString());

        const urlState = await generateUploadUrlAction(undefined as any, getUrlFormData);

        if (urlState.status !== 'success' || !urlState.uploadUrl || !urlState.filePath) {
            toast({ variant: 'destructive', title: 'Error', description: `No se pudo obtener la URL de subida: ${urlState.message}` });
            setIsUploading(false);
            return;
        }
        
        // 2. Upload file to signed URL
        const { uploadUrl, filePath: newFilePath } = urlState;

        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl, true);
        xhr.setRequestHeader('Content-Type', videoFile.type);
        
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                setUploadProgress(percentComplete);
            }
        };

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                setFilePath(newFilePath);
                setUploadProgress(100);
                toast({ title: "Subida Completa", description: "El video se ha subido correctamente." });
                
                // 3. Submit form to save metadata
                if(formRef.current) {
                    const formData = new FormData(formRef.current);
                    formData.append('filePath', newFilePath);
                    formAction(formData);
                }

            } else {
                toast({ variant: 'destructive', title: 'Error de Subida', description: `Error al subir el video: ${xhr.statusText}` });
            }
             setIsUploading(false);
        };

        xhr.onerror = () => {
            toast({ variant: 'destructive', title: 'Error de Red', description: 'No se pudo subir el video. Comprueba tu conexión.' });
            setIsUploading(false);
        };

        xhr.send(videoFile);
    }

    return (
        <form ref={formRef} onSubmit={handleFormSubmit} className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="video">Video del Estudio (MP4, WEBM)</Label>
                <Input id="video" name="video" type="file" accept="video/mp4,video/webm" required onChange={handleVideoFileChange}/>
                {isUploading && <Progress value={uploadProgress} className="w-full mt-2" />}
                {filePath && !isUploading && (
                     <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                        <CheckCircle className="h-4 w-4" />
                        <span>Video subido exitosamente.</span>
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
                    <Button type="button" variant="outline" onClick={handleTranscribeFromVideo} disabled={isTranscribing || !videoFile}>
                        {isTranscribing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                        {isTranscribing ? 'Transcribiendo...' : 'Transcribir desde Video'}
                    </Button>
                </div>
            </div>

            <SubmitButton />

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

