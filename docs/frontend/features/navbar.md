# Navbar

The fixed top header. Holds primary nav (left links / mobile burger), the centered logo, and the right cluster (search icon + cart). When opened, the search input *replaces* the navbar's in-row content rather than rendering alongside it. Dropdown panels (shop, search, mobile menu) all hang off the navbar via `absolute top-full`.

Files live under [`frontend/src/navbar/`](../../../frontend/src/navbar/).

## Single-active-panel state

The navbar's invariant is "at most one expanded panel at a time" — the desktop shop hover, the search overlay, and the mobile menu are mutually exclusive. That shape is encoded directly in [`navbarPanelAtom`](../../../frontend/src/navbar/navbarAtoms.ts):

```ts
export type NavbarPanel = 'shop' | 'search' | 'mobileMenu';
export const navbarPanelAtom = atom<NavbarPanel | null>(null);
```

Setting the atom to `'search'` implicitly closes shop and mobile menu — no scattered `setShopOpen(false)` calls at every panel-open call site.

For consumers, [`useNavbarPanel(name)`](../../../frontend/src/navbar/navbarAtoms.ts#L33) returns a `useState`-shaped `[isOpen, setIsOpen]` tuple. Sibling component code reads exactly like `useState`, so the single-active invariant is enforced by the data shape, not by call-site discipline.

A derived `navbarDropdownOpenAtom` returns `true` when shop or search is open. The root layout uses it to render a dim overlay over the page below the navbar.

## Two top-level shapes

[`<Navbar>`](../../../frontend/src/navbar/Navbar.tsx) renders one of two shapes depending on whether `searchOpen` is true:

- **Search closed:** the standard navbar — left links (desktop) or burger + search icon (mobile), centered logo, right cluster (search + cart).
- **Search open:** in-row content is replaced by the search input row (icon + `<input>` + close button). All viewports use the same shape; only the dropdown panel below differs.

The search-replaces-content swap morphs via the View Transitions API. The search input row carries `style={{ viewTransitionName: 'search-bar' }}` so when `toggleSearch` runs inside [`withViewTransition`](../../../frontend/src/common/utils/withViewTransition.ts), the browser cross-fades between the two shapes — including from the mobile menu's search button (which carries the same view-transition name) into the navbar's search input.

The `<input>` has `min-w-0 flex-1`. Without `min-w-0`, the input's intrinsic width (≥150px from the browser's default `size`) prevents it from shrinking and pushes the close button off the right edge below ~320sw.

## Dropdown panels

All three panels hang off the navbar via `absolute top-full`, sharing the same positioning shape:

| Panel | Component | Trigger | Visible at |
|---|---|---|---|
| Shop | [`<ShopDropdown>`](../../../frontend/src/navbar/ShopDropdown.tsx) | Hover/click "Shop" | Desktop only (`useIsDesktop`) |
| Search (desktop) | [`<SearchDropdown>`](../../../frontend/src/navbar/SearchDropdown.tsx) | Click search icon | `≥ 1024sw` |
| Search (mobile) | [`<MobileSearchOverlay>`](../../../frontend/src/navbar/MobileSearchOverlay.tsx) | Click search icon | `< 1024sw` |
| Mobile menu | [`<MobileMenuPanel>`](../../../frontend/src/navbar/MobileMenuPanel.tsx) | Click burger | Mobile only |

The overlays (mobile search, mobile menu) extend to the rest of the viewport via inline `height: calc(100dvh - var(--navbar-height))`. The desktop dropdowns size to their content.

Because they're positioned relative to the navbar, the panels inherit the navbar's transform — see "Hide-on-scroll" below for the implication.

## Hide-on-scroll

[`useHideOnScroll`](../../../frontend/src/navbar/useHideOnScroll.ts) (called from the root layout) hides the navbar when the user scrolls down past the navbar height and shows it again when they scroll up. It also drives `--navbar-offset`, a CSS variable that other sticky elements (e.g. the listing-header bar) can use to position themselves below or against the navbar's current edge.

Three pause conditions, all coexisting:

1. **Pending route navigation** (`useRouterState({ select: s => s.isLoading })`) — avoids stale slides while the next page is loading.
2. **Window resize** — reflow can clamp `window.scrollY` (e.g. you're at the bottom of a long page that becomes shorter), and those involuntary scroll events would otherwise read as a direction change and make the navbar flutter. While `resize` events are firing, the scroll handler returns early; 200ms after the last resize, `lastScrollY` is re-synced and normal behavior resumes.
3. **Panel open** — when any `navbarPanelAtom` value is non-null, the scroll handler is paused AND the navbar is force-reset to `translateY(0)` plus its full `--navbar-offset`. Without this, opening a panel while the navbar was hidden would leave the panel hanging off-screen (since the overlay's `absolute top-full` inherits the navbar's transform).

State is tracked via refs (`hiddenRef`, `panelOpenRef`) so cross-effect coherence is preserved — the panel-open effect can flip `hiddenRef.current = false` to keep the scroll handler's idea of state in sync after force-resetting the transform.

## Logo viewport behavior

The centered logo (`width: clamp(167px, 15.3vw, 214px)`) is hidden below 300sw via `hidden min-[300px]:block`. At narrow widths the logo would overlap the burger / search / cart icons; below 300sw the navbar reads as a tight icon-only bar.

## CSS variable wiring

[`useNavbarCssHeight`](../../../frontend/src/navbar/useElementHeight.ts) sets `--navbar-height` on the document root via a `ResizeObserver` — read by mobile overlays for their fill-rest-of-viewport height calc, and by sticky elements for offsetting. Updates without a React re-render.

`--navbar-offset` (driven by `useHideOnScroll`) tracks how far the navbar is currently visible: `var(--navbar-height)` when shown, `0px` when hidden. Pair it with `--navbar-offset-transition: top 300ms` to make sticky bars below the navbar slide in/out alongside it.

## Z-index

The navbar is `z-50`. The dim overlay used when shop/search dropdowns open is `z-40` (rendered in the root layout below the navbar). Other fixed page bars (`<ProductBottomBar>`) are at `z-30` so the overlay covers them when a navbar panel is open. The cart's [`<SlidePane>`](../../../frontend/src/common/components/SlidePane.tsx) uses `z-[51]` (backdrop) and `z-[52]` (pane) — above the navbar — so the cart pane covers everything including the navbar's dropdown content.

## Search term as shared state

[`searchTermAtom`](../../../frontend/src/navbar/navbarAtoms.ts) is the single source of truth for the visible input value. The desktop dropdown and mobile overlay each read the atom and locally `useDebounce` it before firing their query — so typing doesn't spam the backend, but each dropdown's results stay in sync with the live input.

Closing search clears the term so the next open starts fresh; `autoFocus` on the input handles initial focus (each open is a fresh mount of the search-row JSX).
