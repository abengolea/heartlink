"use client";

import * as React from "react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CircleUser,
  CreditCard,
  Database,
  FileText,
  Gift,
  Home,
  Link2,
  ListOrdered,
  Mail,
  Menu,
  Receipt,
  Settings,
  Stethoscope,
  Syringe,
  Upload,
  UserPlus,
  Users,
  Webhook,
  Workflow,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import Logo from "./logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { isNavActive } from "@/lib/nav-active";

type MobileNavItem = { href: string; label: string; icon: LucideIcon };

const adminMobileNavItems: MobileNavItem[] = [
  { href: "/admin", label: "Panel admin", icon: Home },
  { href: "/dashboard", label: "Panel principal", icon: BarChart3 },
  { href: "/admin/users", label: "Usuarios", icon: Users },
  { href: "/admin/pricing", label: "Facturación", icon: CreditCard },
  { href: "/admin/suscripciones", label: "Suscripciones", icon: Receipt },
  { href: "/admin/envios-prueba", label: "Envíos de prueba", icon: Gift },
  { href: "/dashboard/operators", label: "Médicos operadores", icon: UserPlus },
  { href: "/dashboard/patients", label: "Pacientes", icon: Syringe },
  { href: "/dashboard/studies", label: "Estudios", icon: FileText },
  { href: "/admin/links-publicos", label: "Links públicos", icon: Link2 },
  { href: "/admin/backups", label: "Copias de seguridad", icon: Database },
  { href: "/admin/trigger-mail-test", label: "Probar envío de correo", icon: Mail },
  { href: "/admin/actividad", label: "Actividad", icon: ListOrdered },
  { href: "/admin/soporte", label: "Soporte / errores", icon: Webhook },
];

function buildDashboardMobileNav(role: string | undefined): MobileNavItem[] {
  const isOperator = role === "operator";
  const items: MobileNavItem[] = [
    { href: "/dashboard", label: "Panel de control", icon: Home },
    { href: "/dashboard/patients", label: "Pacientes", icon: Users },
  ];
  if (isOperator) {
    items.push(
      { href: "/dashboard/requesters", label: "Médicos Solicitantes", icon: Stethoscope },
      { href: "/dashboard/studies", label: "Estudios", icon: FileText },
      { href: "/dashboard/studies/upload", label: "Subir estudio", icon: Upload },
      { href: "/dashboard/whatsapp-upload", label: "Subir por WhatsApp", icon: Workflow },
      { href: "/dashboard/subscription", label: "Suscripción", icon: CreditCard },
    );
  } else {
    items.push(
      { href: "/dashboard/doctors", label: "Médicos", icon: Stethoscope },
      { href: "/dashboard/studies", label: "Estudios", icon: FileText },
    );
  }
  items.push({ href: "/dashboard/configuracion", label: "Configuración", icon: Settings });
  return items;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  operator: "Operador",
  solicitante: "Solicitante",
  medico_solicitante: "Médico solicitante",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, dbUser } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  React.useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const isAdminSection = pathname.startsWith("/admin");
  const roleLabel = dbUser?.role ? roleLabels[dbUser.role] ?? dbUser.role : null;
  const isAdminUser = dbUser?.role === "admin";

  const sheetNavItems: MobileNavItem[] =
    isAdminUser || isAdminSection ? adminMobileNavItems : buildDashboardMobileNav(dbUser?.role);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const sheetLogoHref = isAdminUser || isAdminSection ? "/admin" : "/dashboard";

  return (
    <header className="flex h-14 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 lg:h-[60px] lg:px-6 shrink-0">
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Abrir menú de navegación</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-[min(100vw-2rem,320px)]">
          <SheetHeader>
            <SheetTitle className="sr-only">Menú de navegación</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-2 text-lg font-medium overflow-y-auto">
            <SheetClose asChild>
              <Link
                href={sheetLogoHref}
                className="flex items-center gap-2 text-lg font-semibold mb-4 shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                prefetch={false}
              >
                <Logo />
                {(isAdminUser || isAdminSection) && (
                  <span className="text-sm text-muted-foreground">(Admin)</span>
                )}
              </Link>
            </SheetClose>
            {sheetNavItems.map((item) => {
              const active = isNavActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      active && "bg-muted text-foreground font-medium",
                    )}
                    prefetch={false}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        {/* Can be used for breadcrumbs or page title */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" className="rounded-full gap-2 pl-2 pr-3">
            <CircleUser className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline text-left max-w-[140px] truncate">
              {dbUser?.name ? (
                <>
                  <span className="font-medium block truncate">{dbUser.name}</span>
                  {roleLabel && (
                    <span className="text-xs text-muted-foreground block truncate">{roleLabel}</span>
                  )}
                </>
              ) : (
                <span className="text-muted-foreground">Usuario</span>
              )}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {dbUser?.name ? (
              <div>
                <p className="font-medium">{dbUser.name}</p>
                {roleLabel && <p className="text-xs text-muted-foreground font-normal">{roleLabel}</p>}
              </div>
            ) : (
              "Mi cuenta"
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/configuracion" prefetch={false}>
              Configuración
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/soporte" prefetch={false}>
              Soporte
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Cerrar sesión</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
