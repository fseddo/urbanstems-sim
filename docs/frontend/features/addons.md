# Add-ons (vases + gifts)

Two add-on types — **vase** and **gift** — selectable from the PDP and (vase only) from cart-line triggers. Add-ons are real `Product` rows (see [backend/products](../../backend/features/products.md) → `addon_type` field), but they have no standalone selling surface (no listing, no PDP route). The selector pane is their listing UI; the existing `/api/products/<slug>/` is their detail endpoint.

The vase and gift sides are intentionally asymmetric:

- **Vase** is single-attach to a parent bouquet. It lives on the bouquet's `CartLine.vase` field; the line renders as a "set" with parent + vase sub-rows.
- **Gift** is an independent cart line. From the PDP, gift selections stage in `pendingAddonsAtom` (with per-slug counts); on ADD TO BAG each gift becomes its own cart line with `quantity = count`. After that they behave like any normal cart item — own qty stepper, own removal, no parent link in the cart.

## Type discriminator

[`frontend/api/products/AddonType.ts`](../../../frontend/api/products/AddonType.ts) — single-source literal union `'vase' | 'gift'`. Every per-type consumer derives from this.

## State shape

[`addonAtoms.ts`](../../../frontend/src/addons/addonAtoms.ts):

| Atom | Purpose |
|---|---|
| `addonSelectorAtom` | `AddonSelectorState \| null`. Non-null = pane open. Payload carries the add-on `type` + open `context` (`'pdp'` or `'cart-line'`). |
| `pendingAddonsAtom` | `atomWithStorage<Record<parentSlug, PendingAddons>>` — per-product PDP staging. `vase: CartItem?`, `gifts: Array<{item, count}>` (count-grouped, no duplicate entries). |
| `setPendingVaseAtom`, `clearPendingVaseAtom`, `incrementPendingGiftAtom`, `decrementPendingGiftAtom`, `clearPendingForProductAtom` | Targeted mutators. Gift increment appends a new `{item, count: 1}` or bumps the existing count; decrement reverses, dropping the entry at 0. |

`AddonSelectorContext` is `{ kind: 'pdp'; parentSlug }` or `{ kind: 'cart-line'; lineId }`. Cart-line context only fires for vases — gifts have no cart-line trigger because they're independent cart lines.

## `<AddonSelectorPane>`

[`AddonSelectorPane.tsx`](../../../frontend/src/addons/AddonSelectorPane.tsx) — single instance mounted at the root layout in [`__root.tsx`](../../../frontend/routes/__root.tsx). Type derives from the atom payload. Renders one of two views via the DatePicker delayed-unmount fade pattern: **list** (default) and **detail** (selected slug).

The list rows use a **discriminated `action` prop** so each row reflects its current selection state in the open context:

| Selection | Row state | Button slot |
|---|---|---|
| Unselected (vase or gift) | Normal border | `ADD` |
| Vase already pending | `border-brand-primary` highlight | `REMOVE` (clears pending) |
| Gift with count > 0 | `border-brand-primary` highlight | `−  N  +` stepper (increment / decrement pending count) |

The pane closes on vase ADD (single-pick is decisive); stays open on gift increments (user is likely tapping `+` multiple times or browsing other gifts).

Cart-line context never shows REMOVE — the cart-line vase trigger only opens the modal when no vase is attached, so every vase row reads as unselected.

Session state (selectedSlug, scroll, fade timer) resets on close.

## `useAddAddon`

[`useAddAddon.ts`](../../../frontend/src/addons/useAddAddon.ts) — single ADD-click handler shared by AddonRow + AddonDetail:

- vase + cart-line → `setLineVaseAtom` (immediate; replaces any existing)
- vase + pdp → `setPendingVaseAtom`
- gift + pdp → `incrementPendingGiftAtom`
- gift + cart-line → unreachable (no UI trigger)

## `useAddToBagButton`

[`useAddToBagButton.ts`](../../../frontend/src/products/useAddToBagButton.ts) — shared by the in-flow PDP button and `<ProductBottomBar>`. Reads `pendingAddonsAtom[product.slug]`, builds the bundled `setPrice` (parent + vase + Σ gift × count), and on click:

1. Calls `addToCart({ product, vase, gifts })` — the cart atom adds parent+vase as one set line AND splits each pending gift into its own cart line with `quantity = count`.
2. Calls `clearPendingForProductAtom(product.slug)`.

## PDP integration

[`<AddOns>`](../../../frontend/src/products/productDetailPane/ProductAddOns.tsx) — collapsible "Make It Extra Special" section, default open. Each row is a summary surface; all add/remove/quantity adjustments happen inside the modal.

| Section | Empty state | Selected state |
|---|---|---|
| Vase (gated by `isVaseAddonEligible`) | Whole-row click → opens vase selector | Image + name + price + Edit (opens modal where REMOVE lives) |
| Gift | Whole-row click → opens gift selector | "N gifts added" condensed line + Edit (opens modal where steppers live) |

`isVaseAddonEligible(product)` returns false when `product.addon_type !== null` (gift products), `vase_included === true`, or `category=plants` is tagged.

## Cart-line integration

[`<CartLineRow>`](../../../frontend/src/cart/CartPane.tsx) shows an "ADD A VASE" trigger when `item.addon_type === null && item.vase_addon_eligible && !line.vase`. The trigger gates on `addon_type === null` so it never appears on gift cart lines. Click opens `addonSelectorAtom` with `{ type: 'vase', context: { kind: 'cart-line', lineId } }`.

Gift cart lines render as standard cart-line rows — image, name, qty stepper, total. No special set chrome.

Vase removal from a cart line happens via the trash icon on the vase sub-row inside the set (writes `setLineVaseAtom` with `vase: null`).

## Per-type metadata — `ADDON_TYPE_META`

[`addonTypeMeta.ts`](../../../frontend/src/addons/addonTypeMeta.ts) — per-type UI strings + thumbnails. `addonCtaLabel(type)` derives "Add A Vase" / "Add A Gift". Tracked for migration to Tag rows; see [`docs/improvements/backend.md`](../../improvements/backend.md) → "Tag schema consolidation".

## Cross-links

- Cart shape (set vs standalone vs gift lines, `lineFingerprint`, `vase` field) — [`docs/frontend/features/cart.md`](cart.md)
- Configurator details on the PDP — [`docs/frontend/features/products.md`](products.md)
- Backend `addon_type` field + filter exclusion — [`docs/backend/features/products.md`](../../backend/features/products.md)
- Stripe wire flattening — [`docs/frontend/features/checkout.md`](checkout.md)
