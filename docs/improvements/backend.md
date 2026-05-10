# Backend Improvements

Active and deferred improvements for `backend/`. Done items aren't tracked here — they're in git history and the conventions they established are codified in [`backend/CLAUDE.md`](../../backend/CLAUDE.md). Architecture and feature documentation lives in [`docs/backend/`](../backend/).

## Remaining (active for this review cycle)

_Empty — all items from this review cycle landed. See `## Future improvements` for deferred work and `## Skipped` for intentional non-action._

## Future improvements (deferred — out of scope for this cycle)

**🔝 Top priority for next review cycle:**

- **Sale-collection products show no discount + missing badges (scraper data quality)** — 41 products in the `sale` collection; 0 currently render with a real discount. Two issues: **(a) inverted price fields** — 29 products (mostly triples, some doubles) have `discounted_price > price` in `data/products.json` (e.g. Triple Firecracker: `price=18800`, `discounted_price=22200`). The scraper put the regular/compare-at price in `discounted_price` and the actual sale price in `price` — fields are swapped. **(b) missing Sale badges** — 12 products (all doubles) have `discounted_price=null` AND `badge_text=null` despite being in the sale collection. Two-part fix: in `seed_products.py`, swap `price`/`discounted_price` when `discounted_price > price`; and derive `badge_text='Sale'` for any product in the `sale` collection that doesn't already have one. Pairs with a planned scraper revisit — straighten the data at the source too. Keeping `products.json` as the raw scrape and applying corrections at seed time means re-scraping doesn't blow them away.

**Other deferred items:**

- **Tag schema consolidation + first-class addon-type tags** — the [`Tag`](../../backend/products/models.py) model has accumulated overlapping fields (`header_*` for landing pages, `nav_*` for navbar dropdowns, `page_title` for SEO) and the live data confirms real redundancy: `nav_img_src` is effectively a stand-in for `image_src` (5/6 entries have only one set; the 1 that has both has identical values), and `nav_description` is a strict subset of `header_subtitle` (every entry with `nav_description` also has `header_subtitle`). At the same time, add-on type metadata (PDP-row CTA copy + thumbnail + modal title/subtitle for "vase"/"gift") currently lives in [`frontend/src/addons/addonTypeMeta.ts`](../../frontend/src/addons/addonTypeMeta.ts) as hardcoded constants — inconsistent with the catalog's "Tag rows hold per-taxonomy metadata" pattern. Plan: **(a)** rename `header_title→title`, `header_subtitle→subtitle`, `nav_description→description`. **(b)** drop `nav_img_src` (use `image_src`; backfill from `nav_img_src` value during the seed pass for the 5 entries that need it). **(c)** drop `page_title` and compute SEO `<title>` at the route head as `${tag.name} | UrbanStems` (delete [`stripBrandSuffix`](../../frontend/src/common/utils/stripBrandSuffix.ts)). **(d)** add `FacetKind = 'addon'` and seed two `Tag` rows from `addons.json`'s `addon_types` array — `name` → modal title, `subtitle` → modal subtitle, `description` → PDP row copy, `image_src` → row thumbnail, CTA derived as `` `Add A ${name.replace(/s$/, '')}` ``. **(e)** migrate `<AddOns>` (PDP) and `<AddonSelectorPane>` to `tagQueries.list({ facet: 'addon' })`; delete `addonTypeMeta.ts`. Consumer fanout for the renames: [`CollectionHero`](../../frontend/src/collections/CollectionHero.tsx), [`CollectionPage`](../../frontend/src/collections/CollectionPage.tsx), [`$slug.tsx`](../../frontend/routes/collections/$slug.tsx) (head meta), [`ShopDropdown`](../../frontend/src/navbar/ShopDropdown.tsx), [`MobileMenuPanel`](../../frontend/src/navbar/MobileMenuPanel.tsx). Rollback signal: if a future addon type's CTA can't be derived from `Add A ${singular(name)}`, add a nullable `cta_label` column instead of reverting. Deferred to keep the addons feature build focused — the cleanup is separable, can be done from a quiet moment, and the constants file is a tiny migration target.

- **`Review.date` → `DateField`** — currently `CharField(max_length=20)` storing `MM/DD/YY`. Needs a `to_date(date, 'MM/DD/YY')` cast in a `SeparateDatabaseAndState` migration plus a frontend display tweak. Deferred because the data is read-only at present and the existing strings render fine as-is.
- **Backend test coverage** — no automated tests in the backend yet. Smoke tests worth writing first: `match_vocab` / `strip_container_clauses` (seed-products vocab logic), the create-intent view (totals + serializer validation), the webhook signature path. Deferred as a standalone effort.
- **`_compute_totals` silent invalid-item drop** — a request with one stale slug succeeds and charges for the rest; customer first finds out from the email. Fix: after `_compute_totals`, if `len(resolved) < len(line_items)`, return 400 with `missing_slugs: [...]`. Deferred because there's no product add/delete flow yet, so stale slugs aren't realistic in practice.
- **`lines_metadata[:500]` truncation** — checked actual sizes (avg 79 chars/line, max 128); only ~6 avg-sized or 3 max-sized items fit. When truncated, `json.loads` in `emails.py` raises and the `except` swallows it → email renders with zero line items. Fix: pack whole items into `lines_metadata` until the next would overflow, warn if any dropped. Deferred because typical cart sizes haven't been observed to overflow.
- **Self-host email logo** — `EMAIL_LOGO_URL` defaults to a LinkedIn CDN URL we don't control. Either ship the logo with the app (whitenoise static) or move to a project-owned bucket. Deferred until the next email-design pass.
- **Email Django template rebuild** — `emails.py` has 388 lines of f-string HTML. Workable; resistant to change. When the email next needs significant design iteration, consider Django templates (already configured) or Jinja for autoescape + cleaner syntax.
- **Split `UPSTREAM_TIMEOUT_S`** — currently 5s for both autocomplete (typing UI; should fail fast at ~2s) and details (one-shot; 5s fine). Splitting into `AUTOCOMPLETE_TIMEOUT_S = 2`, `DETAILS_TIMEOUT_S = 5` is a small UX win when Google is slow. Deferred — easy to revisit.

## Skipped (intentional non-action)

Items the audit flagged that are intentionally not addressed because they're either low priority, cosmetic, or the current shape is acceptable. Listed here so a future contributor knows they were considered.

### products
- `cast(Request, self.request)` repeated in `api_views.py` — local hygiene, two call sites.
- `ProductListSerializer` / `ProductDetailSerializer` ~70% field overlap — fine; a base class would save little.
- `Color.hex` regex validation — defensive, low payoff (UI controls the values).
- `admin.py` through-models registered without `TabularInline`s — workable.
- `generate_blur_placeholders` silent per-image errors — intentional UX (one bad image shouldn't fail the whole boot).

### checkout
- `emails.py` 388-line f-string HTML — workable; revisit on next design change (also listed in Future).
- `emails.py` re-fetches PaymentIntent for `expand=['latest_charge']` — one extra Stripe call per email; acceptable.
- `emails.py` hardcoded brand hex colors (`_NAVY`, `_DIVIDER`, etc.) — intentional duplicates of the brand palette tuned for email-client rendering; should not import frontend tokens.
- Tax/shipping NY defaults (`CHECKOUT_TAX_RATE_PCT = 8.875`) — sim-acceptable; real deploys integrate Stripe Tax / TaxJar / Avalara via the existing `_tax_cents(subtotal)` seam.
- `SignatureVerificationError` returning 400 — correct behavior (don't retry; ack-and-stop).

### places
- `details/` cache + Google session-token billing — provider-specific; sim-acceptable.
- Synchronous `requests` calls block the gunicorn worker — sim-scale fine; revisit if/when async views land elsewhere.
- `_geoip_reader` module globals — pattern is documented and contained.
- Lowercase `q` for cache-key normalization — works correctly; a comment is optional.
- `AUTOCOMPLETE_CACHE_TTL_S = 1h` — aggressive but acceptable; Google's autocomplete results don't churn.
- `place_id` snake_case query param (Google uses camelCase) — proxy translates correctly; consistent with the rest of the API.
- `detect_location` doesn't cache — call already sub-millisecond (in-memory reader).
- `source: 'private-ip'` grouping (loopback + link-local + private under one tag) — frontend type lists separate values it doesn't use; cleanup is type-side.
- `_geoip_reader` never explicitly closed — fine for the gunicorn lifecycle (handle closes on process exit).

### project
- `ALLOWED_HOSTS` and `CORS_ALLOWED_ORIGINS` parsed by hand-rolled `lambda v: [s.strip() for s in v.split(',')]` — works; two call sites, but small.
- Dockerfile installs `postgresql-client` system package without an inline comment explaining why (it's the `psql` CLI, not a build dep).
- `requirements.txt` is one un-grouped list — no runtime/dev split. Fine at current scale.
- Django 5.0.8 / DRF 3.14.0 are not the latest — generic dependency hygiene; no current CVEs.
- `urls.py` path inconsistency (products mounts at `''` and includes `api/` internally; places + checkout mount at `api/...`) — workable.
- Django default `AUTH_PASSWORD_VALIDATORS` — admin-only auth at present; revisit when customer accounts ship.
- `TIME_ZONE = 'UTC'` with `USE_TZ = True` — correct.
- `STATIC_URL = 'static/'` (relative) — fine; whitenoise serves them.
- `data/product_types.py` TypedDicts — leave unless the scraper repo reorg lands.
