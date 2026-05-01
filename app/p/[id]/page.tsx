import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { cache } from 'react';
import type { Metadata } from 'next';
import { MessageCircle, Store, Package } from 'lucide-react';
import { getProduct, getShopById } from '@/lib/firestore';
import { formatPrice, getWhatsAppLink } from '@/lib/utils';
import ShareButton from '@/components/ShareButton';

const getData = cache(async (id: string) => {
  const product = await getProduct(id);
  if (!product || !product.isActive) return null;
  const shop = await getShopById(product.shopId);
  if (!shop || !shop.isActive) return null;
  return { product, shop };
});

function getBaseUrl(): string {
  const h = headers();
  const host = h.get('host') ?? 'www.mastershoppro.com';
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = await getData(params.id);
  if (!data) return { title: 'Produit introuvable' };
  const { product, shop } = data;
  const title = `${product.name} — ${shop.name}`;
  const priceTxt = formatPrice(product.sellingPrice, shop.currency);
  const description = product.description
    ? product.description.slice(0, 160)
    : `${product.name} disponible chez ${shop.name}. ${priceTxt}.`;
  const images = product.imageUrl ? [product.imageUrl] : [];
  return {
    title,
    description,
    openGraph: { title, description, images, type: 'website', locale: 'fr_FR', siteName: shop.name },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}

export default async function ViralProductPage({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  if (!data) notFound();
  const { product, shop } = data;

  const priceFormatted = formatPrice(product.sellingPrice, shop.currency);
  const productUrl = `${getBaseUrl()}/p/${product.id}`;
  const waMessage = `Bonjour ${shop.name} 👋\nJe suis intéressé(e) par : *${product.name}* (${priceFormatted})\n${productUrl}`;
  const waLink = getWhatsAppLink(shop.whatsapp, waMessage);
  const pc = shop.primaryColor || '#ec4899';

  const allImages = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-32">
      <Link
        href={`/${shop.slug}`}
        className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 hover:bg-gray-50 transition"
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
          style={{ background: pc }}
        >
          {shop.logo ? (
            <img src={shop.logo} alt={shop.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            <Store size={18} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">Boutique</p>
          <p className="font-semibold text-gray-900 truncate">{shop.name}</p>
        </div>
        <span className="text-sm text-gray-400">›</span>
      </Link>

      <div className="bg-white">
        <div className="aspect-square w-full max-w-2xl mx-auto bg-gray-100 flex items-center justify-center overflow-hidden">
          {allImages[0] ? (
            <img src={allImages[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <Package size={80} className="text-gray-300" />
          )}
        </div>
        {allImages.length > 1 && (
          <div className="flex gap-2 overflow-x-auto px-4 py-3 max-w-2xl mx-auto">
            {allImages.slice(1).map((src, i) => (
              <div key={i} className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                <img src={src} alt={`${product.name} ${i + 2}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-6 max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
        <div className="text-3xl font-extrabold mb-4" style={{ color: pc }}>
          {priceFormatted}
        </div>

        {product.stock > 0 ? (
          <span className="inline-block text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full mb-4">
            En stock
          </span>
        ) : (
          <span className="inline-block text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded-full mb-4">
            Rupture
          </span>
        )}

        {product.description && (
          <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-5">{product.description}</p>
        )}

        {product.specifications && (
          <div className="bg-white rounded-xl p-4 mb-5 border border-gray-200">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-2 font-semibold">Spécifications</p>
            <p className="text-gray-800 whitespace-pre-line text-sm leading-relaxed">{product.specifications}</p>
          </div>
        )}

        <ShareButton url={productUrl} title={`${product.name} — ${shop.name}`} className="mt-2" />
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
        <div className="max-w-2xl mx-auto">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full font-bold py-4 rounded-xl text-white text-base shadow-md active:scale-[0.98] transition"
            style={{ background: pc }}
          >
            <MessageCircle size={20} />
            Commander sur WhatsApp
          </a>
          <Link
            href={`/${shop.slug}`}
            className="block text-center mt-3 text-sm text-gray-600 hover:text-gray-900"
          >
            Voir toute la boutique {shop.name} →
          </Link>
        </div>
      </div>
    </div>
  );
}
