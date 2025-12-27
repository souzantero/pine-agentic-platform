import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Rotas que nao precisam de autenticacao
const PUBLIC_ROUTES = ["/login", "/signup"];

// Rotas de API publicas
const PUBLIC_API_ROUTES = ["/api/auth/login", "/api/auth/register"];

// Rotas de API que precisam apenas de auth (sem org)
const AUTH_ONLY_API_ROUTES = ["/api/organizations"];

// Rotas que precisam apenas de autenticacao (sem org)
const AUTH_ONLY_ROUTES = ["/onboarding"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get("session");
  const currentOrg = request.cookies.get("current_org");

  // Permitir rotas publicas
  if (PUBLIC_ROUTES.some((route) => pathname === route)) {
    // Se ja esta logado, redirecionar para home
    if (session?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Permitir APIs publicas
  if (PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // APIs que precisam apenas de auth (sem org)
  if (AUTH_ONLY_API_ROUTES.some((route) => pathname.startsWith(route))) {
    if (!session?.value) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.next();
  }

  // Permitir arquivos estaticos e assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Verificar autenticacao para todas as outras rotas
  if (!session?.value) {
    // Redirecionar para login preservando a URL de destino
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rotas que precisam apenas de auth (sem verificar org)
  if (AUTH_ONLY_ROUTES.some((route) => pathname.startsWith(route))) {
    // Se ja tem org, redirecionar para home
    if (currentOrg?.value) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Para rotas protegidas, verificar se tem org ativa
  if (!currentOrg?.value) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|api/auth/me|api/auth/logout).*)",
  ],
};
