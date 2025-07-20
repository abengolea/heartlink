import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappUploadForm } from "./whatsapp-upload-form";

export default function WhatsappUploadPage() {
    return (
        <div className="mx-auto grid w-full max-w-4xl gap-4">
             <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">WhatsApp Study Upload</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Automated Study Upload</CardTitle>
                    <CardDescription>
                        Simulate uploading a study via WhatsApp. The system uses AI to extract patient and doctor names,
                        upload the study, and notify the requester.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <WhatsappUploadForm />
                </CardContent>
            </Card>
        </div>
    )
}
