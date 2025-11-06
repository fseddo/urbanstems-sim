import {
  Product,
  Category,
  Collection,
  Occasion,
  PaginatedResponse,
  ProductFilters,
} from '@/types/api';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private async request<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store', // Disable caching for fresh data
      });

      if (!response.ok) {
        throw new Error(
          `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return response.json();
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Products
  async getProducts(
    filters: ProductFilters = {}
  ): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();

    if (filters.category) searchParams.append('category', filters.category);
    if (filters.collection)
      searchParams.append('collection', filters.collection);
    if (filters.occasion) searchParams.append('occasion', filters.occasion);
    if (filters.variant_type)
      searchParams.append('variant_type', filters.variant_type);
    if (filters.min_price)
      searchParams.append('min_price', filters.min_price.toString());
    if (filters.max_price)
      searchParams.append('max_price', filters.max_price.toString());
    if (filters.search) searchParams.append('search', filters.search);
    if (filters.ordering) searchParams.append('ordering', filters.ordering);

    const queryString = searchParams.toString();
    const endpoint = `/products/${queryString ? `?${queryString}` : ''}`;

    return this.request<PaginatedResponse<Product>>(endpoint);
  }

  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/products/${id}/`);
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return this.request<Category[]>('/categories/');
  }

  async getCategory(slug: string): Promise<Category> {
    return this.request<Category>(`/categories/${slug}/`);
  }

  async getCategoryProducts(
    slug: string,
    filters: Omit<ProductFilters, 'category'> = {}
  ): Promise<Product[]> {
    const searchParams = new URLSearchParams();

    if (filters.variant_type)
      searchParams.append('variant_type', filters.variant_type);
    if (filters.min_price)
      searchParams.append('min_price', filters.min_price.toString());
    if (filters.max_price)
      searchParams.append('max_price', filters.max_price.toString());

    const queryString = searchParams.toString();
    const endpoint = `/categories/${slug}/products/${
      queryString ? `?${queryString}` : ''
    }`;

    return this.request<Product[]>(endpoint);
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    return this.request<Collection[]>('/collections/');
  }

  async getCollection(slug: string): Promise<Collection> {
    return this.request<Collection>(`/collections/${slug}/`);
  }

  async getCollectionProducts(slug: string): Promise<Product[]> {
    return this.request<Product[]>(`/collections/${slug}/products/`);
  }

  // Occasions
  async getOccasions(): Promise<PaginatedResponse<Occasion>> {
    return this.request<PaginatedResponse<Occasion>>('/occasions/');
  }

  async getOccasion(slug: string): Promise<Occasion> {
    return this.request<Occasion>(`/occasions/${slug}/`);
  }

  async getOccasionProducts(slug: string): Promise<Product[]> {
    return this.request<Product[]>(`/occasions/${slug}/products/`);
  }
}

export const apiClient = new ApiClient();
