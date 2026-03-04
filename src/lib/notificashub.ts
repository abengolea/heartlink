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
