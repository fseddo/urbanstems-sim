import { CategoryType } from '@/api/categories/Category';

// The set of filter values that have ≥1 matching product within a given
// scope (collection / category / occasion / search). Computed by the
// backend's /products/filter-options/ endpoint and used by the sidebar to
// hide irrelevant options (e.g. "Hydrangea" stem-type on the Plants page).
export type FilterOptions = {
  categories: CategoryType[];
  stem_types: string[];
  colors: string[];
  vase_included: boolean;
  price_range: {
    min: number | null;
    max: number | null;
  };
};

export type FilterOptionsScope = {
  collection?: string;
  category?: string;
  occasion?: string;
  search?: string;
};
