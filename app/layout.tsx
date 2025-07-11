import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from "@/lib/theme"
import { Providers } from "@/components/providers"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Contas-PT - Portuguese Accounting System',
  description: 'Complete Portuguese accounting system with AI-powered document processing, tax compliance, and multi-tenant support.',
  keywords: 'Portuguese accounting, IVA, NIF validation, SAFT-PT, invoice processing, expense tracking',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  )
}