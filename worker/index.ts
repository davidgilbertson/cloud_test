import { DurableObject } from "cloudflare:workers";

type StoredData = { dateCreated: string; count: number };

export class UserData extends DurableObject {
  private data!: StoredData;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      console.log("hi", await ctx.storage.list());
      const data = await this.ctx.storage.get<StoredData>("data");
      if (data) {
        this.data = data;
        return;
      }

      const initial: StoredData = {
        dateCreated: new Date().toISOString(),
        count: 0,
      };

      await this.ctx.storage.put("data", initial);
      this.data = initial;
    });
  }

  async getData(): Promise<StoredData> {
    this.data.count += 1;
    await this.ctx.storage.put("data", this.data);
    return this.data;
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
