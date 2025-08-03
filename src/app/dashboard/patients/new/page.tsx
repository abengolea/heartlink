import { NewPatientForm } from "./new-patient-form";

export default function NewPatientPage() {
    return (
        <div className="mx-auto grid w-full max-w-2xl gap-4">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Agregar Nuevo Paciente</h1>
            </div>
            <NewPatientForm />
        </div>
    );
}