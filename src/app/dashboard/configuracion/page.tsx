"use client";

import { Bell, Globe, Loader2, MessageCircle } from "lucide-react";
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
import { PhoneInputWithCountry } from "@/components/phone-input-with-country";
import { Button } from "@/components/ui/button";

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
  const [myPhone, setMyPhone] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!dbUser) return;
      try {
        const [prefsRes, meRes] = await Promise.all([
          fetchWithAuth("/api/users/me/preferences"),
          fetchWithAuth("/api/users/me"),
        ]);
        if (prefsRes.ok) {
          const data = await prefsRes.json();
          setPrefs({ ...defaults, ...data });
        } else {
          setPrefs({ ...defaults, userId: dbUser.id });
        }
        if (meRes.ok) {
          const me = await meRes.json();
          setMyPhone(me.phone ?? "");
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

  const isOperator = dbUser?.role === "operator" || dbUser?.role === "admin";

  const handleSavePhone = async () => {
    if (!dbUser || phoneSaving) return;
    setPhoneSaving(true);
    try {
      const res = await fetchWithAuth("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: myPhone }),
      });
      if (res.ok) {
        toast.success("Teléfono guardado. Ya puedes subir estudios por WhatsApp.");
      } else {
        toast.error("Error al guardar");
      }
    } catch {
      toast.error("Error al guardar");
    } finally {
      setPhoneSaving(false);
    }
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

      {isOperator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Mi WhatsApp (subir estudios)
            </CardTitle>
            <CardDescription>
              Vincula tu número para poder subir estudios enviando un video desde WhatsApp. El número debe coincidir con el que usas en WhatsApp.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-1">
                <PhoneInputWithCountry
                  value={myPhone}
                  onChange={setMyPhone}
                  placeholder="336 451-3355"
                />
                <p className="text-xs text-muted-foreground">
                  Argentina: ingresá solo código de área + número (ej. 336 451-3355). El 9 se agrega automáticamente.
                </p>
              </div>
              <Button onClick={handleSavePhone} disabled={phoneSaving}>
                {phoneSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar"}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Luego ve a{" "}
              <a href="/dashboard/whatsapp-upload" className="text-primary underline">
                Subir por WhatsApp
              </a>{" "}
              para ver las instrucciones.
            </p>
          </CardContent>
        </Card>
      )}

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
