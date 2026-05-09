# PDP reference CSS rules — extracted from upstream theme-css

Captured during the PDP refactor so subsequent phases don't re-extract the
same CSS from a 200KB minified blob. Delete when
[`pdp-refactor.md`](pdp-refactor.md) is removed.

These are the load-bearing rules for the PDP layout. Inline notes explain
how each maps to our app.

---

## Page-level layout (architecture confirmed)

Hero is row 1 (full bleed). Below it, secondary (image grid + accordions)
is on the LEFT (54.1% wide), pane is on the RIGHT (40.8% wide), 5.1%
gutter between. The pane is `position: sticky` and overlaps the right
side of the hero, then sticks down through the secondary area until the
section ends. The right side past the hero — where the pane lives — is
just page background; no special treatment.

On smaller non-touch viewports the secondary may collapse from two-column
to single-column. On touch the secondary lives below the pane (which is
where touch puts the accordions), as a single vertical list.

```css
.shopify-section--product { position: relative; z-index: 1; --product-media-offset-bottom: 40px; }
.pdp__secondary { position: relative; z-index: 1; }
```

## Hero (`.pdp__media-items` + `.pdp__media-item`)

```css
/* Wrapper — caps total hero size at viewport-minus-header. The
   "ramp at certain sizes" comes from this clamp interacting with
   slide widths set in vw. */
.pdp__media-items { max-height: calc(100vh - var(--header-height)); }

/* Each slide uses the :before padding-top trick to assert an aspect
   ratio. Image is absolutely positioned to fill. */
.pdp__media-item { position: relative; }
.pdp__media-item:before { content: ""; display: block; padding-top: calc(906/1152 * 100%); }
.pdp__media-item:first-child:before { padding-top: calc(906/848 * 100%); }
.pdp__media-item img { position: absolute; inset: 0; height: 100%; width: 100%; object-fit: cover; }

/* Slide widths are vw-based (so height ramps with viewport width). */
.pdp__media-item { width: calc(1046/(1728 - 160) * 100vw); }              /* ≈ 66.7vw, normal slides */
.pdp__media-item:first-child:not(.pdp__media-item--wider) {
  width: calc(762/(1728 - 160) * 100vw);                                  /* ≈ 48.6vw, narrower first slide */
}

/* The `.pdp__media-item--fill` modifier (used for our hero) overrides
   the aspect ratios. */
.pdp__media-item--fill:before,
.pdp__media-item--fill:first-child:before {
  padding-top: calc(641/600 * 100%);                                       /* ≈ 1.068, slightly taller than wide */
}

/* The :first-child img can have its own object-fit override via custom prop. */
.pdp__media-item:first-child img { object-fit: var(--gallery-first-image-object-fit, cover); }

/* Slide bottom margin (between slides + content below). */
.pdp__media-item { margin-bottom: 40px; }
.pdp__media-item--fill { margin-bottom: 60px; }

/* Smooth slide transitions (respects reduced-motion). */
.pdp__media-item.pdp__media-item img,
.pdp__media-item.pdp__media-item:before,
.pdp__media-item { transition: var(--prefers-reduced-motion-none, 300ms ease-in-out); }
```

**Application to our code:** the hero wrapper should NOT use
`height: calc(100dvh - var(--navbar-height))` (which only ramps with
viewport height). Use `max-height: calc(100dvh - var(--navbar-height))`
on the wrapper + `aspect-ratio: 600/641` per slide (or the `:before`
padding-top trick). Slide width-in-vw drives slide-height-in-vw, capped
by max-height.

## Hero parent (`.pdp__media`)

```css
.pdp__media { position: relative; --product-media-offset-left: var(--wrap-h); margin-left: calc(-1 * var(--product-media-offset-left)); z-index: -1; }
.pdp__media { --product-media-offset-left: 30px; }    /* desktop value (under @media (min-width: 1024px)) */

/* THIS IS THE GRAY YOU NOTICED. A pseudo-element painted #F2F2F2,
   100vw wide, sitting behind the hero. Extends past the section's
   horizontal padding so the gray reaches the viewport edges. */
.pdp__media:before {
  content: ""; position: absolute; top: 0; left: calc(-1 * var(--wrap-h));
  height: 100%; width: 100vw; background-color: #F2F2F2;
}
```

**Application to our code:** add a `:before` pseudo on our hero wrapper
(or a sibling absolute div) painted `bg-background-alt` (or a closer
match to `#F2F2F2`), full viewport width, behind the hero (z-index: -1).
Worth holding off on this until other shapes are right; visual nicety,
not structural.

## Pane (`.pdp__info`)

```css
.pdp__info {
  display: flex; flex-direction: column; align-items: center;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0px 4px 40px 0px rgba(0, 0, 0, 0.12);
  text-align: center;
  transition: var(--pdp-info-transition, top 250ms ease-in-out);
}

/* The sticky behavior. Top offset = header + 40px gap, reduced by an
   optional offset CSS var (likely set when navbar hides on scroll). */
.pdp__info--sticky {
  position: sticky;
  top: calc(var(--header-height) + 40px - var(--pdp-info-sticky-top-offset, 0px));
}
```

Geometry tokens (from inline `style` on the pane element):

```css
.pdp__info {
  --margin-desktop: 40px 0 0 calc(80/1568 * 100%);
  --margin-mobile: 0;
  --padding-desktop: var(--pdp-info-padding-desktop, 36px clamp(32px, calc(40/1728 * 100%), 74px) clamp(40px, calc(74/1728 * 100%), 74px));
  --padding-mobile: 28px 16px 51px;
  --width-desktop: calc(640/1568 * 100%);
  --width-mobile: 100%;
}
```

**Application to our code:** Phase 3.1 work. We have a placeholder
`w-[37vw]` and `right-[90px]` — replace with width 40.8% of container,
left margin 5.1% of container, top margin 40px, padding clamps as above.

The transition `top 250ms ease-in-out` is what creates a smooth pane
slide when the navbar offset changes. Our equivalent is the
`--navbar-offset-transition` CSS var we already pass through.

Our existing `top: calc(var(--navbar-offset) + 40px)` is roughly
equivalent to their `calc(var(--header-height) + 40px - var(--pdp-info-sticky-top-offset, 0px))`,
with the sign flipped: theirs subtracts an offset; ours adds one (because
our `--navbar-offset` is negative when the navbar is hidden).

## Image grid (`.pdp__lifestyle-grid`)

```css
.pdp__lifestyle-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-column-gap: 16px;
  margin-bottom: 64px;
}
.pdp__lifestyle-grid-item:last-child { margin-top: 16px; }
.pdp__lifestyle-grid-asset { border-radius: 8px; }

/* Mobile (likely scoped under @media (max-width: 1023px) or similar) */
.pdp__lifestyle-grid {
  grid-template-columns: repeat(1, 1fr);
  margin-bottom: 56px;
}
```

Per-figure aspect ratios via inline custom props consumed by an
`.aspect-ratio` utility (we don't have that utility; use Tailwind
`aspect-[W/H]` instead):

| Figure | Aspect (W/H) | Use |
|---|---|---|
| 1 | `438/779` | Main detail (often video) |
| 2 | `389/284` | Lifestyle 1 |
| 3 | `389/478` | Lifestyle 2 |

**Application to our code:** Phase 4 work. Replace
`aspect-[343/250]` / `aspect-[343/421]` placeholders + the fixed
`460×460×1100` cluster with this 2-col grid + per-figure aspect ratios.
Last child's `margin-top: 16px` gives vertical breathing when it wraps
to a new row in the 2-col layout.

## Secondary zone (`.pdp__secondary`)

```css
.pdp__secondary { position: relative; z-index: 1; }
```

Geometry tokens (from inline `style` on the wrapper):

```css
.pdp__secondary {
  --padding-desktop: 46px 0 0;
  --padding-mobile: 59px 0 0;
  --width-desktop: calc(848/1568 * 100%);    /* 54.1% of container */
  --width-mobile: 100%;
}
```

This is the LEFT zone below the hero on non-touch — holds the image grid
plus (on non-touch only) the description + care-instructions accordions.

## Utility classes (`.width`, `.margin`, `.padding`)

The reference uses a custom-prop-driven utility class system. The same
class consumes different `--*-desktop` / `--*-tablet` / `--*-mobile`
custom properties depending on the viewport:

```css
.width   { width:  var(--width,  var(--width-mobile,  auto)); }
.margin  { margin: var(--margin, var(--margin-mobile, 0));    }
.padding { padding: var(--padding, var(--padding-mobile, 0)); }

@media (min-width: 768px) {
  .width   { width:  var(--width,  var(--width-tablet,  var(--width-mobile,  auto))); }
  .margin  { margin: var(--margin, var(--margin-tablet, var(--margin-mobile, 0)));    }
  .padding { padding: var(--padding, var(--padding-tablet, var(--padding-mobile, 0))); }
}

@media (min-width: 1024px) {
  .width   { width:  var(--width, var(--width-desktop, var(--width-tablet, var(--width-mobile, auto)))); }
  .margin  { margin: var(--margin-desktop, var(--margin, 0)); }
  .padding { padding: var(--padding, var(--padding-desktop, 0)); }
}
```

**Translation pattern:** wherever the reference HTML carries
`class="width margin padding"` + inline `style="--width-desktop: …;"`,
our app should set the equivalent dimension via Tailwind classes or
the `style` prop directly.
