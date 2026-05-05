import type { Facet } from '../Facet';
import { createFacetQueries } from '../createFacetQueries';

const { keys, queries } = createFacetQueries<Facet>('collections');
export const collectionKeys = keys;
export const collectionQueries = queries;
