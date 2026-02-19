import { PaginatedResponse } from '@/types/api';

type ApiRequestParams = {
  method: 'get' | 'post' | 'put' | 'delete';
  path: string;
  body?: unknown;
};

async function baseRequest<T>({
  path,
  method,
  body,
}: ApiRequestParams): Promise<T> {
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      method,
      body: body ? JSON.stringify(body) : undefined,
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
    const data = await response.json();
    return data as T;
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

export async function paginatedRequest<T>(
  params: ApiRequestParams
): Promise<PaginatedResponse<T>> {
  return baseRequest<PaginatedResponse<T>>(params);
}

export async function request<T>(params: ApiRequestParams): Promise<T> {
  return baseRequest<T>(params);
}
