import { NextRequest, NextResponse } from "next/server";
import { requireRole, getAuthenticatedUser } from "@/lib/api-auth";
import { verifySubscriptionAccess, createAccessControlResponse } from "@/middleware/subscription-access";
import { consumeTrialWhatsAppSendIfOnTrial } from "@/lib/firestore";
import { logWhatsAppSend } from "@/lib/notificashub";
import { toWhatsAppFormat } from "@/lib/phone-format";

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
 * POST: Envía estudio al médico por WhatsApp usando template notificas_estudio_medico.
 * Variables: {{1}} HeartLink, {{2}} medicoNombre, {{3}} estudio, {{4}} link
 */
export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ["admin", "operator"]);
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    if (authUser.dbUser.role !== "admin") {
      const accessResult = await verifySubscriptionAccess(authUser.dbUser.id);
      if (!accessResult.hasAccess) {
        const res = createAccessControlResponse(accessResult);
        return NextResponse.json(res, { status: 402 });
      }
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

    const toNormalized = toWhatsAppFormat(to);
    if (!toNormalized || toNormalized.length < 12) {
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
        name: "notificas_estudio_medico",
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

    await logWhatsAppSend({
      to: toNormalized,
      medicoNombre: medicoNombre.trim(),
      estudio: estudio.trim(),
      link: link.trim(),
      messageId: messageId ?? null,
      operatorId: authUser.dbUser.id,
    });

    if (authUser.dbUser.role === "operator") {
      await consumeTrialWhatsAppSendIfOnTrial(authUser.dbUser.id);
    }

    return NextResponse.json({
      success: true,
      message: "Mensaje enviado correctamente",
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      if (error.message === "FORBIDDEN") {
        return NextResponse.json(
          { error: "Solo los médicos operadores pueden enviar estudios por WhatsApp" },
          { status: 403 }
        );
      }
    }
    console.error("[whatsapp/send] Error:", error);
    return NextResponse.json(
      { error: "Error al enviar por WhatsApp" },
      { status: 500 }
    );
  }
}
