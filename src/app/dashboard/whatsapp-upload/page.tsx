"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappUploadForm } from "./whatsapp-upload-form";
import { MessageCircle, Video, List, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

export default function WhatsappUploadPage() {
    const router = useRouter();
    const { dbUser } = useAuth();
    const isOperator =
        dbUser?.role === "operator" ||
        dbUser?.role === "admin";

    useEffect(() => {
        if (dbUser && !isOperator) {
            router.replace("/dashboard");
        }
    }, [dbUser, isOperator, router]);

    if (!dbUser || !isOperator) {
        return (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
                Cargando...
            </div>
        );
    }

    return (
        <div className="mx-auto grid w-full max-w-4xl gap-6">
             <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Subir estudios por WhatsApp</h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Carga estudios enviando un video desde tu WhatsApp al número de HeartLink
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageCircle className="h-5 w-5" />
                        Cómo subir desde WhatsApp
                    </CardTitle>
                    <CardDescription>
                        Si eres operador, vincula tu número en{" "}
                        <Link href="/dashboard/configuracion" className="text-primary underline">
                            Configuración → Mi WhatsApp
                        </Link>
                        {" "}y luego:
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ol className="grid gap-3 list-decimal list-inside">
                        <li className="flex gap-2">
                            <Video className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>Envía un <strong>video del estudio</strong> al número de WhatsApp de HeartLink</span>
                        </li>
                        <li className="flex gap-2">
                            <List className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>Selecciona el <strong>paciente</strong> (o crea uno nuevo)</span>
                        </li>
                        <li className="flex gap-2">
                            <List className="h-4 w-4 mt-0.5 shrink-0" />
                            <span>Selecciona el <strong>médico solicitante</strong></span>
                        </li>
                        <li className="flex gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                            <span>El estudio se crea y el médico recibe el enlace por WhatsApp</span>
                        </li>
                    </ol>
                    <p className="text-sm text-muted-foreground">
                        Comandos: <strong>hola</strong> (iniciar), <strong>ayuda</strong> (instrucciones), <strong>cancelar</strong> (cancelar)
                    </p>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Simular subida (pruebas)</CardTitle>
                    <CardDescription>
                        Para probar sin WhatsApp: sube un video, indica paciente y médico.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <WhatsappUploadForm />
                </CardContent>
            </Card>
        </div>
    )
}
