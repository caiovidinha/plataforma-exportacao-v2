'use client'
import { useMutation, useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { api, errorMessage, type ApiOptions } from './api'

type Query = NonNullable<ApiOptions['query']>

/** GET tipado com cache por (path, query). `path = null` desativa a consulta. */
export function useGet<T>(path: string | null, opts: { query?: Query; enabled?: boolean; refetchInterval?: number; staleTime?: number } = {}) {
  return useQuery<T>({
    queryKey: [path, opts.query ?? {}],
    queryFn: ({ signal }) => api<T>(path!, { query: opts.query, signal }),
    enabled: path !== null && opts.enabled !== false,
    refetchInterval: opts.refetchInterval,
    staleTime: opts.staleTime ?? 15_000,
  })
}

/**
 * Mutação com invalidação de caches por prefixo de path e toast de erro automático.
 * `invalidate: ['/orders', '/dashboard']` invalida todas as consultas que começam com esses paths.
 */
export function useSend<TRes = unknown, TVars = void>(
  fn: (vars: TVars) => Promise<TRes>,
  opts: { invalidate?: string[]; onSuccess?: (res: TRes, vars: TVars) => void; silent?: boolean } = {},
) {
  const qc = useQueryClient()
  return useMutation<TRes, Error, TVars>({
    mutationFn: fn,
    onSuccess: async (res, vars) => {
      await Promise.all((opts.invalidate ?? []).map((p) => qc.invalidateQueries({ predicate: (q) => typeof q.queryKey[0] === 'string' && (q.queryKey[0] as string).startsWith(p) })))
      opts.onSuccess?.(res, vars)
    },
    onError: (e) => {
      if (!opts.silent) toast.error(errorMessage(e))
    },
  })
}

export const keyOf = (path: string, query: Query = {}): QueryKey => [path, query]
