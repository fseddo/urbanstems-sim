# Frontend Data Fetching

How the frontend talks to our Django API, why it's structured the way it is, and what to follow when adding a new endpoint.

## The rule

**Every HTTP call from the frontend goes through TanStack Query.** GETs are `queryOptions`, side-effecting one-shots (submit, delete, login) are `useMutation`. Components and route loaders never call `request()` or `fetch()` directly.

Concretely:

- The shared HTTP client is [`frontend/api/request.ts`](../../../frontend/api/request.ts) — wraps `fetch`, parses Django/DRF errors, throws a typed `Error`.
- Per-resource queries live in `frontend/api/<resource>/<resource>Queries.ts` (see [products](../../../frontend/api/products/productQueries.ts), [places](../../../frontend/api/places/placeQueries.ts), [checkout](../../../frontend/api/checkout/checkoutQueries.ts)).
- Each file exports two objects: `<resource>Keys` (query-key builders) and `<resource>Queries` (the `queryOptions` factories that wrap `request()` in their `queryFn`).

## Why a query, even for POSTs

Most of our endpoints are GETs and queries are the obvious fit. The non-obvious case is `createPaymentIntent` — it's a POST that creates a server resource, but the result is fully determined by cart contents (slug + qty pairs). That makes it keyable, which means:

- **Dedup**: rapid re-entries to `/checkout` don't fire a second PaymentIntent creation; the second `ensureQueryData` returns the cached one.
- **Cache invalidation by content**: if the cart changes, the key changes, and a new intent is created automatically — no manual invalidation.
- **Status is observable everywhere**: the cart pane reads `useIsFetching({ queryKey })` to show its CHECKOUT spinner while the route loader's `ensureQueryData` is in flight.

If a POST has no natural cache key (form submission, login, "delete this thing"), it's a `useMutation`, not a `queryOptions`. The dividing line is: *would calling this twice with the same input be wasteful?* If yes → query. If no (or it's an imperative "do the thing now") → mutation.

## How route loaders consume queries

TanStack Router loaders receive `context.queryClient` (wired up at [`__root.tsx`](../../../frontend/routes/__root.tsx) via `createRootRouteWithContext<{ queryClient }>`). To pre-fetch in a loader:

```ts
loader: async ({ context }) => {
  const data = await context.queryClient.ensureQueryData(
    fooQueries.thing(args)
  );
  return { data };
}
```

`ensureQueryData` is the loader-friendly call: returns cached data if fresh, fetches if not, dedupes concurrent calls. The component then reads via `Route.useLoaderData()` and the same data is also reachable elsewhere via `useQuery(fooQueries.thing(args))` — same cache, same key.

## Reading status outside the route

Anywhere in the app can observe whether a query is in flight without owning the data:

```ts
const isLoading = useIsFetching({ queryKey: fooKeys.thing(args) }) > 0;
```

This is what the cart pane uses to drive its CHECKOUT button spinner during the `/checkout` loader's intent fetch.

## Anatomy of a queries file

Match the existing pattern. From [`checkoutQueries.ts`](../../../frontend/api/checkout/checkoutQueries.ts):

```ts
import { queryOptions } from '@tanstack/react-query';
import { request } from '../request';

export interface CreatePaymentIntentResponse { /* ... */ }

export const checkoutKeys = {
  all: ['checkout'] as const,
  paymentIntents: () => [...checkoutKeys.all, 'payment-intent'] as const,
  paymentIntent: (lines: CartLine[]) =>
    [...checkoutKeys.paymentIntents(), lineHash(lines)] as const,
};

export const checkoutQueries = {
  paymentIntent: (lines: CartLine[]) =>
    queryOptions({
      queryKey: checkoutKeys.paymentIntent(lines),
      queryFn: () =>
        request<CreatePaymentIntentResponse>({ /* ... */ }),
      staleTime: Infinity,
    }),
};
```

Conventions:
- **Hierarchical query keys.** `['resource'] → ['resource', 'list'] → ['resource', 'list', filtersHash]`. Lets you invalidate at any granularity (`queryClient.invalidateQueries({ queryKey: checkoutKeys.all })` nukes everything checkout-related).
- **Stable, content-derived keys.** Don't use object references — use a hash/sorted-string or let React Query's deep-equality match the same shape.
- **Types co-located.** Request/response types live in the queries file unless the type is shared widely (then split into a sibling file like [`Product.ts`](../../../frontend/api/products/Product.ts)).
- **`staleTime` matches the data's actual volatility.** Cart-keyed PaymentIntents → `Infinity` (cart is the cache key). Listings the user might refresh → default 5 min from [`main.tsx`](../../../frontend/src/main.tsx).

## Mutations

For non-keyable side effects, use `useMutation`. Pattern:

```ts
const submitOrder = useMutation({
  mutationFn: (input: SubmitInput) =>
    request<SubmitResponse>({ method: 'post', path: '/orders/', body: input }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
});

submitOrder.mutate(input);  // submitOrder.isPending while in flight
```

See **Mutation placement** below for where each kind of mutation lives.

## Patterns worth knowing

These are patterns the codebase already uses; mirror them when adding new endpoints rather than inventing alternatives.

- **Hierarchical query keys.** `all → lists → list(filters) → details → detail(slug)`. Lets consumers invalidate at any granularity (`queryClient.invalidateQueries({ queryKey: fooKeys.all })` nukes the whole resource; `fooKeys.detail(slug)` invalidates one row).
- **Stable hash for content-derived keys** — when a POST is keyable on its body (e.g. `checkoutQueries.paymentIntent` keyed on sorted `slug:qty` pairs), include the hash in the key. Same payload → same cache entry → dedupe across mounts.
- **`staleTime` chosen per data volatility, not per default.** Examples: `places.detect` is `Infinity` (geolocation rarely changes within a session); `places.autocomplete` 5m; `places.details` 24h; `checkout.paymentIntent` `Infinity` (cart hash is the cache key, content-keyed). The default `staleTime` from [`main.tsx`](../../../frontend/src/main.tsx) is fine for "listings the user might refresh."
- **Deep-equal cache keys via `createQueryParams(...).key`** — the helper returns a `key` value that TanStack Query deep-equals, so a single object stand-in works in place of a long tuple. Adding a new filter dimension only touches the input shape, not every queryKey site.
- **Loader returns a discriminated union** — e.g. `{ kind: 'ok', intent } | { kind: 'error', message }`, as `/checkout/` does. Pushes error/redirect handling into the loader without making the component branchy.
- **`Promise.all` of multiple `ensureQueryData` calls** in one loader — the right pattern for parallel pre-fetch. `/collections/$slug` is the worked example.
- **`beforeLoad` for redirect-only routes** — `/collections/index.tsx` uses it to send `/collections` → `/collections/all` in 7 lines.

## Mutation placement

Two patterns, both codified in `CLAUDE.local.md`:

1. **Backend-API mutations** (anything going through `request()`) — co-locate in the same `<resource>Queries.ts` file, exported as `<resource>Mutations` alongside `<resource>Queries`. Co-location gives the mutation direct access to `<resource>Keys` for `queryClient.invalidateQueries` without circular imports.
2. **Mutations that need React hook context** (Stripe, router, atoms — anything depending on `useStripe()`, `useNavigate()`, etc.) — live as custom hooks under `frontend/src/<area>/use<Action>.ts`. The hook calls the relevant context hooks alongside `useMutation`. Reference: [`useConfirmPayment`](../../../frontend/src/checkout/useConfirmPayment.ts).

## What not to do

- **Don't** import `request` directly into a component or route. If you find yourself doing it, you're reinventing a query.
- **Don't** create a `*Api.ts` with bare functions returning promises. The historical `checkoutApi.ts` was deleted for this reason — it bypassed the query layer.
- **Don't** put route-loader fetches outside TanStack Query (no plain `await fetch(...)`, no plain `await request(...)`). Use `queryClient.ensureQueryData` so the rest of the app can observe the same data and status.
