import { imageAtWidth } from '../utils/imageAtWidth';

export type SourceTier = {
  // CSS media query for this `<source>` (e.g. '(min-width: 1024px)').
  media: string;
  // Widths to include in the source's `srcset`. Each width is appended to
  // `src` via `imageAtWidth(src, w)` and tagged `${w}w` in the srcset.
  widths: number[];
};

type Props = {
  src: string;
  alt: string;
  // Conditional `<source>` elements. The browser picks the first matching
  // one, so order from most-specific to least (e.g. `(min-width: 1600px)`
  // before `(min-width: 1024px)`).
  sources?: SourceTier[];
  // Widths for the default `<img>`'s `srcset`. The largest is typically a
  // good default to use as `defaultWidth` too.
  defaultWidths: number[];
  // Width to render in the `src` attribute itself (the absolute fallback
  // when none of the srcsets apply, e.g. very old browsers).
  defaultWidth: number;
  // Intrinsic dimensions for CLS prevention — the browser uses these to
  // reserve aspect-ratio space before the image loads.
  width?: number;
  height?: number;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
  className?: string;
  // When true, the image is treated as decorative — empty `alt`,
  // `aria-hidden`, `role="presentation"`. Use for atmosphere/lifestyle
  // images that don't carry semantic content.
  decorative?: boolean;
};

const buildSrcset = (src: string, widths: number[]) =>
  widths.map((w) => `${imageAtWidth(src, w)} ${w}w`).join(', ');

// Responsive `<picture>` wrapper. Builds viewport-conditional `<source>`
// elements with `srcset` from a list of width tiers, plus a default `<img>`
// fallback. Lets the browser pick the smallest sufficient image for the
// viewport instead of the caller hardcoding one width.
//
// Powers PDP hero, lifestyle image grid, swatches — anywhere we want the
// browser to fetch right-sized images. See [`docs/improvements/pdp-refactor.md`].

export const PictureSrcset = ({
  src,
  alt,
  sources = [],
  defaultWidths,
  defaultWidth,
  width,
  height,
  loading,
  fetchPriority,
  className,
  decorative = false,
}: Props) => {
  return (
    <picture>
      {sources.map((tier) => (
        <source
          key={tier.media}
          media={tier.media}
          srcSet={buildSrcset(src, tier.widths)}
        />
      ))}
      <img
        src={imageAtWidth(src, defaultWidth)}
        srcSet={buildSrcset(src, defaultWidths)}
        alt={decorative ? '' : alt}
        aria-hidden={decorative || undefined}
        role={decorative ? 'presentation' : undefined}
        width={width}
        height={height}
        loading={loading}
        fetchPriority={fetchPriority}
        className={className}
      />
    </picture>
  );
};
