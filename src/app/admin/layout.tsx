import { DashboardHeader } from "@/components/dashboard-header";
import { AdminSidebar } from "@/components/admin-sidebar";
import AuthGuard from "@/components/auth-guard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requireAuth={true} allowedRoles={['admin']}>
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr] min-w-0">
      <AdminSidebar />
      <div className="flex flex-col min-w-0 overflow-x-hidden">
        <DashboardHeader />
        <main className="flex flex-1 flex-col gap-4 p-4 sm:p-4 lg:gap-6 lg:p-6 bg-background min-w-0">
          {children}
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
