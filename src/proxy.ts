// NEYKRA — Proxy (ex-middleware, Next.js 16).
// S'exécute avant chaque requête :
//   1. refresh automatique du token Supabase (écriture des cookies de session) ;
//   2. protection de route basique : /feed exige une session, /login et /signup
//      redirigent vers /feed si l'utilisateur est déjà connecté.
//
// À ne pas confondre avec la vraie protection des données : les Server
// Components (pages /feed, etc.) vérifient aussi la session côté serveur.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl ?? "", supabaseAnonKey ?? "", {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, responseHeaders) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
        Object.entries(responseHeaders).forEach(([key, value]) =>
          response.headers.set(key, value)
        );
      },
    },
  });

  // getUser() valide le JWT auprès de l'API Auth (contrairement à getSession()
  // qui se contente de décoder le cookie localement et peut être trompé).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtectedPage =
    pathname === "/feed" ||
    pathname.startsWith("/feed/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings/") ||
    pathname === "/profile/edit" ||
    pathname.startsWith("/profile/edit/");
  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isProtectedPage && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/feed";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Toutes les routes sauf fichiers statiques Next et assets publics.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};