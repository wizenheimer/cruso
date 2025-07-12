import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { authCookiePrefix } from '@/lib/auth-constants';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Using Better Auth's helper with custom prefix
    const sessionCookie = getSessionCookie(request, {
        cookiePrefix: authCookiePrefix,
    });

    const protectedRoutes = ['/dashboard', '/get-started'];
    const authRoutes = ['/login', '/signup'];

    const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !sessionCookie) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // Redirect authenticated users from auth routes
    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/get-started/:path*', '/login', '/signup'],
};
