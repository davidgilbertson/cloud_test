import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type StoredData = { dateCreated: string; lastWrite: string };

// This means that with heavy load, performance suffers rather than my bank account
setGlobalOptions({ maxInstances: 5 });

initializeApp();
const db = getFirestore();

async function readUserData(userId: string): Promise<StoredData> {
  const userDocRef = db.collection("users").doc(userId);

  return db.runTransaction(async (t) => {
    const snapshot = await t.get(userDocRef);
    const existingData = (snapshot.data() ?? {}) as {
      lastWrite?: unknown;
      dateCreated?: unknown;
      [key: string]: unknown;
    };

    const now = new Date().toISOString();
    const dateCreated =
      snapshot.exists && typeof existingData.dateCreated === "string"
        ? existingData.dateCreated
        : now;

    const lastWrite =
      snapshot.exists && typeof existingData.lastWrite === "string"
        ? existingData.lastWrite
        : now;

    if (!snapshot.exists) {
      t.set(userDocRef, { dateCreated, lastWrite });
    }

    return { dateCreated, lastWrite };
  });
}

async function writeUserData(userId: string): Promise<StoredData> {
  const userDocRef = db.collection("users").doc(userId);
  const now = new Date().toISOString();
  const initial: StoredData = { dateCreated: now, lastWrite: now };

  await userDocRef.set(initial, { mergeFields: ["lastWrite"] });

  const snapshot = await userDocRef.get();
  const data = (snapshot.data() ?? {}) as Partial<StoredData>;

  return {
    dateCreated: data.dateCreated ?? initial.dateCreated,
    lastWrite: data.lastWrite ?? initial.lastWrite,
  };
}

export const api = onRequest(async (req, res): Promise<void> => {
  if (req.path.startsWith("/api/ping")) {
    res.json({ message: "Ping successful" });
    return;
  }

  if (req.path.startsWith("/api/db-")) {
    const start = Date.now();
    const userId = req.query.userId as string;

    let userData: StoredData;
    if (req.path.startsWith("/api/db-read")) {
      userData = await readUserData(userId);
    } else if (req.path.startsWith("/api/db-write")) {
      userData = await writeUserData(userId);
    } else {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const elapsedMs = Date.now() - start;

    res.json({ data: userData, elapsedMs });
    return;
  }

  res.status(404).json({ error: "Not found" });
  return;
});
