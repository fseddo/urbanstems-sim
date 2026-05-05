import { CategoryType } from '@/api/categories/Category';
import { ProductSortKey } from '@/api/products/ProductFilters';
import { SortOrder } from '@/api/PaginatedResponse';

export type UIFilters = {
  sortKey?: ProductSortKey;
  sortOrder?: SortOrder;
  categories?: CategoryType[];
  stem_types?: string[];
  colors?: string[];
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
  // to `label` if omitted. Useful when the option-grid wording doesn't read
  // well inline (e.g. 'Price: Low to High' → 'Price Ascending').
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

// Display data lookups for tag-based filters. The list of available slugs
// per scope is the source of truth (driven by the API's filter-options
// endpoint); these records just supply human-readable labels and any
// presentation-only attributes (e.g. color hex) that the API doesn't carry.
//
// Slugs here must match keys in the backend's STEM_VOCAB / COLOR_VOCAB
// (seed_products.py).

export const CATEGORY_DISPLAY: Record<CategoryType, { label: string }> = {
  [CategoryType.Flowers]: { label: 'Flowers' },
  [CategoryType.Plants]: { label: 'Plants' },
  [CategoryType.Gifts]: { label: 'Gifts' },
  [CategoryType.Centerpieces]: { label: 'Centerpieces' },
  [CategoryType.Peonies]: { label: 'Peonies' },
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

const VALID_CATEGORIES: ReadonlySet<string> = new Set<string>(
  Object.values(CategoryType)
);

const VALID_STEM_TYPES: ReadonlySet<string> = new Set<string>(
  Object.keys(STEM_TYPE_DISPLAY)
);

const VALID_COLORS: ReadonlySet<string> = new Set<string>(
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
const removeTag = <K extends 'categories' | 'stem_types' | 'colors'>(
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
    // Sort doesn't surface as an applied-filter chip — the sort section itself
    // shows the current selection.
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
  categories: {
    isActive: (f) => (f.categories ?? []).length > 0,
    chips: (f, update) =>
      (f.categories ?? []).map((cat) => {
        const label = CATEGORY_DISPLAY[cat]?.label ?? cat;
        return {
          key: `category-${cat}`,
          label: `Category: ${label}`,
          onRemove: () => update(removeTag(f, 'categories', cat)),
        };
      }),
    parseSearch: (s) => ({
      categories: parseSlugArray(s.categories, VALID_CATEGORIES) as
        | CategoryType[]
        | undefined,
    }),
  },
  stem_types: {
    isActive: (f) => (f.stem_types ?? []).length > 0,
    chips: (f, update) =>
      (f.stem_types ?? []).map((slug) => {
        const label = STEM_TYPE_DISPLAY[slug]?.label ?? slug;
        return {
          key: `stem-${slug}`,
          label: `Stem: ${label}`,
          onRemove: () => update(removeTag(f, 'stem_types', slug)),
        };
      }),
    parseSearch: (s) => ({
      stem_types: parseSlugArray(s.stem_types, VALID_STEM_TYPES),
    }),
  },
  colors: {
    isActive: (f) => (f.colors ?? []).length > 0,
    chips: (f, update) =>
      (f.colors ?? []).map((slug) => {
        const label = COLOR_DISPLAY[slug]?.label ?? slug;
        return {
          key: `color-${slug}`,
          label: `Color: ${label}`,
          onRemove: () => update(removeTag(f, 'colors', slug)),
        };
      }),
    parseSearch: (s) => ({
      colors: parseSlugArray(s.colors, VALID_COLORS),
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
