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
| `cartTotalAtom` | Derived: `Σ price × quantity`. |
| `addToCartAtom` (write-only) | Adds a product. Increments quantity if the slug already exists; otherwise pushes a new line with a `CartItem` snapshot of name/price/image. **Also opens the pane** as a side effect, so any "Add to bag" button gets the slide-in for free. |
| `setLineQuantityAtom` (write-only) | Updates a line's quantity. Quantity ≤ 0 removes the line. |
| `removeLineAtom` (write-only) | Removes a line by slug. |

Why `atomWithStorage` with `getOnInit: true`: the checkout route's loader reads the cart synchronously to compute its payment intent. Without `getOnInit`, the loader fires before React mount has had a chance to hydrate the atom, so on hard refresh the loader would see `[]` and treat the cart as empty.

`CartLine` is a deliberate snapshot of the product, not a reference. Storing the price/name/image at add-time means the cart doesn't desync when the catalog changes — if a price drops between add-to-cart and checkout, the cart shows what the user agreed to. Backend reconciles at checkout.

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

`<CartLineRow>` is defined in the same file (only used here, no need for a separate file). Each row:
- Image (h-24 w-24, rounded-sm)
- Name + variant type (e.g. "Size: Standard")
- Quantity stepper (-/+ buttons; 0 removes the line)
- Line total (with strike-through for `discounted_price_dollars` if present)
- Trash icon to remove the line

The variant type is only shown when the product had multiple variants (`hasVariantChoices` check inside `addToCartAtom`'s snapshot — products with a single variant store `variant_type: null`, so the row won't render the variant line).

## SlidePane integration

[`<SlidePane>`](../../../frontend/src/common/components/SlidePane.tsx) handles the responsive shell — three viewport states (full-screen below 530sw, wall-attached 480px wide between 530–1019, floating popover with margins at ≥1020sw), plus the portaled backdrop with click-to-close and body-scroll lock.

CartPane only fills in the content (header / list / footer) — no positioning or backdrop logic in CartPane itself. The same shell is used by `<FilterSidebar>` (left side); the `side` prop swaps the slide direction.

`SlidePane`'s backdrop sits at `z-[51]` and the pane at `z-[52]` — both above the navbar (`z-50`) and the bottom-bar (`z-30`), so the cart cleanly covers everything when open.

## Add-to-cart entry points

Anywhere `useSetAtom(addToCartAtom)` is consumed — primarily:
- [`<ProductDetailContent>`](../../../frontend/src/products/productDetailPane/ProductDetailContent.tsx) (in-flow ADD TO BAG button on the PDP)
- [`<ProductBottomBar>`](../../../frontend/src/products/ProductBottomBar.tsx) (sticky bottom-bar copy of the same button)

Both call `addToCart(product)`; the atom handles the quantity-increment vs new-line decision and opens the pane.

## Backlog

- **Add-on cart functionality** is unbuilt. The PDP's `<AddOns>` section (vase, card) doesn't yet wire to `addToCartAtom`; the buttons exist visually but don't add anything. Tracked as backlog — see the auto-memory entry `project_pdp_addons.md`.
