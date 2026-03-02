"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageCircle, Loader2, Check } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { toWhatsAppFormat } from "@/lib/phone-format";
import { toast } from "sonner";

export interface EnviarEstudioWhatsAppProps {
  /** Valores iniciales opcionales */
  defaultTelefono?: string;
  defaultMedicoNombre?: string;
  defaultEstudio?: string;
  defaultLink?: string;
}

export default function EnviarEstudioWhatsApp({
  defaultTelefono = "",
  defaultMedicoNombre = "",
  defaultEstudio = "",
  defaultLink = "",
}: EnviarEstudioWhatsAppProps) {
  const [telefono, setTelefono] = useState(defaultTelefono);
  const [medicoNombre, setMedicoNombre] = useState(defaultMedicoNombre);
  const [estudio, setEstudio] = useState(defaultEstudio);
  const [link, setLink] = useState(defaultLink);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Sincronizar cuando cambien los defaults (ej. navegación a otro estudio)
  useEffect(() => {
    setTelefono(defaultTelefono);
    setMedicoNombre(defaultMedicoNombre);
    setEstudio(defaultEstudio);
    setLink(defaultLink);
  }, [defaultTelefono, defaultMedicoNombre, defaultEstudio, defaultLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!telefono.trim() || !medicoNombre.trim() || !estudio.trim() || !link.trim()) {
      toast.error("Completa todos los campos");
      return;
    }

    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetchWithAuth("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: toWhatsAppFormat(telefono) || telefono.trim().replace(/\D/g, ""),
          medicoNombre: medicoNombre.trim(),
          estudio: estudio.trim(),
          link: link.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al enviar");
      }

      setSuccess(true);
      toast.success("Mensaje enviado correctamente");
      // Mantener valores pre-llenados por si quiere reenviar
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error al enviar por WhatsApp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Enviar estudio por WhatsApp
        </CardTitle>
        <CardDescription>
          Los campos se completan automáticamente con los datos del estudio. Edita si falta algún dato (ej. teléfono del médico).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="telefono">
              Teléfono del médico {!defaultTelefono && "(si no aparece, agrégalo al perfil del médico)"}
            </Label>
            <Input
              id="telefono"
              placeholder="543364645357"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="medicoNombre">Nombre del médico</Label>
            <Input
              id="medicoNombre"
              placeholder="Dr. García"
              value={medicoNombre}
              onChange={(e) => setMedicoNombre(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="estudio">Nombre del estudio</Label>
            <Input
              id="estudio"
              placeholder="Resonancia columna lumbar"
              value={estudio}
              onChange={(e) => setEstudio(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="link">Link del estudio</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://heartlink.app/estudios/abc123"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={loading}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : success ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Enviado
              </>
            ) : (
              <>
                <MessageCircle className="mr-2 h-4 w-4" />
                Enviar por WhatsApp
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
