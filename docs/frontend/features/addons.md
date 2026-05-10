# Add-ons (vases + gifts)

Two add-on types — **vase** and **gift** — selectable from the PDP and from cart-line triggers. Add-ons are real `Product` rows (see [backend/products](../../backend/features/products.md) → `addon_type` field), but they have no standalone selling surface (no listing, no PDP route). The selector pane is their listing UI; the existing `/api/products/<slug>/` is their detail endpoint.

Add-ons attach to a parent bouquet's cart line as a "set." A set's quantity stepper applies to the whole bundle (parent + addons). Add-ons can never be orphan cart lines.

Files: [`frontend/src/addons/`](../../../frontend/src/addons/).

## Type discriminator

[`frontend/api/products/AddonType.ts`](../../../frontend/api/products/AddonType.ts) — single-source literal union `'vase' | 'gift'`. Every per-type consumer (`Record<AddonType, …>` map, the two parallel selector atoms, `ADDON_TYPE_META`) derives from this. Adding a third type lights up TS errors at every call site.

## State shape

[`addonAtoms.ts`](../../../frontend/src/addons/addonAtoms.ts) holds three concerns:

| Atom | Purpose |
|---|---|
| `addonSelectorAtom` | Holds an `AddonSelectorState \| null`. Non-null = pane open. Payload carries both the add-on `type` (`'vase' \| 'gift'`) and the open `context` so a single atom drives one pane mount. |
| `pendingAddonsAtom` | `atomWithStorage<Record<parentSlug, PendingAddons>>` — per-product staging area for PDP selections. Vase: 1-max; gifts: list. Persisted (`getOnInit: true`) so route loaders see selections on refresh. |
| `setPendingVaseAtom`, `clearPendingVaseAtom`, `addPendingGiftAtom`, `removePendingGiftAtom`, `clearPendingForProductAtom` | Targeted mutators that consumers `useSetAtom` instead of writing to `pendingAddonsAtom` directly. Mirrors the cart's `attachAddonToLineAtom` / `removeAddonFromLineAtom` pattern. |

`AddonSelectorContext` is a discriminated union — `{ kind: 'pdp'; parentSlug }` or `{ kind: 'cart-line'; lineId }` — that drives where ADD writes (pending vs. immediate cart attach). The state shape is `{ type: AddonType; context: AddonSelectorContext }`.

## `<AddonSelectorPane>`

[`AddonSelectorPane.tsx`](../../../frontend/src/addons/AddonSelectorPane.tsx) is the right-side slide-in modal. **One** instance is mounted at the root layout in [`__root.tsx`](../../../frontend/routes/__root.tsx); the `type` it renders comes from the atom payload. Triggers can fire from any route (PDP or cart pane).

Two views inside the same pane: **list** (default) and **detail** (`selectedSlug` non-null). They cross-fade in-place using the [`DatePicker`](../../../frontend/src/date/DatePicker.tsx) delayed-unmount pattern — outgoing view runs `animate-fade-out`, then content swaps + new view runs `animate-fade-in`. Closing the pane skips the fade since `<SlidePane>`'s slide-out animation covers it.

Session state (selected detail slug, scroll position, in-flight fade timer) is reset whenever the pane closes — via a `useEffect` on the open atom — so any reopen path starts fresh at the list view. A separate `renderType` local state holds the last seen `type` so the slide-out animation renders the same content the user just had open (the atom goes null on close before SlidePane finishes sliding).

The pane uses `<SlidePane tier='over'>` to stack above the cart pane (z-54 vs. z-52) when both are open.

## List + detail rendering

- [`AddonRow.tsx`](../../../frontend/src/addons/AddonRow.tsx) — bordered card. Image left, name + price on the top row, subtitle full-width below, ADD + Learn More on the action row. Reused by both selectors.
- [`AddonDetail.tsx`](../../../frontend/src/addons/AddonDetail.tsx) — large image hero + name/subtitle/description + sticky `ADD - $XX` footer. Owns its own back + close chrome (absolutely positioned on the wrapper, not inside the scroll container, so they pin to the pane top during scroll). Fetches via `productQueries.detail(slug)` — the same query the regular PDP uses.

The detail view's flex layout uses `min-h-0 flex-1 flex-col` — without it the image would push the ADD footer past the viewport.

## ADD click routing — `useAddAddon`

[`useAddAddon.ts`](../../../frontend/src/addons/useAddAddon.ts) is the one click handler shared between the row's ADD button and the detail view's ADD button. Reads the selector context atom and routes:

- `kind: 'cart-line'` → `attachAddonToLineAtom({ lineId, addon })` — vase replaces, gift appends.
- `kind: 'pdp'` → `setPendingVaseAtom` or `addPendingGiftAtom` based on the addon's type.

Either way the selector closes after.

## PDP integration

[`<AddOns>`](../../../frontend/src/products/productDetailPane/ProductAddOns.tsx) — collapsible "Make It Extra Special" section inside `<ProductDetailContent>`. Defaults open. Renders two `<AddOnSection>` instances (vase + gift), each with empty / selected states:

- **Empty**: thumbnail + descriptive copy + "Add A Vase" / "Add A Gift" CTA. Whole row is a single `<button>` so any click opens the selector.
- **Selected**: per-item rows with image + name + price + per-item trash. Below the list, "Edit" (vase) or "Add Another" (gift) reopens the selector.

Vase row hides entirely when `isVaseAddonEligible(product) === false` (bouquets that ship with a vase, plants).

## Bundling into the cart — `useAddToBagButton`

[`useAddToBagButton.ts`](../../../frontend/src/products/useAddToBagButton.ts) is the shared hook for the in-flow PDP button and the sticky `<ProductBottomBar>` button. It reads `pendingAddonsAtom[product.slug]`, builds the addon list, computes the bundled `setPrice`, and on click:

1. Calls `addToCart({ product, addons })` — the cart atom merges by `lineFingerprint` (parent slug + sorted addon slugs).
2. Calls `clearPendingForProductAtom(product.slug)` so a re-add doesn't double-apply the same addons.

The hook returns `{ setPrice, addonCount, addToBag }` — the button label uses `setPrice` to reflect the bundled price.

## Cart-line integration

The cart pane's [`<CartLineRow>`](../../../frontend/src/cart/CartPane.tsx) renders an "ADD A VASE" trigger when `item.vase_addon_eligible && no vase in line.addons`. Click writes `addonSelectorAtom` with `{ type: 'vase', context: { kind: 'cart-line', lineId } }`. Gifts have no cart-line trigger — they're PDP-only.

## Per-type metadata — `ADDON_TYPE_META`

[`addonTypeMeta.ts`](../../../frontend/src/addons/addonTypeMeta.ts) holds the per-type UI strings + thumbnails (PDP-row copy, modal header). Hardcoded constants today; a future migration moves this into Tag rows under a new `Facet(slug='addon')` — see [`docs/improvements/backend.md`](../../improvements/backend.md) → "Tag schema consolidation". The `addonCtaLabel(type)` helper derives "Add A Vase" / "Add A Gift" from the type slug.

## Cross-links

- Cart shape (set rendering, `lineFingerprint`, `addons[]`) — [`docs/frontend/features/cart.md`](cart.md)
- Configurator details on the PDP — [`docs/frontend/features/products.md`](products.md)
- Backend `addon_type` field + filter exclusion — [`docs/backend/features/products.md`](../../backend/features/products.md)
- Stripe wire flattening (addons enter the PI as flat line items) — [`docs/frontend/features/checkout.md`](checkout.md)
