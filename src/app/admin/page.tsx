"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Activity,
  BarChart3,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileText,
  Gift,
  MessageSquare,
  RefreshCw,
  Stethoscope,
  Syringe,
  Users,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toast } from "sonner";

interface AdminStats {
  subscribers: number;
  paying: number;
  whatsappMessagesSent: number | null;
  whatsappAvgPerOperator: number | null;
  whatsappOperatorsWithSends: number | null;
  whatsappEstimatedCost: number | null;
  patients: number;
  studies: number;
  users: number;
  operators: number;
  solicitantes: number;
  medicosSolicitantes: number;
  admins: number;
  totalPaymentsApproved: number;
  revenue: number;
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent,
  href,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  accent?: "green" | "blue" | "amber" | "violet";
  href?: string;
}) {
  const accentClasses = {
    green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    violet: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  };
  const c = accent ? accentClasses[accent] : "bg-muted text-muted-foreground";

  const card = (
    <Card
      className={cn(
        href &&
          "transition-all hover:border-primary/50 hover:shadow-md cursor-pointer group"
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          <div className={`rounded-lg p-2 ${c}`}>
            <Icon className="h-4 w-4" />
          </div>
          {href && (
            <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 -mr-1 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold tabular-nums">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {card}
      </Link>
    );
  }
  return card;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(1)}K`;
  }
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function AdminPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStats = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      } else {
        toast.error("Error al cargar estadísticas");
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar estadísticas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-pulse text-muted-foreground">
          Cargando estadísticas...
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas</p>
        <Button onClick={loadStats} variant="outline">
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Estadísticas globales
          </h1>
          <p className="text-muted-foreground">
            Resumen del sistema en números
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadStats}
          disabled={loading}
          className="self-start sm:self-auto"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Suscripciones y pagos */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Suscripciones y facturación
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Suscripciones totales"
            value={stats.subscribers}
            icon={CreditCard}
            href="/admin/suscripciones"
          />
          <StatCard
            title="Pagando (activas)"
            value={stats.paying}
            subtitle={`${stats.subscribers ? Math.round((stats.paying / stats.subscribers) * 100) : 0}% del total`}
            icon={Activity}
            accent="green"
            href="/admin/suscripciones"
          />
          <StatCard
            title="Pagos aprobados"
            value={stats.totalPaymentsApproved}
            icon={DollarSign}
            href="/admin/suscripciones"
          />
          <StatCard
            title="Ingresos (aprobados)"
            value={formatCurrency(stats.revenue)}
            icon={DollarSign}
            accent="green"
            href="/admin/suscripciones"
          />
        </div>
      </div>

      {/* Usuarios y roles */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Usuarios
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Total usuarios"
            value={stats.users}
            icon={Users}
            href="/admin/users"
          />
          <StatCard
            title="Operadores"
            value={stats.operators}
            icon={Stethoscope}
            accent="blue"
            href="/admin/users"
          />
          <StatCard
            title="Solicitantes"
            value={stats.solicitantes}
            icon={Users}
            href="/admin/users"
          />
          <StatCard
            title="Médicos solicitantes"
            value={stats.medicosSolicitantes}
            icon={Users}
            href="/admin/users"
          />
          <StatCard
            title="Admins"
            value={stats.admins}
            icon={Users}
            accent="violet"
            href="/admin/users"
          />
        </div>
      </div>

      {/* Pacientes, estudios y mensajes */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Contenido y mensajería
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <StatCard
            title="Pacientes"
            value={stats.patients}
            icon={Syringe}
            accent="blue"
            href="/dashboard/patients"
          />
          <StatCard
            title="Estudios"
            value={stats.studies}
            icon={FileText}
            accent="amber"
            href="/dashboard/studies"
          />
          <StatCard
            title="Bonificar envíos trial"
            value="WhatsApp"
            subtitle="Sumar envíos gratis a operadores"
            icon={Gift}
            accent="violet"
            href="/admin/envios-prueba"
          />
          <StatCard
            title="Mensajes WhatsApp enviados"
            value={
              stats.whatsappMessagesSent !== null
                ? stats.whatsappMessagesSent.toLocaleString("es-AR")
                : "—"
            }
            subtitle={
              stats.whatsappMessagesSent === null
                ? "NotificasHub no configurado"
                : undefined
            }
            icon={MessageSquare}
            accent="green"
            href="/admin/actividad"
          />
          <StatCard
            title="Promedio msjs por operador"
            value={
              stats.whatsappAvgPerOperator !== null
                ? stats.whatsappAvgPerOperator
                : "—"
            }
            subtitle={
              stats.whatsappOperatorsWithSends != null
                ? `${stats.whatsappOperatorsWithSends} operadores enviaron`
                : undefined
            }
            icon={MessageSquare}
            accent="blue"
            href="/admin/actividad"
          />
          <StatCard
            title="Costo estimado WhatsApp"
            value={
              stats.whatsappEstimatedCost !== null
                ? formatCurrency(stats.whatsappEstimatedCost)
                : "—"
            }
            subtitle={
              stats.whatsappEstimatedCost === null
                ? "Configura WHATSAPP_ESTIMATED_COST_PER_MESSAGE_ARS"
                : undefined
            }
            icon={DollarSign}
            accent="amber"
            href="/admin/actividad"
          />
        </div>
      </div>
    </div>
  );
}
