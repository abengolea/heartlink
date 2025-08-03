import { NewDoctorForm } from "./new-doctor-form";

export default function NewDoctorPage() {
    return (
        <div className="mx-auto grid w-full max-w-2xl gap-4">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Agregar Nuevo Médico</h1>
            </div>
            <NewDoctorForm />
        </div>
    );
}