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
        let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
        let errorDetails = '';

        try {
          const contentType = response.headers.get('content-type');
          if (contentType?.includes('application/json')) {
            const errorData = await response.json();
            errorDetails = JSON.stringify(errorData, null, 2);
          } else if (contentType?.includes('text/html')) {
            const htmlText = await response.text();
            // Extract error from Django debug page if present
            const titleMatch = htmlText.match(/<title>(.+?)<\/title>/);
            const exceptionMatch = htmlText.match(
              /<pre class="exception_value">([\s\S]+?)<\/pre>/
            );
            if (titleMatch) {
              errorDetails = titleMatch[1].replace(/\s+/g, ' ').trim();
            }
            if (exceptionMatch) {
              errorDetails +=
                '\n' +
                exceptionMatch[1]
                  .replace(/&#x27;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/<[^>]*>/g, '')
                  .trim();
            }
          } else {
            errorDetails = await response.text();
          }
        } catch (parseError) {
          errorDetails = 'Unable to parse error response';
        }

        const detailedError = new Error(
          `${errorMessage}\nURL: ${url}\nDetails: ${errorDetails}`
        );
        console.error('API Error Details:', {
          url,
          status: response.status,
          statusText: response.statusText,
          details: errorDetails,
        });
        throw detailedError;
      }

      return response.json();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('API request failed')
      ) {
        throw error;
      }
      const networkError = new Error(
        `Network error while fetching ${url}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Network Error:', networkError);
      throw networkError;
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

    if (filters.sortKey) {
      const ordering =
        filters.sortOrder === 'asc' ? filters.sortKey : `-${filters.sortKey}`;
      searchParams.append('ordering', ordering);
    }

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

  // Collections
  async getCollections(): Promise<Collection[]> {
    return this.request<Collection[]>('/collections/');
  }

  async getCollection(slug: string): Promise<Collection> {
    return this.request<Collection>(`/collections/${slug}/`);
  }

  // Occasions
  async getOccasions(): Promise<PaginatedResponse<Occasion>> {
    return this.request<PaginatedResponse<Occasion>>('/occasions/');
  }

  async getOccasion(slug: string): Promise<Occasion> {
    return this.request<Occasion>(`/occasions/${slug}/`);
  }
}

export const apiClient = new ApiClient();
