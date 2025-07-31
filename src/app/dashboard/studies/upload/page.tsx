
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadStudyForm } from "./upload-study-form";

export default function UploadStudyPage() {
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
                    <UploadStudyForm />
                </CardContent>
            </Card>
        </div>
    )
}
