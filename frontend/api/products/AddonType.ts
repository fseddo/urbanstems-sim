// `null` on Product = regular bouquet; otherwise the row is an add-on
// (vase/gift) attachable to a parent line. Single source of truth for the
// literal union — `Record<AddonType, ...>` consumers derive from this.

export type AddonType = 'vase' | 'gift';

export const ADDON_TYPES: readonly AddonType[] = ['vase', 'gift'] as const;
