import type { Metadata, Viewport } from 'next';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mastershop — Gérez vos ventes et bénéfices en FCFA depuis votre téléphone',
  description: 'Application de gestion de boutique pour commerçants africains. Ventes, stock, reçus, Mobile Money — tout sur votre téléphone Android. Fonctionne sans internet. Gratuit pour démarrer.',
  keywords: 'gestion boutique Afrique, caisse enregistreuse téléphone, FCFA, Mobile Money, Orange Money, Wave, MTN MoMo, Dakar, Abidjan, Douala',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mastershop',
  },
  openGraph: {
    title: 'Mastershop — Gérez votre boutique depuis votre téléphone',
    description: 'Ventes, stock, reçus, bénéfices en FCFA — tout depuis votre téléphone Android. Fonctionne sans internet. 500+ commerçants à Dakar, Abidjan, Douala.',
    url: 'https://www.mastershoppro.com',
    siteName: 'Mastershop',
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: 'https://www.mastershoppro.com/icons/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Mastershop — Application de gestion de boutique',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mastershop — Gérez votre boutique depuis votre téléphone',
    description: 'Ventes, stock, reçus, bénéfices en FCFA — tout depuis votre téléphone. Gratuit pour démarrer.',
    images: ['https://www.mastershoppro.com/icons/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: 'https://www.mastershoppro.com',
  },
};

export const viewport: Viewport = {
  themeColor: '#16a34a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mastershop" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Mastershop" />
        <meta name="format-detection" content="telephone=no" />
        {/* Préchargement Google Fonts pour vitesse */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
        {/* Données structurées pour Google */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Mastershop",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Android, Web",
            "description": "Application de gestion de boutique pour commerçants africains. Ventes, stock, reçus, Mobile Money en FCFA.",
            "url": "https://www.mastershoppro.com",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "XOF"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "ratingCount": "127"
            }
          })}}
        />
      </head>
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}