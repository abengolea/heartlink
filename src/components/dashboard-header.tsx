"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CircleUser, CreditCard, Database, FileText, Home, Link2, ListOrdered, Mail, Menu, Shield, Syringe, Users, Webhook } from "lucide-react";

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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import Logo from "./logo";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const baseNavItems = [
    { href: "/dashboard", label: "Panel de control" },
    { href: "/dashboard/patients", label: "Pacientes" },
    { href: "/dashboard/doctors", label: "Médicos" },
    { href: "/dashboard/studies", label: "Estudios" },
];
const operatorNavItem = { href: "/dashboard/whatsapp-upload", label: "Subir por WhatsApp" };

const adminNavItems = [
    { href: "/admin", label: "Admin", icon: Shield },
    { href: "/dashboard", label: "Panel Principal", icon: Home },
    { href: "/admin/users", label: "Usuarios", icon: Users },
    { href: "/admin/pricing", label: "Facturación", icon: CreditCard },
    { href: "/dashboard/patients", label: "Pacientes", icon: Syringe },
    { href: "/dashboard/studies", label: "Estudios", icon: FileText },
    { href: "/admin/links-publicos", label: "Links Públicos", icon: Link2 },
    { href: "/admin/backups", label: "Copias de Seguridad", icon: Database },
    { href: "/admin/trigger-mail-test", label: "Probar Trigger Mail", icon: Mail },
    { href: "/admin/actividad", label: "Actividad", icon: ListOrdered },
    { href: "/admin/soporte", label: "Soporte / Errores", icon: Webhook },
];

const roleLabels: Record<string, string> = {
  admin: "Admin",
  operator: "Operador",
  solicitante: "Solicitante",
  medico_solicitante: "Médico Solicitante",
};

export function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, dbUser } = useAuth();
  const isAdminSection = pathname.startsWith('/admin');
  const roleLabel = dbUser?.role ? roleLabels[dbUser.role] ?? dbUser.role : null;
  const isOperator =
    dbUser?.role === "operator" ||
    dbUser?.role === "admin";
  const navItems = isOperator
    ? [...baseNavItems, operatorNavItem]
    : baseNavItems;

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };
  
  return (
    <header className="flex h-14 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 lg:h-[60px] lg:px-6 shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col w-[min(100vw-2rem,320px)]">
          <SheetHeader>
            <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-2 text-lg font-medium overflow-y-auto">
            <Link href={isAdminSection ? "/admin" : "/dashboard"} className="flex items-center gap-2 text-lg font-semibold mb-4 shrink-0" prefetch={false}>
              <Logo />
              {isAdminSection && <span className="text-sm text-muted-foreground">(Admin)</span>}
            </Link>
            {(isAdminSection ? adminNavItems : navItems).map((item) => {
              const Icon = 'icon' in item ? (item as { icon: React.ComponentType<{ className?: string }> }).icon : null;
              const isActive = (item.href === '/dashboard' && pathname === '/dashboard') || (item.href === '/admin' && pathname === '/admin') || ((item.href !== '/dashboard' && item.href !== '/admin') && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2.5 text-muted-foreground hover:text-foreground",
                    isActive && "bg-muted text-foreground"
                  )}
                  prefetch={false}
                >
                  {Icon && <Icon className="h-5 w-5 shrink-0" />}
                  <span className="truncate">{item.label}</span>
                </Link>
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
              "Mi Cuenta"
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/dashboard/configuracion" prefetch={false}>Configuración</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/soporte" prefetch={false}>Soporte</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Cerrar Sesión
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
