'use client';
import React from 'react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { CheckCircle, ArrowRight, Star, MessageCircle, X, Play, WifiOff, Zap, Shield } from 'lucide-react';
import { trackVisit } from '@/lib/analytics';
import MetaPixelEvents, { trackLeadClick } from '@/components/MetaPixel';

const APP_URL  = 'https://mastershoppro.com/register';
const DEMO_URL = '/demo';
const WA_NUM   = '393299639430';
const YT_ID    = 'YDzR6rBbxkM';

// -- Traductions FR / EN -----------------------------------------------------
const T = {
  fr: {
    urgency: ' +500 commercants actifs - Afrique & Diaspora (Europe, Canada, USA) - Inscription 100% GRATUITE',
    login: 'Connexion', tryBtn: 'Tester', registerBtn: "S'inscrire ",
    badge: 'Commercants africains & diaspora - 21 pays + Europe & Amerique',
    h1a: 'Gerez vos ventes et suivez vos ',
    h1b: 'benefices en FCFA',
    h1c: ' automatiquement',
    sub: 'Votre telephone devient une vraie caisse enregistreuse. Stock, commandes, recus, statistiques - ',
    subBold: 'tout en 1 application.',
    trust: ['Fonctionne sans internet', 'Leger sur votre telephone', '100% securise', 'Gratuit pour demarrer'],
    cta: '\u00a0 Inscription gratuite\nCommencer maintenant',
    watchDemo: 'Voir comment ca marche',
    socialProof: 'boutiques actives',
    sectionPains: 'Reconnaissez-vous ces problemes ?',
    sectionSol: 'Mastershop les resout tous',
    demoTitle: 'Pas encore convaincu ? Testez avant de vous inscrire.',
    demoSub: 'Ajoutez des produits avec l\'IA, faites des ventes, imprimez des recus - sans creer de compte.',
    demoBtn: ' Essayer la demo interactive',
    demoNote: 'Aucun compte requis  Donnees fictives  IA incluse',
    featTitle: 'Tout ce dont vous avez besoin',
    featSub: 'Aucune formation. Operationnel en 5 minutes.',
    testiTitle: 'Ils gerent leur boutique avec Mastershop',
    pricingTitle: 'Tarifs simples',
    pricingSub: 'Commencez gratuitement. Payez uniquement si vous grandissez.',
    finalTitle: 'Creez votre boutique\nen moins de 5 minutes',
    finalSub: 'Rejoignez 500+ commercants qui gerent leur boutique depuis leur telephone.',
    finalCta: 'Inscription gratuite ',
    contactTitle: 'Une question ? On repond en moins de 2h',
    contactSub: 'Support disponible 7j/7',
    footer: ' 2026 Mastershop  mastershoppro.com',
  },
  en: {
    urgency: ' 500+ active merchants - Africa & Diaspora (Europe, Canada, USA) - 100% FREE Sign-up',
    login: 'Login', tryBtn: 'Try Demo', registerBtn: 'Sign up ',
    badge: 'African merchants & diaspora - 21 countries + Europe & America',
    h1a: 'Manage your sales and track your ',
    h1b: 'profits in FCFA',
    h1c: ' automatically',
    sub: 'Your phone becomes a real cash register. Inventory, orders, receipts, stats - ',
    subBold: 'all in 1 app.',
    trust: ['Works offline', 'Light on your phone', '100% secure', 'Free to start'],
    cta: '\u00a0 Free sign-up\nGet started now',
    watchDemo: 'See how it works',
    socialProof: 'active shops',
    sectionPains: 'Do you recognize these problems?',
    sectionSol: 'Mastershop solves them all',
    demoTitle: 'Not convinced yet? Try before signing up.',
    demoSub: 'Add products with AI, make sales, print receipts - no account needed.',
    demoBtn: ' Try the interactive demo',
    demoNote: 'No account  Fictional data  AI included',
    featTitle: 'Everything you need',
    featSub: 'No training needed. Ready in 5 minutes.',
    testiTitle: 'They manage their shop with Mastershop',
    pricingTitle: 'Simple pricing',
    pricingSub: 'Start free. Pay only when you grow.',
    finalTitle: 'Create your shop\nin under 5 minutes',
    finalSub: 'Join 500+ merchants managing their shop from their phone.',
    finalCta: ' Free sign-up ',
    contactTitle: 'Questions? We reply in under 2h',
    contactSub: 'Support available 7 days/7',
    footer: ' 2026 Mastershop  mastershoppro.com',
  },
} as const;
type Lang = keyof typeof T;

// -- Compteur anime ---------------------------------------------------------
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    let v = 0;
    const step = Math.ceil(to / 50);
    const t = setInterval(() => { v = Math.min(v + step, to); setVal(v); if (v >= to) clearInterval(t); }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <>{val.toLocaleString('fr-FR')}{suffix}</>;
}

// -- Modal video -------------------------------------------------------------
function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-1.5 text-sm">
          <X className="w-4 h-4" /> Fermer
        </button>
        <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl" style={{ paddingTop: '177.78%' }}>
          <iframe className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title="Mastershop demo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showVideo, setShowVideo] = useState(false);
  const lang = 'fr' as const;
  const t = T[lang];
  useEffect(() => { trackVisit({ page: 'landing' }); }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans','Nunito',system-ui,sans-serif" }}>
      <MetaPixelEvents />
      {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}

      {/* -- Barre urgence -- */}
      <div className="bg-emerald-600 text-white text-center text-xs font-bold py-2.5 px-4 tracking-wide">
        {t.urgency}
      </div>

      {/* -- Header -- */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-gray-100 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>M</div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">Mastershop</span>
            <span className="hidden sm:inline text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">PRO</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-gray-800 px-3 py-2">{t.login}</Link>
            <a href={APP_URL} target="_blank"
              className="text-sm font-bold text-white px-4 py-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              {t.registerBtn}
            </a>
          </div>
        </div>
      </header>

      {/* ====================================================
          HERO - CTA massif + video autoplay inline
      ==================================================== */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#fff7ed 0%,#ffffff 45%,#f0fdf4 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 -translate-y-1/3 translate-x-1/3 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#fb923c,transparent)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-15 translate-y-1/3 -translate-x-1/3 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#34d399,transparent)' }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-10">

          {/* --- Badge --- */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold px-4 py-2 rounded-full border border-orange-200">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              {t.badge}
            </div>
          </div>

          {/* --- Layout: texte + telephone cote a cote --- */}
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12 mb-10">

            {/* Colonne texte */}
            <div className="flex-1 text-center lg:text-left">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-4">
                {t.h1a}
                <span className="relative whitespace-nowrap">
                  <span className="relative z-10" style={{ color: '#ea580c' }}>{t.h1b}</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 10" preserveAspectRatio="none" style={{ height: 8 }}>
                    <path d="M0,8 Q75,2 150,6 Q225,10 300,4" stroke="#fb923c" strokeWidth="4" fill="none" strokeLinecap="round" />
                  </svg>
                </span>
                {t.h1c}
              </h1>
              <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                {t.sub}<strong>{t.subBold}</strong>
              </p>
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-8">
                {[
                  { icon: <WifiOff className="w-3.5 h-3.5" />, text: t.trust[0] },
                  { icon: <Zap className="w-3.5 h-3.5" />, text: t.trust[1] },
                  { icon: <Shield className="w-3.5 h-3.5" />, text: t.trust[2] },
                  { icon: <CheckCircle className="w-3.5 h-3.5" />, text: t.trust[3] },
                ].map((b, i) => (
                  <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                    <span className="text-emerald-600">{b.icon}</span>{b.text}
                  </div>
                ))}
              </div>

              {/* ==============================================
                  CTA PRINCIPAL - IMPOSSIBLE A RATER
              ============================================== */}
              <a href={APP_URL} target="_blank" onClick={trackLeadClick}
                className="group relative w-full flex items-center justify-between gap-4 text-white font-extrabold rounded-3xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] overflow-hidden mb-3"
                style={{
                  background: 'linear-gradient(135deg,#16a34a 0%,#15803d 100%)',
                  boxShadow: '0 8px 40px rgba(22,163,74,0.5), 0 2px 12px rgba(0,0,0,0.1)',
                  padding: '20px 28px',
                }}>
                {/* Shimmer effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.2) 50%,transparent 65%)' }} />
                {/* Icone app */}
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 border-2 border-white/30 group-hover:bg-white/30 transition-colors">
                  <span style={{ fontSize: 32 }}>🛍</span>
                </div>
                {/* Texte */}
                <div className="flex-1 text-left">
                  <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-0.5">
                    Gratuit - Aucune carte bancaire
                  </p>
                  <p className="text-white text-2xl font-extrabold leading-tight">
                    Commencer maintenant
                  </p>
                  <p className="text-green-300 text-sm font-semibold mt-0.5">
                    Inscription gratuite - 21 pays africains
                  </p>
                </div>
                <ArrowRight className="w-7 h-7 text-white group-hover:translate-x-1.5 transition-transform flex-shrink-0" />
              </a>

              {/* Social proof */}
              <div className="flex items-center justify-center lg:justify-start gap-3 text-sm text-gray-400 mb-6">
                <div className="flex -space-x-2">
                  {[0,1,2,3,4].map(i => (
                    <div key={i} className="w-7 h-7 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center text-sm">
                      {['👦','👧','👨','👩','👦'][i]}
                    </div>
                  ))}
                </div>
                <div className="flex">{[1,2,3,4,5].map(i=><Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>)}</div>
                <span><strong className="text-gray-700">500+</strong> {t.socialProof}</span>
              </div>
            </div>

            {/* --- Telephone avec video autoplay MUET --- */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-[3.5rem] blur-3xl opacity-50 scale-110 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg,#fb923c,#34d399)', animation: 'pulse 3s ease-in-out infinite' }} />
                <div className="relative rounded-[3.2rem] p-[10px] shadow-2xl border-[7px] border-gray-800 bg-gray-900" style={{ width: 230 }}>
                  {/* Encoche */}
                  <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-20" />
                  {/* Boutons cotes */}
                  <div className="absolute -right-[10px] top-24 w-[5px] h-10 bg-gray-700 rounded-r-lg" />
                  <div className="absolute -left-[10px] top-20 w-[5px] h-7 bg-gray-700 rounded-l-lg" />
                  <div className="absolute -left-[10px] top-32 w-[5px] h-7 bg-gray-700 rounded-l-lg" />
                  {/* Ecran */}
                  <div className="relative rounded-[2.5rem] overflow-hidden bg-black" style={{ aspectRatio: '9/16' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${YT_ID}&controls=0`}
                      title="Mastershop demo"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Bouton son - ouvre modal */}
                    <button onClick={() => setShowVideo(true)}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-sm rounded-full px-3 py-2 shadow-lg hover:scale-105 transition-transform">
                      <div className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <Play className="w-2.5 h-2.5 text-white fill-white ml-0.5" />
                      </div>
                      <span className="text-black text-[10px] font-extrabold whitespace-nowrap">
                        Activer le son
                      </span>
                    </button>
                  </div>
                </div>
                <p className="text-center text-gray-400 text-xs mt-3 font-semibold">
                  Votre boutique en action
                </p>
              </div>
            </div>
          </div>

          {/* ==============================================
              BOUTON "COMMENT CA MARCHE" - MASSIF - IMPOSSIBLE A IGNORER
          ============================================== */}
          <div className="flex justify-center">
            <button onClick={() => setShowVideo(true)}
              className="group relative w-full max-w-2xl overflow-hidden rounded-3xl border-4 transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg,#f97316,#ea580c)',
                borderColor: 'rgba(255,255,255,0.25)',
                boxShadow: '0 10px 50px rgba(249,115,22,0.6), 0 2px 16px rgba(0,0,0,0.15)',
              }}>
              {/* Shimmer au hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none"
                style={{ background: 'linear-gradient(105deg,transparent 30%,rgba(255,255,255,0.3) 50%,transparent 70%)' }} />

              {/* Contenu principal du bouton */}
              <div className="relative flex items-center gap-5 px-8 py-6">
                {/* Icone Play enorme */}
                <div className="flex-shrink-0 relative">
                  {/* Cercle pulsant */}
                  <div className="absolute inset-0 rounded-2xl bg-white/30 animate-ping" />
                  <div className="relative w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                    <Play className="w-9 h-9 fill-orange-600 text-orange-600 ml-1" />
                  </div>
                </div>
                {/* Texte */}
                <div className="flex-1 text-left">
                  <p className="text-orange-100 text-xs font-bold uppercase tracking-widest mb-1">
                    30 secondes pour tout comprendre
                  </p>
                  <p className="text-white font-extrabold leading-tight" style={{ fontSize: 26 }}>
                    {t.watchDemo}
                  </p>
                  <p className="text-orange-200 text-sm mt-1 font-semibold">
                    Voir comment ca marche en video
                  </p>
                </div>
                {/* Fleche */}
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center border-2 border-white/30 group-hover:translate-x-1 transition-transform">
                  <ArrowRight className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Barre info bas du bouton */}
              <div className="relative bg-black/25 px-8 py-2.5 flex items-center justify-center gap-5 border-t border-white/10">
                <span className="text-white/80 text-xs font-semibold">
                  Video gratuite
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/80 text-xs font-semibold">
                  Aucun compte requis
                </span>
                <span className="text-white/30">|</span>
                <span className="text-white/80 text-xs font-semibold">
                  Demarre immediatement
                </span>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* ====================================================
          STATS - orange vif
      ==================================================== */}
      <section style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }} className="py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { to:500, suffix:'+', label:'Boutiques actives' },
            { to:21,  suffix:'',  label:'Pays africains' },
            { to:50000, suffix:'+', label:'Ventes traitees' },
            { to:99, suffix:'%', label:'Clients satisfaits' },
          ].map((s,i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-extrabold"><Counter to={s.to} suffix={s.suffix} /></p>
              <p className="text-orange-100 text-sm font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ====================================================
          DOULEURS  SOLUTIONS
      ==================================================== */}
      <section className="py-14 bg-white px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-orange-600 font-bold text-sm uppercase tracking-widest mb-2">Reconnaissez-vous ces problemes ?</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Mastershop les resout tous</h2>
          </div>
          <div className="space-y-3">
            {[
              { pain:' Vous ne savez jamais combien vous avez vraiment gagne', fix:' Benefice net calcule automatiquement en FCFA apres chaque vente' },
              { pain:' Vous perdez du temps a chercher les prix et le stock', fix:" Photographiez un produit - l'IA remplit tout en 3 secondes" },
              { pain:' Vos clients attendent trop longtemps a la caisse', fix:' Scanner code-barres + encaissement Mobile Money en 10 secondes' },
              { pain:' Vous manquez de stock sans vous en rendre compte', fix:' Alerte automatique quand le stock est bas' },
              { pain:' Pas de recu = clients qui contestent', fix:' Recu thermique Bluetooth ou envoye par WhatsApp immediatement' },
            ].map((item,i) => (
              <div key={i} className="rounded-2xl p-5 border border-gray-100 bg-gray-50 hover:border-orange-200 transition-colors">
                <p className="text-gray-500 text-sm mb-1.5">{item.pain}</p>
                <p className="font-bold text-sm" style={{ color:'#15803d' }}>{item.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          DEMO CTA intermediaire
      ==================================================== */}
      <section className="py-12 px-4" style={{ background:'#fffbeb' }}>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-2xl font-extrabold text-gray-900 mb-3">
            Pas encore convaincu ?{' '}
            <span style={{ color:'#ea580c' }}>Testez avant de vous inscrire.</span>
          </p>
          <p className="text-gray-600 mb-6">Ajoutez des produits avec l'IA, faites des ventes, imprimez des recus - sans creer de compte.</p>
          <a href={DEMO_URL}
            className="inline-flex items-center gap-3 bg-white border-2 font-bold text-lg px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-md"
            style={{ borderColor:'#f97316', color:'#ea580c' }}>
            <span className="text-2xl"></span> Essayer la demo interactive <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-gray-400 text-xs mt-3">Aucun compte requis  Donnees fictives  IA incluse</p>
        </div>
      </section>

      {/* ====================================================
          FONCTIONNALITES
      ==================================================== */}
      <section className="py-14 bg-white px-4" id="features">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 mt-2">Aucune formation. Operationnel en 5 minutes.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { emoji:'', bg:'#fef3c7', border:'#fde68a', title:"IA photo  produit", desc:"Photographiez, l'IA remplit nom, prix et categorie en 3 secondes" },
              { emoji:'', bg:'#dbeafe', border:'#bfdbfe', title:'Scanner codes-barres', desc:'Avec la camera de votre telephone Android' },
              { emoji:'', bg:'#dcfce7', border:'#bbf7d0', title:'Mobile Money', desc:'Orange Money, MTN MoMo, Wave, Airtel Money' },
              { emoji:'', bg:'#ffe4e6', border:'#fecdd3', title:'Recus thermiques', desc:'Imprimante Bluetooth ou envoi WhatsApp instantane' },
              { emoji:'', bg:'#f3e8ff', border:'#e9d5ff', title:'Benefices en temps reel', desc:'CA, marges, top produits - tout en FCFA automatiquement' },
              { emoji:'', bg:'#fff7ed', border:'#fed7aa', title:'Hors connexion', desc:'Fonctionne meme sans internet ou en 2G' },
            ].map((f,i) => (
              <div key={i} className="rounded-2xl p-5 border-2 hover:scale-[1.02] transition-transform"
                style={{ background:f.bg, borderColor:f.border }}>
                <span className="text-3xl block mb-3">{f.emoji}</span>
                <p className="font-extrabold text-gray-900 text-sm mb-1">{f.title}</p>
                <p className="text-gray-600 text-xs leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          TEMOIGNAGES
      ==================================================== */}
      <section className="py-14 px-4" style={{ background:'linear-gradient(160deg,#f0fdf4,#fffbeb)' }} id="testimonials">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Ils gerent leur boutique avec Mastershop</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { avatar:'', name:'Aminata K.', ville:'Dakar, Senegal', metier:'Boutique de tissus',
                text:"Avant je calculais mes benefices a la main chaque soir. Maintenant je vois tout en temps reel. Mes benefices ont augmente de 30% !" },
              { avatar:'', name:'Jean-Paul M.', ville:'Abidjan, Cote d\'Ivoire', metier:'Epicerie',
                text:"Le scanner code-barres avec mon telephone m'a sauve. Mes clients croient que j'ai une vraie caisse professionnelle. Ils sont epates !" },
              { avatar:'', name:'Fatou D.', ville:'Douala, Cameroun', metier:'Cosmetiques',
                text:"a marche meme quand le reseau est coupe. C'est le plus important pour moi. Quand internet revient, tout se synchronise automatiquement." },
              { avatar:'', name:'Moussa T.', ville:'Bamako, Mali', metier:'Telephonie',
                text:"J'ai 3 vendeurs et chacun a son acces. Je vois toutes les ventes depuis mon telephone. Support WhatsApp repond en moins de 2h." },
            ].map((t,i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(j=><Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400"/>)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-xl">{t.avatar}</div>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.metier}  {t.ville}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          DIASPORA SECTION
      ==================================================== */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(160deg, #1e1b4b 0%, #312e81 50%, #1e3a5f 100%)' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white text-xs font-bold px-4 py-2 rounded-full mb-5">
               Pour la diaspora africaine - Europe &amp; Amerique
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
              Vous vivez a <span style={{ color: '#fbbf24' }}>Paris, Bruxelles, Montreal</span><br/>
              et gerez un business <span style={{ color: '#34d399' }}>au pays ?</span>
            </h2>
            <p className="text-indigo-200 mt-4 text-base max-w-xl mx-auto">
              Controlez votre boutique a Dakar, Abidjan ou Douala depuis votre telephone - en temps reel, partout dans le monde.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mb-10">
            {[
              { flag:'', route:'Paris  Dakar', emoji:'', title:'Revendeur de vetements',
                desc:'Vous importez depuis l\'Europe, votre associe vend au Senegal. Chaque vente s\'affiche sur votre telephone en France.' },
              { flag:'', route:'Montreal  Abidjan', emoji:'', title:'Business cosmetiques',
                desc:'Votre sur gere la boutique en Cote d\'Ivoire. Vous voyez le stock, les benefices et les commandes depuis le Canada.' },
              { flag:'', route:'Bruxelles  Douala', emoji:'', title:'Import telephones',
                desc:'Vous achetez en Europe, revendez au Cameroun. Mastershop gere l\'inventaire et les prix des deux cotes.' },
            ].map((item, i) => (
              <div key={i} className="bg-white/10 border border-white/20 rounded-3xl p-5 hover:bg-white/15 transition-colors">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <span className="text-2xl">{item.flag}</span>
                  <span className="text-white/40 text-sm font-bold">{item.route}</span>
                </div>
                <div className="text-3xl mb-2">{item.emoji}</div>
                <p className="font-extrabold text-white text-sm mb-2">{item.title}</p>
                <p className="text-indigo-200 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/10 border border-white/20 rounded-3xl p-6 mb-8">
            <p className="font-extrabold text-white text-sm mb-4 text-center"> Mastershop est concu pour la diaspora</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon:'', text:'Surveillez votre boutique en temps reel depuis n\'importe quel pays' },
                { icon:'', text:'Benefices en FCFA - vous savez exactement ce que ca rapporte' },
                { icon:'', text:'Votre equipe au pays a son acces - vous gardez le controle total' },
                { icon:'', text:'Interface ultra-simple - votre famille vend sans formation' },
                { icon:'', text:'Boutique en ligne partageable sur WhatsApp, Facebook, Instagram' },
                { icon:'', text:'Fonctionne hors connexion - zero vente perdue si reseau coupe' },
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{f.icon}</span>
                  <p className="text-indigo-100 text-sm leading-snug">{f.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-indigo-300 text-sm mb-5">Des centaines de membres de la diaspora gerent deja leur business au pays avec Mastershop</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={APP_URL} target="_blank"
                className="inline-flex items-center justify-center gap-2 font-extrabold px-8 py-4 rounded-2xl text-base shadow-xl hover:scale-105 transition-transform"
                style={{ background:'linear-gradient(135deg,#16a34a,#15803d)', color:'#fff' }}>
                 Creer ma boutique gratuitement
              </a>
              <a href={`https://wa.me/${WA_NUM}?text=${encodeURIComponent('Bonjour, je suis de la diaspora et je veux gerer mon business au pays avec Mastershop')}`}
                target="_blank"
                className="inline-flex items-center justify-center gap-2 font-bold px-8 py-4 rounded-2xl text-base border-2 border-white/30 text-white hover:bg-white/10 transition-colors">
                 Parler a un conseiller
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================
          TARIFS
      ==================================================== */}
      <section className="py-14 bg-white px-4" id="pricing">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Tarifs simples</h2>
            <p className="text-gray-500 mt-2">Commencez gratuitement. Payez uniquement si vous grandissez.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { nom:'Gratuit', prix:'0 F', detail:'Pour debuter',
                features:['20 produits max','50 commandes/mois','Boutique en ligne','Recus WhatsApp'],
                cta:'Commencer gratuitement', url:APP_URL, primary:false },
              { nom:'Starter', prix:'1 500 F', detail:'/mois - le plus choisi',
                features:['50 produits','100 commandes/mois','Scanner code-barres','Rapports avances','Support prioritaire'],
                cta:'Choisir Starter', url:`https://wa.me/${WA_NUM}?text=Je veux le plan Starter Mastershop`,
                primary:true, badge:' POPULAIRE' },
              { nom:'Pro', prix:'2 500 F', detail:'/mois',
                features:['Produits illimites','Commandes illimitees','Multi-boutiques','API acces','Support 24/7'],
                cta:'Nous contacter', url:`https://wa.me/${WA_NUM}?text=Je veux le plan Pro Mastershop`, primary:false },
            ].map((p,i) => (
              <div key={i} className={`relative rounded-3xl p-6 border-2 flex flex-col ${p.primary ? 'border-orange-400 shadow-xl' : 'border-gray-100 bg-gray-50'}`}
                style={p.primary ? { background:'linear-gradient(160deg,#fff7ed,#ffffff)' } : {}}>
                {(p as any).badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-extrabold px-4 py-1.5 rounded-full"
                    style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>{(p as any).badge}</div>
                )}
                <p className="font-extrabold text-gray-900 text-lg">{p.nom}</p>
                <p className="text-3xl font-extrabold text-gray-900 mt-1">{p.prix}</p>
                <p className="text-gray-400 text-xs mb-5">{p.detail}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {p.features.map((f,j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-gray-700">
                      <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color:'#16a34a' }}/>{f}
                    </li>
                  ))}
                </ul>
                <a href={p.url} target="_blank"
                  className="block w-full text-center font-extrabold py-3.5 rounded-2xl transition-all text-sm"
                  style={p.primary
                    ? { background:'linear-gradient(135deg,#f97316,#ea580c)', color:'#fff' }
                    : { background:'#f3f4f6', color:'#374151' }}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====================================================
          CTA FINAL - vert fort
      ==================================================== */}
      <section className="py-16 px-4" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-green-200 font-bold text-sm uppercase tracking-widest mb-3">Pret a commencer ?</p>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Creez votre boutique<br />en moins de 5 minutes
          </h2>
          <p className="text-green-200 mb-8 text-lg">Rejoignez 500+ commercants qui gerent leur boutique depuis leur telephone.</p>
          <a href={APP_URL} target="_blank"
            className="group inline-flex items-center gap-3 bg-white font-extrabold text-xl px-10 py-5 rounded-2xl hover:scale-105 transition-all duration-200 shadow-2xl w-full sm:w-auto justify-center mb-4"
            style={{ color:'#15803d' }}>
            <span className="text-2xl"></span>
            Inscription gratuite 
          </a>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-2">
            <a href={`https://wa.me/${WA_NUM}?text=Bonjour, je veux essayer Mastershop`} target="_blank"
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors">
              <MessageCircle className="w-5 h-5" /> Recevoir le lien sur WhatsApp
            </a>
            <a href={DEMO_URL} className="flex items-center gap-2 text-green-200 hover:text-white text-sm font-semibold transition-colors">
              <Play className="w-4 h-4" /> Tester sans compte d'abord
            </a>
          </div>
          <p className="text-green-300 text-xs mt-6"> Gratuit   Sans carte bancaire   21 pays africains   mastershoppro.com</p>
        </div>
      </section>

      {/* -- Contact -- */}
      <section className="py-12 bg-white px-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-extrabold text-gray-900 text-xl mb-2">Une question ? On repond en moins de 2h</h3>
          <p className="text-gray-500 text-sm mb-7">Support disponible 7j/7</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji:'', label:'WhatsApp', val:'+39 329 963 9430', href:`https://wa.me/${WA_NUM}`, bg:'#dcfce7', border:'#86efac' },
              { emoji:'', label:'Email', val:'wnguetsop@gmail.com', href:'mailto:wnguetsop@gmail.com', bg:'#fff7ed', border:'#fdba74' },
              { emoji:'', label:'Mobile Money', val:'+237 651 495 483', href:'#', bg:'#dbeafe', border:'#93c5fd' },
            ].map((c,i) => (
              <a key={i} href={c.href} target="_blank"
                className="rounded-2xl p-5 flex flex-col items-center gap-2 border-2 hover:scale-105 transition-transform"
                style={{ background:c.bg, borderColor:c.border }}>
                <span className="text-3xl">{c.emoji}</span>
                <p className="font-extrabold text-gray-900">{c.label}</p>
                <p className="text-gray-500 text-xs">{c.val}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* -- Footer -- */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-sm"
              style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>M</div>
            <span className="font-bold text-white">Mastershop</span>
          </div>
          <p> {new Date().getFullYear()} Mastershop  mastershoppro.com</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <a href={DEMO_URL} className="hover:text-white transition-colors">Demo</a>
            <a href={APP_URL} target="_blank" className="text-orange-400 font-bold hover:text-orange-300"> S'inscrire</a>
          </div>
        </div>
      </footer>

      {/* -- Barre mobile sticky -- */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t-2 border-gray-100 shadow-2xl px-3 py-3 flex items-center gap-2"
        style={{ paddingBottom:'max(12px,env(safe-area-inset-bottom))' }}>
        <a href={DEMO_URL}
          className="flex-1 text-center font-bold text-sm py-3 rounded-xl border-2 transition-colors"
          style={{ borderColor:'#f97316', color:'#ea580c' }}>
          Tester d'abord
        </a>
        <a href={APP_URL} target="_blank" onClick={trackLeadClick}
          className="flex-1 flex items-center justify-center gap-1.5 text-white font-extrabold text-sm py-3 rounded-xl"
          style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
           S'inscrire gratuit
        </a>
      </div>
    </div>
  );
}