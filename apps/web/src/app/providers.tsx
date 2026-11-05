'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { Toaster } from 'react-hot-toast'
import { ApiError } from '@/lib/api'
import { LocaleProvider, type Locale } from '@/lib/i18n'

export function Providers({ locale, children }: { locale: Locale; children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
          },
        },
      }),
  )
  return (
    <LocaleProvider locale={locale}>
      <QueryClientProvider client={client}>
        {children}
        <Toaster position="bottom-right" toastOptions={{ style: { borderRadius: 12, fontSize: 14, color: '#14181d' } }} />
      </QueryClientProvider>
    </LocaleProvider>
  )
}
