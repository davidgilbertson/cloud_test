import { DurableObject } from "cloudflare:workers";

type StoredData = { dateCreated: string; lastWrite: string };

export class UserData extends DurableObject {
  private data!: StoredData;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      const data = await this.ctx.storage.get<StoredData>("data");
      if (data) {
        this.data = data;
        return;
      }

      const now = new Date().toISOString();
      const initial: StoredData = {
        dateCreated: now,
        lastWrite: now,
      };

      await this.ctx.storage.put("data", initial);
      this.data = initial;
    });
  }

  async readData(): Promise<StoredData> {
    return this.data;
  }

  async writeData(): Promise<StoredData> {
    const now = new Date().toISOString();
    this.data.lastWrite = now;
    await this.ctx.storage.put("data", this.data);
    return this.data;
  }
}

async function readD1UserData(
  env: Env,
  userId: string
): Promise<StoredData | null> {
  const session = env.userDb.withSession();

  const row = await session
    .prepare("SELECT dateCreated, lastWrite FROM Users WHERE userId = ?")
    .bind(userId)
    .first<StoredData>();

  return row;
}

async function writeD1UserData(env: Env, userId: string): Promise<StoredData> {
  const now = new Date().toISOString();

  const [, , selectResult] = await env.userDb.batch<StoredData>([
    env.userDb
      .prepare(
        "INSERT OR IGNORE INTO Users (userId, dateCreated, lastWrite) VALUES (?, ?, ?)"
      )
      .bind(userId, now, now),
    env.userDb
      .prepare("UPDATE Users SET lastWrite = ? WHERE userId = ?")
      .bind(now, userId),
    env.userDb
      .prepare("SELECT dateCreated, lastWrite FROM Users WHERE userId = ?")
      .bind(userId),
  ]);

  return selectResult.results[0];
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname.startsWith("/api/ping")) {
      return Response.json({ message: "Ping successful" });
    }

    //Durable Object read and write
    if (url.pathname.startsWith("/api/do-")) {
      const start = Date.now();
      const userId = url.searchParams.get("userId");

      if (!userId) {
        return new Response(null, { status: 400 });
      }

      const userStub = env.USER_DATA_DO.getByName(userId);
      let userData: StoredData;
      if (url.pathname.startsWith("/api/do-read")) {
        userData = await userStub.readData();
      } else if (url.pathname.startsWith("/api/do-write")) {
        userData = await userStub.writeData();
      } else {
        throw Error(`Unknown URL ${url.pathname}`);
      }

      const elapsedMs = Date.now() - start;

      return Response.json({ data: userData, elapsedMs });
    }

    // D1 read and write
    if (url.pathname.startsWith("/api/d1-")) {
      const start = Date.now();
      const userId = url.searchParams.get("userId");

      if (!userId) {
        return new Response(null, { status: 400 });
      }

      let userData: StoredData | null;

      if (url.pathname.startsWith("/api/d1-read")) {
        userData = await readD1UserData(env, userId);
      } else if (url.pathname.startsWith("/api/d1-write")) {
        userData = await writeD1UserData(env, userId);
      } else {
        throw Error(`Unknown URL ${url.pathname}`);
      }

      const elapsedMs = Date.now() - start;

      return Response.json({ data: userData, elapsedMs });
    }

    // WebSocket
    if (url.pathname.startsWith("/ws")) {
      if (request.headers.get("upgrade") !== "websocket") {
        return new Response("Expected a web socket request", { status: 400 });
      }

      const [client, server] = Object.values(new WebSocketPair());

      server.accept();

      server.addEventListener("message", (event) => {
        server.send(`I got your message '${event.data}'`);
      });

      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response(null, { status: 404 });
  },
};
