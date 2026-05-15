import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Providers from './providers';
import './globals.css';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'MasterShopPro - Commandes, clients et boutique WhatsApp',
  description: 'Application Android pour organiser vos ventes WhatsApp, vos produits et votre boutique partageable.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'MasterShopPro' },
  openGraph: {
    title: 'MasterShopPro - Commandes, clients et boutique WhatsApp',
    description: 'Une app Android pour organiser vos ventes WhatsApp, vos produits et votre boutique en ligne.',
    url: 'https://www.mastershoppro.com',
    siteName: 'MasterShopPro',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: 'https://www.mastershoppro.com/icons/og-image.png', width: 1200, height: 630 }],
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://www.mastershoppro.com' },
};

export const viewport: Viewport = {
  themeColor: '#25D366',
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
        <meta name="apple-mobile-web-app-title" content="MasterShopPro" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
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
      </head>
      <body className={jakarta.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
