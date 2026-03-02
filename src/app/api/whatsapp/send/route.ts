import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/api-auth";
import { getNotificasHubDb } from "@/lib/notificashub";

const META_GRAPH_URL = "https://graph.facebook.com/v21.0";
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

interface SendRequestBody {
  to: string;
  medicoNombre: string;
  estudio: string;
  link: string;
}

/**
 * POST: Envía estudio al médico por WhatsApp usando template documento_disponible.
 * Variables: {{1}} HeartLink, {{2}} medicoNombre, {{3}} estudio, {{4}} link
 */
export async function POST(request: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!PHONE_NUMBER_ID || !WHATSAPP_TOKEN) {
      console.error("[whatsapp/send] PHONE_NUMBER_ID o WHATSAPP_TOKEN no configurados");
      return NextResponse.json(
        { error: "Configuración de WhatsApp incompleta" },
        { status: 500 }
      );
    }

    const body = (await request.json()) as SendRequestBody;
    const { to, medicoNombre, estudio, link } = body;

    if (!to?.trim() || !medicoNombre?.trim() || !estudio?.trim() || !link?.trim()) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: to, medicoNombre, estudio, link" },
        { status: 400 }
      );
    }

    const toNormalized = to.replace(/\D/g, "");
    if (toNormalized.length < 10) {
      return NextResponse.json(
        { error: "Número de teléfono inválido" },
        { status: 400 }
      );
    }

    const templateLang = process.env.WHATSAPP_TEMPLATE_LANGUAGE || "es_AR";
    const templatePayload = {
      messaging_product: "whatsapp",
      to: toNormalized,
      type: "template",
      template: {
        name: "documento_disponible",
        language: { code: templateLang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: "HeartLink" },
              { type: "text", text: medicoNombre.trim() },
              { type: "text", text: estudio.trim() },
              { type: "text", text: link.trim() },
            ],
          },
        ],
      },
    };

    const res = await fetch(`${META_GRAPH_URL}/${PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      },
      body: JSON.stringify(templatePayload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[whatsapp/send] Meta API error:", data);
      return NextResponse.json(
        { error: data?.error?.message || "Error al enviar por WhatsApp" },
        { status: res.status >= 500 ? 500 : 400 }
      );
    }

    const messageId = data?.messages?.[0]?.id;

    // Guardar en NotificasHub
    try {
      const hubDb = getNotificasHubDb();
      await hubDb.collection("sends").add({
        appId: "heartlink",
        to: toNormalized,
        medicoNombre: medicoNombre.trim(),
        estudio: estudio.trim(),
        link: link.trim(),
        messageId: messageId ?? null,
        sentAt: new Date().toISOString(),
        status: "sent",
      });
    } catch (hubError) {
      console.warn("[whatsapp/send] Error guardando en NotificasHub:", hubError);
      // No fallar la respuesta si el mensaje ya se envió
    }

    return NextResponse.json({
      success: true,
      message: "Mensaje enviado correctamente",
    });
  } catch (error) {
    console.error("[whatsapp/send] Error:", error);
    return NextResponse.json(
      { error: "Error al enviar por WhatsApp" },
      { status: 500 }
    );
  }
}
