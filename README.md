A repo to test Cloudflare and Firebase, including:

- Page load time
- Cold start time
- DB operation times

Cloudflare URL: https://cloudtest.gilbertson-david.workers.dev
Firebase URL: https://dgcloudtest.web.app

# Frontend

Shared frontend source in `src/`. `index.html` is in the root, so Vite Just Works.

# Dev

## Emulating Cloudflare

`npm run dev:cf` uses Vite (with the Cloudflare plugin) to serve the site and the Workers.

## Emulating Firebase

`npm run dev:fb` builds the functions and frontend code, then runs the Firebase emulator

# Deploy

Use the `npm run deploy:*` scripts.

For Firebase, predeploy scripts in `firebase.json` run a build.
