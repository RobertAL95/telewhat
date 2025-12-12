import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Obtener la cookie correcta ('at')
  // El backend establece 'at' (Access Token)
  const hasSession = request.cookies.has('at');
  
  const { pathname } = request.nextUrl;
  const pathLower = pathname.toLowerCase();

  // 2. Definir rutas
  const isAuthRoute = pathLower.startsWith('/Auth'); // Login/Register
  const isProtectedRoute = pathLower.startsWith('/Chat') || pathLower.startsWith('/profile');

  // CASO A: Usuario intenta entrar a ruta protegida SIN sesión
  if (isProtectedRoute && !hasSession) {
    console.log(`[Flym Middleware] 🔒 Acceso denegado a ${pathname}. Redirigiendo a /auth`);
    return NextResponse.redirect(new URL('/Auth', request.url));
  }

  // CASO B: Usuario YA logueado intenta entrar al Login (Redirigir al chat)
  // Esto mejora la UX: si ya tienes cookie, no te dejo ver el formulario de login de nuevo
  if (isAuthRoute && hasSession) {
    return NextResponse.redirect(new URL('/Chat', request.url));
  }

  // Para el resto de rutas (Home, Invite, etc.), dejar pasar
  return NextResponse.next();
}

// 🔧 Configuración del Matcher
// Aplicar solo a las rutas que nos interesan controlar
export const config = {
  matcher: [
    '/Chat/:path*', 
    '/profile/:path*', 
    '/Auth/:path*',
    // Excluir api, _next, static, etc.
  ],
};