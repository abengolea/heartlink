"use client";

import Link from "next/link";
import { CreditCard, FileText, Home, Settings, Stethoscope, Upload, Users, UserPlus, Workflow } from "lucide-react";
import Logo from "@/components/logo";
import { useAuth } from "@/contexts/auth-context";

export function DashboardSidebar() {
  const { dbUser } = useAuth();
  const isOperator =
    dbUser?.role === "operator" ||
    dbUser?.role === "medico_operador" ||
    dbUser?.role === "admin";
  const isAdmin = dbUser?.role === "admin";

  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold" prefetch={false}>
            <Logo />
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Home className="h-4 w-4" />
              Panel de control
            </Link>
            <Link
              href="/dashboard/patients"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Users className="h-4 w-4" />
              Pacientes
            </Link>
            {/* Admin ve ambos: Operadores y Solicitantes; Operadores solo Solicitantes; Solicitantes ven sus operadores */}
            {isAdmin && (
              <Link
                href="/dashboard/operators"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                prefetch={false}
              >
                <UserPlus className="h-4 w-4" />
                Médicos Operadores
              </Link>
            )}
            {isOperator ? (
              <Link
                href="/dashboard/requesters"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                prefetch={false}
              >
                <Stethoscope className="h-4 w-4" />
                Médicos Solicitantes
              </Link>
            ) : (
              <Link
                href="/dashboard/doctors"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                prefetch={false}
              >
                <Stethoscope className="h-4 w-4" />
                Médicos
              </Link>
            )}
            <Link
              href="/dashboard/studies"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <FileText className="h-4 w-4" />
              Estudios
            </Link>
            {isOperator && (
              <Link
                href="/dashboard/studies/upload"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                prefetch={false}
              >
                <Upload className="h-4 w-4" />
                Subir Estudio
              </Link>
            )}
            {isOperator && (
              <Link
                href="/dashboard/whatsapp-upload"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                prefetch={false}
              >
                <Workflow className="h-4 w-4" />
                Subir por WhatsApp
              </Link>
            )}
            <Link
              href="/dashboard/subscription"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <CreditCard className="h-4 w-4" />
              Suscripción
            </Link>
            <Link
              href="/dashboard/configuracion"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Settings className="h-4 w-4" />
              Configuración
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
