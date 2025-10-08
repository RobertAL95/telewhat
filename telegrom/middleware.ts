import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que requieren autenticación
const protectedRoutes = ['/profile', '/chat'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;

  // Si no hay token y la ruta está protegida → redirigir al login
  if (protectedRoutes.some((route) => req.nextUrl.pathname.startsWith(route))) {
    if (!token) {
      const loginUrl = new URL('/', req.url); // raíz → login
      return NextResponse.redirect(loginUrl);
    }
  }

  // Si hay token → permitir el acceso
  return NextResponse.next();
}

// Middleware activo solo en rutas definidas
export const config = {
  matcher: ['/profile/:path*', '/chat/:path*'],
};
