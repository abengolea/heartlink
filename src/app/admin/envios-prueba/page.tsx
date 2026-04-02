"use client";

import { useEffect, useMemo, useState } from "react";
import { Gift, Loader2, Plus, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { User } from "@/lib/types";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toast } from "sonner";

export default function AdminEnviosPruebaPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogUser, setDialogUser] = useState<User | null>(null);
  const [amountStr, setAmountStr] = useState("5");
  const [submitting, setSubmitting] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/users");
      if (!res.ok) {
        toast.error("No se pudo cargar la lista de usuarios");
        return;
      }
      const data: User[] = await res.json();
      setUsers(data);
    } catch {
      toast.error("Error al cargar usuarios");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const operators = useMemo(
    () => users.filter((u) => u.role === "operator"),
    [users]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        (u.email?.toLowerCase().includes(q) ?? false) ||
        (u.phone?.replace(/\D/g, "").includes(q.replace(/\D/g, "")) ?? false)
    );
  }, [operators, search]);

  const openDialog = (user: User) => {
    setDialogUser(user);
    setAmountStr("5");
  };

  const submitBonus = async () => {
    if (!dialogUser) return;
    const n = parseInt(amountStr, 10);
    if (!Number.isFinite(n) || n < 1) {
      toast.error("Ingresá un número entero mayor o igual a 1");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetchWithAuth("/api/admin/operators/trial-sends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: dialogUser.id, amount: n }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "No se pudo actualizar");
        return;
      }
      toast.success(data.message || "Envíos actualizados");
      setDialogUser(null);
      await loadUsers();
    } catch {
      toast.error("Error de red");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold text-lg md:text-2xl flex items-center gap-2">
            <Gift className="h-6 w-6 text-primary" />
            Envíos de prueba (WhatsApp)
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Sumá envíos gratis de notificación al médico solicitante para los médicos
            operadores que elijas. Cada envío descuenta cuando no tienen suscripción
            activa.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadUsers}
          disabled={loading}
          className="shrink-0"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Médicos operadores</CardTitle>
          <CardDescription>
            Hasta 500 envíos por operación y un acumulado máximo de 50&nbsp;000 por
            usuario.
          </CardDescription>
          <div className="relative max-w-md pt-2">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Buscar por nombre, email o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No hay operadores que coincidan con la búsqueda.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">WhatsApp</TableHead>
                  <TableHead className="text-right">Envíos prueba</TableHead>
                  <TableHead className="w-[100px]">
                    <span className="sr-only">Acción</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const trial = u.trialWhatsAppSendsRemaining ?? 0;
                  return (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.name}</TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {u.email || "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground font-mono text-xs">
                        {u.phone || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={trial > 0 ? "default" : "secondary"}>
                          {trial}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="outline" onClick={() => openDialog(u)}>
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Sumar
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!dialogUser} onOpenChange={(o) => !o && setDialogUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sumar envíos de prueba</DialogTitle>
            <DialogDescription>
              Operador: <strong>{dialogUser?.name}</strong>
              {dialogUser?.email ? (
                <>
                  {" "}
                  · <span className="text-muted-foreground">{dialogUser.email}</span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="trial-amount">Cantidad a sumar (1–500)</Label>
            <Input
              id="trial-amount"
              type="number"
              min={1}
              max={500}
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogUser(null)}>
              Cancelar
            </Button>
            <Button onClick={submitBonus} disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirmar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
