import { setGlobalOptions } from "firebase-functions";
import { onRequest } from "firebase-functions/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

type StoredData = { dateCreated: string; lastWrite: string };

// This means that with heavy load, performance suffers rather than my bank account
setGlobalOptions({ maxInstances: 5 });

initializeApp();
const db = getFirestore();

async function readUserData(userId: string): Promise<StoredData | null> {
  const userDocRef = db.collection("users").doc(userId);
  const snapshot = await userDocRef.get();
  if (!snapshot.exists) return null;

  const data = (snapshot.data() ?? {}) as Partial<StoredData>;
  if (
    typeof data.dateCreated !== "string" ||
    typeof data.lastWrite !== "string"
  ) {
    return null;
  }

  return { dateCreated: data.dateCreated, lastWrite: data.lastWrite };
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
    const userId = req.query.userId as string;

    let userData: StoredData | null;
    if (req.path.startsWith("/api/db-read")) {
      userData = await readUserData(userId);
    } else if (req.path.startsWith("/api/db-write")) {
      userData = await writeUserData(userId);
    } else {
      res.status(404).json({ error: "Not found" });
      return;
    }

    res.json({ data: userData });
    return;
  }

  res.status(404).json({ error: "Not found" });
  return;
});
