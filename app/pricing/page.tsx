'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Check, X, MessageCircle, Package, Zap, Crown, ShoppingBag,
  ArrowRight, HelpCircle, ChevronDown, ShieldCheck,
} from 'lucide-react';
import { PLANS } from '@/lib/types';

const SIGNUP_URL = '/register';

// ─── Analyse de valeur par plan (justification prix) ──────────────────────────
const PLAN_VALUE: Record<string, {
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
    tagline: 'Essayer sans risque',
    forWho: 'Pour les vendeurs qui débutent sur WhatsApp',
    valueProof: '8 commandes / mois suffisent pour valider que l\'outil fonctionne pour toi.',
    highlight: 'Gratuit pour toujours',
    cta: 'Commencer gratuitement',
    mobileMoneyOk: false,
  },
  STARTER: {
    icon: <MessageCircle className="h-6 w-6" />,
    tagline: 'WhatsApp connecté',
    forWho: 'Pour le vendeur actif avec 10–50 clients par mois',
    valueProof: '3 000 FCFA = 100 FCFA/jour. Moins qu\'un café. Ton WhatsApp directement dans l\'app.',
    highlight: '100 FCFA / jour',
    cta: 'Démarrer Starter',
    mobileMoneyOk: true,
  },
  STANDARD: {
    icon: <Zap className="h-6 w-6" />,
    tagline: 'Brochures IA + Commandes auto',
    forWho: 'Pour le vendeur sérieux avec 50–200 clients par mois',
    valueProof: '5 000 FCFA = 1 commande récupérée grâce à l\'IA paie l\'abonnement entier.',
    highlight: 'Le plus rentable',
    cta: 'Choisir Standard',
    badge: '⭐ Plus populaire',
    mobileMoneyOk: true,
  },
  PRO: {
    icon: <Crown className="h-6 w-6" />,
    tagline: 'Boutique avec équipe',
    forWho: 'Pour le commerçant qui gère plusieurs vendeurs',
    valueProof: '10 000 FCFA = 3 numéros WhatsApp + 10 collaborateurs + statistiques complètes.',
    highlight: '3 WhatsApp · 10 staff',
    cta: 'Passer en Pro',
    mobileMoneyOk: true,
  },
};

// ─── Comparaison de features ───────────────────────────────────────────────────
const FEATURES_TABLE = [
  { label: 'Produits max',           FREE: '20',           STARTER: '120',       STANDARD: '400',            PRO: 'Illimité',      section: 'Produits' },
  { label: 'Commandes/mois',         FREE: '8',            STARTER: 'Illimité',  STANDARD: 'Illimité',       PRO: 'Illimité',      section: 'Commandes' },
  { label: 'Brochures IA',           FREE: true,           STARTER: true,        STANDARD: true,             PRO: true,            section: 'Produits' },
  { label: 'Photo pro IA',           FREE: false,          STARTER: true,        STANDARD: true,             PRO: true,            section: 'Produits' },
  { label: 'Boutique en ligne',      FREE: true,           STARTER: true,        STANDARD: true,             PRO: true,            section: 'Boutique' },
  { label: 'WhatsApp connecté',      FREE: false,          STARTER: '1 numéro',  STANDARD: '1 numéro',       PRO: '3 numéros',     section: 'WhatsApp' },
  { label: 'Inbox WhatsApp',         FREE: false,          STARTER: true,        STANDARD: true,             PRO: true,            section: 'WhatsApp' },
  { label: 'Détection commande IA',  FREE: false,          STARTER: false,       STANDARD: true,             PRO: true,            section: 'WhatsApp' },
  { label: 'Brouillons commandes',   FREE: false,          STARTER: false,       STANDARD: true,             PRO: true,            section: 'Commandes' },
  { label: 'Statuts commande',       FREE: false,          STARTER: false,       STANDARD: true,             PRO: true,            section: 'Commandes' },
  { label: 'Fiche client enrichie',  FREE: false,          STARTER: false,       STANDARD: true,             PRO: true,            section: 'Clients' },
  { label: 'Multi-staff',            FREE: '1 personne',   STARTER: '1 personne',STANDARD: '2 personnes',    PRO: '10 personnes',  section: 'Équipe' },
  { label: 'Statistiques & rapports',FREE: false,          STARTER: false,       STANDARD: false,            PRO: true,            section: 'Analyse' },
  { label: 'Support',                FREE: 'Email',        STARTER: 'WhatsApp',  STANDARD: 'WhatsApp',       PRO: 'Prioritaire',   section: 'Support' },
];

const FAQS = [
  {
    q: 'Puis-je changer de plan à tout moment ?',
    a: 'Oui. Tu passes au plan supérieur quand tu veux. Le passage est immédiat après paiement. Il n\'y a pas d\'engagement minimum.',
  },
  {
    q: 'Comment payer avec Mobile Money ?',
    a: 'Wave, Orange Money, MTN MoMo — envoie le montant au numéro affiché lors du paiement, puis confirme via WhatsApp avec le numéro de transaction. Activation sous 1h.',
  },
  {
    q: 'Qu\'est-ce qui distingue Standard de Starter ?',
    a: 'Standard ajoute la détection automatique des commandes par IA : quand un client écrit "je veux 2 robes taille M", l\'app crée directement une commande brouillon. C\'est ce qui fait gagner le plus de temps.',
  },
  {
    q: 'Les 5 000 FCFA sont-ils rentables ?',
    a: '1 commande oubliée = souvent 5 000 à 20 000 FCFA perdus. Standard récupère ces commandes automatiquement. Un seul ordre sauvé par mois rembourse l\'abonnement.',
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
              Pensé pour les commerçants d'Afrique francophone
            </div>

            <h1 className="display-serif mx-auto mt-6 text-5xl leading-[1.02] tracking-[-0.04em] sm:text-6xl">
              Des prix en FCFA.<br />
              <em className="italic" style={{ color: '#1FB955' }}>Pas en dollars.</em>
            </h1>

            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
              Chaque plan est calibré pour le volume réel d'un vendeur WhatsApp en Afrique.
              Tu peux commencer gratuitement et passer au plan supérieur quand tu en as besoin.
            </p>

            <div className="mx-auto mt-6 flex flex-wrap items-center justify-center gap-3 text-[13px] font-semibold text-slate-500">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-wa" />Sans engagement</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-wa" />Mobile Money accepté</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-wa" />Activation immédiate</span>
            </div>
          </div>
        </section>

        {/* ── PLANS ── */}
        <section className="px-5 pb-16 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLAN_ORDER.map((planId) => {
              const plan = PLANS[planId];
              const val  = PLAN_VALUE[planId];
              const isPopular = plan.isPopular;

              return (
                <div key={planId}
                     className={`premium-card relative flex flex-col overflow-hidden ${isPopular ? 'premium-glow ring-2 ring-wa/30' : ''}`}>
                  {/* Badge populaire */}
                  {val.badge && (
                    <div className="py-1.5 text-center text-[10.5px] font-extrabold tracking-[0.22em] uppercase text-white"
                         style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
                      {val.badge}
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    {/* Icon + nom */}
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

                    {/* Prix */}
                    <div className="mt-5 border-b border-slate-100 pb-5">
                      {plan.priceXaf === 0 ? (
                        <div>
                          <span className="display-serif text-5xl text-ink">Gratuit</span>
                          <p className="mt-1 text-[12px] font-semibold text-slate-400">Pour toujours</p>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-end gap-1">
                            <span className="display-serif text-5xl leading-none text-ink">
                              {plan.priceXaf.toLocaleString('fr-FR')}
                            </span>
                            <span className="mb-1 text-sm font-bold text-slate-400">FCFA</span>
                          </div>
                          <p className="mt-1 text-[12px] font-semibold text-slate-400">par mois · {val.highlight}</p>
                        </div>
                      )}
                    </div>

                    {/* Pour qui */}
                    <p className="mt-4 text-[12.5px] font-semibold leading-relaxed text-slate-600">
                      {val.forWho}
                    </p>

                    {/* Preuve de valeur */}
                    <div className="mt-3 rounded-xl px-3 py-2.5"
                         style={{ background: `${plan.color}10`, borderLeft: `3px solid ${plan.color}` }}>
                      <p className="text-[11.5px] font-extrabold leading-relaxed" style={{ color: plan.color }}>
                        {val.valueProof}
                      </p>
                    </div>

                    {/* Features (top 4) */}
                    <ul className="mt-4 flex-1 space-y-2">
                      {plan.features.slice(0, 4).map((f) => (
                        <li key={f} className="flex items-start gap-2 text-[12.5px] text-slate-600">
                          <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: plan.color }} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
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
        </section>

        {/* ── ANALYSE MARCHÉ ── */}
        <section className="px-5 py-14 lg:px-8" style={{ background: 'var(--app-paper)' }}>
          <div className="mx-auto max-w-4xl">
            <div className="mb-8 text-center">
              <span className="section-kicker justify-center">Analyse de marché</span>
              <h2 className="section-title mx-auto">Pourquoi ces prix pour l'Afrique ?</h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  emoji: '📊',
                  title: '100 FCFA / jour',
                  body: 'Le plan Starter revient à 100 FCFA/jour — moins qu\'un café. Pour un vendeur WhatsApp actif, une seule commande bien gérée couvre cela.',
                  accent: '#2563eb',
                },
                {
                  emoji: '💡',
                  title: 'Standard = 1 commande retrouvée',
                  body: 'La détection IA des commandes récupère en moyenne 3–5 commandes oubliées par mois. À 5 000 FCFA moyen, c\'est 15 000–25 000 FCFA sauvés pour 5 000 FCFA d\'abonnement.',
                  accent: '#ea580c',
                },
                {
                  emoji: '🌍',
                  title: 'Calibré pour le volume réel',
                  body: 'Les limites FREE (8 cmd) et STARTER (120 produits) reflètent les volumes observés chez les vendeurs Douala, Dakar et Abidjan en phase de démarrage.',
                  accent: '#1FB955',
                },
                {
                  emoji: '💳',
                  title: 'Mobile Money en priorité',
                  body: '70%+ des transactions locales passent par MTN MoMo ou Orange Money. Stripe reste disponible pour la diaspora.',
                  accent: '#7c3aed',
                },
                {
                  emoji: '📈',
                  title: 'ROI mesurable',
                  body: 'Un vendeur qui passe FREE → Standard gagne en moyenne 2–3h/semaine sur la gestion des commandes. À 500 FCFA/h d\'opportunité manquée = 5 000–6 000 FCFA récupérés.',
                  accent: '#0E5D32',
                },
                {
                  emoji: '🔓',
                  title: 'Sans engagement = sans risque',
                  body: 'Pas de contrat, pas d\'abonnement annuel forcé. Tu paies le mois où tu en as besoin. Idéal pour les activités saisonnières.',
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
              <h2 className="section-title mx-auto">Ce que tu as dans chaque plan</h2>
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
          <div className="pointer-events-none absolute inset-0"
               style={{ background: '#0B1220' }} />
          <div className="pointer-events-none absolute inset-0"
               style={{
                 background: `radial-gradient(circle at 88% 10%, rgba(31,185,85,0.30), transparent 50%),
                              radial-gradient(circle at 8% 92%, rgba(255,106,44,0.18), transparent 55%)`,
               }} />

          <div className="relative mx-auto max-w-2xl text-center text-white">
            <h2 className="display-serif text-4xl leading-[1.04] sm:text-5xl">
              Commence gratuitement.<br />
              <em className="italic" style={{ color: '#1FB955' }}>Évolue quand tu veux.</em>
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-base text-white/70">
              Sans carte bancaire. Sans engagement. Mobile Money accepté.
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
