export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname.startsWith("/api/ping")) {
      return Response.json({ message: "hello, world" });
    }

    return new Response(null, { status: 404 });
  },
};
