import { NextResponse, type NextRequest } from 'next/server'

/**
 * Barreira rápida: áreas autenticadas exigem o cookie de refresh. A validação real da sessão é da API
 * (cada requisição) e do guard do cliente (perfil correto por área).
 */
export function middleware(req: NextRequest) {
  if (!req.cookies.get('at_refresh')) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(req.nextUrl.pathname)}`
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = { matcher: ['/exporter/:path*', '/store/:path*', '/admin/:path*'] }
