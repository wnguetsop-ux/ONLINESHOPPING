'use client';
import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Crown, ExternalLink, MessageCircle, Shield, Sparkles, Wallet } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { checkShopLimits } from '@/lib/firestore';
import { PLANS, PlanId } from '@/lib/types';

const STRIPE_LINKS: Partial<Record<PlanId, string>> = {
  STARTER: process.env.NEXT_PUBLIC_STRIPE_PLAN_STARTER_URL || '',
  STANDARD: process.env.NEXT_PUBLIC_STRIPE_PLAN_STANDARD_URL || '',
  PRO: process.env.NEXT_PUBLIC_STRIPE_PLAN_PRO_URL || '',
};

const MOBILE_MONEY = {
  number: '00237 651 495 483',
  name: 'MasterShopPro',
};

export default function SubscriptionPage() {
  const { shop } = useAuth();
  const [limits, setLimits] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showManualPlan, setShowManualPlan] = useState<PlanId | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!shop?.id) return;
    checkShopLimits(shop.id)
      .then(setLimits)
      .finally(() => setLoading(false));
  }, [shop?.id]);

  const currentPlan = PLANS[shop?.planId || 'FREE'];
  const primaryColor = '#25D366';

  const paidPlans = useMemo(
    () => (Object.values(PLANS).filter((plan) => plan.id !== 'FREE') as typeof currentPlan[]),
    []
  );

  function handleCopy() {
    navigator.clipboard.writeText(MOBILE_MONEY.number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function getWhatsAppPlanMessage(planId: PlanId) {
    const plan = PLANS[planId];
    return encodeURIComponent(
      `Bonjour MasterShopPro, je veux activer le plan ${plan.name} pour la boutique ${shop?.name || ''}.\nPrix: ${plan.priceXaf.toLocaleString('fr-FR')} FCFA/mois.\nJe vais regler via Mobile Money.`
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-wa-dark mb-2">Plan actif</p>
            <h1 className="text-2xl font-black text-gray-800">{currentPlan.name}</h1>
            <p className="text-sm text-gray-500 mt-2 max-w-2xl">
              Choisis le niveau qui correspond a ton volume de messages, de commandes et d organisation au quotidien.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">Produits</p>
              <p className="font-black text-gray-800">
                {limits?.productsCount || 0}
                <span className="text-gray-400 font-medium">/{currentPlan.maxProducts === -1 ? '∞' : currentPlan.maxProducts}</span>
              </p>
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-bold mb-1">Commandes/mois</p>
              <p className="font-black text-gray-800">
                {limits?.ordersThisMonth || 0}
                <span className="text-gray-400 font-medium">/{currentPlan.maxOrdersPerMonth === -1 ? '∞' : currentPlan.maxOrdersPerMonth}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-4 md:grid-cols-2 gap-4">
        {Object.values(PLANS).map((plan) => {
          const isCurrent = currentPlan.id === plan.id;
          const stripeLink = STRIPE_LINKS[plan.id];

          return (
            <div
              key={plan.id}
              className={`premium-card relative p-5 flex flex-col ${
                isCurrent
                  ? 'border-2 border-ink shadow-lg'
                  : plan.isPopular
                    ? 'border-2 border-wa-border shadow-wa'
                    : ''
              }`}
            >
              {plan.isPopular && !isCurrent && (
                <div
                  className="absolute -top-3 left-5 px-3 py-1 rounded-full text-white text-xs font-bold tracking-wide"
                  style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}
                >
                  PLUS POPULAIRE
                </div>
              )}
              {isCurrent && (
                <div className="absolute -top-3 left-5 px-3 py-1 rounded-full text-white text-xs font-bold" style={{ background: '#0B1220' }}>
                  Plan actuel
                </div>
              )}

              <div className="pt-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black mb-4" style={{ backgroundColor: plan.color }}>
                  {plan.id === 'FREE' ? 'F' : plan.id === 'STARTER' ? 'S' : plan.id === 'STANDARD' ? 'ST' : 'P'}
                </div>
                <h2 className="text-xl font-black text-gray-800">{plan.name}</h2>
                <div className="mt-3">
                  <p className="font-black" style={{ color: plan.color }}>
                    <span className="display-serif text-5xl leading-none">{plan.priceXaf.toLocaleString('fr-FR')}</span>
                    <span className="text-sm font-semibold text-gray-400"> FCFA</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">par mois</p>
                </div>
                {plan.badge && (
                  <p className="mt-3 inline-flex px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-bold">
                    {plan.badge}
                  </p>
                )}
              </div>

              <div className="mt-5 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-gray-600">
                    <Check className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: plan.color }} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-2">
                {isCurrent ? (
                  <button className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold" disabled>
                    Plan actuel
                  </button>
                ) : plan.id === 'FREE' ? (
                  <button className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold" disabled>
                    Commencer avec ce plan
                  </button>
                ) : (
                  <>
                    {stripeLink ? (
                      <a
                        href={stripeLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-3 rounded-2xl text-white font-bold flex items-center justify-center gap-2"
                        style={{ backgroundColor: plan.color }}
                      >
                        <Sparkles className="w-4 h-4" />
                        Payer par carte
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    ) : (
                      <button
                        className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 font-bold cursor-not-allowed"
                        disabled
                      >
                        Carte a configurer
                      </button>
                    )}

                    <button
                      onClick={() => setShowManualPlan(plan.id)}
                      className="w-full py-3 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-700 font-bold flex items-center justify-center gap-2"
                    >
                      <Wallet className="w-4 h-4" />
                      Payer Mobile Money
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4">
        <div className="rounded-3xl border border-gray-100 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Ce que chaque plan change</p>
          <h2 className="text-lg font-black text-gray-800 mb-4">Une progression simple selon le stade de la boutique</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              Gratuit pour demarrer et valider ton organisation sur 8 commandes.
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              Starter pour recevoir les messages dans l app et suivre les conversations simplement.
            </div>
            <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4">
              Standard pour gagner du temps avec la detection des commandes et les brouillons.
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Paiement</p>
          <h2 className="text-lg font-black text-gray-800 mb-4">Comment activer un plan sans complication</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 mt-0.5 text-emerald-600" />
              <span>Carte bancaire si le lien Stripe du plan est disponible.</span>
            </div>
            <div className="flex items-start gap-2">
              <Crown className="w-4 h-4 mt-0.5 text-wa-dark" />
              <span>Mobile Money pour un paiement rapide depuis le Cameroun.</span>
            </div>
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 mt-0.5 text-blue-500" />
              <span>Confirmation WhatsApp pour activer le bon plan sur la bonne boutique.</span>
            </div>
          </div>
        </div>
      </div>

      {showManualPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 text-white text-center">
              <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center mx-auto mb-3">
                <Wallet className="w-7 h-7" />
              </div>
              <h2 className="text-xl font-black">Paiement Mobile Money</h2>
              <p className="text-emerald-100 text-sm mt-1">
                {PLANS[showManualPlan].name} - {PLANS[showManualPlan].priceXaf.toLocaleString('fr-FR')} FCFA / mois
              </p>
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4">
                <p className="text-xs uppercase tracking-wide font-bold text-emerald-700 mb-2">Numero de paiement</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="font-black text-gray-800">{MOBILE_MONEY.number}</p>
                  <button onClick={handleCopy} className="p-2 rounded-xl bg-white border border-emerald-100">
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Nom du receveur: {MOBILE_MONEY.name}</p>
              </div>

              <div className="rounded-2xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600 leading-relaxed">
                1. Envoie le montant exact. 2. Garde le numero de transaction. 3. Confirme ensuite par WhatsApp pour activation.
              </div>

              <a
                href={`https://wa.me/237651495483?text=${getWhatsAppPlanMessage(showManualPlan)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-bold flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Confirmer via WhatsApp
              </a>

              <button
                onClick={() => setShowManualPlan(null)}
                className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
