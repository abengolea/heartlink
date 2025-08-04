import { EditPatientForm } from "./edit-patient-form";

export default function EditPatientPage({ params }: { params: { id: string } }) {
    return (
        <div className="mx-auto grid w-full max-w-2xl gap-4">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Editar Paciente</h1>
            </div>
            <EditPatientForm patientId={params.id} />
        </div>
    );
}