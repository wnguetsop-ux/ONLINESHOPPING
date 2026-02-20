'use client';
import { useState, useEffect } from 'react';
import { Crown, Check, Zap, Package, ShoppingCart, ExternalLink, Sparkles, Shield, Clock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkShopLimits } from '@/lib/firestore';
import { PLANS } from '@/lib/types';

// ── Stripe payment links ──────────────────────────────────────────────────
const STRIPE_LINKS: Record<string, string> = {
  STARTER: 'https://buy.stripe.com/7sY3cngMt8Cu8ja6XGaVa02',
  PRO:     'https://buy.stripe.com/fZuaEPbs98Cuczqci0aVa03',
};

const PLAN_FEATURES: Record<string, { icon: string; items: string[] }> = {
  FREE: {
    icon: '🆓',
    items: ['20 produits max', '20 commandes/mois', 'Boutique en ligne publique', 'Scanner de codes-barres', 'Support email'],
  },
  STARTER: {
    icon: '🚀',
    items: ['50 produits max', '100 commandes/mois', 'Toutes les fonctionnalités Free', 'IA analyse produits (Gemini + GPT-4o)', 'Reçus imprimables thermiques', 'Support prioritaire'],
  },
  PRO: {
    icon: '👑',
    items: ['Produits illimités', 'Commandes illimitées', 'Toutes les fonctionnalités Starter', 'Scanner USB professionnel', 'Multi-devises (21 pays)', 'Support 24/7 WhatsApp'],
  },
};

export default function SubscriptionPage() {
  const { shop } = useAuth();
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (shop?.id) {
      checkShopLimits(shop.id).then(data => { setLimits(data); setLoading(false); });
    }
  }, [shop?.id]);

  const currentPlan = PLANS[shop?.planId || 'FREE'];
  const primaryColor = shop?.primaryColor || '#ec4899';

  function openStripe(planId: string) {
    const link = STRIPE_LINKS[planId];
    if (!link) return;
    // Pass shop slug as metadata via URL query (Stripe allows client_reference_id)
    const url = `${link}?client_reference_id=${shop?.slug || ''}&prefilled_email=${shop ? '' : ''}`;
    window.open(link, '_blank');
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }} />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-6">

      {/* Current plan banner */}
      <div className="card" style={{ background: `linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05)`, borderColor: `${primaryColor}30` }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: `${currentPlan.color}20` }}>
              {PLAN_FEATURES[currentPlan.id]?.icon}
            </div>
            <div>
              <p className="text-sm text-gray-500">Plan actuel</p>
              <p className="text-2xl font-bold" style={{ color: currentPlan.color }}>{currentPlan.name}</p>
            </div>
          </div>
          {/* Usage bars */}
          <div className="flex gap-6">
            <div>
              <p className="text-xs text-gray-500 mb-1">Produits</p>
              <p className="font-bold text-gray-800">{limits?.productsCount || 0}<span className="text-gray-400 font-normal">/{currentPlan.maxProducts === -1 ? '∞' : currentPlan.maxProducts}</span></p>
              {currentPlan.maxProducts !== -1 && (
                <div className="mt-1 h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (limits?.productsCount || 0) / currentPlan.maxProducts * 100)}%`, backgroundColor: (limits?.productsCount || 0) >= currentPlan.maxProducts ? '#ef4444' : primaryColor }} />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Commandes/mois</p>
              <p className="font-bold text-gray-800">{limits?.ordersThisMonth || 0}<span className="text-gray-400 font-normal">/{currentPlan.maxOrdersPerMonth === -1 ? '∞' : currentPlan.maxOrdersPerMonth}</span></p>
              {currentPlan.maxOrdersPerMonth !== -1 && (
                <div className="mt-1 h-1.5 w-24 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (limits?.ordersThisMonth || 0) / currentPlan.maxOrdersPerMonth * 100)}%`, backgroundColor: (limits?.ordersThisMonth || 0) >= currentPlan.maxOrdersPerMonth ? '#ef4444' : '#10b981' }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plans grid */}
      <div className="grid md:grid-cols-3 gap-5">
        {Object.values(PLANS).map(plan => {
          const isCurrent = currentPlan.id === plan.id;
          const isPopular = plan.id === 'STARTER';
          const hasStripe = !!STRIPE_LINKS[plan.id];
          const features = PLAN_FEATURES[plan.id];

          return (
            <div key={plan.id} className={`relative bg-white rounded-2xl border-2 flex flex-col transition-all overflow-hidden
              ${isCurrent ? 'border-current shadow-lg' : isPopular ? 'border-blue-400 shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'}`}
              style={isCurrent ? { borderColor: primaryColor } : {}}>

              {/* Popular badge */}
              {isPopular && !isCurrent && (
                <div className="bg-blue-500 text-white text-xs font-bold text-center py-1.5 tracking-wide">⭐ PLUS POPULAIRE</div>
              )}
              {isCurrent && (
                <div className="text-white text-xs font-bold text-center py-1.5 tracking-wide" style={{ backgroundColor: primaryColor }}>
                  ✓ PLAN ACTUEL
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Header */}
                <div className="text-center mb-5">
                  <span className="text-4xl">{features?.icon}</span>
                  <h3 className="text-xl font-bold text-gray-800 mt-2">{plan.name}</h3>
                  <div className="mt-2">
                    {plan.price === 0 ? (
                      <p className="text-3xl font-bold text-gray-700">Gratuit</p>
                    ) : (
                      <div>
                        <p className="text-3xl font-bold" style={{ color: plan.color }}>
                          {plan.price.toLocaleString('fr-FR')}
                          <span className="text-sm font-normal text-gray-400"> FCFA</span>
                        </p>
                        <p className="text-xs text-gray-400">par mois</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-6 flex-1">
                  {features?.items.map((f, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                      <span className="text-sm text-gray-600">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isCurrent ? (
                  <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold cursor-not-allowed">
                    Plan actuel
                  </button>
                ) : plan.id === 'FREE' ? (
                  <button disabled className="w-full py-3 rounded-xl bg-gray-100 text-gray-400 font-semibold cursor-not-allowed">
                    Plan de base
                  </button>
                ) : hasStripe ? (
                  <button onClick={() => openStripe(plan.id)}
                    className="w-full py-3 rounded-xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-[0.98] shadow-sm"
                    style={{ backgroundColor: plan.color }}>
                    <Zap className="w-4 h-4" />
                    Passer au {plan.name}
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                ) : null}

                {/* Stripe security badge for paid plans */}
                {hasStripe && !isCurrent && (
                  <div className="flex items-center justify-center gap-1.5 mt-3">
                    <Shield className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400">Paiement sécurisé par Stripe</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stripe info box */}
      <div className="card bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 mb-1">Paiement 100% sécurisé via Stripe</h3>
            <p className="text-sm text-gray-600 mb-3">
              Vos paiements sont traités directement par Stripe, le leader mondial du paiement en ligne.
              Cartes bancaires, Mobile Money et bien plus selon votre pays.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, text: 'Chiffrement SSL' },
                { icon: Clock, text: 'Activation immédiate' },
                { icon: Check, text: 'Sans engagement' },
              ].map(({ icon: I, text }) => (
                <div key={text} className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 border border-indigo-100">
                  <I className="w-3.5 h-3.5 text-indigo-500" />{text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="card">
        <h3 className="font-bold text-gray-800 mb-4">Questions fréquentes</h3>
        <div className="space-y-4">
          {[
            { q: 'Quand mon plan sera-t-il activé ?', r: 'L\'activation est immédiate après confirmation du paiement Stripe. Votre boutique passe automatiquement au nouveau plan.' },
            { q: 'Puis-je annuler à tout moment ?', r: 'Oui, sans engagement. Vous pouvez annuler quand vous voulez depuis le portail Stripe ou en nous contactant.' },
            { q: 'Quels modes de paiement sont acceptés ?', r: 'Carte bancaire (Visa, Mastercard), ainsi que les modes disponibles dans votre pays via Stripe.' },
            { q: 'Mon plan ne s\'est pas activé ?', r: 'Contactez-nous sur WhatsApp avec votre capture de paiement et le nom de votre boutique.' },
          ].map(({ q, r }) => (
            <div key={q} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
              <p className="font-semibold text-gray-800 text-sm mb-1">{q}</p>
              <p className="text-gray-500 text-sm">{r}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}