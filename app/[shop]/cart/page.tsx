'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { getShopBySlug } from '@/lib/firestore';
import { Shop } from '@/lib/types';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.shop as string;
  
  const { items, shopSlug, updateQuantity, removeFromCart, subtotal } = useCart();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadShop() {
      const shopData = await getShopBySlug(slug);
      setShop(shopData);
      setLoading(false);
    }
    if (slug) loadShop();
  }, [slug]);

  // Redirect if cart is for different shop
  useEffect(() => {
    if (!loading && shopSlug && shopSlug !== slug) {
      router.push(`/${shopSlug}/cart`);
    }
  }, [loading, shopSlug, slug, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Boutique non trouvée</p>
      </div>
    );
  }

  const primaryColor = shop.primaryColor || '#ec4899';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/${slug}`} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-800 text-lg">Mon Panier</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {items.length > 0 ? (
          <>
            {/* Items */}
            <div className="space-y-4 mb-6">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="bg-white rounded-2xl p-4 shadow-sm">
                  <div className="flex gap-4">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt="" className="w-20 h-20 rounded-xl object-cover" />
                    ) : (
                      <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center">
                        <span className="text-2xl">📦</span>
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{product.name}</h3>
                      <p className="text-sm text-gray-400">{product.category}</p>
                      <p className="font-bold mt-1" style={{ color: primaryColor }}>
                        {formatPrice(product.sellingPrice, shop.currency)}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => removeFromCart(product.id!)}
                      className="p-2 text-gray-400 hover:text-red-500 self-start"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                  
                  {/* Quantity */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(product.id!, quantity - 1)}
                        className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="font-semibold w-8 text-center">{quantity}</span>
                      <button
                        onClick={() => updateQuantity(product.id!, quantity + 1)}
                        disabled={quantity >= product.stock}
                        className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-80 disabled:opacity-50 text-white"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-bold text-gray-800">
                      {formatPrice(product.sellingPrice * quantity, shop.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-600">Sous-total</span>
                <span className="text-xl font-bold" style={{ color: primaryColor }}>
                  {formatPrice(subtotal, shop.currency)}
                </span>
              </div>
              
              <Link
                href={`/${slug}/checkout`}
                className="w-full py-4 rounded-xl text-white font-semibold text-center block hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                Commander ({items.length} article{items.length > 1 ? 's' : ''})
              </Link>
              
              <Link
                href={`/${slug}`}
                className="w-full py-3 text-center block text-gray-500 hover:text-gray-700 mt-2"
              >
                ← Continuer mes achats
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-16">
            <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 mb-6">Votre panier est vide</p>
            <Link
              href={`/${slug}`}
              className="btn-primary inline-block"
              style={{ backgroundColor: primaryColor }}
            >
              Découvrir les produits
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
