"use client";

import { CreditCard, FileText, Home, Settings, Shield, Stethoscope, Upload, Users, UserPlus, Workflow } from "lucide-react";
import Logo from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";
import { AdminSidebar } from "@/components/admin-sidebar";
import { SidebarNavLink } from "@/components/sidebar-nav-link";
import Link from "next/link";

export function DashboardSidebar() {
  const { dbUser } = useAuth();

  if (dbUser?.role === "admin") {
    return <AdminSidebar />;
  }

  const isOperator =
    dbUser?.role === "operator" ||
    dbUser?.role === "admin";

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold" prefetch={false}>
            <Logo />
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 lg:px-4">
            <SidebarNavLink href="/dashboard" prefetch={false}>
              <Home className="h-4 w-4" />
              Panel de control
            </SidebarNavLink>
            <SidebarNavLink href="/dashboard/patients" prefetch={false}>
              <Users className="h-4 w-4" />
              Pacientes
            </SidebarNavLink>
            {isOperator ? (
              <SidebarNavLink href="/dashboard/requesters" prefetch={false}>
                <Stethoscope className="h-4 w-4" />
                Médicos Solicitantes
              </SidebarNavLink>
            ) : (
              <SidebarNavLink href="/dashboard/doctors" prefetch={false}>
                <Stethoscope className="h-4 w-4" />
                Médicos
              </SidebarNavLink>
            )}
            <SidebarNavLink href="/dashboard/studies" prefetch={false}>
              <FileText className="h-4 w-4" />
              Estudios
            </SidebarNavLink>
            {isOperator && (
              <SidebarNavLink href="/dashboard/studies/upload" prefetch={false}>
                <Upload className="h-4 w-4" />
                Subir Estudio
              </SidebarNavLink>
            )}
            {isOperator && (
              <SidebarNavLink href="/dashboard/whatsapp-upload" prefetch={false}>
                <Workflow className="h-4 w-4" />
                Subir por WhatsApp
              </SidebarNavLink>
            )}
            {dbUser?.role === 'operator' && (
              <SidebarNavLink href="/dashboard/subscription" prefetch={false}>
                <CreditCard className="h-4 w-4" />
                Suscripción
              </SidebarNavLink>
            )}
            <SidebarNavLink href="/dashboard/configuracion" prefetch={false}>
              <Settings className="h-4 w-4" />
              Configuración
            </SidebarNavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}
