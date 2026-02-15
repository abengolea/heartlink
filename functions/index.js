/**
 * Firebase Cloud Functions - HeartLink
 * Incluye cron programado para procesar suscripciones vencidas.
 */

const { setGlobalOptions } = require("firebase-functions/v2");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10 });

const APP_URL = process.env.APP_URL || "https://heartlink--heartlink-f4ftq.us-central1.hosted.app";
const CRON_SECRET = process.env.CRON_SECRET_TOKEN || "heartlink-cron-2025";

/**
 * Cron diario: procesa suscripciones vencidas (bloquea acceso tras período de gracia).
 * Se ejecuta todos los días a las 03:00 UTC.
 */
exports.processSubscriptionsCron = onSchedule(
  {
    schedule: "0 3 * * *", // 03:00 UTC diario (crontab: min hora día mes día-semana)
    timeZone: "UTC",
  },
  async () => {
    logger.info("[Cron] processSubscriptionsCron started");
    try {
      const res = await fetch(`${APP_URL}/api/cron/process-subscriptions`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${CRON_SECRET}`,
        },
      });
      const data = await res.json();
      logger.info("[Cron] processSubscriptionsCron result", data);
    } catch (err) {
      logger.error("[Cron] processSubscriptionsCron failed", err);
      throw err;
    }
  }
);
