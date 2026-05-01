import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Heart, ShoppingBag, Truck, MapPin, Sparkles, Package, Store,
  CheckCircle2, ArrowRight, MessageCircle,
} from 'lucide-react';
import { getActiveProductsForDiaspora } from '@/lib/firestore';
import { formatPrice, approxEur, formatEur } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Envoyer à ma famille au Cameroun — Mastershop',
  description:
    'Achetez directement chez des commerçants camerounais et faites livrer à votre famille au Cameroun. Paiement en euros, livraison locale, photo de réception.',
  openGraph: {
    title: 'Envoyer à ma famille au Cameroun — Mastershop',
    description:
      'Choisissez un produit chez un commerçant local au Cameroun. Vous payez en euros, votre famille reçoit à domicile.',
    type: 'website',
    locale: 'fr_FR',
  },
};

export const dynamic = 'force-dynamic';

export default async function DiasporaLandingPage() {
  const items = await getActiveProductsForDiaspora(60);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative max-w-5xl mx-auto px-5 py-12 sm:py-20">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-semibold mb-5">
            <Heart className="w-3.5 h-3.5" />
            Pour la diaspora camerounaise
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold leading-tight mb-4">
            Faites plaisir à votre famille<br />au Cameroun 🇨🇲
          </h1>
          <p className="text-base sm:text-xl text-white/90 max-w-2xl mb-7 leading-relaxed">
            Choisissez un produit chez un commerçant local. Vous payez en euros depuis l&apos;Europe,
            votre famille reçoit à domicile au Cameroun.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center text-sm text-white/85">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Commerçants camerounais vérifiés</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Livraison à Yaoundé, Douala et autres villes</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>Photo de réception envoyée</span>
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-5 py-10 sm:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <ShoppingBag className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="font-bold text-gray-900 mb-1">1. Choisissez</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Parcourez les produits proposés par des commerçants au Cameroun et sélectionnez ce qui plaira à votre famille.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <MessageCircle className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="font-bold text-gray-900 mb-1">2. Discutez & payez</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Contactez le commerçant sur WhatsApp pour confirmer la disponibilité, l&apos;adresse de livraison et le montant en euros.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5 text-emerald-700" />
            </div>
            <p className="font-bold text-gray-900 mb-1">3. Livraison & photo</p>
            <p className="text-sm text-gray-600 leading-relaxed">
              Le commerçant livre votre famille au Cameroun et vous renvoie une photo de la réception.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-5 pb-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">À envoyer aujourd&apos;hui</h2>
            <p className="text-sm text-gray-500 mt-1">{items.length} produits disponibles chez nos commerçants</p>
          </div>
          <Sparkles className="w-6 h-6 text-emerald-600 hidden sm:block" />
        </div>

        {items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center border border-gray-100">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 font-semibold mb-1">Pas encore de produits disponibles</p>
            <p className="text-sm text-gray-500">Revenez bientôt — nos commerçants ajoutent des nouveautés chaque jour.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {items.map(({ product, shop }) => {
              const eur = approxEur(product.sellingPrice, shop.currency);
              const priceLocal = formatPrice(product.sellingPrice, shop.currency);
              return (
                <Link
                  key={product.id}
                  href={`/p/${product.id}`}
                  className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-emerald-300 hover:shadow-lg transition-all"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight mb-1.5">
                      {product.name}
                    </p>
                    <div className="flex items-baseline gap-1.5 mb-2">
                      <span className="text-base font-extrabold text-emerald-700">{formatEur(eur)}</span>
                      <span className="text-xs text-gray-400">·</span>
                      <span className="text-xs text-gray-500">{priceLocal}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Store className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{shop.name}</span>
                      {shop.city && (
                        <>
                          <span className="text-gray-300">·</span>
                          <MapPin className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{shop.city}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-5 py-12">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">Questions fréquentes</h2>

          <div className="space-y-5">
            <div>
              <p className="font-bold text-gray-900 mb-1.5">Comment je paie depuis l&apos;Europe ?</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pour le moment, vous discutez directement avec le commerçant sur WhatsApp pour convenir
                du moyen de paiement (virement, Wise, PayPal selon ce qu&apos;il accepte). Bientôt, paiement
                par carte en euros directement sur la fiche produit.
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1.5">Comment je sais que ma famille a bien reçu ?</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Le commerçant vous envoie une photo (et/ou un message vocal) de la réception sur WhatsApp.
                Pas de photo, pas de paiement final.
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1.5">Dans quelles villes au Cameroun ?</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Principalement Yaoundé et Douala, mais beaucoup de commerçants livrent dans toute leur région.
                Le commerçant vous le confirmera par WhatsApp.
              </p>
            </div>
            <div>
              <p className="font-bold text-gray-900 mb-1.5">Je suis commerçant au Cameroun, comment je rejoins ?</p>
              <p className="text-sm text-gray-600 leading-relaxed">
                Inscrivez-vous gratuitement sur Mastershop, ajoutez vos produits, ils apparaîtront ici.{' '}
                <Link href="/register" className="text-emerald-700 font-semibold hover:underline">
                  Créer ma boutique →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-gray-900 text-gray-400 py-8 px-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between gap-4 text-sm">
          <p>
            <span className="font-bold text-white">Mastershop</span> — relier la diaspora aux commerçants camerounais
          </p>
          <Link href="/" className="hover:text-white inline-flex items-center gap-1">
            En savoir plus sur Mastershop <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
