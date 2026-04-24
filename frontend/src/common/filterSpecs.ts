import { CategoryType } from '@/api/cateogries/Category';
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

export const CATEGORIES = [
  { label: 'Flowers', value: CategoryType.Flowers },
  { label: 'Plants', value: CategoryType.Plants },
  { label: 'Gifts', value: CategoryType.Gifts },
  { label: 'Centerpieces', value: CategoryType.Centerpieces },
] as const;

// Slugs here must match keys in backend STEM_VOCAB (seed_products.py).
export const STEM_TYPES = [
  { label: 'Anemones', value: 'anemones' },
  { label: 'Carnations', value: 'carnations' },
  { label: 'Delphinium', value: 'delphinium' },
  { label: 'Eucalyptus', value: 'eucalyptus' },
  { label: 'Garden Roses', value: 'garden-roses' },
  { label: 'Lilies', value: 'lilies' },
  { label: 'Marigolds', value: 'marigolds' },
  { label: 'Mums', value: 'mums' },
  { label: 'Peonies', value: 'peonies' },
  { label: 'Ranunculus', value: 'ranunculus' },
  { label: 'Roses', value: 'roses' },
  { label: 'Sunflowers', value: 'sunflowers' },
  { label: 'Tulips', value: 'tulips' },
  { label: 'Scabiosa', value: 'scabiosa' },
  { label: 'Hydrangea', value: 'hydrangea' },
] as const;

// Slugs here must match keys in backend COLOR_VOCAB (seed_products.py).
// `hex` lets the sidebar render swatches without another API call.
export const COLORS = [
  { label: 'Assorted', value: 'assorted', hex: null },
  { label: 'Beige', value: 'beige', hex: '#E8D9B6' },
  { label: 'Blue', value: 'blue', hex: '#6B85A3' },
  { label: 'Green', value: 'green', hex: '#A3B58F' },
  { label: 'Metallic', value: 'metallic', hex: '#C0C0C0' },
  { label: 'Orange', value: 'orange', hex: '#E09457' },
  { label: 'Peach', value: 'peach', hex: '#F0C9A8' },
  { label: 'Pink', value: 'pink', hex: '#C97B8E' },
  { label: 'Purple', value: 'purple', hex: '#B39DBF' },
  { label: 'Red', value: 'red', hex: '#A34545' },
  { label: 'White', value: 'white', hex: '#FFFFFF' },
  { label: 'Yellow', value: 'yellow', hex: '#E6C85A' },
] as const;

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
  STEM_TYPES.map((s) => s.value)
);

const VALID_COLORS: ReadonlySet<string> = new Set<string>(
  COLORS.map((c) => c.value)
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
  const next = (filters[key] as string[] | undefined ?? []).filter(
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
        const label = CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
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
        const label = STEM_TYPES.find((s) => s.value === slug)?.label ?? slug;
        return {
          key: `stem-${slug}`,
          label,
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
        const label = COLORS.find((c) => c.value === slug)?.label ?? slug;
        return {
          key: `color-${slug}`,
          label,
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
              label: 'Includes Vase',
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
          label: `${min} - ${max}`,
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
