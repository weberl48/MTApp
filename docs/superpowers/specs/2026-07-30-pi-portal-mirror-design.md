# Dev Portal on the Raspberry Pi (Full Mirror + HA Alerts) — Design Spec

**Date:** 2026-07-30
**Goal:** Run the MCA dev portal 24/7 on the Raspberry Pi (Home Assistant OS, `192.168.1.160`) as a full mirror — prod checks always on, "local" pointed at this PC's dev server, dev errors fanned out to both portals — with a Home Assistant sensor + phone alert when production goes unhealthy.
**Pattern:** identical to the alpaca-bot deployment (scp → docker build/run over the `speakeasy` SSH alias, HA package YAML with REST sensor + `notify.mobile_app_sm_s926u`).

## Decisions (settled with the user)

- **Scope:** full mirror (both environments), not a prod-only monitor. The PC's portal at `:4321` stays untouched in behavior.
- **HA alerting:** yes — phone push when PROD is unhealthy for 5 minutes; recovery push. Local/dev state never alerts.
- Out of scope: portal auth/HTTPS (LAN only), `gh`-backed CI panel on the Pi (card degrades gracefully), alert tuning beyond the 5-minute rule.

## 1. Repo changes (all small, keep PC behavior identical by default)

- **`tools/dev-portal/lib/env.mjs`** — `loadRepoEnv()` overlays `process.env` on top of file values for the two keys the portal uses (`SUPABASE_ACCESS_TOKEN`, `CRON_SECRET`): file read stays; any key present in `process.env` wins. Container needs no `.env.local`.
- **`tools/dev-portal/config.mjs`** — `local` environment `baseUrl` (and its "Open app" link) becomes `process.env.LOCAL_APP_URL || 'http://localhost:3000'`.
- **Dev-error fan-out** — `src/lib/logger.ts` `forwardToDevPortal()` and `src/app/api/dev/errors/route.ts` treat `DEV_PORTAL_URL` as a comma-separated list; each target gets the same fire-and-forget POST (2s timeout each, failures ignored, one failure never blocks another). Default unchanged (`http://localhost:4321`).
- **`tools/dev-portal/Dockerfile`** (new) — `node:20-alpine`, copy the portal directory, `EXPOSE 4321`, `CMD ["node", "server.mjs"]`. `data/` expected as a volume.
- **PC env** — `.env.local` gains `DEV_PORTAL_URL=http://localhost:4321,http://192.168.1.160:4321` so dev errors mirror to the Pi.
- Docs: CLAUDE.md portal line notes the Pi mirror; `tools/dev-portal/README.md` gains a "Pi deployment" section with the exact commands.

## 2. Pi deployment

```
ssh speakeasy "mkdir -p /root/mca-portal/data /root/mca-portal/src"
# copy the portal EXCLUDING data/ (the PC's history/error feed stays on the PC)
scp -r tools/dev-portal/{server.mjs,config.mjs,lib,public,Dockerfile} speakeasy:/root/mca-portal/src/
# secrets + PC address, written without echoing values to the transcript
ssh speakeasy "cat > /root/mca-portal/.env"   # stdin piped from a locally-built temp file:
#   SUPABASE_ACCESS_TOKEN=<from .env.local>
#   CRON_SECRET=<from .env.local>
#   LOCAL_APP_URL=http://192.168.1.63:3000
ssh speakeasy "cd /root/mca-portal/src && docker build -t mca-portal ."
ssh speakeasy "docker run -d --name mca-portal --restart unless-stopped \
  -p 4321:4321 --env-file /root/mca-portal/.env \
  -v /root/mca-portal/data:/app/data mca-portal"
```

Secrets land in `/root/mca-portal/.env` (root-only HA OS host). The `local` env points at the PC (`192.168.1.63:3000`); when the PC sleeps or dev isn't running, local shows down — correct, and never alerts. Windows Firewall must allow inbound 3000 from the LAN (checked during verification; added if missing as a private-profile rule for the Node dev server).

## 3. Home Assistant package (`/config/packages/mca_portal.yaml`)

- `rest` sensor → `http://192.168.1.160:4321/api/overview` every 60s. The overview returns `{ environments: [...] }`; the sensor stores the prod entry's overall status + failing-check names as attributes (exact field names taken from `lib/checks.mjs` at implementation time).
- Template binary sensor `binary_sensor.mca_prod_healthy` (device_class `problem` inverted or plain `connectivity`).
- Automation `MCA prod unhealthy` — trigger: `mca_prod_healthy` off `for: 00:05:00` → `notify.mobile_app_sm_s926u` "MCA prod is DOWN: <failing checks>". Automation `MCA prod recovered` — trigger: on after having alerted → recovery push.
- Lovelace card YAML (entities: prod status, last poll, link to `http://192.168.1.160:4321`) provided as a paste-in snippet in the package file's header comment (storage-mode dashboards aren't file-editable).
- Package deployed by `scp` to `/config/packages/` + HA config check + core restart via the Supervisor API from the SSH add-on (per the `ha-supervisor-api` skill), or `ha core restart`.

## 4. Verification

1. `http://192.168.1.160:4321` serves the portal from the LAN; prod card healthy with detail (CRON_SECRET working); local card reflects the PC dev server (up when running, down when stopped).
2. A forced dev error on the PC appears in BOTH portals' error feeds.
3. `sensor` polls populate in HA (Developer Tools → States); `binary_sensor.mca_prod_healthy` is `on`.
4. Alert path fired once via automation trigger service (phone push received) without waiting for a real outage.
5. `docker inspect mca-portal` shows `RestartPolicy: unless-stopped`; container survives `docker restart`.
6. PC portal still fully functional (its own checks + error feed).
