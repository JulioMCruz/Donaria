import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { WalletProvider } from '@/contexts/WalletContext'
import { Toaster } from '@/components/ui/sonner'
import { ClientLayout } from '@/components/client-layout'

export const metadata: Metadata = {
  title: 'Donaria - Transparent Humanitarian Aid on Stellar Blockchain',
  description: 'Connect donors with verified beneficiaries through transparent, blockchain-powered humanitarian aid. Track your donations, verify impact, and provide direct help to communities in crisis using Stellar blockchain technology.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>
          <WalletProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
            <Toaster />
          </WalletProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
