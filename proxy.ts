import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const config = {
    matcher: ["/admin/:path*", "/admin"],
};

const secret = process.env.JWT_SECRET || "default_jwt_secret_change_me_in_prod";
const secretKey = new TextEncoder().encode(secret);

async function isValidToken(token?: string) {
    if (!token) return false;
    try {
        await jwtVerify(token, secretKey);
        return true;
    } catch {
        return false;
    }
}

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get("access_token")?.value;
    const authenticated = await isValidToken(token);

    // Redirect /admin to /admin/dashboard
    if (pathname === "/admin" || pathname === "/admin/") {
        if (!authenticated) {
            return NextResponse.redirect(new URL("/admin/login", request.url));
        }
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    // Protect all /admin/* routes except /admin/login
    if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
        if (!authenticated) {
            const loginUrl = new URL("/admin/login", request.url);
            loginUrl.searchParams.set("callbackUrl", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    // Redirect authenticated users away from /admin/login to /admin/dashboard
    if (pathname === "/admin/login" && authenticated) {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }

    return NextResponse.next();
}