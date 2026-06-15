# DEPLOYMENT.md — Frontend (sql-agents-frontend)

> **Read this file fully before deploying.** It covers deploying this React/Vite frontend
> to DigitalOcean and the project-specific gotchas that are NOT obvious from the code.
> Deploy the **backend first** (see DEPLOYMENT.md in `sql-agents-backend`) because the
> frontend needs the backend's public URL at build time.

---

## 1. What this service is

A React + Vite single-page app (TypeScript). It is the **frontend half** of a two-repo project
and talks to the FastAPI backend over Server-Sent Events at routes prefixed **`/api/v1`**.

On DigitalOcean it deploys as a **Static Site** — there is no running server, just compiled
HTML/CSS/JS files served to browsers. Static sites are cheap (often free).

---

## 2. Critical project-specific facts (READ THESE FIRST)

### 2a. `vite.config.ts` writes build output OUTSIDE the repo — MUST be fixed for standalone deploy
Current config:
```ts
build: { outDir: '../static' }   // writes to a SIBLING folder, not inside this repo
```
This was set up for an old single-container mode where the build was dropped into the
backend's `static/` folder. For a standalone DigitalOcean Static Site, the build output must
live **inside** this repo so DO can find it. **Change `outDir` to the Vite default `dist`:**
```ts
build: { outDir: 'dist' }
```
Then set the Static Site **Output Directory = `dist`** in DigitalOcean. Commit this change.

### 2b. `VITE_API_URL` MUST be set at BUILD time to the backend's public URL
The hooks resolve the backend base like this:
```ts
const API_BASE = import.meta.env.VITE_API_URL ?? ''
// then: fetch(`${API_BASE}/api/v1/compare`, ...)
```
- **Local dev:** `VITE_API_URL` is empty, and `vite.config.ts`'s proxy forwards `/api` →
  `localhost:8000`. No env var needed.
- **Production:** there is NO proxy. If `VITE_API_URL` is empty, the app calls
  `/api/v1/...` on its *own* static domain (which has no backend) and every request 404s.
  You **must** set `VITE_API_URL` to the deployed backend URL, e.g.
  `https://sql-agents-backend-xxxxx.ondigitalocean.app`.
- **Vite bakes env vars in at build time**, not runtime. The variable must be present when
  `npm run build` runs (set it as a build-time env var in DigitalOcean). Changing the backend
  URL later requires a rebuild.

### 2c. CORS is enforced by the backend, not here
After this frontend is deployed, take its public URL and add it to the backend's
`allow_origins` (see the backend's DEPLOYMENT.md §2c). Until then the browser blocks calls
with a CORS error even though the frontend itself is fine.

---

## 3. Environment variables to set in DigitalOcean

| Variable | When | Value |
|---|---|---|
| `VITE_API_URL` | **Build time** | Deployed backend URL, no trailing slash, e.g. `https://sql-agents-backend-xxxxx.ondigitalocean.app` |

---

## 4. Recommended path — DigitalOcean App Platform Static Site

1. **Deploy the backend first** and copy its public URL.
2. **Fix `outDir`** to `dist` (§2a), commit, push.
3. DigitalOcean dashboard → **Apps** → **Create App** → connect GitHub →
   `arshmankhawar/sql-agents-frontend`, branch `main`, Autodeploy = ON.
4. **Resource type**: **Static Site** (not a Web Service).
5. **Build command**:
   ```bash
   npm ci && npm run build
   ```
6. **Output directory**: `dist`
7. **Environment variable**: `VITE_API_URL` = the backend URL (build-time scope).
8. **Deploy**, then copy this frontend's public URL.
9. **Go back to the backend** and add this URL to CORS `allow_origins` (or set its
   `FRONTEND_ORIGIN` env var), then redeploy the backend.

### SPA routing note
It's a single-page app. If you add client-side routes later, configure the Static Site to
serve `index.html` as the catch-all/fallback so deep links don't 404.

---

## 5. Alternative hosts

A Vite static build is just files — it also deploys cleanly to Vercel, Netlify, or Cloudflare
Pages (often with zero config and a generous free tier). Same two requirements apply:
set `VITE_API_URL` at build time, and add the resulting URL to the backend's CORS list.

---

## 6. Post-deploy verification

1. Open the deployed frontend URL in a browser.
2. Open DevTools → Network and Console tabs.
3. Submit a query (e.g. "Compare average salaries between tech_startup and airport").
4. Confirm:
   - Requests go to `https://<backend-url>/api/v1/...` (not the frontend's own domain).
   - **No CORS errors** in the console (if there are, fix backend `allow_origins`).
   - The live task feed streams and the final answer + charts render.

---

## 7. The full CI/CD picture once deployed

```
push to main → GitHub Actions CI (ESLint, type-check, vite build) → ✅
            → DigitalOcean Static Site auto-pulls → npm ci && npm run build
            → publishes dist/ → live
```
CI is the quality gate; App Platform autodeploy is the CD half.

---

## 8. Quick reference — local run

```bash
npm install
npm run dev      # dev server on :5173, proxies /api to localhost:8000
npm run build    # production build (currently to ../static — see §2a)
npm run preview  # preview the production build on :4173
```
Backend must be running on :8000 for local dev (see the backend repo).
