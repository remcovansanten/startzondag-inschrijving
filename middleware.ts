import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  // Only protect admin routes (except login)
  if (request.nextUrl.pathname.startsWith('/admin') &&
      !request.nextUrl.pathname.startsWith('/admin/login')) {

    const token = request.cookies.get('auth-token');

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Verify token is valid and not expired
    const session = await verifyToken(token.value);
    if (!session) {
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('auth-token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};