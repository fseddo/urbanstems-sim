# Add-ons (vases + gifts) — implementation plan

Forward-looking plan, not current-state. Once shipped, fold into [`docs/frontend/features/cart.md`](../frontend/features/cart.md), [`docs/frontend/features/products.md`](../frontend/features/products.md), and [`docs/backend/features/products.md`](../backend/features/products.md), then delete this file.

## Goal

Two new add-on types — **vases** and **gifts** — selectable from the PDP and from cart lines. They're real Products in the catalog (so they reuse the price/image/description/serializer machinery) but they have no standalone selling surface (no listing page, no PDP route). They're always attached to a parent bouquet line in the cart and contribute to that line's set price; they cannot exist as orphan cart lines.

## Design decisions (settled)

| Decision | Choice | Why |
|---|---|---|
| Storage | Real `Product` rows with new `addon_type` field | Reuses Product serializer, image/price/description fields, the `productQueries.detail` endpoint, and the `addToCartAtom` snapshot machine. One discriminator field handles all gating. |
| Discoverability | No frontend listing page, no PDP route | A standalone listing creates a dead-end ("how do I buy this without a bouquet?"). The selector modal *is* the listing — same data, presented in the only context where the action makes sense. |
| Cart shape | Nested: `CartLine.addons: CartItem[]` | Data shape mirrors visual "set" shape. Quantity stepper applies to the whole set. Removing parent removes the set. |
| PDP flow | Configurator: pending selection on PDP, bundles into one ADD TO BAG | Avoids the "I clicked add and nothing happened" failure mode. Preview-before-commit feel. |
| Vase trigger gating | Hidden everywhere (PDP AddOns row + cart line) when `isVaseAddonEligible(product) === false`, and on the cart line once a vase is already in the set. Selected vase has its own remove control. | One frontend helper combines two signals: `vase_included === true` (bouquet ships with a vase) OR `category=plants` tag (plants use pots, not vases). UI rule, lives with UI. To exclude more categories later, edit the helper. |
| Gift trigger | Always offerable today (no `gift_included` field). Hidden once a gift is in the set, on the cart line. | If we ever want bouquets to suppress gift offers, add a `gift_included` field and mirror the vase gating. |
| AddOns section on PDP | Collapsible | Reduce visual noise when not engaging with add-ons. |
| Detail "Learn More" view | Replace selector pane content with detail content + Back button | One pane, two views. Avoids triple-stacked panes (cart > selector > detail). |

## Backend

### `Product` model

Add one field:

```python
class AddonType(models.TextChoices):
    VASE = "vase", "Vase"
    GIFT = "gift", "Gift"

class Product(models.Model):
    # ...existing fields
    addon_type = models.CharField(
        max_length=10, choices=AddonType.choices,
        null=True, blank=True,
        help_text="If set, this Product is an add-on of the given type "
                  "(not a standalone bouquet). Filtered out of normal "
                  "listings/search by default."
    )
```

Migration is additive, default `null` for all existing rows.

### `ProductFilter`

`addon_type` becomes a filterable field. **Default behavior** (when `addon_type` is not in the query string): exclude all add-on rows.

```python
class ProductFilter(django_filters.FilterSet):
    addon_type = django_filters.CharFilter(method='_filter_addon_type')

    def _filter_addon_type(self, queryset, name, value):
        # Explicit value: filter to that addon_type ('vase' / 'gift')
        return queryset.filter(addon_type=value)

    @property
    def qs(self):
        qs = super().qs
        # Default: exclude add-ons unless explicitly requested
        if 'addon_type' not in self.request.GET:
            qs = qs.filter(addon_type__isnull=True)
        return qs
```

This keeps add-ons out of `/api/products/` listings, search, collection pages, occasion pages, etc., without touching every consumer. The selector modal opts in via `?addon_type=vase`.

### `ProductSerializer`

Add `addon_type` to the serialized fields. No other changes — image/price/description/etc. all already exist.

### `ProductViewSet.retrieve`

Already works for any slug, including add-ons — the modal's Learn More view fetches via the existing `/api/products/<slug>/` endpoint. No code change needed.

If we want to *prevent* add-on slugs from being retrievable directly (defense against URL-poking), we could 404 them in `retrieve` when `addon_type is not None`. I'd skip this — the modal needs the endpoint, and there's no security concern.

### Seeding

Add a few vase + gift fixtures to `seed_products.py` — name, image, price, description, `addon_type`. Three vases and three or four gifts is enough to fill the modal usefully. Note that without `addon_type__isnull=True` filtering they'd appear in listings; the FilterSet change above gates them out automatically.

## Frontend

### Types

`Product` gains one optional field:

```ts
// frontend/api/products/Product.ts
export interface Product {
  // ...existing
  addon_type: AddonType | null;
}

// frontend/api/products/AddonType.ts (new)
export type AddonType = 'vase' | 'gift';
export const ADDON_TYPES: readonly AddonType[] = ['vase', 'gift'] as const;
```

`ProductFilters` gains `addon_type`:

```ts
// frontend/api/products/ProductFilters.ts
export interface ProductFilters {
  // ...existing
  addon_type?: AddonType;
}
```

### Cart shape changes

```ts
// frontend/src/cart/cartAtoms.ts
export interface CartItem {
  slug: string;
  name: string;
  variant_type: VariantType | null;
  price_dollars: number;
  discounted_price_dollars: number | null;
  main_image: string | null;
  vase_addon_eligible: boolean; // NEW — for cart-line "Add a Vase" gating. Computed at snapshot time via isVaseAddonEligible(product) — combines vase_included + category=plants check. Cart never sees the underlying signals.
  addon_type: AddonType | null; // NEW — distinguishes parent vs addon snapshots
}

export interface CartLine {
  item: CartItem;
  quantity: number;
  addons: CartItem[]; // NEW — empty by default; populated by addons attached to this set
}
```

`addToCartAtom` writes `addons: []` for new lines. The existing slug-match merge logic stays the same: re-adding the same parent increments quantity (the existing addons stay attached — the user added another of "the same set," not a fresh bouquet without addons).

`cartTotalAtom` updates to sum addon prices into each line:

```ts
export const cartTotalAtom = atom((get) =>
  get(cartItemsAtom).reduce((sum, line) => {
    const addonSum = line.addons.reduce((a, x) => a + x.price_dollars, 0);
    return sum + (line.item.price_dollars + addonSum) * line.quantity;
  }, 0)
);
```

New write atoms:

```ts
// Attach an add-on to a specific cart line. Per-type rules:
// - vase: at most one per set; new vase replaces any existing vase
// - gift: unlimited per set; new gift appends
export const attachAddonToLineAtom = atom(
  null,
  (get, set, payload: { lineSlug: string; addon: CartItem }) => {
    set(cartItemsAtom, get(cartItemsAtom).map((line) => {
      if (line.item.slug !== payload.lineSlug) return line;
      const nextAddons = payload.addon.addon_type === 'vase'
        ? [...line.addons.filter((a) => a.addon_type !== 'vase'), payload.addon]
        : [...line.addons, payload.addon];
      return { ...line, addons: nextAddons };
    }));
  }
);

export const removeAddonFromLineAtom = atom(
  null,
  (get, set, payload: { lineSlug: string; addonSlug: string }) => {
    set(cartItemsAtom, get(cartItemsAtom).map((line) =>
      line.item.slug !== payload.lineSlug
        ? line
        : { ...line, addons: line.addons.filter((a) => a.slug !== payload.addonSlug) }
    ));
  }
);
```

### Selector pane state

A new file `frontend/src/addons/addonAtoms.ts`:

```ts
// What context opened the selector — drives where the ADD click writes to.
export type AddonSelectorContext =
  | { kind: 'pdp'; parentSlug: string }      // PDP — writes pending selection
  | { kind: 'cart-line'; lineSlug: string }; // cart line — writes directly to cart

export const vaseSelectorAtom = atom<AddonSelectorContext | null>(null);
export const giftSelectorAtom = atom<AddonSelectorContext | null>(null);

// Per-PDP-product pending add-on selections, keyed by parent product slug.
// Cleared when the parent is added to cart (consumed by addToCartAtom).
export type PendingAddons = { vase?: CartItem; gift?: CartItem };
export const pendingAddonsAtom = atomWithStorage<Record<string, PendingAddons>>(
  'urbanstems-pending-addons',
  {},
  undefined,
  { getOnInit: true }
);
```

`addToCartAtom` extends to consume the pending entry for that product slug:

```ts
export const addToCartAtom = atom(null, (get, set, product: Product) => {
  // ...existing snapshot logic
  const pending = get(pendingAddonsAtom)[product.slug] ?? {};
  const addons = [pending.vase, pending.gift].filter((x): x is CartItem => x != null);
  // push line with `addons`, or merge into existing line and union addons
  // clear pendingAddonsAtom[product.slug] after add
});
```

### Components — new

| File | Purpose |
|---|---|
| `frontend/src/addons/AddonSelectorPane.tsx` | Generic SlidePane that lists Products of a given `addon_type`. Driven by either `vaseSelectorAtom` or `giftSelectorAtom`. Two views: list (vase/gift cards with ADD + Learn More) and detail (large image + description + ADD). Local `selectedSlug` state for the list↔detail swap. |
| `frontend/src/addons/AddonRow.tsx` | One row in the selector list — image, name, subtitle, price, ADD button, Learn More link. |
| `frontend/src/addons/AddonDetail.tsx` | Detail view inside the same pane: large image, name, subtitle, full description, ADD button, Back button in header. Fetches via `productQueries.detail(slug)` (same as PDP). |
| `frontend/src/addons/useAddAddon.ts` | Hook called by ADD button. Reads the selector context atom; routes to `pendingAddonsAtom` (PDP mode) or `attachAddonToLineAtom` (cart-line mode). Closes the selector after. |

The same components are reused for vases and gifts — the only difference is which atom drives them and which header text shows ("Vases" vs "Gifts"). One generic `AddonSelectorPane` parameterized by `addonType: AddonType` covers both.

Mount one instance for each at the root layout (sibling to `<CartPane>` in `__root.tsx`), each subscribed to its own atom. Both render `<SlidePane side='right'>` so they stack visually over whatever is below.

### Components — changed

**`frontend/src/products/productDetailPane/ProductAddOns.tsx`**

Replace the static placeholder with real interactive rows. Reads `pendingAddonsAtom[product.slug]` and renders one of two states per add-on type:

- **Empty:** thumbnail + copy ("Enhance Your Bouquet With The Perfect Vase") + "Add A Vase" link → opens vase selector with `{ kind: 'pdp', parentSlug: product.slug }` context.
- **Selected:** selected vase's image + name + price + "Edit" link (re-opens selector) + small remove (X) button.

**Gating per row** — same signals as the cart-line triggers, via shared helper:
- Vase row is **hidden entirely** when `isVaseAddonEligible(product) === false` (bouquet ships with a vase, OR product is a plant — plants use pots, not vases).
- Gift row always renders (no `gift_included` equivalent on Product today). If we later want some bouquets to suppress gift offers, add a `gift_included` field and mirror the gating.
- If both rows happen to be hidden (only possible if a future `gift_included` is added), the whole `<AddOns>` section unmounts — no empty "Make It Extra Special" header.

Wrap the whole section in `<CollapsiblePanel open={open}>` (already in `frontend/src/common/components/CollapsiblePanel.tsx`) with a header row that toggles `open` — defaults open if any pending selection exists, defaults closed otherwise. Header shows "Make It Extra Special" + chevron.

The component now needs `product.slug` to read from the pending atom. Update its prop signature:

```ts
export const AddOns = ({ product }: { product: Product }) => { ... }
```

And update its consumer ([`ProductDetailContent`](../../frontend/src/products/productDetailPane/ProductDetailContent.tsx)) to pass `product`.

**`frontend/src/products/productDetailPane/ProductDetailContent.tsx`**

The ADD TO BAG button label and price reflect the bundled total when add-ons are pending:

```ts
const pending = useAtomValue(pendingAddonsAtom)[product.slug] ?? {};
const addonSum = (pending.vase?.price_dollars ?? 0) + (pending.gift?.price_dollars ?? 0);
const setPrice = product.price_dollars! + addonSum;
const buttonLabel = addonSum > 0
  ? `ADD TO BAG WITH ADD-ONS - $${setPrice}`  // copy TBD; "WITH ADD-ONS" is generic
  : `ADD TO BAG - $${product.price_dollars}`;
```

(Copy decision: "WITH ADD-ONS" is generic; "WITH VASE" / "WITH VASE & GIFT" reads better but combinatorial. Pick one — either way the price reflects the set total.)

`<ProductBottomBar>` needs the same treatment — its sticky ADD TO BAG also reflects the set price. Same atom read; same label logic. Worth extracting `useAddToBagButtonProps(product)` if both consumers grow.

**`frontend/src/cart/CartPane.tsx`**

`<CartLineRow>` rendering shifts when `line.addons.length > 0`:

- **No add-ons:** today's layout (image, name, "Size: Single", qty stepper, total).
- **With add-ons:** name becomes `${item.name} Set`. Replace the "Size: …" line with a vertical stack of sub-rows — one per component (parent first, then each addon). Each sub-row: small thumbnail + "1 × {name}" + (for addons) trash icon → `removeAddonFromLineAtom`. Qty stepper applies to the whole set; total = `(item.price + Σ addon.price) × quantity`.

Below the row, render trigger buttons:
- "ADD A VASE" — visible iff `item.vase_addon_eligible` AND no addon with `addon_type === 'vase'` in `line.addons`. Click → opens vase selector with `{ kind: 'cart-line', lineSlug: item.slug }`.
- "ADD A GIFT" — visible iff no addon with `addon_type === 'gift'` in `line.addons`. (No `gift_included` equivalent on Product — could add one if needed; otherwise gifts are always offerable.)

These buttons replicate the dark "ADD A VASE" pill in your screenshot.

### Routing / queries

- New: nothing. `productQueries.list({ addon_type: 'vase' })` works via `createQueryParams`. `productQueries.detail(slug)` works for add-ons unchanged.
- Selector pane: `useQuery(productQueries.list({ addon_type: type }))` on open. Detail view: `useQuery(productQueries.detail(selectedSlug))` when in detail mode.

### What does NOT change

- `<ProductCard>`, collection/landing/search routes — the FilterSet's default exclusion keeps add-ons invisible.
- `addToCartAtom`'s public signature — it still takes a `Product`. Internally it consumes the pending-addons atom.
- Checkout — the cart payload sent to the backend's payment-intent now includes nested add-ons. **Backend payment-intent calculation needs to sum addon prices** (small change in `checkout/views.py` — verify with the existing serializer).

## Open considerations

- **Cart merge logic.** Two cart lines merge iff they have the same parent slug AND the same set of addon slugs. Concretely: a fingerprint `slug + sorted(addons.map(a => a.slug)).join(',')`. Examples:
  - "The Sorbet" + "The Sorbet" → merges (qty 2)
  - "The Sorbet Set (Rose Quartz Vase)" + "The Sorbet Set (Rose Quartz Vase)" → merges
  - "The Sorbet" + "The Sorbet Set (Rose Quartz Vase)" → two separate lines
  - "The Sorbet Set (Rose Quartz Vase)" + "The Sorbet Set (Glass Vase)" → two separate lines
- **Per-set add-on cap.** **One vase max** per set — `attachAddonToLineAtom` for `addon_type === 'vase'` replaces any existing vase. **Unlimited gifts** per set — gift attachment appends; the cart sub-rows render one row per gift with its own trash icon. Cart-line "ADD A GIFT" trigger stays visible even when gifts are already attached (no per-type cap to enforce). PDP `pendingAddons` shape changes accordingly:

  ```ts
  export type PendingAddons = { vase?: CartItem; gifts: CartItem[] }; // gift list, not single
  ```
- **Pending-addons persistence.** Storing `pendingAddonsAtom` in localStorage means selections survive reload, which feels right. But cross-tab edge cases (two tabs, two PDPs of the same product, racing pending selections) won't matter at this scale.
- **Backend payment-intent.** Resolved: no backend change required. Frontend flattens the cart payload — see slice 7.

## Build order

A natural slice — each step ships visibly and isn't broken alone:

1. **Backend:** `addon_type` field + migration + FilterSet default exclusion + serializer + seed fixtures. Test via `/api/products/?addon_type=vase`. No frontend visible change.
2. **Cart shape:** `CartLine.addons`, `CartItem.vase_included` + `addon_type`, derived total, attach/remove atoms. Cart pane renders the new "set" layout when addons present (none yet — verify via console-attached addon to test). No new triggers wired.
3. **Selector pane:** generic `AddonSelectorPane` + atoms + `useAddAddon`. Mount two instances at root. Driven by atoms — initially nothing opens it.
4. **Cart-line triggers:** "ADD A VASE" / "ADD A GIFT" buttons in cart pane open the selector with cart-line context. End-to-end: parent in cart → click "ADD A VASE" → select vase → vase appears in set. First user-visible new flow.
5. **PDP triggers:** rebuild `<AddOns>` with empty/selected states + collapsible wrapper. ADD TO BAG button label/price reflects pending. `addToCartAtom` consumes `pendingAddonsAtom`. Bottom bar mirror.
6. **Detail "Learn More":** swap selector pane body to detail view. Back button restores list view.
7. **Checkout payload flattening:** in [`checkoutQueries.ts`](../../frontend/api/checkout/checkoutQueries.ts), update the `paymentIntent` queryFn body to `flatMap` each line into `[parent, ...addons]`, each as `{slug, quantity: line.quantity}`. Update `lineHash` to include sorted addon slugs in the cache key (so two carts with different addon configs don't collide). **Zero backend changes** — `_compute_totals` and the email renderer both use `Product.objects.filter(slug__in=...)` directly (default manager, no FilterSet), so addon slugs resolve and price normally. Verify end-to-end with a test card. Known minor regression: addon line names eat into the `lines` metadata's existing 500-char Stripe limit (called out in [`docs/improvements/backend.md`](../improvements/backend.md)) — addons exacerbate but don't introduce the issue.

## What to delete / promote when shipped

- Delete `project_pdp_addons.md` from auto-memory (this plan is its resolution).
- Update `docs/frontend/features/cart.md` — replace the "Add-on cart functionality is unbuilt" backlog note with the actual cart-shape description (nested addons, set rendering, triggers).
- Update `docs/frontend/features/products.md` — describe the configurator AddOns section + pending-addons atom.
- Update `docs/backend/features/products.md` — note `addon_type` field and the FilterSet default-exclusion behavior.
- Add a feature doc `docs/frontend/features/addons.md` for the selector pane (mirrors the cart doc shape).
- Delete this file.
