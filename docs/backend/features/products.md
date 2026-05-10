# Products (backend)

The `products/` app owns the catalog: products, the unified facet/tag taxonomy (categories, collections, occasions, colors, stem types), reviews, and the seed + blur-placeholder management commands that build the initial DB from `data/products.json`.

## Models

### `Product`
Basic catalog row — name, slug, prices in cents, images, badge, lead time, rating. `variant_type` is a `TextChoices` of `single` / `double` / `triple`; `base_name` groups siblings (a "single Roses" and a "double Roses" share the base name). `vase_included` is derived from product text at seed time (separate from `badge_text` after the dedicated bool was added).

`addon_type` is a nullable `TextChoices` of `vase` / `gift`. `null` means a regular bouquet; otherwise the row is an add-on (vase / gift) attachable to a parent's cart line on the frontend. Add-ons share the same `Product` table — they reuse all the catalog machinery (serializer, image fields, description, the `/api/products/<slug>/` detail endpoint) without a parallel model. `url` is nullable since add-ons don't have a marketing-site source URL.

### `Facet`
The 5 dimensions of classification on Product. Each facet is one row with `slug`, `name`, and `kind`:

| slug | name | kind |
|---|---|---|
| `category` | Category | landing |
| `collection` | Collection | landing |
| `occasion` | Occasion | landing |
| `color` | Color | filter |
| `stem_type` | Stem Type | filter |

`kind=landing` means the facet's tags have URL-routable pages (`/collections/<tag-slug>`) with their own SEO/hero metadata. `kind=filter` means the facet only surfaces in the sidebar — no individual landing pages.

The 5 rows are seeded by the data migration and re-asserted by `seed_products.py` from the `FACET_DEFS` constant in [`models.py`](../../../backend/products/models.py) (single source of truth for live state; past migrations carry their own frozen snapshots).

### `Tag`
An individual classification value within a facet. "Birthday" is a tag of the Occasion facet; "Red" is a tag of the Color facet. Schema:
- `facet` FK
- `slug`, `name`
- Landing-page metadata (only populated for landing-kind facets): `image_src`, `page_title`, `header_title`, `header_subtitle`, `nav_img_src`, `nav_description`
- `hex` (only populated for color tags)

Slug uniqueness is per-facet (composite `unique_together`). The same slug can exist across different facets (e.g., `peonies` is both a category tag and a stem_type tag — both legitimate). URL routing for `/collections/<slug>` queries with `facet__kind='landing'` to keep that namespace unambiguous.

### `ProductTag`
M2M through-table joining `Product` and `Tag`. Carries a `position` field for curated ordering within a single landing-kind tag (used by `ProductViewSet` when `?<facet>=<slug>` filters to one tag). Color/stem_type position is preserved for parity but not currently used for ordering.

### `Review`
FK to `Product`. `date` is currently a `CharField(max_length=20)` storing the scraped date string — flagged for migration to `DateField` in [improvements](../../improvements/backend.md).

### `BadgeText`
`TextChoices` constraining `Product.badge_text` to the 4 values in the data: `New!`, `Sale`, `Best Seller`, `Limited Time Sale: 20% Off`. Frontend `ProductBadgeText` enum mirrors.

## Variants

`Product.variants()` returns sibling products sharing the row's `base_name` (single / double / triple of the same bouquet, including the row itself). Reads from `_variants_cache` if set; falls back to a direct query.

The list-view path (`ProductViewSet.list`) bulk-fetches variants for the entire response page in one query and attaches `_variants_cache` on each instance — avoids N+1. Detail-view queries inline (one extra query per render).

This replaced an earlier denormalized `Product.variants` JSONField that drifted from reality whenever a sibling was edited outside the seed command. Reference for the rule "derive denormalized data at request time."

## Filtering

`products/filters.py` defines `ProductFilter(FilterSet)`, `TagFilter(FilterSet)`, and `ReviewFilter(FilterSet)`. Used via `DjangoFilterBackend`.

**Per-facet tag filters on Product** — query-param name === facet slug:
```
/api/products/?category=flowers,plants&color=red&occasion=birthday
```
OR within a facet (comma-sep or repeated params), AND across facets. Backend resolves the slugs to Tag rows scoped to the named facet, then filters products via `producttag__tag_id__in=...`. Adding a 6th facet means adding one entry to `ALL_FACET_SLUGS` and one `_filter_<slug>` method — no other plumbing.

**Non-tag filters** are direct columns on Product: `vase_included`, `badge_text`, `variant_type`, `addon_type`, `min_price`, `max_price`. The split between tag filters and column filters reflects cardinality (multi-valued vs single-valued) — see [`backend/CLAUDE.md`](../../../backend/CLAUDE.md) vocabulary section.

**Add-on default-exclusion** — `ProductFilter.qs` excludes add-ons from listings unless `?addon_type=vase|gift` is supplied. The selector pane opts in via that param; every other consumer (collections, occasions, search, homepage carousels) gets only standalone bouquets without changing call sites. `ProductViewSet.filter_queryset` bypasses this on `retrieve` so add-on slugs still resolve via `/api/products/<slug>/` (the modal's "Learn More" view fetches there). `filter_options` filters its base queryset to `addon_type__isnull=True` so price ranges and facet counts stay bouquet-only.

## Pagination

`products/pagination.py` returns `{page, size, total, data}` — exactly the shape the frontend's `PaginatedResponse<T>` consumes. Single source of truth for the wire format.

## `filter_options` action

`ProductViewSet.filter_options` returns the available filter values *for the current scope (URL page tag + search) excluding the user's multi-select sidebar filters* — so checking "Roses" in the stems sidebar doesn't make every other stem disappear. Response shape groups available tag slugs by facet slug:

```json
{
  "facets": {
    "category":   ["flowers", "plants"],
    "collection": ["spring-2026"],
    "occasion":   ["birthday", "anniversary"],
    "color":      ["red", "pink", "white"],
    "stem_type":  ["roses", "tulips"]
  },
  "price_range":   { "min": 3500, "max": 12000 },
  "vase_included": true
}
```

The `facets` map is data-driven from `Facet.objects.all()` — adding a new facet automatically gets a new key in the response.

## Curated ordering

When `?<facet>=<slug>` filters to exactly one landing-kind tag (e.g. `?occasion=birthday`), the viewset annotates the queryset with the matching `ProductTag.position` via a Subquery and orders by it. Subquery is required because multiple facet filters can join `ProductTag` multiple times — annotating explicitly disambiguates which join's position to read.

Multi-select scopes (`?occasion=birthday,anniversary`) skip position ordering — there's no single "curated order" across multiple tags.

## Seed + vocab

`management/commands/seed_products.py` builds the catalog from `data/products.json`. Run with `--clear` to wipe everything first; runs on container boot when `SEED_ON_BOOT=true` is set in env.

### Operational walkthrough

`seed_products --clear` is destructive — it wipes Products, Reviews, all M2M tables, and all taxonomies before rebuilding. Default for `SEED_ON_BOOT` is `false` everywhere; migrations always run, but seed + blur generation only run when the flag is true.

When to flip the flag on Railway:
- Updated `data/products.json` and want the change live.
- Schema migration touched product data and the seed needs to repopulate.
- First-ever deploy of an empty database.

How: set `SEED_ON_BOOT=true` in Railway env, redeploy, **then unset it** (or set to `false`). Leaving it on means every subsequent restart wipes admin edits and churns primary keys (breaks Stripe metadata, search indexes, etc.).

Local dev runs `python manage.py runserver` directly via `docker-compose.yml`'s `command:` override, which bypasses the Dockerfile `CMD` entirely — so seeding never runs from Compose. Reseed locally with `docker compose exec web python manage.py seed_products --clear`, or `pnpm run reseed` from `backend/` (thin wrapper in [`backend/package.json`](../../../backend/package.json)).

### Seed flow

1. Seed the 5 `Facet` rows from `models.FACET_DEFS`.
2. Seed filter-kind tags (`color`, `stem_type`) from the `STEM_VOCAB` and `COLOR_VOCAB` constants.
3. Seed landing-kind tags (`category`, `collection`, `occasion`) from the JSON's dedicated arrays — landing-page metadata flows from JSON onto Tag.
4. For each product, link via `ProductTag`, preserving `position` from the JSON entry (landing) or match order (color/stem).
5. Seed add-ons from [`data/addons.json`](../../../backend/data/addons.json) (after products) — each entry becomes a `Product` row with `addon_type` set, no tags, no reviews. The `addon_types` array in that JSON is UI-row metadata consumed by the frontend's `ADDON_TYPE_META` constants and is ignored at seed time.

The stem and color vocabularies are case-insensitive whole-word lookups against product text. Order is longest-first so `garden roses` matches before `roses` can claim it. `assorted` color is derived (3+ distinct colors).

`fix_title_case` lowercases letters after apostrophes in scraped product names (otherwise `Mother'S Day` slips through Django's `slugify` post-processing). Easy to lose without a comment — see the inline note.

`generate_blur_placeholders.py` produces a base64 LQIP for each product image. Silent per-image errors are intentional UX — one bad image shouldn't fail the whole boot.

## Frontend cross-link

The SPA's catalog routes (`frontend/routes/collections/$slug.tsx`, `products/$slug.tsx`) and the filter sidebar consume this app via `tagQueries.detail(slug)` (resolves URL slug → tag + facet in one round trip) and the per-facet `?<facet>=...` query params on `/api/products/`.
