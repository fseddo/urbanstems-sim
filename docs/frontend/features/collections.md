# Collection / listing page

The `/collections/$slug` route. Renders a tag-driven product listing — breadcrumb + hero on top, header bar with filter / date / address / column-chooser, then the virtualized product grid. The same route handles three render paths: a tag-backed landing page (e.g. `/collections/birthday`), the catch-all "Shop All" page (`/collections/all`), and the search-results case (`?search=<term>`).

Composition top-down, in [`CollectionPage.tsx`](../../../frontend/src/collections/CollectionPage.tsx):

1. [`<NavigationBreadcrumbs>`](../../../frontend/src/common/components/NavigationBreadcrumbs.tsx) — Home → page name. Only renders when there's a `pageTag` (omitted on /collections/all and search-results).
2. [`<CollectionHero>`](../../../frontend/src/collections/CollectionHero.tsx) — title + subtitle, branches per render path.
3. [`<CollectionListHeader>`](../../../frontend/src/collections/CollectionListHeader.tsx) — filter trigger, delivery date, sending-to, column chooser.
4. [`<InfiniteList>`](../../../frontend/src/common/components/InfiniteList.tsx) — virtualized infinite grid of [`<ProductCard>`](../../../frontend/src/common/components/ProductCard.tsx).

[`<FilterSidebar>`](../../../frontend/src/filters/FilterSidebar.tsx) is mounted at the page level and toggled by the filter cell.

## Hero

Three render branches in one component: tag-backed (uses `pageTag.header_title` + `header_subtitle`), search-results (`Results for "<term>"`), or Shop All. Centered title + optional subtitle.

Tokens:
- Title — `--collection-hero-header-size`, single ramp 28→52 over 1200–2250 (consumed via `text-collection-hero-header`). Line-height baked in at `1` so it tracks the font size.
- Subtitle — `--collection-hero-subheader-size`, single ramp 14→21 over 1600–2250 (`text-collection-hero-subheader`). The two ranges differ deliberately — subtitle holds its mobile size for longer because at narrower widths it's already long descriptive copy.
- Vertical padding — `--collection-hero-pt` / `--collection-hero-pb` step once at 1400 (22/40 → 28/62).
- Horizontal padding — `px-page` directly. Hero sits with the same gutters as the rest of the page.

## Breadcrumbs

Listing-page rendering shows `Home → <current page>` only — no Shop All link (that's a PDP convention, since PDP lives one level deeper). Leaf comes from `pageTag.page_title` with the brand suffix (`| UrbanStems`) stripped via [`stripBrandSuffix`](../../../frontend/src/common/utils/stripBrandSuffix.ts) — stopgap until the scraped `page_title` data is cleaned at the source.

Wrapper padding lives in `--listing-breadcrumb-pl` (16/34 step at 1024) and `--listing-breadcrumb-py` (clamp 16→20 over 1140–1480).

## Listing header bar

Layout differs **structurally** between viewports (different DOM trees, not just CSS), so [`<CollectionListHeader>`](../../../frontend/src/collections/CollectionListHeader.tsx) keys off `useIsDesktop` and returns one of two shapes:

- **Desktop** (≥1024): Filter / Date / Address / Chooser in one row. The bar is `sticky top-0 z-40`; when stuck, Date and Address fade to `opacity-0 pointer-events-none` (200ms) — they stay mounted and keep their flex slots, so Filter and Chooser remain pinned at the row's left/right ends without any layout reflow. Stuck state comes from an `IntersectionObserver` on a 1px sentinel rendered just above the bar.
- **Mobile**: Date and Address each as their own full-width (non-sticky) row; Filter & Sort and Chooser share a third sub-row that is itself `sticky top-0 z-40` — so only that bottom strip pins once the page scrolls past it. No JS needed; the structural separation does the work.

Z-stack: bar `z-40`, navbar `z-50` (covers the bar when visible, so only one occupies vertical space), filter sidebar `z-51`+.

Each cell's height comes from `h-listing-bar` (65 mobile / 80 desktop), set on the shared base [`<CollectionListHeaderCell>`](../../../frontend/src/collections/CollectionListHeaderCell.tsx) — every cell self-sizes; the bar's row containers stretch around them.

### Cells

Per-cell components live in [`collections/cells/`](../../../frontend/src/collections/cells/). Each owns its own composition and atom wiring; the bar itself is purely structural.

- [`<DateCell>`](../../../frontend/src/collections/cells/DateCell.tsx) — wraps [`<DatePicker>`](../../../frontend/src/date/DatePicker.tsx). Reads `deliveryDateAtom` directly. Width steps at desktop: `lg:w-[270px] 2xl:w-[360px]`.
- [`<AddressCell>`](../../../frontend/src/collections/cells/AddressCell.tsx) — wraps [`<AddressPicker>`](../../../frontend/src/address/AddressPicker.tsx). Reads `deliveryAddressAtom` directly. The picker IS the cell's input — no separate "Sending to: ..." text + popup-with-input. Click anywhere in the cell focuses the input; placeholder shows the saved address until typing; results dropdown anchors full-width below the cell with row text padded to align with the cell's icon (`resultRowClassName='lg:px-listing-cell'`). Stale results stay until blur even after the input drops below 3 chars. Placeholder fades transparent on focus over 100ms.
- [`<FilterCell>`](../../../frontend/src/collections/cells/FilterCell.tsx) — Filter & Sort opener with the active-filter count bubble (32×32, `bg-background-alt/80` `rounded-md`). Hidden when count is 0 but the layout slot stays so the cell doesn't shift. Same rounded-md as the column chooser buttons next to it for visual family consistency.
- [`<ColumnChooserCell>`](../../../frontend/src/collections/cells/ColumnChooserCell.tsx) — wraps [`<ColumnChooser>`](../../../frontend/src/collections/ColumnChooser.tsx).

The cell's horizontal padding token is `--listing-cell-px` (`px-listing-cell`) — 34 mobile / 40 desktop. Filter & Sort is the exception: it uses `--navbar-px` (16/34/40) to align with the navbar's padding above it.

### DatePicker — touch vs mouse

[`<DatePicker>`](../../../frontend/src/date/DatePicker.tsx) renders differently based on **input device**, not viewport size:

- `useIsTouch` (`pointer: coarse`): centered modal, `bg-black/50` backdrop, `animate-fade-in/out` (200ms each, with delayed-unmount state machine in `close()`).
- Mouse: anchored dropdown below the trigger.

Same calendar content, different shell. See [`architecture/dynamic-sizing.md`](../architecture/dynamic-sizing.md) — "Touch capability vs viewport size" and "Mount/unmount fade-in/out pattern".

## Filter sidebar

[`<FilterSidebar>`](../../../frontend/src/filters/FilterSidebar.tsx) lives in a [`<SlidePane>`](../../../frontend/src/common/components/SlidePane.tsx) — full-screen <530, wall-attached 530-1019, floating popover ≥1020.

Filter spec system: each filter dimension declares an `isActive` predicate, a `chips()` function, and a `parseSearch` function in [`FILTER_SPECS`](../../../frontend/src/filters/filterSpecs.ts). The Filter & Sort cell's active-filter count = total `chips` across all specs (same source the sidebar's chip strip uses).

URL is the source of truth — sidebar writes via `navigate({ search })`. No local state for active filters.

## Product grid

[`<InfiniteList>`](../../../frontend/src/common/components/InfiniteList.tsx) is a virtualized infinite grid in `common/`; collections is currently the only consumer. Each row is a CSS grid with `gridTemplateColumns: repeat(N, minmax(0, 1fr))` where N = `columnCount`. (For non-virtualized vertical scrolling lists with optional header/footer slots — e.g. modal panes — use the sibling [`<List>`](../../../frontend/src/common/components/List.tsx).)

Spacing:
- Outer pt/pb — `pt-[40px] pb-[47px] lg:pt-[53px] lg:pb-[64px]`. Combined with each row's `py-[17px] lg:py-[27px]`, the visual top/bottom from the outer edge to the first/last card content lands at 57/64 mobile, 80/91 desktop.
- Row gap — `py-[17px] lg:py-[27px]` on each row. Adjacent rows' bottom + top padding sums to the spec'd 34 mobile / 54 desktop visual gap. (CSS `gap-y` doesn't apply because each row's grid only contains one row of cells.)
- Column gap — `gap-x-[15px]`.
- Horizontal padding — `px-page`.

## Column count

`columnCount` is local React state in `<CollectionPage>`. Defaults differ by viewport:

| viewport | default | options shown by chooser |
|---|---|---|
| narrow (<375) | 1 | only 1 |
| mobile (375–1023) | 2 | 2, 1 |
| desktop (≥1024) | 3 | 2, 3, 4 |

Snap-back on viewport flips (in `useEffect`):
- Desktop → mobile: clamp to 2 if value was 3 or 4.
- Mobile → desktop: snap to 3 if value was 1.
- Narrow (`useIsNarrow`): force to 1, regardless of where it came from.

The narrow tier exists because below 375px viewport, two product cards (each `min-w-[160px]` plus page padding + grid gap) physically don't fit. The chooser also hides the 2-col option there so users can't pick something that would just snap back.

## Product card

[`<ProductCard>`](../../../frontend/src/common/components/ProductCard.tsx) uses `@container` so its internal layout responds to its own rendered width, not the viewport — a card at 160px on a small phone gets different aspect ratio + badge sizing than the same component at 600px in a 2-col desktop view.

- Aspect ratio: `aspect-[3/4]` → `@[300px]:aspect-[4/5]` → `@[500px]:aspect-[43/39]`.
- `badge_text` (top-left): positioned `top-[5%] left-[5%]` (percent-based so the offset scales with the card), `truncate` + `max-w-[90%]` so long copy can't extend past the card. Font + padding step at `@[300px]`.
- `badge_image_src` (bottom-right): `right-[5%] bottom-[5%]` + `w-1/4` (~25% of card width). Width-based not height-based, so the badge scales linearly with the card regardless of which aspect ratio is active.
- Card floor: `min-w-[160px]` so 2-up still fits on iPhone-SE-width (375) viewports.

## Data flow

Loader fetches via `productQueries.infiniteList(filters)` and `productQueries.filterOptions(filterOptionsScope)`. URL search params → `parseUIFiltersSearch` → `UIFilters` shape → `buildFilters(pageTag, search)` to merge in the page's tag constraint (e.g., `/collections/birthday` always filters by occasion=birthday).

The page tag's own slug is hidden from its facet section in the sidebar — toggling "Birthday" on `/collections/birthday` would be a no-op.
