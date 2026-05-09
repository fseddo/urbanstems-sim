# Frontend rules

Auto-loaded under `frontend/`. Rules only — for rationale and worked examples, follow the link at the bottom of each section.

For the project's facet/tag/taxonomy vocabulary, see the root `CLAUDE.md`.

## Data fetching

- All HTTP goes through TanStack Query. Never call `request()` or `fetch()` directly from a component or route.
- GETs and content-keyable POSTs → `queryOptions` in `frontend/api/<resource>/<resource>Queries.ts`. Filename always carries the resource prefix; never bare `queries.ts`.
- One-shot side effects with no natural cache key → `useMutation`. Two placement patterns:
  - Backend-API mutations co-locate in `<resource>Queries.ts` exported as `<resource>Mutations`.
  - Mutations needing React hook context (Stripe, router, atoms) live as custom hooks under `frontend/src/<area>/use<Action>.ts`. See [`useConfirmPayment`](src/checkout/useConfirmPayment.ts).
- Route loaders use `context.queryClient.ensureQueryData(fooQueries.thing(args))`.
- Status reads from `useIsFetching` / `useQuery(...).isPending` / `mutation.isPending` — never hand-rolled `submitting`/`loading` booleans.
- Use [`createQueryParams`](api/createQueryParams.ts) to build query strings + queryKeys. One call returns both `queryString` (path) and `key` (queryKey).
- Render-blocking data → fetch in the route's `loader` (or `beforeLoad` if it gates / can redirect), not `useQuery` + skeleton.
- Whenever a request is in flight, surface a loader (button spinner, skeleton, inline pending) — read pending state from the source of truth.

Deep dive: [`docs/frontend/architecture/data-fetching.md`](../docs/frontend/architecture/data-fetching.md).

## State

`useState` is fine for genuinely local, ephemeral UI state. It is NOT the default. Before adding one, check whether an existing primitive already answers:

- _Loading / pending?_ → `useIsFetching` / `useQuery(...).isPending` / `mutation.isPending` / `useRouterState({ select: s => s.isLoading })`.
- _Shared across routes / unmounts?_ → Jotai atom. Survives reload? `atomWithStorage`.
- _Filter / sort / page state?_ → URL search params via the route's `validateSearch`.
- _Server data?_ → query cache via `useQuery` / `Route.useLoaderData()`.

A `useState` mirroring something already in a query, atom, or URL is a bug — the two desync. If you find yourself writing `useEffect` to keep them in sync, delete the `useState` and read from the source.

**Hoist popup/modal/sheet visibility state to the parent.** The component takes `onClose`; the parent owns the `useState`. Reference: [`TestCardPopup`](src/checkout/TestCardPopup.tsx).

**`useEffect` is for side effects only** — subscribing to events you can't attach via JSX, mutating outside React, async setup with cleanup. Not for "react to state by setting other state" (that's a smell pointing at hoisting state, deriving instead, or moving the logic into the event handler).

## Naming

Names match the reader's expectation from the name alone — no hovering for types, no learning local jargon. Three places this comes up:

- **Functions** → name the *operation*: `asString(v)`, `formatCents`, `parseUIFiltersSearch`. Not the call site (`stringParam`) or the return type (`stringOrUndefined`).
- **Variables and value props** → name what the value *is*: `columnCount: number` over `columns: number` (which reads as an array). `selectedTagSlug` over `selectedTag` when the value is the slug.
- **Boolean props** → name the *action*: `withBackdrop`, `includeShopAll`, `hasIcon`, `showCount` over `pill`, `chip`, `slim`. Verb prefix signals it's a toggle. Avoid structural jargon (`leaf`, `head`, `tail`).

References: [`columnCount` in CollectionPage](src/collections/CollectionPage.tsx), [`NavigationBreadcrumbs`](src/common/components/NavigationBreadcrumbs.tsx).

## Reuse and derive types

When the same field/key list appears in two places, derive one from the other:

- **Mapped conditional types** to extract a subset of keys by value type (e.g. `TagFieldKey` in `FilterSidebar`).
- **Single-source literal unions** — define once and import (e.g. `FacetSlug` in `api/facets/Facet.ts`).
- **`Pick` / `Omit` / `Extract`** to narrow without redeclaring.
- **Generics** so callers' typed values flow through instead of widening (e.g. `TagSection<T extends string>`).

**Derive types, not values.** `useState<FeaturedCategorySlug>('flowers')` has the same type safety as `useState<FeaturedCategorySlug>(FEATURED_CATEGORY_SLUGS[0])`. Don't add indirection for its own sake — name a constant if the position is semantic (`const DEFAULT_CATEGORY = 'flowers'`).

## Function syntax

- **Arrow functions** for all declarations including React components: `const Foo = (props: Props) => {}`. Never `function Foo() {}`.
- **One component per file** by default. Route files in `frontend/routes/` are thin (types, route definition, page-component import); the page component lives under `frontend/src/<area>/`.
- **Drop `async`** from arrow functions whose body is a single returned promise: `() => request(...)` is enough. Before stripping, verify the absence of `await`/`try` is intentional, not a missed transform.

For TanStack Query `queryFn`s, `() => request(...)` is canonical: errors belong to `useQuery({}).error`, transforms belong to `select`.

## className concatenation

- **Use [`tw()`](src/common/utils/tw.ts)** for any className combining multiple values or conditionals. Pass each fragment as a separate argument; never template-literal concat.
- **Once a className gains responsive variants or arbitrary sizing values, reach for `tw()` even with no conditionals** — group arguments by *purpose* (visual identity / layout / responsive type), not by breakpoint.
- **Use only colors from the existing palette** in [`globals.css`](src/globals.css): `background`, `background-alt`, `foreground`, `brand-primary`, `footer`, plus their opacity variants and black/white. New colors require a token in `:root` + `@theme inline` — ask first.

Deep dive: [`docs/frontend/architecture/styling.md`](../docs/frontend/architecture/styling.md).

## Motion

Anything entering or leaving the UI must transition — never pop. Default to a **fade** (`transition-opacity duration-200`, matching the codebase's `--animate-fade-in/out` 200ms tokens in [`globals.css`](src/globals.css)); use a **slide transform** when motion direction carries meaning (drawers, sheets, top-arriving bars).

- **Slot stays reserved** → keep mounted, toggle `opacity-0 pointer-events-none` with `transition-opacity`. Cleanest path; no reflow.
- **Element must leave the DOM** → delayed-unmount state machine. `exiting` flag → `setTimeout(FADE_DURATION_MS)` → unmount. Reference: [`DatePicker`](src/date/DatePicker.tsx).
- **Hiding would reflow neighbors** → hold the slot via flex/grid sizing or `visibility: hidden` so the fade plays clean before layout changes.
- **Content collapses / expands in place** (accordion section, info panel, sidebar dropdown) → use [`<CollapsiblePanel open={…}>`](src/common/components/CollapsiblePanel.tsx). Wraps content in a `grid-template-rows: 0fr ↔ 1fr` transition so any content height slides cleanly without measuring. Polymorphic via `as` for semantic outer elements.

Deep dive: [`docs/frontend/architecture/dynamic-sizing.md`](../docs/frontend/architecture/dynamic-sizing.md) — "Mount/unmount fade-in/out pattern".

## Extract when repetition is real

Don't abstract on the first instance — you don't know the variation surface yet. **At 3+ near-identical bodies** (JSX blocks, conditionals, helpers), extract a small reusable component or helper. Trigger is *observed* repetition, not anticipated future use.

Recently landed: [`useDismissable`](src/common/hooks/useDismissable.ts), [`useMediaQuery`](src/common/hooks/useMediaQuery.ts), [`imageAtWidth`](src/common/utils/imageAtWidth.ts), [`prefetchImages`](src/common/utils/prefetchImages.ts), [`asString`](src/common/utils/asString.ts).

## Other conventions

- Don't hand-edit `frontend/routes/routeTree.gen.ts` (Vite rebuilds it).
- Persistent client state → Jotai `atomWithStorage`. **If a loader reads an `atomWithStorage` atom, declare it with `{ getOnInit: true }`** — default only hydrates on React mount, so loaders see the initial value on hard refresh.
- Frontend env vars in `frontend/.env`. Stripe setup → [`docs/frontend/features/checkout.md`](../docs/frontend/features/checkout.md). Address/places → [`docs/frontend/features/places.md`](../docs/frontend/features/places.md).
