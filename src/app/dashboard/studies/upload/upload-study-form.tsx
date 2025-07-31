
"use client";

import { z } from "zod";
import { submitStudy } from "@/actions/whatsapp-study-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRef, useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, UploadCloud, Loader2, CheckCircle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { users, patients } from "@/lib/data";
import { transcribeAudioAction } from "@/actions/transcribe-audio";
import { useToast } from "@/hooks/use-toast";

type State = {
    status: 'success' | 'error' | 'idle';
    message: string;
    data?: any;
}

export function UploadStudyForm() {
    const [videoDataUri, setVideoDataUri] = useState('');
    const [patientName, setPatientName] = useState('');
    const [requestingDoctorName, setRequestingDoctorName] = useState('');
    const [description, setDescription] = useState('');

    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const videoInputRef = useRef<HTMLInputElement>(null);
    const requesters = users.filter(u => u.role === 'solicitante');
    const { toast } = useToast();

    const [state, setState] = useState<State>({ status: 'idle', message: '' });
    
    const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                if (event.target?.result) {
                    const dataUri = event.target.result as string;
                    setVideoDataUri(dataUri);
                }
            };
            reader.readAsDataURL(file);
        } else {
            setVideoDataUri('');
        }
    };

    const handleTranscribeFromVideo = async () => {
        if (!videoDataUri) {
            toast({
                variant: 'destructive',
                title: 'No se ha seleccionado ningún video',
                description: 'Por favor, selecciona un archivo de video para transcribir.',
            });
            return;
        }
        setIsTranscribing(true);
        try {
            const result = await transcribeAudioAction(videoDataUri);
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
    };
    
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        if (!videoDataUri || !patientName || !requestingDoctorName) {
            setState({ status: 'error', message: 'Por favor, completa todos los campos requeridos.' });
            return;
        }

        const formData = new FormData();
        formData.append('patientName', patientName);
        formData.append('requestingDoctorName', requestingDoctorName);
        formData.append('description', description);
        formData.append('videoDataUri', videoDataUri);
        
        setIsSubmitting(true);
        setState({ status: 'idle', message: '' });
        
        const result = await submitStudy(formData);
        setState(result);
        
        if (result.status === 'success') {
            setVideoDataUri('');
            setPatientName('');
            setRequestingDoctorName('');
            setDescription('');
            if(videoInputRef.current) {
                videoInputRef.current.value = "";
            }
        }
        setIsSubmitting(false);
    };

  return (
    <form onSubmit={handleFormSubmit} className="grid gap-6">
        <div className="grid gap-2">
            <Label htmlFor="video">Video del Estudio (MP4, WEBM)</Label>
            <Input id="video" type="file" accept="video/mp4,video/webm" ref={videoInputRef} onChange={handleVideoFileChange}/>
        </div>
       
        <div className="grid gap-2">
            <Label htmlFor="patientName">Nombre Completo del Paciente</Label>
             <Select onValueChange={setPatientName} value={patientName} >
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
             <Select onValueChange={setRequestingDoctorName} value={requestingDoctorName}>
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
             <Textarea id="description" placeholder="Describe el estudio o utiliza la IA para transcribir el audio del video..." value={description} onChange={(e) => setDescription(e.target.value)} rows={5} />
              <Button type="button" variant="outline" onClick={handleTranscribeFromVideo} disabled={isTranscribing || isSubmitting || !videoDataUri}>
                  {isTranscribing ? <Loader2 className="mr-2 animate-spin" /> : <Wand2 className="mr-2" />}
                  {isTranscribing ? 'Transcribiendo...' : 'Transcribir desde Video'}
              </Button>
          </div>
        </div>
      
        <Button type="submit" disabled={isSubmitting || !videoDataUri} className="w-full">
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {isSubmitting ? "Subiendo..." : "Subir Estudio"}
        </Button>

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
