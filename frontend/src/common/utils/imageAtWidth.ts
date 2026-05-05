// Append the image-CDN's `width=` resize param to a source URL. Picks `?`
// or `&` based on whether the URL already has a query string. Returns ''
// for null/undefined so callers don't have to guard before passing.

export const imageAtWidth = (
  src: string | null | undefined,
  width: number
): string => {
  if (!src) return '';
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}width=${width}`;
};
