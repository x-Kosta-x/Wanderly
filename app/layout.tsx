
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { LanguageProvider } from '@/contexts/language-context'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: 'Travel & Expenses',
  description: 'App for tracking shared expenses in trips',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <LanguageProvider>
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {children}
          </div>
          <Toaster position="top-right" richColors />
        </LanguageProvider>
      </body>
    </html>
  )
}
