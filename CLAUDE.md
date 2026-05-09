# Repo orientation

UrbanStems sim — Django backend + Vite/React frontend. Two halves of the repo each have their own CLAUDE.md with rules scoped to that area; this file holds repo-wide things and the routing table for area-specific docs.

## Vocabulary: facet, tag, taxonomy

The product-classification system shows up in both halves of the repo:

- **Facet** — a *dimension of classification* on Product. The project ships 5: `category`, `collection`, `occasion` (`kind=landing`, have URL-routable pages) and `color`, `stem_type` (`kind=filter`, only surface in the sidebar). Backend: rows in the `Facet` table. Frontend: `Facet` type in `frontend/api/facets/Facet.ts`, with `FacetSlug` literal union as the source for valid facet slugs.
- **Tag** — an *individual classification value* within a facet ("Birthday" tag of Occasion, "Red" tag of Color). Backend: rows in the `Tag` table with FK to Facet. Frontend: `Tag` type in `frontend/api/tags/Tag.ts`, consumed via `tagQueries.list(facetSlug?)` and `tagQueries.detail(slug)`.
- **Taxonomy** — the *system-level concept* of facets + tags + the `ProductTag` through-table. Code names use the specific term: `Facet` / `Tag` / `ProductTag` / `FacetSerializer` / `TagSerializer` / `tagQueries` / `facetQueries`.

## Where to read before starting work

Auto-loaded CLAUDE files are not enough for area-specific work — read the relevant feature/architecture doc *first* when starting a task in any of these areas:

| Touching | Read first |
|---|---|
| `frontend/src/collections/` or `frontend/routes/collections/` | [`docs/frontend/features/collections.md`](docs/frontend/features/collections.md) |
| `frontend/src/checkout/` or `frontend/routes/checkout/` | [`docs/frontend/features/checkout.md`](docs/frontend/features/checkout.md) |
| `frontend/src/address/`, `frontend/api/places/`, anything geo | [`docs/frontend/features/places.md`](docs/frontend/features/places.md) |
| `frontend/api/` (any new query/mutation) | [`docs/frontend/architecture/data-fetching.md`](docs/frontend/architecture/data-fetching.md) |
| Any responsive sizing work | [`docs/frontend/architecture/dynamic-sizing.md`](docs/frontend/architecture/dynamic-sizing.md) + the relevant feature doc |
| `backend/products/` | [`docs/backend/features/products.md`](docs/backend/features/products.md) |
| `backend/checkout/` | [`docs/backend/features/checkout.md`](docs/backend/features/checkout.md) |
| `backend/places/` | [`docs/backend/features/places.md`](docs/backend/features/places.md) |
| Anything backend (general) | [`docs/backend/architecture.md`](docs/backend/architecture.md) |

Touching an area not listed here? That's likely a doc gap — flag it.

## Doc layout

`docs/` is organized for selective reading:

- `docs/frontend/architecture/` — cross-cutting frontend principles (responsive sizing, data fetching). Stable; rarely changes.
- `docs/frontend/features/<area>.md` — current state of one feature. Updated when the feature changes.
- `docs/backend/` — same shape (one architecture file + per-app feature files).
- `docs/improvements/` — punch lists of remaining work, organized by area. Not explanations.

See [`docs/README.md`](docs/README.md) for the principles behind this layout.
