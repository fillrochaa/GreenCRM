import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseConfig } from "@/lib/supabase/config";

/** Rotas abertas para quem não está logado. */
const PUBLIC_PATHS = new Set(["/login"]);

/**
 * Renova a sessão do Supabase (o token expira a cada hora) e faz o redirecionamento
 * otimista para o login. A autorização de verdade fica em requireUser(), chamado por
 * cada página e Server Action do CRM.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabaseConfig();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [header, value] of Object.entries(headers)) response.headers.set(header, value);
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const loggedIn = Boolean(data?.claims);
  const { pathname, search } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!loggedIn && !isPublic) {
    const target = new URL("/login", request.url);
    if (pathname !== "/") target.searchParams.set("next", pathname + search);
    return redirectKeepingCookies(target, response);
  }
  if (loggedIn && isPublic) {
    return redirectKeepingCookies(new URL("/funil", request.url), response);
  }
  return response;
}

/** Redireciona sem perder os cookies de sessão que o Supabase acabou de renovar. */
function redirectKeepingCookies(target: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(target);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export const config = {
  // Tudo, menos arquivos estáticos e imagens.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
