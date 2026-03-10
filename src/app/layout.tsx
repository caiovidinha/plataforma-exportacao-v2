import type { Metadata } from 'next'
import { Inter, Outfit, Montserrat } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' })

export const metadata: Metadata = {
  title: {
    default: 'BrazilXHub',
    template: '%s | BrazilXHub',
  },
  description: 'B2B export platform for the Brazil Nut supply chain.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages()

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${outfit.variable} ${montserrat.variable} font-sans bg-dark text-slate-100 antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: { background: '#261810', color: '#f1f5f9', border: '1px solid #3e281a' },
            }}
          />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
