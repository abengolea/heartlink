"use client";

import { Settings, Bell, Globe, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/auth-context";
import { fetchWithAuth } from "@/lib/fetch-with-auth";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface UserPreferences {
  userId: string;
  notifications: {
    email: boolean;
    whatsapp: boolean;
    studyReady: boolean;
  };
  language: string;
  updatedAt: string;
}

const defaults: UserPreferences = {
  userId: "",
  notifications: { email: true, whatsapp: false, studyReady: true },
  language: "es",
  updatedAt: "",
};

export default function ConfiguracionPage() {
  const { dbUser } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!dbUser) return;
      try {
        const res = await fetchWithAuth("/api/users/me/preferences");
        if (res.ok) {
          const data = await res.json();
          setPrefs({ ...defaults, ...data });
        }
      } catch {
        setPrefs({ ...defaults, userId: dbUser.id });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dbUser]);

  const updatePref = async (updates: Partial<UserPreferences>) => {
    if (!dbUser || saving) return;
    setSaving(true);
    try {
      const res = await fetchWithAuth("/api/users/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const data = await res.json();
        setPrefs((p) => ({ ...p, ...data }));
        toast.success("Preferencias guardadas");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationChange = (key: keyof UserPreferences["notifications"], value: boolean) => {
    const next = { ...prefs.notifications, [key]: value };
    setPrefs((p) => ({ ...p, notifications: next }));
    updatePref({ notifications: next });
  };

  const handleLanguageChange = (value: string) => {
    setPrefs((p) => ({ ...p, language: value }));
    updatePref({ language: value });
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="font-semibold text-lg md:text-2xl">Configuración</h1>
          <p className="text-muted-foreground text-sm">Ajustes de tu cuenta y preferencias.</p>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="font-semibold text-lg md:text-2xl">Configuración</h1>
        <p className="text-muted-foreground text-sm">Ajustes de tu cuenta y preferencias.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificaciones
          </CardTitle>
          <CardDescription>
            Elige cómo quieres recibir avisos sobre estudios y actualizaciones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-email">Notificaciones por email</Label>
              <p className="text-sm text-muted-foreground">Recibir avisos por correo electrónico</p>
            </div>
            <Switch
              id="notif-email"
              checked={prefs.notifications.email}
              onCheckedChange={(v) => handleNotificationChange("email", v)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-whatsapp">Notificaciones por WhatsApp</Label>
              <p className="text-sm text-muted-foreground">Recibir avisos por WhatsApp cuando haya estudios listos</p>
            </div>
            <Switch
              id="notif-whatsapp"
              checked={prefs.notifications.whatsapp}
              onCheckedChange={(v) => handleNotificationChange("whatsapp", v)}
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notif-study">Aviso cuando estudio esté listo</Label>
              <p className="text-sm text-muted-foreground">Notificación cuando un estudio sea procesado</p>
            </div>
            <Switch
              id="notif-study"
              checked={prefs.notifications.studyReady}
              onCheckedChange={(v) => handleNotificationChange("studyReady", v)}
              disabled={saving}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Idioma
          </CardTitle>
          <CardDescription>
            Idioma de la interfaz (próximamente más opciones).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={prefs.language}
            onValueChange={handleLanguageChange}
            disabled={saving}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  );
}
