import type { Metadata } from 'next'
import { Inter, Outfit } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })

export const metadata: Metadata = {
  title: {
    default: 'Plataforma Exportação v2',
    template: '%s | Plataforma Exportação',
  },
  description: 'Plataforma B2B de exportação com foco na cadeia da castanha-do-Brasil.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className={`${inter.variable} ${outfit.variable} font-sans bg-dark text-slate-100 antialiased`}>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: { background: '#1a2836', color: '#f1f5f9', border: '1px solid #243548' },
          }}
        />
      </body>
    </html>
  )
}
