'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Check, X, Sparkles, Crown, ShoppingBag,
  ArrowRight, ChevronDown, ShieldCheck, Zap, Camera, FileText,
} from 'lucide-react';
import { PLANS, AI_CREDIT_COSTS } from '@/lib/types';

const SIGNUP_URL = '/register';

// ─── Coûts IA par action ───────────────────────────────────────────────────────
const ACTION_COSTS = [
  { icon: Camera,    label: 'Analyse photo produit',     desc: 'IA remplit la fiche automatiquement',           credits: AI_CREDIT_COSTS.analysePhoto,  color: '#2563eb' },
  { icon: Sparkles,  label: 'Photo Pro IA (OpenAI)',      desc: 'Génère une photo studio professionnelle',       credits: AI_CREDIT_COSTS.photoProIA,    color: '#7c3aed' },
  { icon: FileText,  label: 'Brochure IA',                desc: 'Texte + visuel de vente prêt à partager',       credits: AI_CREDIT_COSTS.brochureIA,    color: '#1FB955' },
  { icon: Zap,       label: 'Quick Sell (tout en 1)',     desc: 'Analyse + brochure en un seul flux express',    credits: AI_CREDIT_COSTS.quickSell,     color: '#FF6A2C' },
];

// ─── Données par pack ──────────────────────────────────────────────────────────
const PACK_VALUE: Record<string, {
  icon: React.ReactNode;
  tagline: string;
  forWho: string;
  valueProof: string;
  highlight: string;
  cta: string;
  badge?: string;
  mobileMoneyOk: boolean;
}> = {
  FREE: {
    icon: <ShoppingBag className="h-6 w-6" />,
    tagline: '5 crédits offerts',
    forWho: 'Pour découvrir l\'IA sans risque à l\'inscription',
    valueProof: '5 crédits = 5 analyses produit, ou 1 photo pro IA, ou 5 brochures. Gratuit pour toujours.',
    highlight: 'Sans carte bancaire',
    cta: 'Commencer gratuitement',
    mobileMoneyOk: false,
  },
  STARTER: {
    icon: <Camera className="h-6 w-6" />,
    tagline: 'Pack 50 crédits',
    forWho: 'Pour le vendeur qui teste l\'IA régulièrement',
    valueProof: '1 500 FCFA = 30 FCFA/crédit. Idéal pour ~25 photos pro ou ~50 fiches produit.',
    highlight: '30 FCFA / crédit',
    cta: 'Acheter Pack 50',
    mobileMoneyOk: true,
  },
  STANDARD: {
    icon: <Sparkles className="h-6 w-6" />,
    tagline: 'Pack 200 crédits',
    forWho: 'Pour le commerçant actif avec 20–100 produits',
    valueProof: '5 000 FCFA = 25 FCFA/crédit. Le meilleur rapport : ~100 photos pro ou ~200 brochures.',
    highlight: '25 FCFA / crédit',
    cta: 'Acheter Pack 200',
    badge: '⭐ Meilleur rapport',
    mobileMoneyOk: true,
  },
  PRO: {
    icon: <Crown className="h-6 w-6" />,
    tagline: 'Pack 500 crédits',
    forWho: 'Pour le gros vendeur ou une boutique avec plusieurs produits',
    valueProof: '10 000 FCFA = 20 FCFA/crédit. ~250 photos pro ou ~500 fiches produit en un seul achat.',
    highlight: '20 FCFA / crédit',
    cta: 'Acheter Pack 500',
    mobileMoneyOk: true,
  },
};

const FEATURES_TABLE = [
  { label: 'Crédits inclus',              FREE: '10 offerts',    STARTER: '50',          STANDARD: '200',          PRO: '500',           section: 'Crédits' },
  { label: 'Prix par crédit',             FREE: '—',             STARTER: '30 FCFA',     STANDARD: '25 FCFA',      PRO: '20 FCFA',       section: 'Crédits' },
  { label: 'Analyse photo (1 crédit)',    FREE: true,            STARTER: true,          STANDARD: true,           PRO: true,            section: 'IA' },
  { label: 'Photo Pro IA (3 crédits)',    FREE: true,            STARTER: true,          STANDARD: true,           PRO: true,            section: 'IA' },
  { label: 'Brochure IA (1 crédit)',      FREE: true,            STARTER: true,          STANDARD: true,           PRO: true,            section: 'IA' },
  { label: 'Quick Sell (3 crédits)',      FREE: true,            STARTER: true,          STANDARD: true,           PRO: true,            section: 'IA' },
  { label: 'Produits illimités',          FREE: true,            STARTER: true,          STANDARD: true,           PRO: true,            section: 'Boutique' },
  { label: 'Commandes illimitées',        FREE: true,            STARTER: true,          STANDARD: true,           PRO: true,            section: 'Boutique' },
  { label: 'Boutique en ligne publique',  FREE: true,            STARTER: true,          STANDARD: true,           PRO: true,            section: 'Boutique' },
  { label: 'Crédits expirent ?',          FREE: 'Non',           STARTER: 'Non',         STANDARD: 'Non',          PRO: 'Non',           section: 'Crédits' },
  { label: 'Mobile Money accepté',        FREE: false,           STARTER: true,          STANDARD: true,           PRO: true,            section: 'Paiement' },
  { label: 'Support',                     FREE: 'Email',         STARTER: 'WhatsApp',    STANDARD: 'WhatsApp',     PRO: 'Prioritaire',   section: 'Support' },
];

const FAQS = [
  {
    q: 'Est-ce que les crédits expirent ?',
    a: 'Non. Les crédits que tu achètes ne s\'expirent jamais. Tu peux acheter un Pack 200 aujourd\'hui et l\'utiliser sur 6 mois. Pas de pression.',
  },
  {
    q: 'Comment payer avec Mobile Money ?',
    a: 'Wave, Orange Money, MTN MoMo — envoie le montant au numéro affiché lors du paiement, puis confirme via WhatsApp avec le numéro de transaction. Crédits ajoutés sous 1h.',
  },
  {
    q: 'À quoi ça sert concrètement 1 crédit ?',
    a: '1 crédit = 1 analyse photo IA (la fiche se remplit automatiquement) ou 1 brochure IA. 3 crédits = 1 photo produit professionnelle générée par OpenAI. 3 crédits aussi = Quick Sell (analyse + brochure express).',
  },
  {
    q: 'Puis-je acheter plusieurs packs ?',
    a: 'Oui, les crédits s\'accumulent. Si tu as 30 crédits restants et tu achètes un Pack 50, tu te retrouves avec 80 crédits. Idéal pour ne jamais tomber à zéro.',
  },
];

type PlanId = 'FREE' | 'STARTER' | 'STANDARD' | 'PRO';
const PLAN_ORDER: PlanId[] = ['FREE', 'STARTER', 'STANDARD', 'PRO'];

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* NAV */}
      <nav className="sticky top-0 z-50 border-b border-app-border bg-white/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-white shadow-wa"
                 style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>M</div>
            <span className="text-base font-extrabold tracking-tight">MasterShopPro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden text-sm font-semibold text-slate-500 hover:text-slate-900 sm:block">
              Connexion
            </Link>
            <Link href={SIGNUP_URL} className="btn-primary h-10 px-4 text-xs">
              Démarrer <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      <main>
        {/* ── HERO ── */}
        <section className="relative overflow-hidden px-5 pb-16 pt-16 text-center lg:px-8 lg:pb-20 lg:pt-20">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem]"
               style={{
                 background: `radial-gradient(60% 60% at 50% 0%, rgba(31,185,85,0.14), transparent 55%),
                              linear-gradient(180deg, #FBF7EF 0%, #FFFFFF 70%)`,
               }} />
          <div className="mx-auto max-w-3xl">
            <div className="premium-chip premium-chip-wa mx-auto w-fit">
              <span className="pulse-dot" />
              Payez l'IA que vous utilisez — pas d'abonnement mensuel
            </div>

            <h1 className="display-serif mx-auto mt-6 text-5xl leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              Des crédits en FCFA.<br />
              <em className="italic" style={{ color: '#1FB955' }}>Zéro abonnement.</em>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Chaque action IA consomme un petit nombre de crédits. Tu achètes quand tu veux,
              les crédits n'expirent jamais, et tout le reste est gratuit et illimité.
            </p>

            <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 text-[13px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-wa" />Crédits sans expiration</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-wa" />Mobile Money accepté</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-wa" />Produits & commandes illimités</span>
            </div>
          </div>
        </section>

        {/* ── COÛTS PAR ACTION ── */}
        <section className="px-5 pb-10 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 text-center">
              <span className="section-kicker justify-center">Tarif à l'usage</span>
              <h2 className="section-title mx-auto">Combien coûte chaque action IA ?</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ACTION_COSTS.map((a) => (
                <div key={a.label} className="premium-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl"
                         style={{ background: `${a.color}18`, color: a.color }}>
                      <a.icon className="h-5 w-5" />
                    </div>
                    <div className="display-serif text-3xl font-black" style={{ color: a.color }}>
                      {a.credits}
                    </div>
                  </div>
                  <p className="text-[13px] font-extrabold text-ink">{a.label}</p>
                  <p className="mt-1 text-[11.5px] text-slate-500 leading-relaxed">{a.desc}</p>
                  <p className="mt-2 text-[10.5px] font-extrabold uppercase tracking-[0.15em]" style={{ color: a.color }}>
                    {a.credits} crédit{a.credits > 1 ? 's' : ''}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PACKS ── */}
        <section className="px-5 pb-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <span className="section-kicker justify-center">Packs de crédits</span>
              <h2 className="section-title mx-auto">Plus tu achètes, moins ça coûte</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {PLAN_ORDER.map((planId) => {
                const plan = PLANS[planId];
                const val  = PACK_VALUE[planId];
                const isPopular = plan.isPopular;
                const credits = (plan as any).aiCreditsIncluded as number;

                return (
                  <div key={planId}
                       className={`premium-card relative flex flex-col overflow-hidden ${isPopular ? 'premium-glow ring-2 ring-wa/30' : ''}`}>
                    {val.badge && (
                      <div className="py-1.5 text-center text-[10.5px] font-extrabold tracking-[0.22em] uppercase text-white"
                           style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
                        {val.badge}
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl"
                             style={{ background: `${plan.color}18`, color: plan.color }}>
                          {val.icon}
                        </div>
                        <div>
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.2em]" style={{ color: plan.color }}>
                            {plan.name}
                          </p>
                          <p className="text-[12px] font-semibold text-slate-500">{val.tagline}</p>
                        </div>
                      </div>

                      <div className="mt-5 border-b border-slate-100 pb-5">
                        {plan.priceXaf === 0 ? (
                          <div>
                            <span className="display-serif text-5xl text-ink">Gratuit</span>
                            <p className="mt-1 text-[12px] font-semibold text-slate-400">5 crédits offerts</p>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-end gap-1">
                              <span className="display-serif text-5xl leading-none text-ink">
                                {plan.priceXaf.toLocaleString('fr-FR')}
                              </span>
                              <span className="mb-1 text-sm font-bold text-slate-400">FCFA</span>
                            </div>
                            <p className="mt-1 text-[12px] font-semibold text-slate-400">{credits} crédits · {val.highlight}</p>
                          </div>
                        )}
                      </div>

                      <p className="mt-4 text-[12.5px] font-semibold leading-relaxed text-slate-600">
                        {val.forWho}
                      </p>

                      <div className="mt-3 rounded-xl px-3 py-2.5"
                           style={{ background: `${plan.color}10`, borderLeft: `3px solid ${plan.color}` }}>
                        <p className="text-[11.5px] font-extrabold leading-relaxed" style={{ color: plan.color }}>
                          {val.valueProof}
                        </p>
                      </div>

                      <ul className="mt-4 flex-1 space-y-2">
                        {plan.features.slice(0, 4).map((f) => (
                          <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                            <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: plan.color }} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <div className="mt-6 space-y-2">
                        <Link href={SIGNUP_URL}
                              className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-extrabold transition hover:-translate-y-0.5 ${
                                isPopular ? 'text-white shadow-wa' : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300'
                              }`}
                              style={isPopular ? { background: 'linear-gradient(135deg,#1FB955,#0E5D32)' } : {}}>
                          {val.cta} <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                        {val.mobileMoneyOk && (
                          <p className="text-center text-[10.5px] font-semibold text-slate-400">
                            💸 Wave · Orange Money · MTN MoMo
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── ANALYSE VALEUR ── */}
        <section className="px-5 py-14 lg:px-8" style={{ background: 'var(--app-paper)' }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <span className="section-kicker justify-center">Analyse de valeur</span>
              <h2 className="section-title mx-auto">Pourquoi des crédits plutôt qu'un abonnement ?</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  emoji: '💡',
                  title: 'Payer uniquement ce qu\'on utilise',
                  body: 'Un abonnement mensuel te fait payer même les mois calmes. Avec les crédits, tu paies seulement quand l\'IA travaille pour toi.',
                  accent: '#1FB955',
                },
                {
                  emoji: '📸',
                  title: '1 photo pro = 60 FCFA maxi',
                  body: 'Avec le Pack 200, 1 photo OpenAI coûte 50 FCFA (2 × 25 FCFA). Chez un photographe à Douala, une séance photo revient à 5 000–15 000 FCFA.',
                  accent: '#7c3aed',
                },
                {
                  emoji: '🌍',
                  title: 'Calibré pour l\'Afrique',
                  body: '1 500 FCFA = moins d\'un repas. Pour 50 crédits. Un commerçant à Douala ou Dakar qui génère 10 brochures par semaine rentabilise son pack en 1 jour.',
                  accent: '#2563eb',
                },
                {
                  emoji: '🔓',
                  title: 'Crédits sans expiration',
                  body: 'Les crédits ne disparaissent pas au bout d\'un mois. Tu peux acheter un Pack 500 et l\'étaler sur plusieurs mois selon ton activité.',
                  accent: '#FF6A2C',
                },
                {
                  emoji: '📈',
                  title: 'ROI direct et mesurable',
                  body: '1 brochure IA bien faite peut générer une commande de 5 000–20 000 FCFA. Le crédit qui a généré la brochure coûtait 25 FCFA. ROI = × 200 minimum.',
                  accent: '#0E5D32',
                },
                {
                  emoji: '💳',
                  title: 'Mobile Money en priorité',
                  body: '70%+ des achats locaux passent par MTN MoMo ou Orange Money. Payer 5 000 FCFA pour 200 crédits se fait en 30 secondes depuis le téléphone.',
                  accent: '#3F7BDC',
                },
              ].map((c) => (
                <div key={c.title} className="premium-card p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{c.emoji}</span>
                    <h3 className="font-extrabold text-[14px] text-ink">{c.title}</h3>
                  </div>
                  <p className="text-[12.5px] leading-relaxed text-slate-600">{c.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TABLEAU COMPARATIF ── */}
        <section className="px-5 py-14 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <span className="section-kicker justify-center">Comparaison complète</span>
              <h2 className="section-title mx-auto">Ce que tu as dans chaque pack</h2>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-white shadow-ios">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-4 text-left text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                      Fonctionnalité
                    </th>
                    {PLAN_ORDER.map((planId) => {
                      const plan = PLANS[planId];
                      return (
                        <th key={planId} className={`px-4 py-4 text-center ${plan.isPopular ? 'bg-wa-soft' : ''}`}>
                          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em]" style={{ color: plan.color }}>
                            {plan.name}
                          </p>
                          {plan.priceXaf === 0 ? (
                            <p className="display-serif text-xl text-ink">Gratuit</p>
                          ) : (
                            <p className="display-serif text-xl text-ink">{plan.priceXaf.toLocaleString('fr-FR')} <span className="text-[11px] text-slate-400">FCFA</span></p>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {FEATURES_TABLE.map((row, i) => (
                    <tr key={row.label} className={i % 2 === 0 ? 'bg-slate-50/50' : 'bg-white'}>
                      <td className="px-5 py-3 font-semibold text-slate-700">{row.label}</td>
                      {PLAN_ORDER.map((planId) => {
                        const plan = PLANS[planId];
                        const val = (row as any)[planId];
                        return (
                          <td key={planId} className={`px-4 py-3 text-center ${plan.isPopular ? 'bg-wa-soft/30' : ''}`}>
                            {val === true ? (
                              <Check className="mx-auto h-4 w-4 text-wa" />
                            ) : val === false ? (
                              <X className="mx-auto h-4 w-4 text-slate-300" />
                            ) : (
                              <span className="font-extrabold text-ink">{val}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-5 py-14 lg:px-8" style={{ background: 'var(--app-paper)' }}>
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <span className="section-kicker justify-center">Questions fréquentes</span>
              <h2 className="section-title mx-auto">Tout ce qu'il faut savoir</h2>
            </div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={faq.q} className="premium-card overflow-hidden p-0">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
                    <span className="font-extrabold text-[15px] text-ink">{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-400 transition-transform ${openFaq === i ? 'rotate-180 text-wa' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="border-t border-slate-100 px-6 py-5 text-[13.5px] leading-relaxed text-slate-600 animate-fadeIn">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA FINAL ── */}
        <section className="relative overflow-hidden px-5 py-20 lg:px-8">
          <div className="pointer-events-none absolute inset-0" style={{ background: '#0B1220' }} />
          <div className="pointer-events-none absolute inset-0"
               style={{
                 background: `radial-gradient(circle at 88% 10%, rgba(31,185,85,0.30), transparent 50%),
                              radial-gradient(circle at 8% 92%, rgba(255,106,44,0.18), transparent 55%)`,
               }} />

          <div className="relative mx-auto max-w-2xl text-center text-white">
            <h2 className="display-serif text-4xl leading-[1.04] sm:text-5xl">
              Commence avec 5 crédits.<br />
              <em className="italic" style={{ color: '#1FB955' }}>Gratuit. Pour toujours.</em>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/70">
              Sans carte bancaire. Recharge quand tu en as besoin. Mobile Money accepté.
            </p>

            <div className="mx-auto mt-8 flex max-w-sm flex-col gap-3">
              <Link href={SIGNUP_URL} className="btn-primary px-6 py-4 text-base">
                Créer ma boutique gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/login" className="text-[13px] font-semibold text-white/50 hover:text-white/80 transition-colors">
                J'ai déjà un compte → Se connecter
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 px-5 py-6 lg:px-8" style={{ background: '#0B1220' }}>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <p className="text-[11px] font-semibold text-white/40">
            mastershoppro.com · {new Date().getFullYear()}
          </p>
          <div className="flex gap-4 text-[11px] font-semibold text-white/40">
            <Link href="/" className="hover:text-white/70 transition-colors">Accueil</Link>
            <Link href="/login" className="hover:text-white/70 transition-colors">Connexion</Link>
            <Link href={SIGNUP_URL} className="hover:text-white/70 transition-colors">Inscription</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
