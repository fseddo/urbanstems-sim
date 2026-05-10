# Cart

A right-side slide-in pane that holds line items, free-shipping progress, totals, and the checkout handoff. State is stored in jotai atoms with localStorage persistence — there's no React Query / backend round-trip for cart contents; the cart is a snapshot of UI-side selections that gets sent to the backend during checkout.

Files: [`frontend/src/cart/`](../../../frontend/src/cart/) — two of them, [`cartAtoms.ts`](../../../frontend/src/cart/cartAtoms.ts) and [`CartPane.tsx`](../../../frontend/src/cart/CartPane.tsx).

## State shape

[`cartAtoms.ts`](../../../frontend/src/cart/cartAtoms.ts) holds everything cart-related as jotai atoms:

| Atom | Purpose |
|---|---|
| `cartItemsAtom` | The persistent line list. `atomWithStorage` keyed `urbanstems-cart`, with `getOnInit: true` so route loaders see the persisted value on hard refresh, not the empty initial. |
| `cartOpenAtom` | Whether the slide-in pane is open. |
| `cartCountAtom` | Derived: total quantity across lines. Used by the navbar's cart-icon badge. |
| `cartTotalAtom` | Derived: `Σ lineSetPrice(line) × line.quantity` — includes addon prices. |
| `lineSetPrice(line)` | Per-set unit price (parent + addons, before quantity). Exported for both cart and checkout consumers. |
| `lineFingerprint(line)` | Stable per-line identity (`parentSlug + sorted addon slugs`). Used as React key, line-mutation atom payload, and merge bucket. |
| `addToCartAtom` (write-only) | Adds a bouquet, optionally with addons. Same-fingerprint lines merge (qty++); different addon configs stay as separate lines. **Also opens the pane.** |
| `setLineQuantityAtom` (write-only) | Updates a line's quantity by `lineId`. Quantity ≤ 0 removes the line. |
| `removeLineAtom` (write-only) | Removes a line by `lineId`. |
| `attachAddonToLineAtom` (write-only) | Vase: 1-max per set, replaces existing. Gift: unlimited, appends. |
| `removeAddonFromLineAtom` (write-only) | Removes the first addon match by slug — gifts can repeat, the per-row trash is one click per addon. |
| `snapshotAddon(product)` | Selector callers convert a vase/gift `Product` to `CartItem` before passing to attach. |

Why `atomWithStorage` with `getOnInit: true`: the checkout route's loader reads the cart synchronously to compute its payment intent. Without `getOnInit`, the loader fires before React mount has had a chance to hydrate the atom, so on hard refresh the loader would see `[]` and treat the cart as empty.

`CartLine` is a deliberate snapshot of the product, not a reference. Storing the price/name/image at add-time means the cart doesn't desync when the catalog changes — if a price drops between add-to-cart and checkout, the cart shows what the user agreed to. Backend reconciles at checkout.

## `CartLine` shape — sets

```ts
interface CartLine {
  item: CartItem;        // parent bouquet
  quantity: number;       // applies to the whole set
  addons: CartItem[];     // attached vases/gifts; empty = plain bouquet
}
```

The same `CartItem` shape covers both parent bouquets and addons — the role is implied by where the item sits (`item` vs. `addons[]`). `CartItem.addon_type` is `null` on parents, set on addons. `CartItem.vase_addon_eligible` is snapshotted on the parent at add time so the cart never re-derives from `vase_included` + tags.

A `CartLine` shape change on a persisted cart would crash derived atoms reading `line.addons`. A one-shot module-load shape check in [`cartAtoms.ts`](../../../frontend/src/cart/cartAtoms.ts) clears the storage if the persisted shape predates `addons: []`. Drop the guard once enough time has passed that no live carts could still be on the old shape.

## `lineFingerprint` — line identity

Slug alone isn't unique once a parent can appear in multiple lines with different addon configs (e.g. "The Sorbet" alone AND "The Sorbet Set + vase" can coexist as two distinct lines). `lineFingerprint(line)` returns `parentSlug|addon1Slug,addon2Slug` (sorted). Used as:

- React keys in [`<CartLineRow>`](../../../frontend/src/cart/CartPane.tsx) and [`<CheckoutSummary>`](../../../frontend/src/checkout/CheckoutSummary.tsx)
- Payload for `setLineQuantityAtom` / `removeLineAtom` / `attachAddonToLineAtom` / `removeAddonFromLineAtom`
- Merge bucket in `addToCartAtom`

Quantity is excluded — qty changes shouldn't remount the row or split the merge bucket.

## `<CartPane>`

[`<CartPane>`](../../../frontend/src/cart/CartPane.tsx) is rendered once at the root layout level (in [`__root.tsx`](../../../frontend/routes/__root.tsx)) so its mount lifecycle is independent of route. It's a `<SlidePane side='right'>` with a header / scrolling line list / sticky footer.

### Three states

| State | Body |
|---|---|
| Empty | Centered "Your cart is empty" + "CONTINUE SHOPPING" button (closes the pane). |
| Has items | Free-shipping progress bar + line list. |
| Has items + total ≥ $140 | Free-shipping bar reads "Your order qualifies for free shipping!"; "Estimated Shipping" in the footer reads "Free" instead of "TBD". |

`FREE_SHIPPING_THRESHOLD = 140` is a module-level const. If a second consumer needs the same threshold (e.g. a cart-progress badge elsewhere), promote to a shared constants file.

### Footer + checkout handoff

The footer shows total + estimated shipping + a "CHECKOUT" button. The button is disabled while the checkout payment-intent query is in flight, surfacing a `<CgSpinner>` during the wait.

The `navigating` flag reads from `useIsFetching({ queryKey: checkoutKeys.paymentIntent(lines) })` — leveraging React Query's loading state directly rather than holding a separate boolean. The query gets *triggered* by the navigation to `/checkout` (which has a loader that ensures the payment intent), so the spinner pattern is: click CHECKOUT → router starts navigation → loader fires the query → `useIsFetching > 0` while it's pending → spinner shows → query resolves → `setOpen(false)` runs after `await navigate(...)`.

This matches the codebase's "read pending state from the source of truth" rule — no hand-rolled `submitting` boolean.

### Line row

`<CartLineRow>` is defined in the same file. Receives `lineId` from the parent map (computed via `lineFingerprint`) and uses it for every line-mutation atom call.

Two render modes branching on `line.addons.length > 0`:

- **Plain bouquet**: image, name, variant type ("Size: Standard"), qty stepper, line total, trash.
- **Set**: image (parent's), name becomes `${item.name} Set`, then a vertical stack of `<SetSubRow>` (parent + each addon — small thumb + "1 × Name", per-addon trash on addon rows only). Qty stepper applies to the whole set; line total = `lineSetPrice(line) × quantity`.

### Cart-line trigger

When `item.vase_addon_eligible && no vase in line.addons`, the line renders an "ADD A VASE" pill below the qty/total row. Click writes `addonSelectorAtom` with `{ type: 'vase', context: { kind: 'cart-line', lineId } }`. Gifts have no cart-line trigger — they're PDP-only.

## SlidePane integration

[`<SlidePane>`](../../../frontend/src/common/components/SlidePane.tsx) handles the responsive shell — three viewport states (full-screen below 530sw, wall-attached 480px wide between 530–1019, floating popover with margins at ≥1020sw), plus the portaled backdrop with click-to-close and body-scroll lock.

CartPane only fills in the content (header / list / footer) — no positioning or backdrop logic in CartPane itself. The same shell is used by `<FilterSidebar>` (left side); the `side` prop swaps the slide direction.

The `tier` prop on SlidePane (`'base' | 'over'`) bumps the z-index two steps so a second pane (the addon selector) can stack above the cart pane while both stay above the navbar. Cart uses `'base'` (z-52); addon selectors use `'over'` (z-54).

## Add-to-cart entry points

Both PDP surfaces ([`<ProductDetailContent>`](../../../frontend/src/products/productDetailPane/ProductDetailContent.tsx) and [`<ProductBottomBar>`](../../../frontend/src/products/ProductBottomBar.tsx)) consume [`useAddToBagButton(product)`](../../../frontend/src/products/useAddToBagButton.ts), which bundles any pending addons for the current product into the new line and clears pending on add. See [`docs/frontend/features/addons.md`](addons.md) for the full configurator flow.

## Cross-links

- Add-on selector pane, pending atoms, configurator flow — [`docs/frontend/features/addons.md`](addons.md)
- Checkout summary set rendering — [`docs/frontend/features/checkout.md`](checkout.md)
