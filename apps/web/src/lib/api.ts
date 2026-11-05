/**
 * Cliente da API. Todas as chamadas vão para `/api/*` (reescrito pelo Next para a API),
 * então os cookies httpOnly de sessão são do mesmo domínio. Sem mocks.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

type Query = Record<string, string | number | boolean | undefined | null>

export interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  form?: FormData
  query?: Query
  signal?: AbortSignal
}

const CSRF_HEADERS = { 'x-requested-with': 'amazon-trade' }
const NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/forgot-password', '/auth/reset-password', '/auth/verify-email']

export const buildUrl = (path: string, query?: Query) => {
  const qs = query
    ? Object.entries(query)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : ''
  return `/api${path}${qs ? `?${qs}` : ''}`
}

let refreshing: Promise<boolean> | null = null
/** Renova a sessão uma única vez mesmo com várias requisições 401 simultâneas. */
function refreshSession(): Promise<boolean> {
  refreshing ??= fetch('/api/auth/refresh', { method: 'POST', headers: CSRF_HEADERS, credentials: 'same-origin' })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      setTimeout(() => (refreshing = null), 0)
    })
  return refreshing
}

async function send(path: string, opts: ApiOptions): Promise<Response> {
  const headers: Record<string, string> = { ...CSRF_HEADERS }
  let body: BodyInit | undefined
  if (opts.form) body = opts.form
  else if (opts.body !== undefined) {
    headers['content-type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }
  return fetch(buildUrl(path, opts.query), { method: opts.method ?? (body ? 'POST' : 'GET'), headers, body, credentials: 'same-origin', signal: opts.signal })
}

async function request(path: string, opts: ApiOptions): Promise<Response> {
  let res = await send(path, opts)
  if (res.status === 401 && !NO_REFRESH.includes(path) && (await refreshSession())) res = await send(path, opts)
  if (!res.ok) {
    let payload: { error?: { code?: string; message?: string; details?: unknown } } = {}
    try {
      payload = await res.json()
    } catch {
      /* corpo vazio */
    }
    throw new ApiError(res.status, payload.error?.code ?? `http_${res.status}`, payload.error?.message ?? res.statusText, payload.error?.details)
  }
  return res
}

export async function api<T = unknown>(path: string, opts: ApiOptions = {}): Promise<T> {
  const res = await request(path, opts)
  if (res.status === 204) return undefined as T
  const text = await res.text()
  return (text ? JSON.parse(text) : undefined) as T
}

/** Baixa um arquivo autenticado (documentos) e abre numa nova aba / salva. */
export async function openFile(path: string, filename?: string) {
  const res = await request(path, {})
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  if (filename && !blob.type.startsWith('application/pdf') && !blob.type.startsWith('image/')) {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
  } else {
    window.open(url, '_blank', 'noopener')
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000)
}

/** Mensagem de erro amigável a partir de qualquer exceção. */
export const errorMessage = (e: unknown, fallback = 'Erro inesperado') => (e instanceof ApiError ? e.message || e.code : e instanceof Error ? e.message : fallback)
