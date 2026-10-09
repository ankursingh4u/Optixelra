# Optixelra — deployment

Live at **https://optixelra.onkra.online** on Coolify (`coolify.solnix.store`,
VPS `173.212.233.194`). Deployed 2026-10-09. Coolify 4.3.23.

## Coolify resources

| Resource | UUID | Notes |
|---|---|---|
| Project | `h52igwhqddnes82qzjblvipd` | "Optixelra" |
| Environment | `xdktmzmowws8askkx4pkrc57` | `production` |
| Server | `myfwitwdjhljv0ksumbn9vqq` | `localhost` (the Coolify host) |
| Application | `1pqzhwulkwvow8290acvwhuq` | `optixelra` |
| Database | `dzuvvb3cp12z45imqjppqynb` | `optixelra-postgres` (standalone PostgreSQL) |

Do **not** copy UUIDs from a sibling app (ImageAi Max, PixelPro Max, ImageBoost
SEO) — they address *that* app's container and database, and the sibling
`Session` rows hold access tokens issued to a different `client_id`.

## How it's wired

- **Source:** public GitHub repo `ankursingh4u/Optixelra`, branch `main`, build
  pack **dockerfile**. No deploy key or GitHub App — the repo is public, so
  Coolify clones it anonymously. Pushing `main` does **not** auto-redeploy (no
  git webhook is configured); trigger a deploy explicitly (Coolify UI, or
  `POST /api/v1/deploy?uuid=1pqzhwulkwvow8290acvwhuq`).
- **Port:** container listens on `3000`; health check `GET /healthz`.
- **Migrations:** the container start command is `prisma migrate deploy &&
  react-router-serve` (see `Dockerfile` → `npm run docker-start`). Because the
  health check only passes once the server is serving, a healthy container is
  proof the migration applied. The DB holds the `0001_init` baseline.
- **Database URL:** set as a runtime env var in Coolify, using the Postgres
  resource's **internal** hostname (the container UUID above) over Coolify's
  Docker network. It is not reachable from outside the host.
- **DNS:** `optixelra.onkra.online` resolves to `173.212.233.194` via a
  wildcard A record on `onkra.online`. Coolify issues the Let's Encrypt
  certificate only once the record resolves, so a missing record shows up as a
  TLS failure rather than a 404.

## Secrets (NOT in git)

Set as **runtime** environment variables on the `optixelra` application in
Coolify: `SHOPIFY_API_KEY`, `SHOPIFY_API_SECRET`, `SHOPIFY_APP_URL`, `SCOPES`,
`SHOPIFY_APP_HANDLE`, `DATABASE_URL`, `OPENAI_API_KEY`. The Postgres password is
stored on the database resource in Coolify. None of these live in the repo.

All seven are set with `is_buildtime = false`. Keep it that way: Coolify's
default for a new variable is build-time **and** runtime, and a build-time
variable is passed to `docker build` as an ARG, where it persists in the image
layer history. Nothing in the Dockerfile needs any of these at build time —
`prisma generate` reads only `schema.prisma`, and `react-router build` bundles
without executing the server modules.

Note the API field is spelled **`is_buildtime`**, not `is_build_time`. Posting
the latter is accepted silently and leaves the variable build-time, which is
how these got created wrong on the first attempt here and had to be patched.
Verify with `GET /api/v1/applications/1pqzhwulkwvow8290acvwhuq/envs` after any
change rather than trusting the write response.

Coolify also auto-creates a second, preview-deployment copy of each variable
(`is_preview = true`) that keeps the platform defaults — those show
`is_buildtime = true`. They are inert while no preview deployments are
configured; if preview deploys are ever enabled, fix their flags too.

## Shopify app config — pushed

`shopify.app.toml` (redirect URLs, scopes, webhook subscriptions incl. the
mandatory compliance webhook) was pushed on 2026-10-09 with
`shopify app deploy --allow-updates`, released as version **`optixelra-2`**
under org **SDLC LIMITED** (`232511680`), app `433497538561`, client_id
`2ffbbea15200e1219194c9a1b70efb2a`.

Re-run that command after **any** edit to `shopify.app.toml` — editing the file
alone changes nothing on Shopify's side. It needs `SHOPIFY_APP_AUTOMATION_TOKEN`
in the environment and is non-interactive only when given `--allow-updates`
(or `--no-release` / `--allow-deletes`).

`Update URLs: No` in `shopify app info` is intentional — it reflects
`automatically_update_urls_on_dev = false`, which stops `shopify app dev` from
overwriting the production URLs with a tunnel address.

## Still required before App Store launch

1. **Create the Managed Pricing plans** in the Dev Dashboard — `Free`,
   `Starter`, `Growth`, `Pro` (+ `… Annual`), names matching
   `app/plans.server.js` byte-for-byte. **The Free plan is mandatory** or a
   reviewer on a dev store hits an impassable pricing wall.
2. **Confirm `SHOPIFY_APP_HANDLE` — treat this as unresolved.** It is set to
   the assumed `optixelra`, but the release came back named **`optixelra-2`**,
   which is exactly the shape Shopify produces when it appends a suffix on a
   name collision (previous builds became `optipix-3` and `imageboost-seo-1`).
   The suffix may just be a version counter — the sibling's first release was
   `imageai-max-initial` — so the two cases are indistinguishable from the CLI:
   `shopify app info` does not print the handle, `shopify app env show` does
   not include it, and the deploy bundle manifest records `"handle": ""`.
   Resolve it by reading a real install URL
   (`/store/<store>/apps/<handle>/…`) or the Dev Dashboard, then update the
   Coolify env var. A wrong handle 404s every pricing CTA. At runtime the app
   prefers the handle Shopify itself reports
   (`currentAppInstallation.app.handle`) and only falls back to this variable —
   but the fallback is used exactly when the pricing wall renders, so it still
   has to be right.
3. **Rotate `SHOPIFY_API_SECRET`** — the secret for client_id
   `2ffbbea15200e1219194c9a1b70efb2a` was shared in plaintext during setup.
   Rotate it in the Dev Dashboard and update the Coolify env var. The
   `SHOPIFY_APP_AUTOMATION_TOKEN` was shared the same way and should be rotated
   with it.
4. **Give `OPENAI_API_KEY` its own key.** The key set here is the same one
   shared during setup and is in use by sibling builds. One key across several
   apps shares a single quota and a single rate limit, so one app's run
   degrades every other app's alt text to the product-title fallback — silently,
   because an over-quota key still authenticates.
5. **Set `SUPPORT_EMAIL`** — currently unset, so the public `/privacy` page has
   no contact address. App Store review requires one.
6. **Install on a dev store and walk the app** — the embedded routes
   (optimizer, analytics, alt text, page speed, billing) need a real session and
   cannot be exercised from outside the Shopify iframe. Use the "Test API key"
   button on the Alt text page to confirm `OPENAI_API_KEY` reaches OpenAI: an
   unfunded key still authenticates, so the feature silently degrades to a
   "&lt;product title&gt; - product image" fallback rather than erroring.
