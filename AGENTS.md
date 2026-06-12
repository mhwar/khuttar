<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# خطار (Khattar) — Tourism & Study-Abroad Platform

Arabic-first (RTL) platform: Next.js 16 App Router + Tailwind v4 + shadcn/ui + Prisma 6 + PostgreSQL. Deploys to Cloudflare Workers via @opennextjs/cloudflare + Hyperdrive (see README runbook).

## Session setup (required before anything DB-related)

```bash
service postgresql start || true
# First time only:
su - postgres -c "psql -c \"CREATE ROLE khattar LOGIN PASSWORD 'khattar' CREATEDB;\"" || true
su - postgres -c "createdb -O khattar khattar" || true
pnpm prisma migrate dev && SEED_ALLOW_DESTRUCTIVE=1 pnpm db:seed
```

`pnpm dev` / `pnpm build && pnpm start`. Demo logins: `admin@khattar.sa` / `agent@khattar.sa`, password `Khattar123!`.

## Conventions (follow these)

- **No native Prisma enums / Json** — string pseudo-enums with the single source of truth in `lib/constants.ts` (values + zod enums + Arabic labels + `BOOKING_TRANSITIONS`). Keeps the SQLite fallback a one-line provider swap.
- **Dates/currency only via `lib/format.ts`** — plain `ar-SA` Intl may yield the Hijri calendar and Eastern Arabic digits; we force `ar-SA-u-ca-gregory-nu-latn` + `Asia/Riyadh`. Format dates in server components only (hydration safety).
- **Forms**: one pattern everywhere — server action `(prev, formData) => ActionState` + zod via `parseForm` (`lib/forms.ts`), consumed by `FormDialog` / `ActionForm` (field errors flow through `FormErrorsContext`). Buttons that fire bound actions returning `{ok,error}` use `ActionButton` / `ConfirmDeleteButton` (a raw `<form action>` only accepts void-returning actions).
- **Cloudflare Workers constraints**: keep `middleware.ts` named exactly that (a `proxy.ts` breaks the OpenNext build — Node middleware unsupported); `lib/db.ts` exports a per-REQUEST Prisma client (react cache + adapter-pg `maxUses:1`) — never hoist a pg pool to module scope ("Cannot perform I/O on behalf of a different request"); passwords via `lib/password.ts` (WebCrypto PBKDF2 — no `server-only` import there, seeds need it; bcrypt is gone); verify Workers behavior locally with `pnpm preview` (workerd on :8787, Hyperdrive emulated via wrangler.jsonc `localConnectionString`).
- **Authz is in layouts AND every mutating action** (`requireAdmin` / `requireAgent` / `requireApprovedAgent` from `lib/auth.ts`); `middleware.ts` is a cookie-presence UX redirect only. Agent queries always filter by their own `agentId`/`ownerAgentId`.
- **Never pass component references (e.g. lucide icons) from server to client components** — keep icon maps inside the client file (see `components/dashboard/shell.tsx`).
- **No `window` in anything that can render during a no-JS form-POST re-render** (e.g. booking success screen) — resolve relative URLs at click time (see `CopyButton`).
- RTL: `html dir=rtl` + Radix `Direction.Provider`; use logical utilities (`ms-/me-/ps-/pe-/start-/end-`), `Sheet` side="right", `dir="ltr"` on phone/email/code spans.
- Money is integer SAR; commissions rounded with `Math.round`. Ledger sign convention: balance = what the platform owes the agent (COMMISSION +, PLATFORM_FEE −, PAYOUT −, ADJUSTMENT ±). Confirm-ledger generation must stay idempotent (existence check inside the transaction in `setBookingStatus`).

## Verify after changes

```bash
pnpm lint && pnpm build
# smoke: / /programs /b/KH-CNF005 → 200 ; /admin without cookie → 307
```
