# SPEC · NWP-201 — Issue virtual cards from the console

> Written before any code. `/spec`'s skill process run manually (session's
> skill list doesn't expose `/spec`) then reviewed by a human.
> Load it as context when you build: `@docs/specs/NWP-201-issue-cards.md`

**Ticket:** [NWP-201](../tickets/NWP-201.md)
**Author:** Xavier Ruiz
**Status:** building

## Problem

Ops issues virtual cards by messaging the platform team, who create them by hand — hours of turnaround, 12-20 times a week, and a wrong spend limit shipped last month because the request lived in a Slack thread. Marcus wants this in the console today: issue a card, see the cards issued, open one to check it.

## Current state

Cards do not exist anywhere in this codebase yet.

- `src/data/types.ts` — has `Merchant`, `Payment`, `Refund`, `Dispute`, `Payout`, `Currency`, but no `Card` type or `CardStatus`.
- `src/data/store.ts` — in-memory `Store` holds `merchants`, `payments`, `refunds`, `disputes`, `payouts` off `globalThis.__northwindStore`. No `cards` array.
- `src/data/generate.ts` — deterministic `mulberry32` seed generator (`SEED = 20260813`) builds the above. No card generation.
- `src/data/queries.ts` — the one query-builder pattern (`parseFilters`, `filterPayments`, `sortPayments`, `paginate`, `queryPayments`) and lookup helpers (`paymentById`, etc.) live here. Cards need the equivalent lookup helpers, not a new pattern.
- `src/app/api/payments/route.ts` — the shape every route handler should match: parse via an allowlisted parser, return `NextResponse.json(...)`.
- `src/app/payments/page.tsx` / `src/app/payments/[id]/page.tsx` — the list/detail page shape to mirror for `/cards` and `/cards/[id]` (Table components, `StatusBadge`, server components reading the store directly).
- `src/components/Drawer.tsx`, `Button.tsx`, `Input.tsx`, `Select.tsx` — existing primitives; a card-issue dialog reuses `Drawer`, not a new modal.
- `src/lib/money.ts` — `formatMoney`, `parseAmountToMinorUnits` already do everything the limit field needs.
- `src/components/ui/payments/StatusBadge.tsx` — keyed by a `Record<AnyStatus, ...>` union; extending it for card status is smaller than a new badge component.
- `src/app/siteConfig.ts` + `src/components/ui/navigation/AppSidebar.tsx` — nav is a `baseLinks` map plus a `navigation` array; `/cards` needs an entry in both.
- `.claude/rules/cards.md` — already states the BIN, reveal-once, and state-machine rules; this spec doesn't invent anything beyond it.

## Domain rules

| Rule | Source | What breaks if ignored |
| --- | --- | --- |
| Money is integer minor units | `.claude/rules/money.md`, ticket | A `$250.00` limit stored as `250` or `"250.00"` corrupts every comparison against spend |
| Numbers generated server-side, `4242` BIN, valid Luhn | ticket, `.claude/rules/cards.md` | A client-generated or non-Luhn number is not a plausible test card and fails validation elsewhere |
| Full number returned exactly once, in the creation response | ticket, `.claude/rules/cards.md` | Storing or re-serving it turns a demo fixture into something that looks like a real PAN leak |
| Status is a state machine: `active ⇄ frozen`, either → `cancelled`, `cancelled` terminal | ticket, `.claude/rules/cards.md` | An unguarded transition lets a cancelled card come back to life |
| Validate on the server: missing merchant, limit ≤ 0, limit > 5,000,000, currency outside USD/EUR/GBP | ticket | Client-only checks are bypassed by a direct POST |
| No persistence, no DB/ORM/migration | ticket, `build-battle/CLAUDE.md` | Out of scope; NWP-203 |

## Approach

Add a `Card` type and a `cards: Card[]` array to the existing in-memory store, generated at boot (empty or lightly seeded — no seed data is required by the ticket). Add one new file, `src/lib/cardNumber.ts`, holding the Luhn generator (the ticket's only clearly test-worthy unit). Add `src/data/cardQueries.ts` alongside `queries.ts` for `cards`-specific lookups (`allCards`, `cardById`), keeping the payments query builder untouched — cards don't need filter/sort/paginate for a first cut, so `queryPayments`'s machinery isn't reused, since reusing it here would mean bolting a `Card` shape onto a `Payment`-shaped builder, which is worse than a few short accessor functions. A single `POST /api/cards` (create) and `PATCH /api/cards/[id]` (status transitions: freeze/unfreeze/cancel) cover the ticket; `GET /api/cards`/`GET /api/cards/[id]` are not needed as routes since the list/detail pages are server components reading the store directly, matching how `/payments/[id]/page.tsx` already reads `paymentById` directly rather than fetching its own API.

**Considered and rejected:** generating the card number client-side for instant UI feedback, then confirming server-side — rejected because it invites exactly the "looks generated in the browser" bug the cards rule calls out, and the reveal-once response is already fast enough that there's nothing to hide latency for.

**Considered and rejected:** storing the full card number encrypted for later "reveal" — rejected, out of scope (no persistence, ticket explicitly says reveal is one response, not a re-readable field), and there's no encryption primitive in this app to do it safely.

## File map

| File | Add or change | Why |
| --- | --- | --- |
| `src/data/types.ts` | edit | add `CardStatus`, `Card` |
| `src/data/store.ts` | edit | add `cards: Card[]` to `Store` |
| `src/data/generate.ts` | edit | return `cards: []` (no seed cards required) |
| `src/lib/cardNumber.ts` | add | Luhn check-digit + `4242`-BIN generator |
| `src/lib/cardNumber.test.ts` | add | Luhn validity + BIN prefix tests |
| `src/data/cardQueries.ts` | add | `allCards`, `cardById`, `createCard`, `setCardStatus` (the one place that mutates `store.cards`) |
| `src/app/api/cards/route.ts` | add | `POST` — validate, generate, create, return `{ card, number }` once |
| `src/app/api/cards/[id]/route.ts` | add | `PATCH` — validated status transitions |
| `src/app/cards/page.tsx` | add | list route, mirrors `payments/page.tsx` |
| `src/app/cards/issue-dialog.tsx` | add | `Drawer`-based issue form + one-time reveal screen |
| `src/app/cards/[id]/page.tsx` | add | detail route: full record, spend vs. limit, freeze/unfreeze/cancel |
| `src/app/cards/[id]/freeze-action.tsx` | add | client freeze/unfreeze/cancel control, no reload |
| `src/components/ui/payments/StatusBadge.tsx` | edit | extend `AnyStatus`/`LABELS`/`DOTS`/`VARIANTS` for `CardStatus` |
| `src/app/siteConfig.ts` | edit | add `cards: "/cards"` to `baseLinks` |
| `src/components/ui/navigation/AppSidebar.tsx` | edit | add "Cards" nav entry |

## Plan

1. **Types + store + Luhn generator** — done when: `Card`/`CardStatus` exist, `store.cards` exists, `cardNumber.test.ts` passes (`npm test`).
2. **`POST /api/cards` with full server-side validation** — done when: a curl with a valid body returns `201` with `{ card, number }`, and each invalid case (missing merchant, limit ≤ 0, limit > 5,000,000, bad currency) returns `400` with a message.
3. **`PATCH /api/cards/[id]` status transitions** — done when: `active → frozen → active` succeeds, `→ cancelled` succeeds from either, anything from `cancelled` returns `409`, unknown id returns `404`.
4. **`/cards` list + `/cards/[id]` detail pages** — done when: both render against real store data, masked everywhere except the one-time reveal, spend-vs-limit visible on detail.
5. **Issue dialog + freeze/unfreeze control + nav entry** — done when: issuing a card from the UI lands it in the list, freezing/unfreezing updates without a full reload.
6. **Full verification pass** — done when: `npm test`, `npm run lint`, `npm run build` all pass clean.

## Verification

| Acceptance criterion | How it is proven |
| --- | --- |
| Issue a card via form/dialog, appears in list | Manual: issue via UI, see it in `/cards` |
| `/cards` list: nickname, merchant, masked number, limit, status, created date | Manual + read of the table columns |
| Card detail: full record + spend vs. limit | Manual: open a card, read the detail page |
| Numbers generated server-side, `4242` BIN, valid Luhn | `cardNumber.test.ts`; number never appears in client code |
| Reveal once, mask forever | Manual: reload detail after creation, confirm `•••• 4242` only; grep confirms no route but `POST /api/cards` ever returns the full number |
| Server-side validation (missing merchant, limit ≤ 0, limit > 5,000,000, bad currency) | curl each invalid case against `POST /api/cards` directly, bypassing the UI |

## Risks

- Time-boxed at 45 minutes; stretch goals (category lock, written empty/error states beyond the default) may not all land — core six criteria take priority in the plan order above.

## Out of scope

- Persistence (DB/ORM/migrations) — NWP-203.
- Auth, roles, permissions.
- Real card network calls.
- Editing a limit after issue — NWP-202.

## Open questions

- None — the ticket and `.claude/rules/cards.md` fully specify the rules needed to build this.
