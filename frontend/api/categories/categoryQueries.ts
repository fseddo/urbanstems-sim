import type { Facet } from '../Facet';
import { createFacetQueries } from '../createFacetQueries';

const { keys, queries } = createFacetQueries<Facet>('categories');
export const categoryKeys = keys;
export const categoryQueries = queries;
