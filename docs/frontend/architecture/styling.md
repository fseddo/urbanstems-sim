# Styling

How `className` strings are composed in this codebase, when to reach for the `tw()` helper, and what colors are sanctioned.

## The `tw()` helper

[`tw()`](../../../frontend/src/common/utils/tw.ts) is a thin wrapper over `tailwind-merge`. Use it any time a `className` combines multiple values or includes conditionals. Pass each fragment as a separate argument — never build the string with template literals or `+`.

```tsx
// good
className={tw(
  'flex flex-col gap-8 transition-opacity',
  formReady ? 'opacity-100' : 'pointer-events-none opacity-0'
)}

// bad
className={`flex flex-col gap-8 ${formReady ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
```

Two reasons:
- `twMerge` resolves conflicting Tailwind classes (`p-4 p-6`, `opacity-0 opacity-100`) to the last one rather than racing in the cascade.
- Comma-separated arguments keep each conditional readable on its own line.

A single static string with no conditionals or arbitrary values can stay a plain string literal — `tw()` with one argument is just ceremony.

## Responsive variants and arbitrary values

Once a `className` gains responsive variants (`md:`, `lg:`, `min-[X]:`, `max-[Y]:`) or arbitrary sizing values (`text-[Npx]`, `w-[clamp(...)]`, `bg-[linear-gradient(...)]`), **reach for `tw()` even with no conditionals**, and **group the comma-separated arguments by purpose, not by breakpoint**.

Typical groups:
1. Visual identity (colors, font, alignment)
2. Layout (width, padding, flex/grid, position)
3. Responsive type/size — each base value sitting next to its variants on the same line.

```tsx
// good — three groups by purpose, responsive deltas live with their base
className={tw(
  'bg-brand-summer font-crimson text-center text-white',
  'px-page w-full py-1.5',
  'text-[16px] max-[560px]:text-[14px] max-[560px]:leading-3'
)}

// bad — long flat string buries the responsive deltas
className='bg-brand-summer font-crimson px-page w-full py-1.5 text-center text-[16px] text-white max-[560px]:text-[14px] max-[560px]:leading-3'
```

Why purpose-grouping works: the responsive delta is the part that needs to be most readable — design tweaks and bugs land there. As the codebase moves toward fluid/responsive sizing across the page, splitting purposes onto their own lines means a future reader scans vertically to find the right group instead of parsing a long horizontal string. The base value and its variants ride together (`text-[16px] max-[560px]:text-[14px]`), so each breakpoint's override is unambiguous.

The trigger is *multiple purposes worth separating*, not "any arbitrary value." A flat string with one purpose and one arbitrary (`'font-crimson text-shadow text-[clamp(32px,3.3vw,50px)]'`, `'absolute inset-0 h-full w-full object-cover'`) can stay plain.

References: [`<NavNotificationBanner>`](../../../frontend/src/navbar/NavNotificationBanner.tsx), [`<LandingVideo>`](../../../frontend/src/landing/video/LandingVideo.tsx).

## Palette

Use only colors from the existing palette in [`globals.css`](../../../frontend/src/globals.css):

| Token | Use |
|---|---|
| `background` | App background |
| `background-alt` | Slightly darker neutral surface (e.g. filter chip bubble) |
| `foreground` | Default text + heavy accents |
| `brand-primary` | Brand color — used for borders, headlines, accent fills |
| `footer` | Footer background |

Tailwind opacity variants (`brand-primary/70`, `bg-white/10`, `text-white/60`) compose normally. Black and white at any opacity are also fine.

If a design genuinely needs a new color, **ask first**. New tokens get added to both `:root` (the value) and `@theme inline` (the Tailwind utility binding) so they're reusable, named, and themable.

Don't:
- Inline hex values in component classes (`text-[#1e2934]`, `bg-[#f0ede8]`).
- Reach for arbitrary Tailwind palette colors (`bg-red-50`, `text-amber-600`, `border-gray-200`) without confirming.

Pre-existing violations are tracked in [`docs/improvements/src-commerce-shared.md`](../../improvements/src-commerce-shared.md) — fix as you touch the relevant components, but don't sweep them all in one go without alignment on what each gray means semantically.

## Letter-spacing for action text

Uppercase CTAs (buttons + tracked text-link CTAs like "SHOP ALL", "GOT IT", "ADD TO BAG", "VIEW ALL") share a single letter-spacing token: `tracking-action` = `1.68px`. Defined in [`globals.css`](../../../frontend/src/globals.css)'s `@theme inline` and applied uniformly across [`<AnimatedButton>`](../../../frontend/src/common/components/AnimatedButton.tsx), all ADD TO BAG / ADD TO CART buttons, checkout / cart CTAs, navbar dropdown SHOP NOW links, modal "GOT IT" buttons, and similar surfaces.

When adding a new uppercase action element, use `tracking-action` rather than a one-off `tracking-wider` / `tracking-widest` / arbitrary `tracking-[Xpx]`. The token exists so the action-text rhythm stays consistent across the app.
