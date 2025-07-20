import { redirect } from "next/navigation";

export default function AdminPage() {
    // Redirect to the users page by default
    redirect('/admin/users');
}
