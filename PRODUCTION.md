# Production Deployment Guide for Cinevora

## Overview
Cinevora is split into two services:

1. **Frontend** – a Vite‑React SPA that is best hosted on **Cloudflare Pages** (or any static‑site host). It only needs the public environment variable `VITE_API_BASE_URL` pointing at the backend.
2. **Backend (Proxy)** – an Express server that hides TMDB, RapidAPI and Turso secrets. It can be deployed to any Node‑compatible platform (Render, Railway, Fly.io, or Cloudflare Workers / Pages Functions). The backend exposes:
   - `/api/tmdb/*` – forwards TMDB requests with the read token.
   - `/api/db/query` – forwards safe SQL queries to Turso.
   - `/api/health` – simple health‑check.

Both services communicate over HTTP, so they can be hosted on separate domains or sub‑domains.

---

## Required Environment Variables
Create a `.env` file **only on the server** (it is never committed).

```.env
# Backend only (not exposed to the client)
TMDB_READ_ACCESS_TOKEN=your_tmdb_read_token
RAPIDAPI_KEY=your_rapidapi_key            # if you still use RapidAPI endpoints
TURSO_DATABASE_URL=your_turso_url
TURSO_AUTH_TOKEN=your_turso_token
PORT=3001                                   # optional, defaults to 3001

# Frontend only – add to Cloudflare Pages "Environment Variables" section
VITE_API_BASE_URL=https://<backend-host>/api   # e.g. https://cinevora-backend.onrender.com/api
```

*Do NOT* add the backend‑only variables to the frontend environment – Vite will expose any `VITE_` prefixed variable to the browser.

---

## Deploying the Backend
You have two straightforward options.

### 1️⃣ Render (recommended for simplicity)
1. **Create a new Web Service** in Render.
2. **Repository** – point it at this Git repo.
3. **Build Command** – `npm ci`
4. **Start Command** – `npm run server`
5. **Environment** – add the variables from the `.env` section above.
6. **Port** – Render expects the app to listen on the `$PORT` env var (already used in `server.ts`).
7. **Health Check** – set the path to `/api/health`.
8. Click **Create Web Service** – Render will build the Docker image automatically.

### 2️⃣ Cloudflare Workers / Pages Functions (single‑service approach)
If you prefer everything on Cloudflare, move the Express routes into **Workers Functions**:
- Create a `functions/api` folder.
- Split each route into its own file (e.g. `functions/api/tmdb/[...slug].ts`).
- Use the same logic from `server.ts` but export a `fetch` handler.
- Add the same env vars in the Cloudflare dashboard under **Settings → Environment Variables**.
- Set the Routes to `https://<your‑domain>/api/*`.

> The existing Express server works locally and on Render; switching to Workers is optional and requires a small rewrite.

---

## Deploying the Frontend (Cloudflare Pages)
1. In the Cloudflare dashboard, create a **Pages** project linked to this repo.
2. **Build Settings**:
   - **Build command**: `npm run build`
   - **Build directory**: `dist`
3. **Environment Variables** – add only `VITE_API_BASE_URL` (the URL of the backend you deployed above).
4. **Advanced Settings** – enable **Auto‑Deploy** on pushes to `main`.
5. After the first deploy, Cloudflare will serve the static assets from the `dist` folder and automatically proxy `/api/*` requests to the backend domain you set in `VITE_API_BASE_URL`.

---

## Local Development
Run both services together:
```
npm run dev:all   # starts backend on 3001 and Vite dev server on 5174
```
The Vite config proxies `/api/*` to `http://localhost:3001`, so you can develop with the same API surface as production.

---

## Verifying the Deployment
1. **Health check** – `curl https://<backend-host>/api/health` should return `{"status":"ok"}`.
2. Open the frontend URL and verify that movies, details, search, and the admin panel load without exposing any secret keys (inspect network tab – Authorization header is only present on the backend request).
3. Run the seed script (if needed) by SSH‑ing into the backend container and executing `npm run seed`.

---

## Next Steps / Maintenance
- Add rate‑limiting or API‑key validation to the backend if you expect public traffic.
- Consider adding a **read‑only** GraphQL wrapper for Turso queries to make the client code even cleaner.
- Enable a CI pipeline that runs `npm run lint && npm run test` before each push.

---

*If you need a Cloudflare Workers version of the proxy, let me know and I can generate the function files.*