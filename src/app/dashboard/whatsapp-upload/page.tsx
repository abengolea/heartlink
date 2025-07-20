import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappUploadForm } from "./whatsapp-upload-form";

export default function WhatsappUploadPage() {
    return (
        <div className="mx-auto grid w-full max-w-4xl gap-4">
             <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Subida de Estudios por WhatsApp</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Subida Automatizada de Estudios</CardTitle>
                    <CardDescription>
                        Simula la subida de un estudio a través de WhatsApp. El sistema utiliza IA para extraer los nombres del paciente y del médico,
                        subir el estudio y notificar al solicitante.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <WhatsappUploadForm />
                </CardContent>
            </Card>
        </div>
    )
}
