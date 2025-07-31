
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
import { uploadStudy } from "@/actions/upload-study";
import { useToast } from "@/hooks/use-toast";
import { transcribeAudioAction } from "@/actions/transcribe-audio";


function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <UploadCloud className="mr-2 h-4 w-4" />
      )}
      {pending ? "Subiendo..." : "Subir Estudio"}
    </Button>
  );
}

const initialState = {
  status: 'idle' as 'idle' | 'success' | 'error',
  message: '',
  data: null as any,
};

export function UploadStudyForm() {
    const formRef = useRef<HTMLFormElement>(null);
    const [state, formAction] = useActionState(uploadStudy, initialState);
    
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [description, setDescription] = useState('');
    const requesters = users.filter(u => u.role === 'solicitante');
    const { toast } = useToast();

    useEffect(() => {
        if (state.status === 'success') {
            formRef.current?.reset();
            setVideoFile(null);
            setDescription('');
        }
    }, [state.status]);


    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVideoFile(file);
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


    return (
        <form ref={formRef} action={formAction} className="grid gap-6">
            <div className="grid gap-2">
                <Label htmlFor="video">Video del Estudio (MP4, WEBM)</Label>
                <Input id="video" name="video" type="file" accept="video/mp4,video/webm" required onChange={handleVideoFileChange}/>
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

            {state.status !== 'idle' && (
                <Alert variant={state.status === 'error' ? 'destructive' : 'default'} className={cn(state.status === 'success' && "bg-accent/50 border-accent")}>
                    {state.status === 'success' ? <CheckCircle className="h-4 w-4" /> : <Terminal className="h-4 w-4" />}
                    <AlertTitle>{state.status === 'error' ? 'Fallo en la Subida' : 'Subida Exitosa'}</AlertTitle>
                    <AlertDescription>
                        {state.message}
                        {state.status === 'success' && state.data?.studyId && (
                            <span className="block mt-2 font-code text-xs">ID del Estudio: {state.data.studyId}</span>
                        )}
                    </AlertDescription>
                </Alert>
            )}
        </form>
    );
}
