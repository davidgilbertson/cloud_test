import { DurableObject } from "cloudflare:workers";

type StoredData = { dateCreated: string; lastAccess: string };

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
        lastAccess: now,
      };

      await this.ctx.storage.put("data", initial);
      this.data = initial;
    });
  }

  async getData(): Promise<StoredData> {
    const now = new Date().toISOString();
    const previousLastAccess = this.data.lastAccess ?? now;

    this.data.lastAccess = now;
    await this.ctx.storage.put("data", this.data);

    return {
      dateCreated: this.data.dateCreated,
      lastAccess: previousLastAccess,
    };
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/ping")) {
      return Response.json({ message: "Ping successful" });
    }

    if (url.pathname.startsWith("/api/data")) {
      const start = Date.now();
      const body = await request.json().catch(() => null);
      const userId =
        typeof (body as any)?.userId === "string" ? (body as any).userId : null;

      if (!userId) {
        return new Response(null, { status: 400 });
      }

      const userStub = env.USER_DATA_DO.getByName(userId);
      const userData = await userStub.getData();
      const elapsedMs = Date.now() - start;

      return Response.json({ data: userData, elapsedMs });
    }

    return new Response(null, { status: 404 });
  },
};
