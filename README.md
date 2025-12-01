A repo to test Cloudflare and Firebase, including:

- Page load time
- Cold start time
- DB operation times

Cloudflare URL: https://cloudtest.gilbertson-david.workers.dev
Firebase URL: https://dgcloudtest.web.app

# Frontend

Shared frontend source in `src/`. `index.html` is in the root, so Vite Just Works.

# Dev

## Cloudflare

`npm run dev:cf` uses Vite (with the Cloudflare plugin) to serve the site and the Workers.

After changing `wrangler.jsonc`, run `npx wrangler types` to generate TypeScript type definitions.

To create the D1 database locally, run:

```
npx wrangler d1 execute user-d1-db --local --file=worker/userDbSchema.sql
```

Note that this creates a DB (a `.sqlite` file in `.wrangler/state`) that matches the name/ID in `wrangler.jsonc`,
which must also exist in the production environment.

## Firebase

`npm run dev:fb` builds the functions and frontend code, then runs the Firebase emulator

# Deploy

Use the `npm run deploy:*` scripts.

For Firebase, predeploy scripts in `firebase.json` run a build.
