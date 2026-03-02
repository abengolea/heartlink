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
