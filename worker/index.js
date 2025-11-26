import { DurableObject } from "cloudflare:workers";

export class UserData extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.blockConcurrencyWhile(async () => {
      const data = await this.ctx.storage.get("data");
      if (data) {
        this.data = data;
        return;
      }

      const initial = {
        dateCreated: new Date().toISOString(),
        count: 0,
      };

      await this.ctx.storage.put("data", initial);
      this.data = initial;
    });
  }

  async getData(request) {
    this.data.count += 1;
    await this.ctx.storage.put("data", this.data);
    return this.data;
  }
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/ping")) {
      return Response.json({ message: "hello, world" });
    }

    if (url.pathname.startsWith("/api/data")) {
      const start = Date.now();
      const { userId } = await request.clone().json();

      const userStub = env.USER_DATA_DO.getByName(userId);
      const userData = await userStub.getData();
      const elapsedMs = Date.now() - start;

      return Response.json({ data: userData, elapsedMs });
    }

    return new Response(null, { status: 404 });
  },
};
