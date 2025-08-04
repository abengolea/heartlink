import { EditDoctorForm } from "./edit-doctor-form";

export default function EditDoctorPage({ params }: { params: { id: string } }) {
    return (
        <div className="mx-auto grid w-full max-w-2xl gap-4">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Editar Médico</h1>
            </div>
            <EditDoctorForm doctorId={params.id} />
        </div>
    );
}