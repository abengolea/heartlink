
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { createStudy } from "@/actions/create-study";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState, useTransition } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, UploadCloud, Loader2, CheckCircle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { users, patients } from "@/lib/data";
import { transcribeAudioAction } from "@/actions/transcribe-audio";
import { AudioTranscriber } from "./audio-transcriber";

const formSchema = z.object({
  video: z.any().optional(),
  patientName: z.string().min(1, "El nombre del paciente es obligatorio."),
  requestingDoctorName: z.string().min(1, "El nombre del médico solicitante es obligatorio."),
  description: z.string().optional(),
});

type FormFields = z.infer<typeof formSchema>;

type State = {
    status: 'success' | 'error' | 'idle';
    message: string;
    data?: any;
}

export function UploadStudyForm() {
    const [videoDataUri, setVideoDataUri] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const requesters = users.filter(u => u.role === 'solicitante');
    const [isPending, startTransition] = useTransition();

    const [state, setState] = useState<State>({ status: 'idle', message: '' });


    const { register, handleSubmit, formState: { errors }, watch, reset, setValue, control } = useForm<FormFields>({
        resolver: zodResolver(formSchema),
    });
    
    const videoFile = watch("video");

    const handleTranscriptionResult = (transcription: string) => {
        setValue('description', transcription);
    };

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
    
    const onFormSubmit = (data: FormFields) => {
        const formData = new FormData();
        formData.append('patientName', data.patientName);
        formData.append('requestingDoctorName', data.requestingDoctorName);
        formData.append('description', data.description || '');
        formData.append('videoDataUri', videoDataUri);
        
        startTransition(async () => {
            const result = await createStudy(formData);
            setState(result);
            if (result.status === 'success') {
                reset();
                setVideoDataUri('');
                if(videoInputRef.current) {
                    videoInputRef.current.value = "";
                }
            }
        });
    };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="grid gap-6">
        <div className="grid gap-2">
            <Label htmlFor="video">Video del Estudio (MP4)</Label>
            <Input id="video" type="file" accept="video/mp4,video/webm" {...register('video')} ref={videoInputRef} onChange={handleVideoFileChange}/>
            {errors.video && <p className="text-sm text-destructive">{typeof errors.video.message === 'string' ? errors.video.message : ''}</p>}
        </div>
       
        <div className="grid gap-2">
            <Label htmlFor="patientName">Nombre Completo del Paciente</Label>
            <Controller
                control={control}
                name="patientName"
                render={({ field }) => (
                     <Select onValueChange={field.onChange} value={field.value ?? ''} >
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
                )}
            />
            {errors.patientName && <p className="text-sm text-destructive">{errors.patientName.message}</p>}
        </div>

        <div className="grid gap-2">
            <Label htmlFor="requestingDoctorName">Nombre del Médico Solicitante</Label>
             <Controller
                control={control}
                name="requestingDoctorName"
                render={({ field }) => (
                     <Select onValueChange={field.onChange} value={field.value ?? ''}>
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
                )}
            />
            {errors.requestingDoctorName && <p className="text-sm text-destructive">{errors.requestingDoctorName.message}</p>}
        </div>
      
        <div className="grid gap-2">
          <Label htmlFor="description">Descripción / Borrador de Informe</Label>
          <div className="grid gap-2">
             <Textarea id="description" placeholder="Graba un audio o sube un video para transcribir automáticamente el borrador del informe..." {...register('description')} rows={5} />
              <AudioTranscriber onTranscription={handleTranscriptionResult} disabled={isPending} />
          </div>
        </div>
      
        <Button type="submit" disabled={isPending || !videoDataUri} className="w-full">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
            {isPending ? "Subiendo..." : "Subir Estudio"}
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

