import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect /collections to /collections/all
  if (pathname === '/collections') {
    return NextResponse.redirect(new URL('/collections/all', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/collections',
};
