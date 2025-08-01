"use client";

import Link from "next/link";
import { CircleUser, Menu, Package2, Shield, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
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

const navItems = [
    { href: "/dashboard", label: "Panel de control" },
    { href: "/dashboard/patients", label: "Pacientes" },
    { href: "/dashboard/requesters", label: "Médicos Solicitantes" },
    { href: "/dashboard/studies", label: "Estudios" },
    { href: "/dashboard/whatsapp-upload", label: "Subir por WhatsApp" },
];

export function DashboardHeader() {
  const pathname = usePathname();
  const isAdminSection = pathname.startsWith('/admin');
  
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 lg:h-[60px] lg:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col">
          <SheetHeader>
            <SheetTitle className="sr-only">Menú de Navegación</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-2 text-lg font-medium">
            <Link href="#" className="flex items-center gap-2 text-lg font-semibold mb-4" prefetch={false}>
              <Logo />
              {isAdminSection && <span className="text-sm text-muted-foreground">(Admin)</span>}
            </Link>
            {navItems.map((item) => (
                <Link
                key={item.href}
                href={item.href}
                className={cn(
                    "mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground",
                    pathname.startsWith(item.href) && item.href !== '/dashboard' && "bg-muted text-foreground",
                    pathname === '/dashboard' && item.href === '/dashboard' && "bg-muted text-foreground"
                )}
                prefetch={false}
                >
                {item.label}
                </Link>
            ))}
             {isAdminSection && (
              <Link
                href="/admin"
                className="mx-[-0.65rem] flex items-center gap-4 rounded-xl px-3 py-2 text-muted-foreground hover:text-foreground bg-muted text-foreground"
                prefetch={false}
              >
                <Shield className="h-5 w-5" />
                Admin
              </Link>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <div className="w-full flex-1">
        {/* Can be used for breadcrumbs or page title */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="icon" className="rounded-full">
            <CircleUser className="h-5 w-5" />
            <span className="sr-only">Toggle user menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Configuración</DropdownMenuItem>
          <DropdownMenuItem>Soporte</DropdownMenuItem>
          <DropdownMenuSeparator />
           <DropdownMenuItem asChild>
            <Link href="/" prefetch={false}>Cerrar Sesión</Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
