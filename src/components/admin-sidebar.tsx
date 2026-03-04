"use client";

import Link from "next/link";
import {
  BarChart3,
  CreditCard,
  Database,
  FileText,
  Home,
  Link2,
  ListOrdered,
  Mail,
  Receipt,
  Syringe,
  Users,
  Webhook,
} from "lucide-react";
import Logo from "@/components/logo";

export function AdminSidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-semibold"
            prefetch={false}
          >
            <Logo />
            <span className="text-sm text-muted-foreground">(Admin)</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Home className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <BarChart3 className="h-4 w-4" />
              Panel Principal
            </Link>
            <Link
              href="/admin/users"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Users className="h-4 w-4" />
              Usuarios
            </Link>
            <Link
              href="/admin/pricing"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <CreditCard className="h-4 w-4" />
              Facturación
            </Link>
            <Link
              href="/admin/suscripciones"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Receipt className="h-4 w-4" />
              Suscripciones
            </Link>
            <Link
              href="/dashboard/patients"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Syringe className="h-4 w-4" />
              Pacientes
            </Link>
            <Link
              href="/dashboard/studies"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <FileText className="h-4 w-4" />
              Estudios
            </Link>
            <Link
              href="/admin/links-publicos"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Link2 className="h-4 w-4" />
              Links Públicos
            </Link>
            <Link
              href="/admin/backups"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Database className="h-4 w-4" />
              Copias de Seguridad
            </Link>
            <Link
              href="/admin/trigger-mail-test"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Mail className="h-4 w-4" />
              Probar Trigger Mail
            </Link>
            <Link
              href="/admin/actividad"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <ListOrdered className="h-4 w-4" />
              Actividad
            </Link>
            <Link
              href="/admin/soporte"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
              prefetch={false}
            >
              <Webhook className="h-4 w-4" />
              Soporte / Errores
            </Link>
          </nav>
        </div>
      </div>
    </div>
  );
}
