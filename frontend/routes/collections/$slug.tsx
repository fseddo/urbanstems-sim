import { createFileRoute, redirect } from '@tanstack/react-router';
import { productQueries } from '@/api/products/queries';
import { tagQueries } from '@/api/tags/tagQueries';
import { CollectionPage } from '@/src/collections/CollectionPage';
import {
  buildFilterOptionsScope,
  buildFilters,
  type RouteSearch,
} from '@/src/collections/collectionFilters';
import { parseUIFiltersSearch } from '@/src/filters/filterSpecs';
import { asString } from '@/src/common/utils/asString';

export const Route = createFileRoute('/collections/$slug')({
  validateSearch: (search: Record<string, unknown>): RouteSearch => ({
    ...parseUIFiltersSearch(search),
    search: asString(search.search),
  }),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ params, deps, context }) => {
    const isAll = params.slug === 'all';

    // Resolve the URL slug to a Tag (with its Facet inline) — one round trip,
    // replaces the legacy 3-list-fetches + entity-detail dance.
    let pageTag = null;
    if (!isAll) {
      try {
        pageTag = await context.queryClient.ensureQueryData(
          tagQueries.detail(params.slug)
        );
      } catch {
        throw redirect({ to: '/collections/$slug', params: { slug: 'all' } });
      }
    }

    const filters = buildFilters(pageTag, deps.search);
    const filterOptionsScope = buildFilterOptionsScope(
      pageTag,
      deps.search.search
    );

    const productsPromise = context.queryClient.ensureInfiniteQueryData(
      productQueries.infiniteList(filters)
    );
    const filterOptionsPromise = context.queryClient.ensureQueryData(
      productQueries.filterOptions(filterOptionsScope)
    );

    await Promise.all([productsPromise, filterOptionsPromise]);
    const filterOptions = await filterOptionsPromise;

    document.title =
      pageTag?.page_title ??
      (pageTag
        ? `${pageTag.name} Delivery | Next Day Delivery | UrbanStems`
        : 'Shop Our Collection | UrbanStems');

    return { pageTag, filters, filterOptions };
  },
  component: CollectionPage,
});
