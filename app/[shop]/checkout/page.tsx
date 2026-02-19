'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, MapPin, Truck, CreditCard, Loader2, CheckCircle, MessageCircle } from 'lucide-react';
import { getShopBySlug, createOrder } from '@/lib/firestore';
import { Shop } from '@/lib/types';
import { useCart } from '@/hooks/useCart';
import { formatPrice, getWhatsAppLink } from '@/lib/utils';

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.shop as string;
  
  const { items, subtotal, clearCart } = useCart();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [finalTotal, setFinalTotal] = useState(0);
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    quartier: '',
    address: '',
    deliveryMethod: 'PICKUP' as 'DELIVERY' | 'PICKUP',
    paymentMethod: 'CASH_ON_DELIVERY' as 'MOBILE_MONEY' | 'CASH_ON_DELIVERY',
    notes: '',
  });

  useEffect(() => {
    async function loadShop() {
      const shopData = await getShopBySlug(slug);
      setShop(shopData);
      if (shopData) {
        setForm(f => ({
          ...f,
          deliveryMethod: shopData.pickupEnabled ? 'PICKUP' : 'DELIVERY'
        }));
      }
      setLoading(false);
    }
    if (slug) loadShop();
  }, [slug]);

  useEffect(() => {
    if (!loading && items.length === 0 && !success) {
      router.push(`/${slug}/cart`);
    }
  }, [loading, items.length, success, router, slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!shop) return null;

  const primaryColor = shop.primaryColor || '#ec4899';
  const deliveryFee = form.deliveryMethod === 'DELIVERY' ? (shop.deliveryFee || 0) : 0;
  const total = subtotal + deliveryFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shop?.id) return;
    
    setSubmitting(true);
    
    const shopData = shop;
    try {
      const orderId = await createOrder(shop.id, {
        customerName: form.name,
        customerPhone: form.phone,
        customerQuartier: form.quartier,
        customerAddress: form.address,
        items: items.map(({ product, quantity }) => ({
          productId: product.id!,
          productName: product.name,
          quantity,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
        })),
        paymentMethod: form.paymentMethod,
        deliveryMethod: form.deliveryMethod,
        deliveryFee,
        notes: form.notes,
      });
      
      // Get the order number (we don't have direct access, so generate display)
      setFinalTotal(total);
      const orderNum = `CMD-${new Date().toISOString().slice(2,10).replace(/-/g, '')}-${orderId.slice(0,4).toUpperCase()}`;
      setOrderNumber(orderNum);
      clearCart();
      setSuccess(true);

      // Auto-send WhatsApp confirmation
      if (shopData?.whatsapp) {
        const itemsList = items.map(({ product, quantity }) => 
          `• ${product.name} x${quantity} = ${formatPrice(product.sellingPrice * quantity, shopData.currency)}`
        ).join('\n');

        const whatsappMsg = `🛒 *Nouvelle commande ${orderNum}!*\n\n👤 *Client:* ${form.name}\n📞 *Tél:* ${form.phone}\n📍 *Livraison:* ${form.deliveryMethod === 'DELIVERY' ? `${form.quartier} - ${form.address}` : 'Retrait sur place'}\n💳 *Paiement:* ${form.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Paiement à la livraison'}\n\n*Articles:*\n${itemsList}\n\n💰 *Total: ${formatPrice(total, shopData.currency)}*\n\nMerci de confirmer ma commande!`;
        
        setTimeout(() => {
          window.open(getWhatsAppLink(shopData.whatsapp, whatsappMsg), '_blank');
        }, 500);
      }
      
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('LIMIT_REACHED')) {
        alert('⚠️ ' + msg.replace('LIMIT_REACHED: ', ''));
      } else {
        alert('Erreur lors de la commande. Vérifiez votre connexion et réessayez.');
      }
    }
    
    setSubmitting(false);
  }

  // Success Screen
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)' }}>
        <div className="bg-white rounded-3xl p-8 text-center max-w-md w-full shadow-2xl">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Commande envoyée! 🎉</h1>
          <p className="text-gray-500 mb-1">Merci <strong>{form.name}</strong>!</p>
          <p className="text-gray-500 text-sm mb-5">Votre commande a été enregistrée. Confirmez-la sur WhatsApp ci-dessous.</p>
          
          <div className="bg-gray-50 rounded-2xl p-4 mb-5 text-left space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Mode</span>
              <span className="font-medium">{form.deliveryMethod === 'DELIVERY' ? '🚚 Livraison' : '📍 Retrait'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Paiement</span>
              <span className="font-medium">{form.paymentMethod === 'MOBILE_MONEY' ? '📱 Mobile Money' : '💵 Comptant'}</span>
            </div>
            <div className="flex justify-between font-bold pt-2 border-t" style={{ color: primaryColor }}>
              <span>Total</span>
              <span>{formatPrice(finalTotal || total, shop.currency)}</span>
            </div>
          </div>
          
          {shop.whatsapp && (
            <a href={getWhatsAppLink(shop.whatsapp, `🛒 Commande de ${form.name} (${form.phone})\nTotal: ${formatPrice(finalTotal || total, shop.currency)}\nMerci de confirmer!`)}
              target="_blank"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-white font-semibold mb-3 transition-colors"
              style={{ backgroundColor: '#25D366' }}>
              <MessageCircle className="w-5 h-5" />
              Confirmer sur WhatsApp
            </a>
          )}
          
          <Link href={`/${slug}`} className="block text-sm text-gray-400 hover:text-gray-600 transition-colors">
            ← Retour à la boutique
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href={`/${slug}/cart`} className="p-2 hover:bg-gray-100 rounded-xl">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="font-bold text-gray-800 text-lg">Finaliser la commande</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Customer Info */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">👤 Vos informations</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm({...form, name: e.target.value})}
                className="input"
                placeholder="Jean Pierre"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone *</label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm({...form, phone: e.target.value})}
                className="input"
                placeholder="677 123 456"
              />
            </div>
          </div>
        </div>

        {/* Delivery Method */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">🚚 Mode de livraison</h2>
          
          <div className="space-y-3">
            {shop.pickupEnabled && (
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                form.deliveryMethod === 'PICKUP' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="delivery"
                  checked={form.deliveryMethod === 'PICKUP'}
                  onChange={() => setForm({...form, deliveryMethod: 'PICKUP'})}
                  className="w-5 h-5"
                  style={{ accentColor: primaryColor }}
                />
                <MapPin className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Retrait sur place</p>
                  {shop.pickupAddress && <p className="text-sm text-gray-500">{shop.pickupAddress}</p>}
                </div>
                <span className="font-semibold text-emerald-600">Gratuit</span>
              </label>
            )}
            
            {shop.deliveryEnabled && (
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                form.deliveryMethod === 'DELIVERY' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="delivery"
                  checked={form.deliveryMethod === 'DELIVERY'}
                  onChange={() => setForm({...form, deliveryMethod: 'DELIVERY'})}
                  className="w-5 h-5"
                  style={{ accentColor: primaryColor }}
                />
                <Truck className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Livraison à domicile</p>
                </div>
                <span className="font-semibold">{formatPrice(shop.deliveryFee || 0, shop.currency)}</span>
              </label>
            )}
          </div>
          
          {form.deliveryMethod === 'DELIVERY' && (
            <div className="space-y-4 mt-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quartier *</label>
                <input
                  type="text"
                  required
                  value={form.quartier}
                  onChange={(e) => setForm({...form, quartier: e.target.value})}
                  className="input"
                  placeholder="Ex: Bastos, Mvan..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse précise *</label>
                <input
                  type="text"
                  required
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  className="input"
                  placeholder="Rue, numéro, repère..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">💳 Mode de paiement</h2>
          
          <div className="space-y-3">
            <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
              form.paymentMethod === 'CASH_ON_DELIVERY' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
            }`}>
              <input
                type="radio"
                name="payment"
                checked={form.paymentMethod === 'CASH_ON_DELIVERY'}
                onChange={() => setForm({...form, paymentMethod: 'CASH_ON_DELIVERY'})}
                className="w-5 h-5"
                style={{ accentColor: primaryColor }}
              />
              <CreditCard className="w-5 h-5 text-gray-500" />
              <div className="flex-1">
                <p className="font-medium text-gray-800">
                  {form.deliveryMethod === 'PICKUP' ? 'Paiement au retrait' : 'Paiement à la livraison'}
                </p>
              </div>
            </label>
            
            {shop.mobileMoneyNumber && (
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                form.paymentMethod === 'MOBILE_MONEY' ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
              }`}>
                <input
                  type="radio"
                  name="payment"
                  checked={form.paymentMethod === 'MOBILE_MONEY'}
                  onChange={() => setForm({...form, paymentMethod: 'MOBILE_MONEY'})}
                  className="w-5 h-5"
                  style={{ accentColor: primaryColor }}
                />
                <span className="text-xl">📱</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">Mobile Money</p>
                  <p className="text-sm text-gray-500">{shop.mobileMoneyNumber}</p>
                </div>
              </label>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optionnel)</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({...form, notes: e.target.value})}
            className="textarea"
            rows={2}
            placeholder="Instructions spéciales..."
          />
        </div>

        {/* Summary */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-gray-800 mb-4">📋 Récapitulatif</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Sous-total ({items.length} articles)</span>
              <span>{formatPrice(subtotal, shop.currency)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Livraison</span>
              <span>{deliveryFee === 0 ? 'Gratuit' : formatPrice(deliveryFee, shop.currency)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ color: primaryColor }}>
              <span>Total</span>
              <span>{formatPrice(total, shop.currency)}</span>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ backgroundColor: primaryColor }}
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              `Confirmer la commande • ${formatPrice(total, shop.currency)}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}