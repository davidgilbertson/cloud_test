import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";

// This means that with heavy load, performance suffers rather than my bank account
setGlobalOptions({ maxInstances: 5 });

initializeApp();
const db = getFirestore();

export const api = onRequest(async (req, res) => {
  if (req.path.startsWith("/api/ping")) {
    logger.info("Ping request received");
    res.json({ message: "Ping successful", receivedAt: Date.now() });
    return;
  }

  if (req.path.startsWith("/api/data")) {
    const start = Date.now();
    const body = req.body as { userId?: unknown } | undefined;
    const userId = typeof body?.userId === "string" ? body.userId : null;

    if (!userId) {
      res.status(400).json({ error: "userId is required" });
      return;
    }

    logger.info("Data request received", { userId });
    const userDocRef = db.collection("users").doc(userId);

    const userData = await db.runTransaction(async (t) => {
      const snapshot = await t.get(userDocRef);
      const existingData = (snapshot.data() ?? {}) as {
        lastAccess?: unknown;
        dateCreated?: unknown;
        [key: string]: unknown;
      };

      const now = new Date().toISOString();
      const previousLastAccess =
        snapshot.exists && typeof existingData.lastAccess === "string"
          ? existingData.lastAccess
          : now;

      const dateCreated =
        snapshot.exists && typeof existingData.dateCreated === "string"
          ? existingData.dateCreated
          : now;

      if (!snapshot.exists) {
        t.set(userDocRef, {
          dateCreated,
          lastAccess: now,
        });
      } else {
        t.update(userDocRef, { lastAccess: now });
      }

      return {
        dateCreated,
        lastAccess: previousLastAccess,
      };
    });

    const elapsedMs = Date.now() - start;

    res.json({ data: userData, elapsedMs });
    return;
  }

  res.status(404).json({ error: "Not found" });
});
