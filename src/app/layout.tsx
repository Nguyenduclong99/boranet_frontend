import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AppProvider from '@/app/app-provider'
import { baseOpenGraph } from '@/app/shared-metadata'
import Header from '@/components/header'
const inter = Inter({ subsets: ['vietnamese'] })

export const metadata: Metadata = {
  title: {
    template: '%s | Boranet',
    default: 'Boranet'
  },
  description: 'Created by Long Nguyen',
  openGraph: baseOpenGraph
}

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body className={`${inter.className}`}>
          <AppProvider>
            <Header />
            {children}
          </AppProvider>
      </body>
    </html>
  )
}
