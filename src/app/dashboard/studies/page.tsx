import Image from "next/image";
import { patients, studies } from "@/lib/data";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function StudiesPage() {
    const getPatientName = (patientId: string) => {
        return patients.find(p => p.id === patientId)?.name || "Paciente Desconocido";
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center">
                <div className="flex-1">
                    <h1 className="font-semibold text-lg md:text-2xl">Estudios</h1>
                </div>
                 <Button size="sm" className="h-8 gap-1" asChild>
                    <Link href="/dashboard/studies/upload">
                        <PlusCircle className="h-3.5 w-3.5" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Subir Estudio
                        </span>
                    </Link>
                </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
                {studies.map(study => (
                    <Card key={study.id}>
                        <CardHeader className="p-0">
                           <Image
                            src="https://placehold.co/600x400.png"
                            alt="Placeholder de video de estudio"
                            width={600}
                            height={400}
                            className="rounded-t-lg object-cover aspect-video"
                            data-ai-hint="heart ultrasound"
                           />
                        </CardHeader>
                        <CardContent className="p-4 grid gap-2">
                             {study.isUrgent ? (
                                <Badge variant="destructive" className="w-fit">Urgente</Badge>
                            ) : (
                                <Badge variant="outline" className="w-fit">Rutina</Badge>
                            )}
                            <CardTitle className="text-lg">{getPatientName(study.patientId)}</CardTitle>
                            <CardDescription>
                                {study.description}
                            </CardDescription>
                            <p className="text-sm text-muted-foreground">
                                {format(parseISO(study.date), "PPP")}
                            </p>
                        </CardContent>
                        <CardFooter className="p-4 pt-0">
                            <Button asChild size="sm" className="w-full gap-1">
                                <Link href={`/dashboard/studies/${study.id}`}>
                                Ver Estudio
                                <ArrowUpRight className="h-4 w-4" />
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
