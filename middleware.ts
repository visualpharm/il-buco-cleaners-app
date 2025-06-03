import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = request.cookies.get('isAuthenticated')?.value === 'true';

  // Redirect to sign-in if trying to access protected routes without authentication
  if (pathname.startsWith('/analytics') && !isAuthenticated) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  // Redirect to analytics if already authenticated and trying to access sign-in
  if (pathname === '/signin' && isAuthenticated) {
    return NextResponse.redirect(new URL('/analytics', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/analytics/:path*', '/signin'],
};
