import { createFileRoute, redirect } from '@tanstack/react-router';
import { categoryQueries } from '@/api/categories/categoryQueries';
import { collectionQueries } from '@/api/collections/collectionQueries';
import { occasionQueries } from '@/api/occasions/queries';
import { productQueries } from '@/api/products/queries';
import { CollectionPage } from '@/src/collections/CollectionPage';
import {
  buildFilterOptionsScope,
  buildFilters,
  getSlugType,
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
    // Fetch entity lists so we can determine slug type dynamically
    const [categories, collections, occasions] = await Promise.all([
      context.queryClient.ensureQueryData(categoryQueries.list()),
      context.queryClient.ensureQueryData(collectionQueries.list()),
      context.queryClient.ensureQueryData(occasionQueries.list()),
    ]);

    const slugType = getSlugType(
      params.slug,
      categories,
      collections,
      occasions
    );
    if (slugType === null) {
      throw redirect({ to: '/collections/$slug', params: { slug: 'all' } });
    }

    const filters = buildFilters(params.slug, slugType, deps.search);
    const filterOptionsScope = buildFilterOptionsScope(
      params.slug,
      slugType,
      deps.search.search
    );

    const productsPromise = context.queryClient.ensureInfiniteQueryData(
      productQueries.infiniteList(filters)
    );
    const filterOptionsPromise = context.queryClient.ensureQueryData(
      productQueries.filterOptions(filterOptionsScope)
    );

    if (slugType === 'all') {
      document.title = 'Shop Our Collection | UrbanStems';
      await Promise.all([productsPromise, filterOptionsPromise]);
      const filterOptions = await filterOptionsPromise;
      return { slugType, filters, filterOptions, entity: null };
    }

    const entityPromise =
      slugType === 'category'
        ? context.queryClient.ensureQueryData(
            categoryQueries.detail(params.slug)
          )
        : slugType === 'collection'
          ? context.queryClient.ensureQueryData(
              collectionQueries.detail(params.slug)
            )
          : context.queryClient.ensureQueryData(
              occasionQueries.detail(params.slug)
            );

    const [, entity, filterOptions] = await Promise.all([
      productsPromise,
      entityPromise,
      filterOptionsPromise,
    ]);

    document.title =
      entity.page_title ??
      `${entity.name} Delivery | Next Day Delivery | UrbanStems`;

    return { slugType, filters, filterOptions, entity };
  },
  component: CollectionPage,
});
