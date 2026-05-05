import type { Facet } from '../Facet';
import { createFacetQueries } from '../createFacetQueries';

const { keys, queries } = createFacetQueries<Facet>('occasions');
export const occasionKeys = keys;
export const occasionQueries = queries;
