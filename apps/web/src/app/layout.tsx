import type { Metadata, Viewport } from 'next'
import { Inter, Montserrat } from 'next/font/google'
import type { ReactNode } from 'react'
import { getLocale } from '@/lib/i18n-server'
import { Providers } from './providers'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' })
const display = Montserrat({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: ['300', '400', '500', '600'] })

export const metadata: Metadata = {
  title: { default: 'Amazon Trade', template: '%s · Amazon Trade' },
  description: 'Plataforma de exportação de castanha-do-brasil: cadastro verificado, simulação transparente e acompanhamento ponta a ponta com parceiros logísticos.',
}
export const viewport: Viewport = { themeColor: '#1b6145', width: 'device-width', initialScale: 1 }

export default function RootLayout({ children }: { children: ReactNode }) {
  const locale = getLocale()
  return (
    <html lang={locale === 'pt' ? 'pt-BR' : locale} className={`${inter.variable} ${display.variable}`}>
      <body className="font-sans">
        <Providers locale={locale}>{children}</Providers>
      </body>
    </html>
  )
}
