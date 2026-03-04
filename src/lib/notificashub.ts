import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function getNotificasHubDb() {
  const apps = getApps();
  const hubApp =
    apps.find((a) => a.name === "notificashub") ??
    initializeApp(
      {
        credential: cert({
          projectId: process.env.NOTIFICASHUB_PROJECT_ID || "",
          clientEmail: process.env.NOTIFICASHUB_CLIENT_EMAIL || "",
          privateKey: (process.env.NOTIFICASHUB_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
        }),
      },
      "notificashub"
    );
  return getFirestore(hubApp);
}

/** Normaliza teléfono para enviar a NotificasHub (solo dígitos, código país) */
function normalizePhoneForNotificasHub(phone: string): string {
  const digits = (phone ?? "").replace(/\D/g, "").replace(/^0+/, "");
  if (!digits || digits.length < 10) return "";
  if (digits.startsWith("54")) return digits;
  return "54" + digits;
}

/**
 * Registra un usuario (por teléfono) en NotificasHub para que el router multi-tenant
 * pueda enrutar mensajes de WhatsApp a HeartLink.
 * Se llama cuando se crea o actualiza un usuario con phone en HeartLink.
 * No bloquea: ejecuta en background y loguea errores.
 */
export function registerInNotificasHub(phone: string | undefined | null): void {
  if (!phone || !String(phone).trim()) return;
  const normalized = normalizePhoneForNotificasHub(phone);
  if (!normalized || normalized.length < 12) return;

  const url = process.env.NOTIFICASHUB_URL?.trim();
  const secret = process.env.INTERNAL_SECRET?.trim();
  if (!url || !secret) {
    console.warn("[notificashub] registerInNotificasHub: faltan NOTIFICASHUB_URL o INTERNAL_SECRET");
    return;
  }

  const endpoint = `${url.replace(/\/$/, "")}/api/register-user`;
  void fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": secret,
    },
    body: JSON.stringify({ phone: normalized, tenantId: "heartlink" }),
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        console.warn("[notificashub] register-user falló:", res.status, text);
      } else {
        console.log("[notificashub] Usuario registrado:", normalized);
      }
    })
    .catch((err) => {
      console.warn("[notificashub] Error llamando register-user:", err instanceof Error ? err.message : err);
    });
}

/** Registra un envío de WhatsApp en NotificasHub para estadísticas y costos por operador */
export async function logWhatsAppSend(params: {
  to: string;
  medicoNombre: string;
  estudio: string;
  link: string;
  messageId?: string | null;
  operatorId?: string;
}): Promise<void> {
  try {
    const hubDb = getNotificasHubDb();
    await hubDb.collection("sends").add({
      appId: "heartlink",
      to: params.to,
      medicoNombre: params.medicoNombre.trim(),
      estudio: params.estudio.trim(),
      link: params.link.trim(),
      messageId: params.messageId ?? null,
      operatorId: params.operatorId ?? null,
      sentAt: new Date().toISOString(),
      status: "sent",
    });
  } catch (err) {
    console.warn("[notificashub] Error registrando envío:", err);
  }
}
