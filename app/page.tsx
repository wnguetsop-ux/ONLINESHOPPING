'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageCircle, Package, ShoppingBag } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';
import { PLANS } from '@/lib/types';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mastershoppro.app';
const SIGNUP_URL = '/register';

const BENEFITS = [
  'Centraliser les demandes qui arrivent par chat',
  'Suivre paiement, statut, client et stock au meme endroit',
  'Transformer une discussion en commande sans changer WhatsApp',
];

const FAQS = [
  {
    q: 'Est-ce que MasterShopPro remplace WhatsApp ?',
    a: 'Non. WhatsApp reste le canal de vente. MasterShopPro organise les commandes, clients, paiements et suivis derriere les discussions.',
  },
  {
    q: 'Est-ce que je peux garder mon numero WhatsApp actuel ?',
    a: 'Oui, c est le parcours cible. Si Meta demande une migration du numero, l app guide le commercant au lieu de lui demander de repartir de zero.',
  },
  {
    q: 'Pourquoi utiliser MasterShopPro si WhatsApp a deja un catalogue ?',
    a: 'Le catalogue aide a montrer les produits. MasterShopPro aide a gerer ce qui vient apres : commandes, paiements, statut, stock, historique client.',
  },
];

function formatXaf(value: number) {
  return `${value.toLocaleString('fr-FR')} FCFA`;
}

export default function LandingPage() {
  const plans = [PLANS.FREE, PLANS.STARTER, PLANS.STANDARD, PLANS.PRO];

  return (
    <div className="premium-mesh min-h-screen overflow-x-hidden text-slate-900">
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-app-border bg-white/88 shadow-[0_16px_45px_rgba(15,23,42,0.05)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="premium-icon flex h-10 w-10 items-center justify-center rounded-2xl bg-wa text-white shadow-wa">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black tracking-tight">MasterShopPro</p>
              <p className="text-[11px] font-semibold text-slate-400">Back-office des ventes WhatsApp</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden text-sm font-semibold text-slate-500 transition hover:text-slate-900 sm:inline-flex">
              Connexion
            </Link>
            <Link href={SIGNUP_URL} className="btn-primary px-5 text-sm">
              Organiser mes ventes
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-28 lg:px-8 lg:pb-24 lg:pt-36">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(circle_at_top_left,rgba(37,211,102,0.18),transparent_44%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.12),transparent_38%),linear-gradient(180deg,#f8fffb_0%,#ffffff_70%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-[#128C7E]">
                  <MessageCircle className="h-4 w-4" />
                  Pensé pour les vendeurs WhatsApp
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="mt-6 max-w-3xl text-5xl font-black tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
                  WhatsApp vous aide a vendre.
                  <span className="block text-[#25D366]">MasterShopPro vous aide a gerer.</span>
                </h1>
              </Reveal>

              <Reveal delay={140}>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                  Gardez vos clients sur WhatsApp. Suivez les commandes, paiements, clients et stocks dans un tableau de bord clair.
                </p>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-8 grid gap-3 sm:grid-cols-1">
                  {BENEFITS.map((item) => (
                    <div key={item} className="premium-chip">
                      <CheckCircle2 className="h-4 w-4 text-[#25D366]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={260}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={SIGNUP_URL} className="btn-primary px-7 text-base">
                    Organiser mes ventes WhatsApp
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary px-7 text-base"
                  >
                    Telecharger sur Android
                  </a>
                </div>
              </Reveal>

              <Reveal delay={320}>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="inline-flex transition hover:-translate-y-0.5">
                    <Image
                      src="/google-play-badge.svg"
                      alt="Get it on Google Play"
                      width={180}
                      height={54}
                      className="h-[54px] w-auto"
                    />
                  </a>
                  <span className="text-sm font-semibold text-slate-500">
                    Android disponible maintenant
                  </span>
                </div>
              </Reveal>
            </div>

            <Reveal delay={180}>
              <div className="relative mx-auto max-w-2xl">
                <div className="ambient-orb ambient-orb-green" />
                <div className="ambient-orb ambient-orb-blue" />
                <div className="grid gap-5 lg:grid-cols-[1.12fr_0.88fr]">
                  <div className="media-frame media-hover overflow-hidden rounded-[32px]">
                    <Image
                      src="/generated/landing-seller-phone-1.png"
                      alt="Commercant utilisant MasterShopPro pour organiser ses ventes WhatsApp"
                      width={839}
                      height={839}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                  <div className="flex flex-col gap-5">
                    <div className="ambient-panel p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Apercu operationnel</p>
                      <h3 className="mt-1 text-lg font-black text-slate-900">Chat -> commande -> suivi</h3>
                      <div className="mt-4 media-frame media-hover overflow-hidden rounded-[24px]">
                        <Image
                          src="/generated/landing-hero-1.png"
                          alt="Inbox et commandes MasterShopPro"
                          width={833}
                          height={833}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="ambient-panel p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Votre vraie valeur</p>
                      <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
                        Vous continuez a vendre dans WhatsApp, mais vous ne perdez plus le suivi derriere chaque discussion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="section-kicker justify-center">Apres le catalogue WhatsApp</p>
                <h2 className="section-title">Le travail commence quand le client ecrit</h2>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                {
                  icon: MessageCircle,
                  title: 'Prioriser les messages',
                  text: 'Les demandes client deviennent une inbox de travail, pas un chat melange.',
                },
                {
                  icon: Package,
                  title: 'Creer une commande suivie',
                  text: 'Une discussion peut devenir une commande avec statut, paiement et notes.',
                },
                {
                  icon: CheckCircle2,
                  title: 'Garder le controle',
                  text: 'Retrouvez ce qui reste a payer, a preparer, a livrer ou a relancer.',
                },
              ].map((item, index) => (
                <Reveal key={item.title} delay={index * 80}>
                  <article className="premium-card p-6">
                    <div className="icon-shell">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-xl font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white/50 px-5 py-20 backdrop-blur lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <p className="section-kicker justify-center">Tarifs</p>
                <h2 className="section-title">Des plans simples pour gerer vos ventes</h2>
                <p className="section-copy mx-auto">
                  Commencez petit, puis ajoutez l inbox WhatsApp et les brouillons de commandes quand le volume augmente.
                </p>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 xl:grid-cols-4 md:grid-cols-2">
              {plans.map((plan, index) => (
                <Reveal key={plan.id} delay={index * 70}>
                  <article className={`premium-card relative flex h-full flex-col p-6 ${plan.id === 'STANDARD' ? 'border-[#fdba74] shadow-[0_24px_60px_rgba(234,88,12,0.16)]' : ''}`}>
                    {plan.isPopular && (
                      <div className="absolute -top-3 left-6 rounded-full bg-[#ea580c] px-4 py-1 text-xs font-black text-white shadow-lg">
                        Le plus populaire
                      </div>
                    )}
                    <p className="mt-2 text-sm font-black uppercase tracking-[0.22em]" style={{ color: plan.color }}>
                      {plan.name}
                    </p>
                    <div className="mt-3 flex items-end gap-2">
                      <span className="text-4xl font-black tracking-tight text-slate-950">{formatXaf(plan.priceXaf).replace(' FCFA', '')}</span>
                      <span className="pb-1 text-sm font-semibold text-slate-400">FCFA / mois</span>
                    </div>
                    <div className="mt-5 space-y-3 text-sm text-slate-600">
                      {plan.features.slice(0, 4).map((feature) => (
                        <div key={feature} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" style={{ color: plan.color }} />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Link href={SIGNUP_URL} className={`mt-6 inline-flex items-center justify-center rounded-2xl px-5 py-4 text-sm font-black transition ${plan.id === 'STANDARD' ? 'bg-[#ea580c] text-white hover:bg-[#c2410c]' : 'border border-slate-200 bg-white text-slate-800 hover:border-slate-300 hover:shadow-soft'}`}>
                      Choisir {plan.name}
                    </Link>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 py-20 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.82fr_1.18fr]">
            <Reveal>
              <div>
                <p className="section-kicker">FAQ courte</p>
                <h2 className="section-title">Les questions avant de connecter WhatsApp</h2>
              </div>
            </Reveal>

            <div className="space-y-4">
              {FAQS.map((item, index) => (
                <Reveal key={item.q} delay={index * 70}>
                  <details className="premium-card group overflow-hidden p-0">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-left text-base font-black text-slate-950 marker:content-none">
                      <span>{item.q}</span>
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition group-open:rotate-45 group-open:bg-[#25D366] group-open:text-white">
                        +
                      </span>
                    </summary>
                    <div className="border-t border-slate-200 px-6 py-5 text-sm leading-7 text-slate-600">
                      {item.a}
                    </div>
                  </details>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-5xl rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#111827_58%,#14532d_100%)] px-6 py-10 text-white shadow-[0_35px_80px_rgba(15,23,42,0.24)] sm:px-10 sm:py-12">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="text-3xl font-black tracking-tight sm:text-5xl">
                  Gardez WhatsApp pour vendre. Utilisez MasterShopPro pour ne plus perdre le suivi.
                </h2>
                <p className="mt-4 text-base leading-8 text-white/75">
                  Le client ecrit comme avant. Vous travaillez avec une inbox, des commandes, des paiements et un historique clair.
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href={SIGNUP_URL} className="btn bg-white px-6 py-4 text-sm font-black text-slate-900 hover:-translate-y-0.5">
                    Organiser mes ventes
                  </Link>
                  <a
                    href={PLAY_STORE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn border border-white/20 bg-white/10 px-6 py-4 text-sm font-black text-white hover:-translate-y-0.5 hover:bg-white/15"
                  >
                    Telecharger l application
                  </a>
                </div>
                <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex transition hover:-translate-y-0.5">
                  <Image
                    src="/google-play-badge.svg"
                    alt="Get it on Google Play"
                    width={180}
                    height={54}
                    className="h-[54px] w-auto"
                  />
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#25D366] text-white shadow-[0_12px_30px_rgba(37,211,102,0.24)]">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black tracking-tight">MasterShopPro</p>
              <p className="text-sm text-slate-500">WhatsApp vend. MasterShopPro organise le suivi.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-semibold text-slate-500">
            <Link href="/login" className="transition hover:text-slate-900">Connexion</Link>
            <Link href={SIGNUP_URL} className="transition hover:text-slate-900">Organiser mes ventes</Link>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-slate-900">Google Play</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
