import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Providers from './providers';
import './globals.css';

// -- Police chargee via next/font (interdit d'utiliser <link> en Next.js 14) --
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'Mastershop - Gerez vos ventes et benefices en FCFA depuis votre telephone',
  description: 'Application de gestion de boutique pour commercants africains. Ventes, stock, recus, Mobile Money - tout sur votre telephone Android. Fonctionne sans internet. Gratuit pour demarrer.',
  keywords: 'gestion boutique Afrique, caisse enregistreuse telephone, FCFA, Mobile Money, Orange Money, Wave, MTN MoMo, Dakar, Abidjan, Douala',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mastershop',
  },
  openGraph: {
    title: 'Mastershop - Gerez votre boutique depuis votre telephone',
    description: 'Ventes, stock, recus, benefices en FCFA - tout depuis votre telephone Android. Fonctionne sans internet. 500+ commercants a Dakar, Abidjan, Douala.',
    url: 'https://www.mastershoppro.com',
    siteName: 'Mastershop',
    locale: 'fr_FR',
    type: 'website',
    images: [{
      url: 'https://www.mastershoppro.com/icons/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Mastershop - Gerez vos ventes et benefices en FCFA depuis votre telephone. Gratuit pour demarrer.',
      type: 'image/png',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mastershop - Gerez votre boutique depuis votre telephone',
    description: 'Ventes, stock, recus, benefices en FCFA - tout depuis votre telephone. Gratuit pour demarrer.',
    images: ['https://www.mastershoppro.com/icons/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
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
    <html lang="fr" className={jakarta.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Mastershop" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Mastershop" />
        <meta name="format-detection" content="telephone=no" />

        {/* ============================================================
            FACEBOOK DOMAIN VERIFICATION
            Remplace XXXXX par le code donne dans :
            business.facebook.com  Securite de la marque  Domaines
            ============================================================ */}
        <meta name="facebook-domain-verification" content="REMPLACE_PAR_TON_CODE_FACEBOOK" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Mastershop",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Android, Web",
            "description": "Gestion de boutique pour commercants africains. Ventes, stock, recus, Mobile Money en FCFA.",
            "url": "https://www.mastershoppro.com",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "XOF" },
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "127" }
          })}}
        />

        {/* ================================================================
            META PIXEL - ID : 1805294393481637
            Tracking : PageView  ViewContent (scroll 60%)  Lead (clic S'inscrire)
                       CompleteRegistration  CartAbandon  FbAdClick (fbclid detecte)
            Test : https://business.facebook.com/events_manager2/list/pixel/1805294393481637/test_events
        ================================================================ */}
        <script
          id="meta-pixel"
          dangerouslySetInnerHTML={{ __html: `
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1805294393481637');
            fbq('track', 'PageView');
          `}}
        />
        <noscript
          dangerouslySetInnerHTML={{ __html:
            '<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=1805294393481637&ev=PageView&noscript=1" />'
          }}
        />
      </head>
      <body className={jakarta.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}