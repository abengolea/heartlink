"use client";

import { useFormState, useFormStatus } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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


const formSchema = z.object({
  video: z.instanceof(File).refine(file => file.size > 0, "Se requiere un archivo de video."),
  patientName: z.string().min(1, "El nombre del paciente es obligatorio."),
  requestingDoctorName: z.string().min(1, "El nombre del médico solicitante es obligatorio."),
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

export function WhatsappUploadForm() {
    const [videoDataUri, setVideoDataUri] = useState('');
    const formRef = useRef<HTMLFormElement>(null);

    const { register, handleSubmit, formState: { errors }, watch } = useForm<FormFields>({
        resolver: zodResolver(formSchema),
    });
    
    const [state, formAction] = useFormState(submitWhatsappStudy, {
        status: "idle",
        message: "",
    });

    const videoFile = watch("video");

    useEffect(() => {
        if(videoFile && videoFile.length > 0) {
            const file = videoFile[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if(e.target?.result) {
                    setVideoDataUri(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        } else {
            setVideoDataUri('');
        }
    }, [videoFile]);
    
    const onFormSubmit = (data: FormFields) => {
        if(!videoDataUri) {
            // This should be caught by zod validation, but as a fallback
            console.error("No hay datos de URI de video disponibles");
            return;
        }

        const formData = new FormData();
        formData.append('video', data.video);
        formData.append('patientName', data.patientName);
        formData.append('requestingDoctorName', data.requestingDoctorName);
        formData.append('videoDataUri', videoDataUri);
        
        formAction(formData);
    };

    useEffect(() => {
        if (state.status === 'success') {
            formRef.current?.reset();
            setVideoDataUri('');
        }
    }, [state.status]);

  return (
    <form ref={formRef} onSubmit={handleSubmit(onFormSubmit)} className="grid gap-6">
        <div className="grid gap-2">
            <Label htmlFor="video">Video del Estudio (MP4)</Label>
            <Input id="video" type="file" accept="video/mp4" {...register('video')} />
            {errors.video && <p className="text-sm text-destructive">{errors.video.message}</p>}
        </div>
       
        <div className="grid gap-2">
            <Label htmlFor="patientName">Nombre Completo del Paciente</Label>
            <Input id="patientName" placeholder="Ej., Juan Pérez" {...register('patientName')} />
            {errors.patientName && <p className="text-sm text-destructive">{errors.patientName.message}</p>}
        </div>

        <div className="grid gap-2">
            <Label htmlFor="requestingDoctorName">Nombre del Médico Solicitante</Label>
            <Input id="requestingDoctorName" placeholder="Ej., Dra. Ellie Sattler" {...register('requestingDoctorName')} />
            {errors.requestingDoctorName && <p className="text-sm text-destructive">{errors.requestingDoctorName.message}</p>}
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
                </Aler
tDescription>
            </Alert>
        )}
    </form>
  );
}
