import type { Facet } from '../Facet';

export enum CategoryType {
  Flowers = 'flowers',
  Plants = 'plants',
  Gifts = 'gifts',
  Centerpieces = 'centerpieces',
  Peonies = 'peonies',
}

export interface Category extends Omit<Facet, 'name'> {
  name: CategoryType;
}
