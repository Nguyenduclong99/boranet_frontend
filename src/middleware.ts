import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode

const privatePaths = ['/jobs/over-due', '/jobs/order-list', '/members'];
const authPaths = ['/login', '/register'];
const productEditRegex = /^\/jobs\/\d+\/edit$/;

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const accessToken = request.cookies.get('sessionToken')?.value;

    const isPrivatePath = privatePaths.some((path) => pathname.startsWith(path));
    const isAuthPath = authPaths.some((path) => pathname.startsWith(path));
    const isProductEditPath = pathname.match(productEditRegex);

    if (isPrivatePath || isProductEditPath) {
        if (!accessToken) {
            return NextResponse.redirect(new URL('/login', request.url));
        }

        if (pathname.startsWith('/members')) {
            try {
                const decodedToken: any = jwtDecode(accessToken);
                const roles: string[] = decodedToken.roles || []; // Lấy danh sách roles từ token
                if (!roles.includes('ROLE_ADMIN')) {
                    debugger
                    return NextResponse.redirect(new URL('/', request.url));
                }
            } catch (error) {
                console.error('Error decoding token or checking roles:', error);
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }
    }

    if (isAuthPath && accessToken) {
        return NextResponse.redirect(new URL('/jobs/over-due-date', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/me', '/login', '/register', '/products/:path*', '/jobs/over-due', '/jobs/order-list', '/members'],
};