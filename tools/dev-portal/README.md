# MCA Dev Portal

A local developer dashboard for the MCA App. Zero dependencies (Node 20+), never deployed.

```bash
npm run portal        # → http://localhost:4321
```

Run it next to `npm run dev`. It works standalone too (production checks don't need the dev server).

## What it shows

- **Environment health** — Local Dev, Cert and Production side by side: liveness/readiness probes, the `/api/health` aggregate with per-check detail (database, auth, encryption, Square, email), latency, and quick links to the app, Supabase dashboard, and Vercel.
- **Pulse strip** — health/latency history per environment (bar height = latency, color = status), sampled every 5 minutes while the portal runs. Persisted in `data/history.json`.
- **Endpoint sweep** — on-demand smoke test of every API route against either environment, unauthenticated. A protected route answering 401/404 is a PASS; 5xx or a timeout is a FAIL. Side-effect routes (e.g. `/api/health/restore`) are skipped.
- **Captured errors** — browser errors (window errors, unhandled rejections, `console.error`), React error-boundary crashes, and server-side `logger.error` calls. In dev the app forwards them straight here; in production they are written to `app_errors` in Supabase and *pulled* from there (Vercel can't reach this LAN box), then merged newest-first. Filter by source, expand for stack traces, clear at will. Local ones persist in `data/errors.json` (gitignored — stack traces stay local); production rows are pruned at 30 days.
  Expect framework noise: Next.js's own `console.error` calls (e.g. `Failed to fetch RSC payload`) land here too. Scan for what repeats, not for what is present.
- **Bug reports** — user-filed reports from the app's **Report a Bug** dialog, merged across local and production (ids restart per database, so each row is tagged with its origin). Descriptions and buffered error messages are encrypted in Supabase and decrypted on the way here; screenshots come through signed URLs that expire after 10 minutes. Each report links to its auto-filed GitHub issue in the private `mca-bugs` tracker — that issue deliberately carries no user text (see `src/lib/bug-reports/github-issue.ts`).
- **Cert environment** — a dedicated panel for the cert database. Cert is a faithful copy of production *including real PHI*, refreshed with `scripts/cert-refresh`. Vercel Preview URLs are per-deployment, so there is no stable host to probe — the panel reports on the database instead: staleness, the active branch overlay, row volumes, and the safety invariants (PHI still decrypts, no real address has crept back in, auth rows are well-formed, `require_mfa` on). It mirrors `scripts/cert-refresh/verify-cert.mts` — that script is the gate, this is the always-on view; keep the two in step.
- **Supabase project status** — live status of both Supabase projects via the Management API, with a one-click **Restore** button when the free-tier dev project has auto-paused.
- **CI & deploy** — latest GitHub Actions runs on `main` plus the Vercel deploy state of the latest commit (needs the `gh` CLI authenticated as `weberl48`).

## How the pieces connect

```
DEV      browser errors ─▶ ErrorReporter ─▶ POST /api/dev/errors/ ─┐ forwards
         server logger.error ─────────────────────────────────────┴─▶ portal :4321

PROD     browser errors ─▶ ErrorReporter ─▶ POST /api/errors/ ─┐
         server logger.error ──────────────────────────────────┴─▶ app_errors ─┐
                                                                                │ pulled
         Report a Bug ─▶ submitBugReport() ─▶ bug_reports ──────────────────────┤
                                    └──▶ GitHub issue (pointer only)            │
                                                                     portal ◀───┘
```

The reporter posts same-origin because the app's CSP `connect-src` doesn't allow the portal's port. Production can't push to this portal at all — it's LAN-only and Vercel can't reach it — so prod errors are pulled from `app_errors` via the Management API, and bug reports are pulled from the app's own `/api/bug-reports/` (they need decryption and signed URLs, which the app already has the key for).

## Configuration

Everything is optional — the portal degrades gracefully:

| Source | Unlocks |
|---|---|
| `.env.local` `SUPABASE_ACCESS_TOKEN` | Supabase project status + restore button |
| `.env.local` `CRON_SECRET` (matching Vercel's value) | Per-check health detail for production **and the Bug reports panel** (it bearer-authenticates to `/api/bug-reports/`). Without it that panel is permanently empty rather than erroring — check here first if reports aren't showing |
| `.env.local` `CERT_ENCRYPTION_KEY` | The Cert panel's "PHI decrypts" probe (server-side only, never sent to the browser) |
| `CERT_APP_URL` (portal env) | Pins a Preview URL so cert also gets HTTP probes and endpoint sweeps. Without it cert shows `Not probed`, which is expected |
| `gh` CLI authenticated | CI & deploy panel |
| `DEV_PORTAL_URL` (app env) | Override the portal address the app forwards errors to (default `http://localhost:4321`) |
| `PORT` (portal env) | Portal port (default 4321) |

Environments, links, and the endpoint catalog live in `config.mjs` — add new API routes there so the sweep covers them.

## Raspberry Pi deployment (24/7 mirror)

The portal also runs as a Docker container on the Home Assistant Pi (`speakeasy` SSH alias, `192.168.1.160`) — same code, always on, with an HA sensor + phone alert on prod unhealthy (`ha/mca_portal.yaml` → `/config/packages/`).

```bash
ssh speakeasy "mkdir -p /root/mca-portal/src /root/mca-portal/data"
scp -r server.mjs config.mjs Dockerfile .dockerignore lib public speakeasy:/root/mca-portal/src/
# /root/mca-portal/.env (chmod 600): SUPABASE_ACCESS_TOKEN, CRON_SECRET, LOCAL_APP_URL=http://<pc-ip>:3000
ssh speakeasy "cd /root/mca-portal/src && docker build -t mca-portal ."
# One-time, ONLY when upgrading a container that previously ran as root: the
# existing volume's files are root-owned and the image no longer runs as root.
ssh speakeasy "docker run --rm -v mca-portal-data:/data alpine chown -R 1000:1000 /data"
ssh speakeasy "docker rm -f mca-portal 2>/dev/null; docker run -d --name mca-portal --restart unless-stopped -p 4321:4321 --env-file /root/mca-portal/.env -v mca-portal-data:/app/data mca-portal"
```

**The container runs as `node` (uid 1000), not root.** Docker seeds a *fresh*
named volume from the image — ownership included — so a clean deploy needs
nothing extra. An *existing* volume keeps its old root-owned permissions, hence
the one-time `chown` above. Skip it on an upgrade and the portal still serves,
but every write fails with `[portal] failed to persist …` on the container's
stdout and history/errors silently stop surviving restarts. Verify after any
redeploy: `ssh speakeasy "docker exec mca-portal sh -c 'id -u && touch /app/data/.wtest && rm /app/data/.wtest && echo writable'"`.

**Use the named volume `mca-portal-data`, not a bind mount.** The SSH addon's `/root` is not the host's `/root`, and Docker resolves bind mounts against the host — where the path does not exist and `/` is read-only. The old `-v /root/mca-portal/data:/app/data` silently never worked (the directory stayed empty and history/errors were lost on every restart); with the named volume they actually persist.

**Linking from Home Assistant:** see the header of `ha/mca_portal.yaml`. Do not add `panel_iframe` — it has been removed from HA core, and a failed integration aborts the whole package, taking the prod health sensor and phone alerts with it.

Pi-specific env vars: `LOCAL_APP_URL` points the "local" card at the PC's dev server; secrets come from the env file (real env vars override `.env.local`). The CI panel needs `gh` and stays "unavailable" in the container. To mirror dev errors to the Pi, set `DEV_PORTAL_URL=http://localhost:4321,http://192.168.1.160:4321` in the app's `.env.local` (comma-separated fan-out).
