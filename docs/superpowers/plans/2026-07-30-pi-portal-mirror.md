# Pi Portal Mirror Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The MCA dev portal running 24/7 in Docker on the Pi (full mirror: prod + this PC's dev server), dev errors fanned out to both portals, and an HA sensor + phone alert on prod unhealthy.

**Architecture:** Reuse `tools/dev-portal` unchanged except three tiny compatibility edits (env overlay, `LOCAL_APP_URL`, error fan-out). Deploy with the alpaca-bot pattern over the `speakeasy` SSH alias (192.168.1.160:22222, root). HA package YAML with a REST sensor on `/api/overview` and two automations to `notify.mobile_app_sm_s926u`.

**Tech Stack:** Node 20 (zero-dep portal), Docker on HA OS (aarch64), HA packages (`!include_dir_named packages` already configured), Windows firewall for inbound :3000.

## Global Constraints

- Secrets (`SUPABASE_ACCESS_TOKEN`, `CRON_SECRET`) never appear in the transcript: build the Pi `.env` from a temp file assembled by a script reading `.env.local`, delete after.
- PC portal behavior unchanged by default: every new knob defaults to today's value (`http://localhost:4321`, `http://localhost:3000`).
- Fire-and-forget error forwarding: one target failing must never block/log against another.
- Pi paths: code `/root/mca-portal/src`, secrets `/root/mca-portal/.env` (root-only), data volume `/root/mca-portal/data:/app/data`. Container name `mca-portal`, `--restart unless-stopped`, port 4321.
- Local env target from the Pi: `http://192.168.1.63:3000` (this PC).
- Commits: user is sole author — NO Co-Authored-By trailers.

---

### Task 1: Repo edits (env overlay, LOCAL_APP_URL, fan-out, Dockerfile, docs)

**Files:**
- Modify: `tools/dev-portal/lib/env.mjs`, `tools/dev-portal/config.mjs:15-27`, `src/lib/logger.ts:51-72`, `src/app/api/dev/errors/route.ts:34-42`, `tools/dev-portal/README.md`, `CLAUDE.md` (portal command line)
- Create: `tools/dev-portal/Dockerfile`
- Modify (not committed): `.env.local` — append `DEV_PORTAL_URL=http://localhost:4321,http://192.168.1.160:4321`

**Interfaces:**
- Produces: `loadRepoEnv()` unchanged signature, but `process.env.SUPABASE_ACCESS_TOKEN`/`CRON_SECRET` win over file values; `ENVIRONMENTS[0].baseUrl` honors `process.env.LOCAL_APP_URL`; both error forwarders accept comma-separated `DEV_PORTAL_URL`.

- [ ] **Step 1:** `tools/dev-portal/lib/env.mjs` — replace the body of `loadRepoEnv()` so the file read is best-effort and real env vars overlay it:

```js
export function loadRepoEnv() {
  const env = {}
  let raw = ''
  try {
    raw = readFileSync(join(REPO_ROOT, '.env.local'), 'utf8')
  } catch {
    // No repo .env.local (e.g. running in the Pi container) — env vars only.
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    env[key] = value
  }
  // Real environment variables win (the container has no .env.local).
  for (const key of ['SUPABASE_ACCESS_TOKEN', 'CRON_SECRET']) {
    if (process.env[key]) env[key] = process.env[key]
  }
  return env
}
```

- [ ] **Step 2:** `tools/dev-portal/config.mjs` — above `ENVIRONMENTS`, add `const LOCAL_APP_URL = process.env.LOCAL_APP_URL || 'http://localhost:3000'`; in the `local` entry set `baseUrl: LOCAL_APP_URL` and the Open-app link to `` `${LOCAL_APP_URL}/dashboard/` ``.
- [ ] **Step 3:** `src/lib/logger.ts` `forwardToDevPortal` — fan out:

```ts
    const targets = (process.env.DEV_PORTAL_URL || 'http://localhost:4321').split(',')
    const payload = JSON.stringify({
      source: 'backend',
      kind: typeof safeError === 'object' && safeError ? safeError.name : 'logger.error',
      message: [message, typeof safeError === 'string' ? safeError : safeError?.message]
        .filter(Boolean)
        .join(' — '),
    })
    for (const target of targets) {
      const url = target.trim()
      if (!url) continue
      fetch(`${url}/api/errors`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: payload,
        signal: AbortSignal.timeout(1500),
      }).catch(() => {
        // Portal not running — drop it, never disrupt the app.
      })
    }
```

- [ ] **Step 4:** `src/app/api/dev/errors/route.ts` — replace the single forward with:

```ts
  const targets = (process.env.DEV_PORTAL_URL || 'http://localhost:4321').split(',')
  await Promise.allSettled(
    targets
      .map(t => t.trim())
      .filter(Boolean)
      .map(url =>
        fetch(`${url}/api/errors`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body,
          signal: AbortSignal.timeout(2000),
        })
      )
  )
```

- [ ] **Step 5:** `tools/dev-portal/Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 4321
CMD ["node", "server.mjs"]
```

- [ ] **Step 6:** Append `DEV_PORTAL_URL=http://localhost:4321,http://192.168.1.160:4321` to `.env.local` (not committed). Add a "Raspberry Pi deployment" section to `tools/dev-portal/README.md` with the Task 2 commands and env-var table (`LOCAL_APP_URL`, `SUPABASE_ACCESS_TOKEN`, `CRON_SECRET`, `PORT`); update CLAUDE.md's `npm run portal` line to mention the Pi mirror at `http://192.168.1.160:4321`.
- [ ] **Step 7:** Smoke: `node -e "process.env.CRON_SECRET='x'; const m = await import('./tools/dev-portal/lib/env.mjs'); const e = m.loadRepoEnv(); if (e.CRON_SECRET !== 'x') throw new Error('overlay failed'); console.log('overlay ok')" --input-type=module`. Restart the PC portal (kill the `node .../server.mjs` process, relaunch `wscript tools/dev-portal/data/start-portal.vbs`), confirm `http://localhost:4321/api/meta` still 200 and overview shows both envs. `npx tsc --noEmit` + `npm run lint` for the src/ edits.
- [ ] **Step 8:** Commit: `feat(portal): env overlay + LOCAL_APP_URL + dev-error fan-out + Dockerfile (Pi mirror support)`

---

### Task 2: Deploy the container to the Pi

**Files:**
- Pi: `/root/mca-portal/{src,data,.env}` via `speakeasy` SSH alias

- [ ] **Step 1:** `ssh speakeasy "mkdir -p /root/mca-portal/src /root/mca-portal/data"`, then copy code (NOT `data/`): `scp -r tools/dev-portal/server.mjs tools/dev-portal/config.mjs tools/dev-portal/Dockerfile tools/dev-portal/lib tools/dev-portal/public speakeasy:/root/mca-portal/src/`
- [ ] **Step 2:** Build the Pi `.env` without echoing secrets: a scratchpad Node script reads `.env.local`, writes a temp file containing exactly `SUPABASE_ACCESS_TOKEN=…`, `CRON_SECRET=…`, `LOCAL_APP_URL=http://192.168.1.63:3000`; `scp` it to `speakeasy:/root/mca-portal/.env`; `ssh speakeasy "chmod 600 /root/mca-portal/.env"`; delete the temp file.
- [ ] **Step 3:** `ssh speakeasy "cd /root/mca-portal/src && docker build -t mca-portal ."`
- [ ] **Step 4:** `ssh speakeasy "docker rm -f mca-portal 2>/dev/null; docker run -d --name mca-portal --restart unless-stopped -p 4321:4321 --env-file /root/mca-portal/.env -v /root/mca-portal/data:/app/data mca-portal"`
- [ ] **Step 5:** Verify from the PC: `Invoke-RestMethod http://192.168.1.160:4321/api/meta` → `hasCronSecret: true`, `hasSupabaseToken: true`; `/api/overview` → prod `status: healthy`.
- [ ] **Step 6:** Local-env reachability: `ssh speakeasy "curl -s -o /dev/null -w '%{http_code}' --max-time 8 http://192.168.1.63:3000/api/health/live/"` → expect 200. If it times out, add the firewall rule on the PC: `New-NetFirewallRule -DisplayName 'Next dev 3000 (LAN)' -Direction Inbound -Protocol TCP -LocalPort 3000 -Profile Private -Action Allow` (needs elevation — if the shell isn't elevated, surface the exact command to the user instead of failing silently), then re-test.
- [ ] **Step 7:** `ssh speakeasy "docker inspect mca-portal --format '{{.HostConfig.RestartPolicy.Name}}'"` → `unless-stopped`; `docker restart mca-portal` then `/api/meta` 200 again.

---

### Task 3: HA package (sensor + alerts)

**Files:**
- Create: `tools/dev-portal/ha/mca_portal.yaml` (committed to the repo as the canonical copy)
- Pi: scp to `/config/packages/mca_portal.yaml`, then config check + core restart

- [ ] **Step 1:** Write `tools/dev-portal/ha/mca_portal.yaml`:

```yaml
# MCA dev-portal mirror on this Pi (container mca-portal, port 4321).
# NOTE: if the portal container itself dies, sensor.mca_prod_health goes
# 'unavailable' and the down-alert fires — that's intentional (monitoring died).
#
# Dashboard card — paste into any dashboard as a Manual card:
#   type: entities
#   title: MCA App Health
#   entities:
#     - entity: sensor.mca_prod_health
#       name: Production status
#     - entity: binary_sensor.mca_prod_healthy
#       name: Prod healthy
#
sensor:
  - platform: rest
    name: MCA Prod Health
    unique_id: mca_prod_health
    resource: http://192.168.1.160:4321/api/overview
    method: GET
    scan_interval: 60
    timeout: 30
    value_template: >-
      {{ (value_json.environments | selectattr('key','eq','prod') | list | first).status }}
    json_attributes_path: "$.environments[1]"
    json_attributes:
      - key
      - name
      - checks

binary_sensor:
  - platform: template
    sensors:
      mca_prod_healthy:
        friendly_name: MCA Prod Healthy
        device_class: connectivity
        value_template: "{{ is_state('sensor.mca_prod_health', 'healthy') }}"

automation:
  - id: mca_prod_unhealthy
    alias: MCA prod unhealthy
    mode: single
    trigger:
      - platform: state
        entity_id: binary_sensor.mca_prod_healthy
        to: "off"
        for: "00:05:00"
    action:
      - service: notify.mobile_app_sm_s926u
        data:
          title: "MCA prod is DOWN"
          message: >-
            Status: {{ states('sensor.mca_prod_health') }}.
            Portal: http://192.168.1.160:4321

  - id: mca_prod_recovered
    alias: MCA prod recovered
    mode: single
    trigger:
      - platform: state
        entity_id: binary_sensor.mca_prod_healthy
        from: "off"
        to: "on"
        for: "00:02:00"
    condition:
      # Only announce recovery if a down-alert actually went out since the last recovery.
      - condition: template
        value_template: >-
          {{ state_attr('automation.mca_prod_unhealthy','last_triggered') is not none
             and (state_attr('automation.mca_prod_recovered','last_triggered') is none
                  or state_attr('automation.mca_prod_unhealthy','last_triggered')
                     > state_attr('automation.mca_prod_recovered','last_triggered')) }}
    action:
      - service: notify.mobile_app_sm_s926u
        data:
          title: "MCA prod recovered"
          message: "Production health is back to healthy."
```

- [ ] **Step 2:** `scp tools/dev-portal/ha/mca_portal.yaml speakeasy:/config/packages/mca_portal.yaml`
- [ ] **Step 3:** `ssh speakeasy "ha core check"` → valid; then `ssh speakeasy "ha core restart"` and wait for HA to come back (`until curl -s http://192.168.1.160:8123 ...` via a background wait, ~1–2 min).
- [ ] **Step 4:** Verify entities from inside the SSH add-on (SUPERVISOR_TOKEN is auto-provided): `ssh speakeasy "curl -s -H \"Authorization: Bearer \$SUPERVISOR_TOKEN\" http://supervisor/core/api/states/sensor.mca_prod_health"` → `state: "healthy"`, attribute `key: "prod"` (confirms `$.environments[1]` is prod); same for `binary_sensor.mca_prod_healthy` → `on`.
- [ ] **Step 5:** Test the phone push without an outage: `ssh speakeasy "curl -s -X POST -H \"Authorization: Bearer \$SUPERVISOR_TOKEN\" -H 'Content-Type: application/json' -d '{\"entity_id\":\"automation.mca_prod_unhealthy\"}' http://supervisor/core/api/services/automation/trigger"` (bypasses the trigger/for — actions run). User confirms the notification arrived.
- [ ] **Step 6:** Commit: `feat(portal): HA package — prod health sensor + phone alerts (deployed to Pi)`

---

### Task 4: End-to-end verification + wrap-up

- [ ] **Step 1:** Error fan-out proof: with the dev server running (it reloads `.env.local` automatically), trigger one backend dev error (e.g. `Invoke-RestMethod http://localhost:3000/api/dev/errors/ -Method POST -Body '{"source":"frontend","kind":"e2e-check","message":"pi mirror fan-out test"}' -ContentType 'application/json'`), then confirm the message appears in BOTH `http://localhost:4321/api/errors` and `http://192.168.1.160:4321/api/errors`.
- [ ] **Step 2:** Local-env truth: stop nothing — confirm Pi portal overview shows `local` reflecting the PC dev server's actual state (up).
- [ ] **Step 3:** Update memory (`deployment-testing.md`): Pi mirror URL, container name/paths, HA entities/automations, the `speakeasy` alias, firewall rule if added.
- [ ] **Step 4:** PushNotification: goal complete — Pi portal live + HA alerts armed.
