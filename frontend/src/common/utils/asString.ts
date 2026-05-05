// Narrow an unknown value to a string; non-strings become undefined.
// Mainly for TanStack Router `validateSearch` where each field arrives as
// `unknown` and needs the same coercion.

export const asString = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined;
