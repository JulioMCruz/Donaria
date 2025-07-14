import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import { WalletProvider } from '@/contexts/WalletContext'
import { Toaster } from '@/components/ui/sonner'
import { ClientLayout } from '@/components/client-layout'

export const metadata: Metadata = {
  title: 'Donaria - Transparent Humanitarian Aid on Stellar Blockchain',
  description: 'Connect donors with verified beneficiaries through transparent, blockchain-powered humanitarian aid. Track your donations, verify impact, and provide direct help to communities in crisis using Stellar blockchain technology.',
  keywords: 'humanitarian aid, blockchain donations, Stellar network, transparent charity, crisis relief, verified beneficiaries, cryptocurrency donations, disaster relief, emergency aid, direct donations',
  authors: [{ name: 'Donaria Team' }],
  creator: 'Donaria',
  publisher: 'Donaria',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.donaria.xyz'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    title: 'Donaria - Transparent Humanitarian Aid on Stellar Blockchain',
    description: 'Connect donors with verified beneficiaries through transparent, blockchain-powered humanitarian aid. Track your donations, verify impact, and provide direct help to communities in crisis.',
    url: 'https://www.donaria.xyz',
    siteName: 'Donaria',
    images: [
      {
        url: '/banner.png',
        width: 1200,
        height: 630,
        alt: 'Donaria - Transparent Humanitarian Aid Platform',
      },
      {
        url: '/logo.png',
        width: 800,
        height: 800,
        alt: 'Donaria Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Donaria - Transparent Humanitarian Aid on Stellar Blockchain',
    description: 'Connect donors with verified beneficiaries through transparent, blockchain-powered humanitarian aid. Track donations, verify impact, provide direct help.',
    images: ['/banner.png'],
    creator: '@donaria_xyz',
    site: '@donaria_xyz',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'verification-token-here', // Add actual Google verification token
  },
}

const structuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Donaria",
  "description": "Transparent humanitarian aid platform connecting donors with verified beneficiaries through blockchain technology",
  "url": "https://www.donaria.xyz",
  "logo": "https://www.donaria.xyz/logo.png",
  "image": "https://www.donaria.xyz/banner.png",
  "sameAs": [
    "https://twitter.com/donaria_xyz",
    // Add other social media URLs when available
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "contactType": "Customer Service",
    "email": "support@donaria.xyz"
  },
  "foundingDate": "2024",
  "keywords": "humanitarian aid, blockchain donations, Stellar network, transparent charity, crisis relief",
  "applicationCategory": "FinanceApplication",
  "operatingSystem": "Web Browser",
  "offers": {
    "@type": "Offer",
    "description": "Transparent humanitarian aid donations through blockchain technology",
    "price": "0",
    "priceCurrency": "USD"
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
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
