import { ProductSortKey } from '@/api/products/ProductFilters';
import { SortOrder } from '@/api/PaginatedResponse';

// UIFilters covers what the sidebar can toggle. Collection/occasion are
// not in here — those are URL-path-driven (the user reaches them via
// /collections/<slug>, not by ticking a sidebar checkbox).
export type UIFilters = {
  sortKey?: ProductSortKey;
  sortOrder?: SortOrder;
  category?: string[];
  stem_type?: string[];
  color?: string[];
  vase_included?: true;
  min_price?: number;
  max_price?: number;
};

export type FilterChip = {
  key: string;
  label: string;
  onRemove: () => void;
};

export type FilterSpec = {
  isActive: (filters: UIFilters) => boolean;
  chips: (
    filters: UIFilters,
    update: (next: UIFilters) => void
  ) => FilterChip[];
  parseSearch: (search: Record<string, unknown>) => Partial<UIFilters>;
};

export type SortOption = {
  label: string;
  // Shown in the accordion header when this option is selected; falls back
  // to `label` if omitted.
  activeLabel?: string;
  sortKey?: ProductSortKey;
  sortOrder?: SortOrder;
};

export const SORT_OPTIONS: SortOption[] = [
  { label: 'Recommended' },
  { label: 'Newest', sortKey: 'created_at', sortOrder: 'desc' },
  {
    label: 'Price: Low to High',
    activeLabel: 'Price Ascending',
    sortKey: 'price',
    sortOrder: 'asc',
  },
  {
    label: 'Price: High to Low',
    activeLabel: 'Price Descending',
    sortKey: 'price',
    sortOrder: 'desc',
  },
  { label: 'Best Rated', sortKey: 'reviews_rating', sortOrder: 'desc' },
];

// Display data lookups for tag-based filters. Slugs here must match the
// backend's seeded tag slugs (Color/StemType vocabularies in
// seed_products.py, plus the 5 hardcoded categories from the data file).

export const CATEGORY_DISPLAY: Record<string, { label: string }> = {
  flowers: { label: 'Flowers' },
  plants: { label: 'Plants' },
  gifts: { label: 'Gifts' },
  centerpieces: { label: 'Centerpieces' },
  peonies: { label: 'Peonies' },
};

export const STEM_TYPE_DISPLAY: Record<string, { label: string }> = {
  anemones: { label: 'Anemones' },
  carnations: { label: 'Carnations' },
  delphinium: { label: 'Delphinium' },
  eucalyptus: { label: 'Eucalyptus' },
  'garden-roses': { label: 'Garden Roses' },
  lilies: { label: 'Lilies' },
  marigolds: { label: 'Marigolds' },
  mums: { label: 'Mums' },
  peonies: { label: 'Peonies' },
  ranunculus: { label: 'Ranunculus' },
  roses: { label: 'Roses' },
  sunflowers: { label: 'Sunflowers' },
  tulips: { label: 'Tulips' },
  scabiosa: { label: 'Scabiosa' },
  hydrangea: { label: 'Hydrangea' },
};

export const COLOR_DISPLAY: Record<
  string,
  { label: string; hex: string | null }
> = {
  assorted: { label: 'Assorted', hex: null },
  beige: { label: 'Beige', hex: '#E8D9B6' },
  blue: { label: 'Blue', hex: '#6B85A3' },
  green: { label: 'Green', hex: '#A3B58F' },
  metallic: { label: 'Metallic', hex: '#C0C0C0' },
  orange: { label: 'Orange', hex: '#E09457' },
  peach: { label: 'Peach', hex: '#F0C9A8' },
  pink: { label: 'Pink', hex: '#C97B8E' },
  purple: { label: 'Purple', hex: '#B39DBF' },
  red: { label: 'Red', hex: '#A34545' },
  white: { label: 'White', hex: '#FFFFFF' },
  yellow: { label: 'Yellow', hex: '#E6C85A' },
};

const VALID_SORT_KEYS: ReadonlySet<string> = new Set<ProductSortKey>([
  'name',
  'price',
  'reviews_rating',
  'created_at',
  'external_id',
]);

const VALID_CATEGORIES: ReadonlySet<string> = new Set(
  Object.keys(CATEGORY_DISPLAY)
);

const VALID_STEM_TYPES: ReadonlySet<string> = new Set(
  Object.keys(STEM_TYPE_DISPLAY)
);

const VALID_COLORS: ReadonlySet<string> = new Set(
  Object.keys(COLOR_DISPLAY)
);

// Shared helper: parse a slug-array URL param, accepting both array and
// single-string forms, and filter to a whitelist.
const parseSlugArray = (
  raw: unknown,
  allowed: ReadonlySet<string>
): string[] | undefined => {
  const asArray = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? [raw]
      : [];
  const valid = asArray.filter(
    (v): v is string => typeof v === 'string' && allowed.has(v)
  );
  return valid.length > 0 ? valid : undefined;
};

// Shared helper: remove a single tag from a slug array, clearing the field
// when the result is empty.
const removeTag = <K extends 'category' | 'stem_type' | 'color'>(
  filters: UIFilters,
  key: K,
  tag: string
): UIFilters => {
  const next = ((filters[key] as string[] | undefined) ?? []).filter(
    (c) => c !== tag
  );
  return {
    ...filters,
    [key]: next.length > 0 ? (next as UIFilters[K]) : undefined,
  };
};

export const FILTER_SPECS = {
  sort: {
    isActive: (f) => !!f.sortKey,
    chips: () => [],
    parseSearch: (s) => {
      const sortKey =
        typeof s.sortKey === 'string' && VALID_SORT_KEYS.has(s.sortKey)
          ? (s.sortKey as ProductSortKey)
          : undefined;
      const sortOrder =
        s.sortOrder === 'asc' || s.sortOrder === 'desc'
          ? (s.sortOrder as SortOrder)
          : undefined;
      return { sortKey, sortOrder };
    },
  },
  category: {
    isActive: (f) => (f.category ?? []).length > 0,
    chips: (f, update) =>
      (f.category ?? []).map((slug) => {
        const label = CATEGORY_DISPLAY[slug]?.label ?? slug;
        return {
          key: `category-${slug}`,
          label: `Category: ${label}`,
          onRemove: () => update(removeTag(f, 'category', slug)),
        };
      }),
    parseSearch: (s) => ({
      category: parseSlugArray(s.category, VALID_CATEGORIES),
    }),
  },
  stem_type: {
    isActive: (f) => (f.stem_type ?? []).length > 0,
    chips: (f, update) =>
      (f.stem_type ?? []).map((slug) => {
        const label = STEM_TYPE_DISPLAY[slug]?.label ?? slug;
        return {
          key: `stem-${slug}`,
          label: `Stem: ${label}`,
          onRemove: () => update(removeTag(f, 'stem_type', slug)),
        };
      }),
    parseSearch: (s) => ({
      stem_type: parseSlugArray(s.stem_type, VALID_STEM_TYPES),
    }),
  },
  color: {
    isActive: (f) => (f.color ?? []).length > 0,
    chips: (f, update) =>
      (f.color ?? []).map((slug) => {
        const label = COLOR_DISPLAY[slug]?.label ?? slug;
        return {
          key: `color-${slug}`,
          label: `Color: ${label}`,
          onRemove: () => update(removeTag(f, 'color', slug)),
        };
      }),
    parseSearch: (s) => ({
      color: parseSlugArray(s.color, VALID_COLORS),
    }),
  },
  vase_included: {
    isActive: (f) => f.vase_included === true,
    chips: (f, update) =>
      f.vase_included
        ? [
            {
              key: 'vase_included',
              label: 'Vase Included',
              onRemove: () => update({ ...f, vase_included: undefined }),
            },
          ]
        : [],
    parseSearch: (s) => ({
      vase_included: s.vase_included === true ? true : undefined,
    }),
  },
  price: {
    isActive: (f) => !!(f.min_price || f.max_price),
    chips: (f, update) => {
      if (!f.min_price && !f.max_price) return [];
      const min = `$${(f.min_price ?? 0).toFixed(2)}`;
      const max =
        f.max_price !== undefined ? `$${f.max_price.toFixed(2)}` : 'Any';
      return [
        {
          key: 'price',
          label: `Price: ${min} - ${max}`,
          onRemove: () =>
            update({ ...f, min_price: undefined, max_price: undefined }),
        },
      ];
    },
    parseSearch: (s) => ({
      min_price: typeof s.min_price === 'number' ? s.min_price : undefined,
      max_price: typeof s.max_price === 'number' ? s.max_price : undefined,
    }),
  },
} satisfies Record<string, FilterSpec>;

export const parseUIFiltersSearch = (
  search: Record<string, unknown>
): UIFilters =>
  Object.values(FILTER_SPECS).reduce(
    (acc, spec) => ({ ...acc, ...spec.parseSearch(search) }),
    {} as UIFilters
  );
