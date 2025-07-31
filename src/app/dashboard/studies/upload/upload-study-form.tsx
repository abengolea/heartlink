
"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";

import { submitWhatsappStudy } from "@/actions/whatsapp-study-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, UploadCloud, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { users, patients } from "@/lib/data";
import { transcribeAudioAction } from "@/actions/transcribe-audio";


const formSchema = z.object({
  video: z.any().optional(),
  patientName: z.string().min(1, "El nombre del paciente es obligatorio."),
  requestingDoctorName: z.string().min(1, "El nombre del médico solicitante es obligatorio."),
  description: z.string().optional(),
});

type FormFields = z.infer<typeof formSchema>;

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
      {pending ? "Subiendo..." : "Subir Estudio"}
    </Button>
  );
}

export function UploadStudyForm() {
    const [videoDataUri, setVideoDataUri] = useState('');
    const [isTranscribing, setIsTranscribing] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const requesters = users.filter(u => u.role === 'solicitante');

    const { register, handleSubmit, formState: { errors }, watch, reset, setValue, control } = useForm<FormFields>({
        resolver: zodResolver(formSchema),
    });
    
    const [state, formAction] = useActionState(submitWhatsappStudy, {
        status: "idle",
        message: "",
    });

    const videoFile = watch("video");

    const handleTranscription = async (dataUri: string) => {
        if (!dataUri) return;
        setIsTranscribing(true);
        setValue('description', 'Transcribiendo audio del video...');
        try {
            const result = await transcribeAudioAction(dataUri);
            if (result.status === 'success' && result.transcription) {
                setValue('description', result.transcription);
            } else {
                console.error("Error de transcripción:", result.message);
                 setValue('description', `Error al transcribir: ${result.message}`);
            }
        } catch (error) {
            console.error("Error al transcribir:", error);
            const errorMessage = error instanceof Error ? error.message : "Error desconocido";
            setValue('description', `Error al transcribir: ${errorMessage}`);
        } finally {
            setIsTranscribing(false);
        }
    };


    useEffect(() => {
        if(videoFile && videoFile.length > 0) {
            const file = videoFile[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if(e.target?.result) {
                    const dataUri = e.target.result as string;
                    setVideoDataUri(dataUri);
                    handleTranscription(dataUri);
                }
            };
            reader.readAsDataURL(file);
        } else {
            setVideoDataUri('');
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [videoFile, setValue]);
    
    const onFormSubmit = (data: FormFields) => {
        const formData = new FormData();
        formData.append('patientName', data.patientName);
        formData.append('requestingDoctorName', data.requestingDoctorName);
        formData.append('videoDataUri', videoDataUri);
        
        formAction(formData);
    };

    useEffect(() => {
        if (state.status === 'success') {
            reset();
            setVideoDataUri('');
            if(videoInputRef.current) {
                videoInputRef.current.value = "";
            }
        }
    }, [state.status, reset]);

  return (
    <form ref={formRef} action={handleSubmit(onFormSubmit)} className="grid gap-6">
        <div className="grid gap-2">
            <Label htmlFor="video">Video del Estudio (MP4)</Label>
            <Input id="video" type="file" accept="video/mp4" {...register('video')} ref={videoInputRef}/>
            {errors.video && <p className="text-sm text-destructive">{typeof errors.video.message === 'string' ? errors.video.message : ''}</p>}
        </div>
       
        <div className="grid gap-2">
            <Label htmlFor="patientName">Nombre Completo del Paciente</Label>
            <Controller
                control={control}
                name="patientName"
                render={({ field }) => (
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
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
          <div className="relative">
             <Textarea id="description" placeholder="Seleccione un video para transcribir automáticamente el audio..." {...register('description')} rows={5} readOnly={isTranscribing} />
             {isTranscribing && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-md">
                    <Loader2 className="mr-2 h-6 w-6 animate-spin text-primary" />
                    <span className="text-muted-foreground">Transcribiendo...</span>
                </div>
             )}
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
