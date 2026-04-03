"use client";

import Link from "next/link";
import {
  BarChart3,
  CreditCard,
  Database,
  FileText,
  Gift,
  Home,
  Link2,
  ListOrdered,
  Mail,
  Receipt,
  Syringe,
  UserPlus,
  Users,
  Webhook,
} from "lucide-react";
import Logo from "@/components/logo";
import { SidebarNavLink } from "@/components/sidebar-nav-link";

export function AdminSidebar() {
  return (
    <div className="hidden border-r bg-muted/40 md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link
            href="/admin"
            className="flex items-center gap-2 font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md"
            prefetch={false}
          >
            <Logo />
            <span className="text-sm text-muted-foreground">(Admin)</span>
          </Link>
        </div>
        <div className="flex-1">
          <nav className="grid items-start px-2 lg:px-4">
            <SidebarNavLink href="/admin" prefetch={false}>
              <Home className="h-4 w-4" />
              Panel admin
            </SidebarNavLink>
            <SidebarNavLink href="/dashboard" prefetch={false}>
              <BarChart3 className="h-4 w-4" />
              Panel principal
            </SidebarNavLink>
            <SidebarNavLink href="/admin/users" prefetch={false}>
              <Users className="h-4 w-4" />
              Usuarios
            </SidebarNavLink>
            <SidebarNavLink href="/admin/pricing" prefetch={false}>
              <CreditCard className="h-4 w-4" />
              Facturación
            </SidebarNavLink>
            <SidebarNavLink href="/admin/suscripciones" prefetch={false}>
              <Receipt className="h-4 w-4" />
              Suscripciones
            </SidebarNavLink>
            <SidebarNavLink href="/admin/envios-prueba" prefetch={false}>
              <Gift className="h-4 w-4" />
              Envíos de prueba
            </SidebarNavLink>
            <SidebarNavLink href="/dashboard/operators" prefetch={false}>
              <UserPlus className="h-4 w-4" />
              Médicos operadores
            </SidebarNavLink>
            <SidebarNavLink href="/dashboard/patients" prefetch={false}>
              <Syringe className="h-4 w-4" />
              Pacientes
            </SidebarNavLink>
            <SidebarNavLink href="/dashboard/studies" prefetch={false}>
              <FileText className="h-4 w-4" />
              Estudios
            </SidebarNavLink>
            <SidebarNavLink href="/admin/links-publicos" prefetch={false}>
              <Link2 className="h-4 w-4" />
              Links públicos
            </SidebarNavLink>
            <SidebarNavLink href="/admin/backups" prefetch={false}>
              <Database className="h-4 w-4" />
              Copias de seguridad
            </SidebarNavLink>
            <SidebarNavLink href="/admin/trigger-mail-test" prefetch={false}>
              <Mail className="h-4 w-4" />
              Probar envío de correo
            </SidebarNavLink>
            <SidebarNavLink href="/admin/actividad" prefetch={false}>
              <ListOrdered className="h-4 w-4" />
              Actividad
            </SidebarNavLink>
            <SidebarNavLink href="/admin/soporte" prefetch={false}>
              <Webhook className="h-4 w-4" />
              Soporte / errores
            </SidebarNavLink>
          </nav>
        </div>
      </div>
    </div>
  );
}
