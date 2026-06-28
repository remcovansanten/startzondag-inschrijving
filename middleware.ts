import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Publieke admin-paden (onderdeel van de inlogflow, geen sessie vereist).
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/verify'];

// LET OP: dit is enkel een routing-gemak. Het verifieert de JWT NIET (kan niet op
// de Edge runtime met jsonwebtoken). De echte autorisatie gebeurt server-side via
// getSession() in app/admin/dashboard/layout.tsx en in elke /api/admin/*-handler.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (pathname.startsWith('/admin') && !isPublic) {
    const token = request.cookies.get('auth-token');
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/admin/:path*',
};
