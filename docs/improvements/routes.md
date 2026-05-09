# `frontend/routes/` — improvements

Punch list for the routes layer.

## Pending

- **`success.tsx:setCart([])`** — already moved into the loader on `'succeeded'`; keep an eye on it (regression-prone if a future refactor reverts the loader path).

## Deferred

### `document.title` standardization

The 5 sites have intentional structural variation (brand-first on home, SEO multi-segment on collections, server-overridable `page_title`, " Flower Delivery" tail on products) that a thin `setPageTitle()` helper can't capture. Better path: address at the scraper level for product titles (`page_title` server-side analog), pin the convention once stable. Inline form is short and consistent within each route's intent for now.

## CLAUDE-rule candidates

- **Thin route file** — types, route definition, search validators, loader stay in the route file; page component + helpers move out. Pending the page-component extraction pattern being used uniformly.
- **Named exports for components** (no `export default`) — pending the second offender after the recent sweep.
- **`useMemo` only when expensive or reference identity matters** — pending second offender.
- **`document.title` from the route's loader, not `useEffect` in the page** — pending docs.
