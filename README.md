A repo to test Cloudflare and Firebase, including:

- Page load time
- Cold start time
- DB operation times

Cloudflare URL: https://cloudtest.gilbertson-david.workers.dev

# Frontend

Shared frontend source in `src/`. `index.html` is in the root, so Vite Just Works.

# Build

Note that Vite uses the Cloudflare plugin, so `npm run dev` serves the Cloudflare workers too.
