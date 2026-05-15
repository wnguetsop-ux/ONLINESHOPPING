'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, MessageCircle, Package, ShoppingBag, FileText, Store, Sparkles } from 'lucide-react';
import Reveal from '@/components/marketing/Reveal';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.mastershoppro.app';
const SIGNUP_URL = '/register';

const BENEFITS = [
  'Photo → brochure produit prête en 8 secondes',
  'Commandes, paiements et relances centralisés',
  'Boutique en ligne à partager en 1 lien',
];

export default function LandingPage() {

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
            <Link href="/pricing" className="hidden text-sm font-semibold text-slate-500 transition hover:text-slate-900 sm:inline-flex">
              Tarifs
            </Link>
            <Link href="/login" className="hidden text-sm font-semibold text-slate-500 transition hover:text-slate-900 sm:inline-flex">
              Connexion
            </Link>
            <Link href={SIGNUP_URL} className="btn-primary px-5 text-sm">
              Créer ma boutique
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <section className="relative overflow-hidden px-5 pb-20 pt-28 lg:px-8 lg:pb-24 lg:pt-36">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem]" style={{ background: 'radial-gradient(60% 60% at 8% 10%, rgba(31,185,85,0.18), transparent 55%), linear-gradient(180deg, #FBF7EF 0%, #FFFFFF 70%)' }} />
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
            <div>
              <Reveal>
                <div className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.22em]" style={{ background: 'var(--wa-soft)', color: 'var(--wa-dark)', border: '1px solid rgba(31,185,85,0.22)' }}>
                  <MessageCircle className="h-4 w-4" />
                  Photo → Brochure → Commande → Boutique
                </div>
              </Reveal>

              <Reveal delay={80}>
                <h1 className="display-serif mt-6 max-w-3xl text-5xl tracking-[-0.05em] text-slate-950 sm:text-6xl lg:text-7xl">
                  Tu prends une photo.
                  <span className="block italic" style={{ color: '#1FB955' }}>La brochure est prête.</span>
                  Tu partages. Le client commande.
                </h1>
              </Reveal>

              <Reveal delay={140}>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl">
                  MasterShopPro génère la fiche produit, crée la brochure, suit tes commandes et publie ta boutique en ligne — tout depuis ton téléphone.
                </p>
              </Reveal>

              <Reveal delay={200}>
                <div className="mt-8 grid gap-3 sm:grid-cols-1">
                  {BENEFITS.map((item) => (
                    <div key={item} className="premium-chip">
                      <CheckCircle2 className="h-4 w-4 text-wa" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </Reveal>

              <Reveal delay={260}>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href={SIGNUP_URL} className="btn-primary px-7 text-base">
                    Créer ma boutique gratuitement
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
                <p className="section-kicker justify-center">3 outils. 1 seule app.</p>
                <h2 className="section-title">Tout ce qu'il faut pour vendre sur WhatsApp</h2>
              </div>
            </Reveal>

            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {[
                {
                  icon: Sparkles,
                  badge: '✨ IA',
                  title: 'Brochure en 1 photo',
                  text: 'Prends une photo — la fiche et la brochure sont prêtes en 8 sec. Tu colles, tu envoies.',
                  accent: '#1FB955',
                },
                {
                  icon: Package,
                  badge: '🛒 Suivi',
                  title: 'Commandes suivies',
                  text: 'Chaque commande a un statut, un paiement, un client. Relance en 1 clic.',
                  accent: '#3F7BDC',
                },
                {
                  icon: Store,
                  badge: '🔗 Boutique',
                  title: 'Boutique à partager',
                  text: 'Un lien que tu partages sur WhatsApp. Tes clients voient les produits et commandent directement.',
                  accent: '#FF6A2C',
                },
              ].map((item, index) => (
                <Reveal key={item.title} delay={index * 80}>
                  <article className="premium-card p-6">
                    <div className="flex items-center gap-3">
                      <div className="icon-shell" style={{ background: `${item.accent}18`, color: item.accent }}>
                        <item.icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-extrabold tracking-[0.18em] uppercase" style={{ color: item.accent }}>{item.badge}</span>
                    </div>
                    <h3 className="mt-4 text-xl font-black text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-600">{item.text}</p>
                  </article>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 lg:px-8">
          <Reveal>
            <div className="mx-auto max-w-5xl rounded-[36px] border border-slate-200 bg-[linear-gradient(135deg,#0f172a_0%,#111827_58%,#14532d_100%)] px-6 py-10 text-white shadow-[0_35px_80px_rgba(15,23,42,0.24)] sm:px-10 sm:py-12">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="display-serif text-3xl tracking-tight sm:text-5xl">
                  Tu vends sur WhatsApp.<br />
                  <em className="italic" style={{ color: '#1FB955' }}>On s'occupe du reste.</em>
                </h2>
                <p className="mt-4 text-base leading-8 text-white/75">
                  Brochures IA · Commandes suivies · Boutique en ligne · Relances en 1 clic
                </p>
                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href={SIGNUP_URL} className="btn bg-white px-6 py-4 text-sm font-black text-slate-900 hover:-translate-y-0.5">
                    Créer ma boutique gratuitement
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
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-wa text-white shadow-wa">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-base font-black tracking-tight">MasterShopPro</p>
              <p className="text-sm text-slate-500">Brochures IA · Commandes · Boutique en ligne</p>
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
