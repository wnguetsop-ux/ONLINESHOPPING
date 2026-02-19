'use client';
import { useState, useEffect } from 'react';
import { Crown, Check, Zap, Package, ShoppingCart, MessageCircle, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkShopLimits } from '@/lib/firestore';
import { PLANS } from '@/lib/types';

export default function SubscriptionPage() {
  const { shop } = useAuth();
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);

  // ⚠️ TES INFORMATIONS DE CONTACT
  const PAYMENT_WHATSAPP = '393299639430';
  const PAYMENT_MOMO = '+237 651 495 483';
  const EMAIL = 'wnguetsop@gmail.com';

  useEffect(() => {
    if (shop?.id) {
      checkShopLimits(shop.id).then(data => {
        setLimits(data);
        setLoading(false);
      });
    }
  }, [shop?.id]);

  const currentPlan = PLANS[shop?.planId || 'FREE'];

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function getWhatsAppMessage(planId: string) {
    const plan = PLANS[planId as keyof typeof PLANS];
    return `Bonjour! Je souhaite passer au plan *${plan.name}* de ShopMaster.\n\nMa boutique: ${shop?.name}\nSlug: ${shop?.slug}\n\nPrix: ${plan.price.toLocaleString('fr-FR')} FCFA/mois\n\nMerci de confirmer mon abonnement.`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const primaryColor = shop?.primaryColor || '#ec4899';

  return (
    <div className="max-w-4xl space-y-8">
      {/* Current Usage */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Zap className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Votre utilisation</h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">Produits</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {limits?.productsCount || 0}
              <span className="text-sm font-normal text-gray-400">
                /{currentPlan.maxProducts === -1 ? '∞' : currentPlan.maxProducts}
              </span>
            </p>
            {currentPlan.maxProducts !== -1 && (
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${limits?.productsCount >= currentPlan.maxProducts ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${Math.min(100, ((limits?.productsCount || 0) / currentPlan.maxProducts) * 100)}%` }}
                />
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCart className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-gray-500">Commandes/mois</span>
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {limits?.ordersThisMonth || 0}
              <span className="text-sm font-normal text-gray-400">
                /{currentPlan.maxOrdersPerMonth === -1 ? '∞' : currentPlan.maxOrdersPerMonth}
              </span>
            </p>
            {currentPlan.maxOrdersPerMonth !== -1 && (
              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${limits?.ordersThisMonth >= currentPlan.maxOrdersPerMonth ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${Math.min(100, ((limits?.ordersThisMonth || 0) / currentPlan.maxOrdersPerMonth) * 100)}%` }}
                />
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5" style={{ color: currentPlan.color }} />
              <span className="text-sm text-gray-500">Plan actuel</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: currentPlan.color }}>
              {currentPlan.name}
            </p>
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-5 h-5 text-emerald-500" />
              <span className="text-sm text-gray-500">Statut</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">Actif</p>
          </div>
        </div>
      </div>

      {/* Plans */}
      <div className="grid md:grid-cols-3 gap-6">
        {Object.values(PLANS).map((plan) => {
          const isCurrentPlan = currentPlan.id === plan.id;
          const isPopular = plan.id === 'STARTER';

          return (
            <div
              key={plan.id}
              className={`relative card transition-all ${
                isCurrentPlan ? 'ring-2' : isPopular ? 'ring-2 ring-blue-500' : ''
              }`}
              style={isCurrentPlan ? { ringColor: primaryColor } : {}}
            >
              {isPopular && !isCurrentPlan && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  ⭐ Populaire
                </div>
              )}

              {isCurrentPlan && (
                <div 
                  className="absolute -top-3 left-1/2 -translate-x-1/2 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center gap-1"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Check className="w-4 h-4" /> Actuel
                </div>
              )}

              <div className="text-center pt-4 mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: `${plan.color}20` }}
                >
                  <Crown className="w-7 h-7" style={{ color: plan.color }} />
                </div>
                <h3 className="text-xl font-bold text-gray-800">{plan.name}</h3>
                <p className="text-3xl font-bold mt-2" style={{ color: plan.color }}>
                  {plan.price === 0 ? 'Gratuit' : `${plan.price.toLocaleString('fr-FR')}`}
                  {plan.price > 0 && <span className="text-sm font-normal text-gray-400"> FCFA/mois</span>}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Check className="w-5 h-5 flex-shrink-0" style={{ color: plan.color }} />
                    <span className="text-gray-600 text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed">
                  Plan actuel
                </button>
              ) : plan.id === 'FREE' ? (
                <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-500 font-semibold cursor-not-allowed">
                  Plan de base
                </button>
              ) : (
                <button
                  onClick={() => setShowPayment(plan.id)}
                  className="w-full py-3 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: plan.color }}
                >
                  Passer au {plan.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden">
            <div
              className="p-6 text-white text-center"
              style={{ backgroundColor: PLANS[showPayment as keyof typeof PLANS].color }}
            >
              <Crown className="w-12 h-12 mx-auto mb-3" />
              <h2 className="text-2xl font-bold">Passer au {PLANS[showPayment as keyof typeof PLANS].name}</h2>
              <p className="text-3xl font-bold mt-2">
                {PLANS[showPayment as keyof typeof PLANS].price.toLocaleString('fr-FR')} FCFA/mois
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">📱 Paiement Mobile Money</h3>
                <div className="flex items-center justify-between bg-white rounded-lg p-3 border">
                  <span className="font-mono text-lg">{PAYMENT_MOMO}</span>
                  <button onClick={() => copyToClipboard(PAYMENT_MOMO)} className="p-2 hover:bg-gray-100 rounded-lg">
                    {copied ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5 text-gray-400" />}
                  </button>
                </div>
              </div>

              <a
                href={`https://wa.me/${PAYMENT_WHATSAPP}?text=${encodeURIComponent(getWhatsAppMessage(showPayment))}`}
                target="_blank"
                className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                Confirmer via WhatsApp
              </a>

              <div className="bg-blue-50 rounded-xl p-4 text-sm">
                <p className="text-blue-700 font-medium">📌 Instructions :</p>
                <ol className="list-decimal list-inside text-blue-600 mt-2 space-y-1">
                  <li>Envoyez le montant par Mobile Money</li>
                  <li>Cliquez sur "Confirmer via WhatsApp"</li>
                  <li>Envoyez la capture du paiement</li>
                  <li>Votre plan sera activé sous 24h</li>
                </ol>
              </div>

              <button
                onClick={() => setShowPayment(null)}
                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}