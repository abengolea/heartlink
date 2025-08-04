import { NewRequesterForm } from "./new-requester-form";

export default function NewRequesterPage() {
    return (
        <div className="mx-auto grid w-full max-w-2xl gap-4">
            <div className="flex-1">
                <h1 className="font-semibold text-lg md:text-2xl">Agregar Nuevo Solicitante</h1>
            </div>
            <NewRequesterForm />
        </div>
    );
}