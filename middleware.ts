import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { authCookiePrefix } from '@/lib/auth-constants';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Use Better Auth's helper with custom prefix
    const sessionCookie = getSessionCookie(request, {
        cookiePrefix: authCookiePrefix,
    });

    const protectedRoutes = ['/remove-me']; // ['/dashboard'];
    const authRoutes = ['/login', '/signup'];

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (isProtectedRoute && !sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}
