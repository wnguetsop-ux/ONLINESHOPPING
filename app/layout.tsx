import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AuthProvider } from '@/hooks/useAuth';
import { CartProvider } from '@/hooks/useCart';
import './globals.css';

// ── Police chargée via next/font ──────────────────────────────────────────────
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

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
    images: [{
      url: 'https://www.mastershoppro.com/icons/og-image.png',
      width: 1200,
      height: 630,
      alt: 'Mastershop — Gérez vos ventes et bénéfices en FCFA depuis votre téléphone. Gratuit pour démarrer.',
      type: 'image/png',
    }],
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

        {/* ── Facebook Domain Verification ─────────────────────────────── */}
        <meta name="facebook-domain-verification" content="pj407smood5te9u9ok6v5crobeqh4s" />

        {/* ── Données structurées Google ───────────────────────────────── */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Mastershop",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Android, Web",
            "description": "Gestion de boutique pour commerçants africains. Ventes, stock, reçus, Mobile Money en FCFA.",
            "url": "https://www.mastershoppro.com",
            "offers": { "@type": "Offer", "price": "0", "priceCurrency": "XOF" },
            "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.9", "ratingCount": "127" }
          })}}
        />

        {/* ── Meta Pixel — ID 1805294393481637 ────────────────────────────
            Events trackés automatiquement :
              · PageView              → arrivée sur le site
              · ViewContent           → scroll 60%+ (via MetaPixel.tsx)
              · Lead                  → clic bouton S'inscrire
              · CompleteRegistration  → compte créé avec succès
              · CartAbandon           → formulaire touché puis abandonné
              · FbAdClick             → visiteur venant d'une pub Facebook

            Tester en direct :
            business.facebook.com/events_manager2/list/pixel/1805294393481637/test_events
        ─────────────────────────────────────────────────────────────── */}
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
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}