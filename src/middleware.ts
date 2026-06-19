import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const protectedPath = /^\/(student|teacher|admin)(\/|$)/.test(request.nextUrl.pathname);
  if (protectedPath && !request.cookies.get('studentflow-session')?.value) {
    const target = new URL('/login', request.url); target.searchParams.set('next', request.nextUrl.pathname); return NextResponse.redirect(target);
  }
  return NextResponse.next();
}

export const config = { matcher: ['/student/:path*', '/teacher/:path*', '/admin/:path*'] };
