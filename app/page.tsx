'use client';
import React, { Suspense } from 'react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { CheckCircle, ArrowRight, Star, MessageCircle, X, Play } from 'lucide-react';
import { trackVisit } from '@/lib/analytics';
import MetaPixelEvents, { trackLeadClick } from '@/components/MetaPixel';

const APP_URL  = 'https://mastershoppro.com/register';
const DEMO_URL = '/demo';
const WA_NUM   = '393299639430';
const YT_ID    = 'YDzR6rBbxkM';

function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    let v = 0;
    const step = Math.ceil(to / 60);
    const t = setInterval(() => { v = Math.min(v + step, to); setVal(v); if (v >= to) clearInterval(t); }, 25);
    return () => clearInterval(t);
  }, [to]);
  return <>{val.toLocaleString('fr-FR')}{suffix}</>;
}

function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-1.5 text-sm font-semibold">
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

function HomePageContent() {
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => { trackVisit({ page: 'landing' }); }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans','Nunito',system-ui,sans-serif" }}>
      <Suspense fallback={null}>
        <MetaPixelEvents />
      </Suspense>
      {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-base"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>M</div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">Mastershop</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-500">
            <a href="#fonctionnalites" className="hover:text-gray-900 transition-colors">Fonctionnalites</a>
            <a href="#tarifs" className="hover:text-gray-900 transition-colors">Tarifs</a>
            <a href={DEMO_URL} className="hover:text-gray-900 transition-colors">Demo</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden md:block text-sm font-semibold text-gray-500 hover:text-gray-900 px-3 py-2">
              Connexion
            </Link>
            <a href={APP_URL} target="_blank" onClick={trackLeadClick}
              className="font-extrabold text-white text-sm px-5 py-2.5 rounded-xl shadow-lg hover:scale-105 transition-transform"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              Commencer gratuitement
            </a>
          </div>
        </div>
      </header>

      {/* BANDEAU URGENCE */}
      <div className="bg-emerald-600 text-white text-center text-xs font-bold py-2 px-4">
        500+ commercants actifs - Afrique &amp; Diaspora (Europe, Canada, USA) - Inscription 100% GRATUITE
      </div>

      {/* HERO */}
      <section className="px-6 pt-12 pb-10" style={{ background: 'linear-gradient(180deg,#fff7ed 0%,#fff 100%)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 w-full text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1.5 rounded-full mb-5">
                <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                Gestion de boutique mobile - 21 pays africains
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight mb-4">
                Gerez vos ventes<br />et benefices<br />
                <span style={{ color: '#ea580c' }}>en FCFA automatiquement</span>
              </h1>
              <p className="text-base lg:text-lg text-gray-500 mb-7 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Votre telephone devient une vraie caisse enregistreuse.
                Stock, commandes, recus &mdash; <strong className="text-gray-700">tout en 1 application.</strong>
              </p>
              <button onClick={() => setShowVideo(true)}
                className="group relative w-full overflow-hidden rounded-2xl mb-3 max-w-md mx-auto lg:mx-0 block"
                style={{ background: 'linear-gradient(135deg,#f97316,#dc2626)', boxShadow: '0 8px 32px rgba(249,115,22,0.55)' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.22) 50%,transparent 65%)' }} />
                <div className="flex items-center gap-4 px-6 py-5">
                  <div className="relative flex-shrink-0">
                    <div className="absolute inset-0 rounded-xl bg-white/25 animate-ping" />
                    <div className="relative w-14 h-14 bg-white rounded-xl flex items-center justify-center shadow">
                      <Play className="w-7 h-7 fill-orange-600 text-orange-600 ml-0.5" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-orange-100 text-xs font-bold uppercase tracking-wider">30 secondes pour comprendre</p>
                    <p className="text-white font-extrabold text-xl leading-tight">Voir comment ca marche</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-white/80 group-hover:translate-x-1 transition-transform" />
                </div>
                <div className="bg-black/25 px-6 py-2 flex justify-center gap-4 border-t border-white/10 text-xs text-white/70 font-semibold">
                  <span>Video gratuite</span><span>|</span><span>Sans compte</span><span>|</span><span>Demarre maintenant</span>
                </div>
              </button>
              <a href={APP_URL} target="_blank" onClick={trackLeadClick}
                className="group relative w-full flex items-center gap-4 rounded-2xl overflow-hidden mb-5 max-w-md mx-auto lg:mx-0"
                style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 6px 28px rgba(22,163,74,0.5)', padding: '18px 24px' }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: 'linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.18) 50%,transparent 65%)' }} />
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center border border-white/30 flex-shrink-0 text-2xl">
                  🛍️
                </div>
                <div className="flex-1 text-left">
                  <p className="text-green-200 text-xs font-bold uppercase tracking-wider">Gratuit · Aucune carte bancaire</p>
                  <p className="text-white text-lg font-extrabold leading-tight">Commencer maintenant</p>
                </div>
                <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform flex-shrink-0" />
              </a>
              <div className="flex flex-wrap justify-center lg:justify-start gap-2">
                {['Sans internet', 'Leger sur telephone', '100% securise', 'Gratuit pour demarrer'].map((b, i) => (
                  <span key={i} className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-full">
                    ✓ {b}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex-shrink-0 flex flex-col items-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-[3rem] blur-3xl opacity-40 scale-110 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg,#fb923c 40%,#34d399 100%)' }} />
                <div className="relative rounded-[2.8rem] shadow-2xl border-[6px] border-gray-800 bg-gray-900"
                  style={{ width: 240 }}>
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-black rounded-full z-20" />
                  <div className="absolute -right-2.5 top-20 w-1.5 h-8 bg-gray-600 rounded-r" />
                  <div className="absolute -left-2.5 top-16 w-1.5 h-6 bg-gray-600 rounded-l" />
                  <div className="absolute -left-2.5 top-28 w-1.5 h-6 bg-gray-600 rounded-l" />
                  <div className="relative overflow-hidden bg-black" style={{ borderRadius: '2.3rem', aspectRatio: '9/16' }}>
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&rel=0&playsinline=1&loop=1&playlist=${YT_ID}&controls=0&modestbranding=1`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      style={{ pointerEvents: 'none' }}
                    />
                    <button onClick={() => setShowVideo(true)}
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-white/95 rounded-full pl-2 pr-3 py-1.5 shadow-lg hover:scale-105 transition-transform whitespace-nowrap">
                      <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Play className="w-2.5 h-2.5 text-white fill-white ml-px" />
                      </div>
                      <span className="text-xs font-extrabold text-gray-800">Voir avec son</span>
                    </button>
                  </div>
                </div>
                <p className="text-center text-gray-400 text-xs mt-3 font-semibold">Votre boutique en action</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }} className="py-8">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-white">
          {[
            { to: 500,   suffix: '+', label: 'Boutiques actives' },
            { to: 21,    suffix: '',  label: 'Pays africains' },
            { to: 50000, suffix: '+', label: 'Ventes traitees' },
            { to: 99,    suffix: '%', label: 'Clients satisfaits' },
          ].map((s, i) => (
            <div key={i} className="bg-white/10 rounded-2xl py-4 px-3">
              <p className="text-3xl font-extrabold"><Counter to={s.to} suffix={s.suffix} /></p>
              <p className="text-orange-100 text-xs font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PROBLEMES / SOLUTIONS */}
      <section className="py-14 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-bold text-orange-500 uppercase tracking-widest mb-1">Reconnaissez-vous ces problemes ?</p>
          <h2 className="text-center text-2xl lg:text-3xl font-extrabold text-gray-900 mb-8">Mastershop les resout tous</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { pain: 'Vous ne savez jamais combien vous avez vraiment gagne', fix: 'Benefice net calcule automatiquement en FCFA apres chaque vente' },
              { pain: 'Vous perdez du temps a chercher les prix et le stock', fix: "Photographiez un produit — l'IA remplit tout en 3 secondes" },
              { pain: 'Vos clients attendent trop longtemps a la caisse', fix: 'Scanner + Mobile Money = encaissement en 10 secondes' },
              { pain: 'Vous manquez de stock sans vous en rendre compte', fix: 'Alerte automatique quand le stock passe sous le minimum' },
              { pain: 'Pas de recu = clients qui contestent vos prix', fix: 'Recu thermique Bluetooth ou envoye par WhatsApp instantanement' },
              { pain: 'Pas de visibilite sur vos meilleurs produits', fix: 'Tableau de bord avec top produits, marges et CA en temps reel' },
            ].map((item, i) => (
              <div key={i} className="rounded-2xl p-4 border border-gray-100 bg-gray-50">
                <p className="text-gray-400 text-sm mb-2 flex gap-2">
                  <span className="flex-shrink-0">❌</span><span>{item.pain}</span>
                </p>
                <p className="text-sm font-bold flex gap-2" style={{ color: '#15803d' }}>
                  <span className="flex-shrink-0">✅</span><span>{item.fix}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DEMO CTA */}
      <section className="py-12 px-6" style={{ background: '#fffbeb' }}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-xl lg:text-2xl font-extrabold text-gray-900 mb-1">Pas encore convaincu ?</p>
            <p className="text-lg font-extrabold mb-3" style={{ color: '#ea580c' }}>Testez avant d&apos;en avoir besoin</p>
            <p className="text-gray-500 text-sm mb-5 max-w-md">Ajoutez des produits avec l&apos;IA, faites des ventes fictives, imprimez des recus. Sans creer de compte.</p>
            <a href={DEMO_URL}
              className="inline-flex items-center gap-2 bg-white border-2 font-bold text-sm px-6 py-3.5 rounded-2xl hover:scale-105 transition-all shadow"
              style={{ borderColor: '#f97316', color: '#ea580c' }}>
              <span className="text-lg">🎮</span>
              Essayer la demo interactive
              <ArrowRight className="w-4 h-4" />
            </a>
            <p className="text-gray-400 text-xs mt-2">Aucun compte · Donnees fictives · IA incluse</p>
          </div>
          <div className="flex-shrink-0 grid grid-cols-2 gap-3 w-full max-w-xs lg:max-w-sm">
            {[
              { emoji: '🤖', title: 'IA incluse', desc: 'Ajout produit en 3s par photo' },
              { emoji: '📊', title: 'Stats live', desc: 'CA et benefices en temps reel' },
              { emoji: '💸', title: 'Mobile Money', desc: 'Orange, Wave, MTN, Airtel' },
              { emoji: '🧾', title: 'Recus auto', desc: 'Bluetooth ou WhatsApp' },
            ].map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-3.5 border border-orange-100 shadow-sm text-center">
                <span className="text-2xl block mb-1">{f.emoji}</span>
                <p className="font-extrabold text-gray-900 text-xs">{f.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FONCTIONNALITES */}
      <section className="py-14 px-6 bg-white" id="fonctionnalites">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl lg:text-3xl font-extrabold text-gray-900 mb-1">Tout ce dont vous avez besoin</h2>
          <p className="text-center text-gray-400 text-sm mb-8">Aucune formation. Operationnel en 5 minutes.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { emoji: '🤖', bg: '#fef3c7', bd: '#fde68a', title: 'IA photo produit', desc: "L'IA remplit nom, prix, categorie en 3s" },
              { emoji: '📱', bg: '#dbeafe', bd: '#bfdbfe', title: 'Scanner codes-barres', desc: 'Camera de votre telephone Android' },
              { emoji: '💸', bg: '#dcfce7', bd: '#bbf7d0', title: 'Mobile Money', desc: 'Orange, Wave, MTN, Airtel' },
              { emoji: '🧾', bg: '#ffe4e6', bd: '#fecdd3', title: 'Recus thermiques', desc: 'Bluetooth ou WhatsApp' },
              { emoji: '📊', bg: '#f3e8ff', bd: '#e9d5ff', title: 'Benefices temps reel', desc: 'CA, marges, top produits' },
              { emoji: '📶', bg: '#fff7ed', bd: '#fed7aa', title: 'Hors connexion', desc: 'Marche sans internet ou en 2G' },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl p-4 border-2 hover:scale-[1.03] transition-transform text-center"
                style={{ background: f.bg, borderColor: f.bd }}>
                <span className="text-3xl block mb-2">{f.emoji}</span>
                <p className="font-extrabold text-gray-900 text-xs mb-1">{f.title}</p>
                <p className="text-gray-500 text-xs leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TEMOIGNAGES */}
      <section className="py-14 px-6" style={{ background: 'linear-gradient(160deg,#f0fdf4,#fffbeb)' }}>
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl lg:text-3xl font-extrabold text-gray-900 mb-8">Ils gerent leur boutique avec Mastershop</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { avatar: '👩🏾', name: 'Aminata K.', info: 'Tissus · Dakar', text: "Avant je calculais mes benefices a la main. Maintenant je vois tout en temps reel. +30% de benefices !" },
              { avatar: '👨🏿', name: 'Jean-Paul M.', info: "Epicerie · Abidjan", text: "Le scanner avec mon telephone m'a change la vie. Mes clients croient que j'ai une vraie caisse pro !" },
              { avatar: '👩🏽', name: 'Fatou D.', info: "Cosmetiques · Douala", text: "Ca marche meme quand le reseau est coupe. Quand internet revient, tout se synchronise." },
              { avatar: '👨🏾', name: 'Moussa T.', info: "Telephonie · Bamako", text: "J'ai 3 vendeurs avec chacun son acces. Je vois toutes les ventes depuis mon telephone." },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {[1,2,3,4,5].map(j => <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">&quot;{t.text}&quot;</p>
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{t.avatar}</span>
                  <div>
                    <p className="font-extrabold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.info}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="py-14 px-6 bg-white" id="tarifs">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-2xl lg:text-3xl font-extrabold text-gray-900 mb-1">Tarifs simples</h2>
          <p className="text-center text-gray-400 text-sm mb-8">Commencez gratuitement. Payez si vous grandissez.</p>
          <div className="grid md:grid-cols-3 gap-5 max-w-3xl mx-auto">
            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
              <p className="font-extrabold text-gray-700 text-lg mb-0.5">Gratuit</p>
              <p className="text-4xl font-extrabold text-gray-900 mb-1">0 F</p>
              <p className="text-gray-400 text-xs mb-4">Pour commencer</p>
              <ul className="space-y-2 mb-5">
                {['20 produits max', '50 commandes/mois', 'Boutique en ligne', 'Recus WhatsApp'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href={APP_URL} target="_blank" className="block w-full text-center font-bold py-3 rounded-xl text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                Commencer gratuitement
              </a>
            </div>
            <div className="relative rounded-2xl border-2 border-orange-400 p-6" style={{ background: 'linear-gradient(160deg,#fff7ed,#fff)' }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-white text-xs font-extrabold px-4 py-1 rounded-full whitespace-nowrap"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                ⭐ LE PLUS CHOISI
              </div>
              <p className="font-extrabold text-gray-800 text-lg mt-1 mb-0.5">Starter</p>
              <p className="text-4xl font-extrabold text-gray-900">1 500 F <span className="text-sm font-semibold text-gray-400">/mois</span></p>
              <p className="text-gray-400 text-xs mb-4">Pour les boutiques actives</p>
              <ul className="space-y-2 mb-5">
                {['50 produits', '100 commandes/mois', 'Scanner code-barres', 'Rapports avances', 'Support prioritaire'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href={`https://wa.me/${WA_NUM}?text=Je veux le plan Starter Mastershop`} target="_blank"
                className="block w-full text-center font-extrabold py-3 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>
                Choisir Starter
              </a>
            </div>
            <div className="rounded-2xl border-2 border-gray-200 bg-gray-50 p-6">
              <p className="font-extrabold text-gray-700 text-lg mb-0.5">Pro</p>
              <p className="text-4xl font-extrabold text-gray-900">2 500 F <span className="text-sm font-semibold text-gray-400">/mois</span></p>
              <p className="text-gray-400 text-xs mb-4">Pour les grandes boutiques</p>
              <ul className="space-y-2 mb-5">
                {['Produits illimites', 'Commandes illimitees', 'Multi-boutiques', 'API acces', 'Support 24/7'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href={`https://wa.me/${WA_NUM}?text=Je veux le plan Pro Mastershop`} target="_blank"
                className="block w-full text-center font-bold py-3 rounded-xl text-sm bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="py-16 px-6" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-3">Pret a commencer ?</p>
            <h2 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3">
              Creez votre boutique<br />en moins de 5 minutes
            </h2>
            <p className="text-green-200 text-base leading-relaxed">
              Installez l&apos;application · Ajoutez vos produits avec l&apos;IA · Vendez depuis votre telephone
            </p>
          </div>
          <div className="flex-shrink-0 w-full max-w-sm">
            <a href={APP_URL} target="_blank" onClick={trackLeadClick}
              className="flex items-center justify-center gap-2 bg-white font-extrabold text-base py-4 rounded-2xl w-full hover:scale-105 transition-all shadow-2xl mb-3"
              style={{ color: '#15803d' }}>
              🛍️ Inscription gratuite
            </a>
            <a href={`https://wa.me/${WA_NUM}?text=Bonjour, je veux essayer Mastershop`} target="_blank"
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold text-sm py-3.5 rounded-2xl w-full mb-3 transition-colors border border-white/20">
              <MessageCircle className="w-4 h-4" />
              Recevoir le lien sur WhatsApp
            </a>
            <a href={DEMO_URL} className="flex items-center justify-center gap-2 text-green-300 hover:text-white text-sm font-semibold transition-colors">
              <Play className="w-3.5 h-3.5" />
              Tester la demo sans compte d&apos;abord
            </a>
            <p className="text-green-300/60 text-xs mt-4 text-center">Gratuit · Sans carte · 21 pays africains · mastershoppro.com</p>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section className="py-12 px-6 bg-white border-t border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="font-extrabold text-gray-900 text-xl mb-1">Une question ? On repond en moins de 2h</h3>
          <p className="text-gray-400 text-sm mb-7">Support 7j/7</p>
          <div className="grid grid-cols-3 gap-4 max-w-xl mx-auto">
            {[
              { emoji: '💬', label: 'WhatsApp', val: '+39 329 963 9430', href: `https://wa.me/${WA_NUM}`, bg: '#f0fdf4', bd: '#86efac' },
              { emoji: '📧', label: 'Email', val: 'wnguetsop@gmail.com', href: 'mailto:wnguetsop@gmail.com', bg: '#fff7ed', bd: '#fdba74' },
              { emoji: '📱', label: 'Mobile Money', val: '+237 651 495 483', href: '#', bg: '#eff6ff', bd: '#93c5fd' },
            ].map((c, i) => (
              <a key={i} href={c.href} target="_blank"
                className="rounded-2xl p-4 flex flex-col items-center gap-1.5 border-2 hover:scale-105 transition-transform"
                style={{ background: c.bg, borderColor: c.bd }}>
                <span className="text-2xl">{c.emoji}</span>
                <p className="font-extrabold text-gray-900 text-sm">{c.label}</p>
                <p className="text-gray-400 text-xs break-all text-center leading-tight">{c.val}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-gray-500 py-6 px-6 text-center text-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg flex items-center justify-center font-black text-white text-xs"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>M</div>
            <span className="font-bold text-white">Mastershop</span>
          </div>
          <p className="mb-3">{new Date().getFullYear()} Mastershop · mastershoppro.com</p>
          <div className="flex items-center justify-center gap-6">
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <a href={DEMO_URL} className="hover:text-white transition-colors">Demo</a>
            <a href={APP_URL} target="_blank" className="text-orange-400 font-bold hover:text-orange-300 transition-colors">S&apos;inscrire</a>
          </div>
        </div>
      </footer>

      {/* BARRE MOBILE STICKY */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-gray-200 shadow-2xl flex gap-2 px-3 py-2.5"
        style={{ paddingBottom: 'max(10px,env(safe-area-inset-bottom))' }}>
        <a href={DEMO_URL} className="flex-1 text-center font-bold text-sm py-3 rounded-xl border-2 transition-colors"
          style={{ borderColor: '#f97316', color: '#ea580c' }}>
          Demo gratuite
        </a>
        <a href={APP_URL} target="_blank" onClick={trackLeadClick}
          className="flex-1 flex items-center justify-center gap-1.5 text-white font-extrabold text-sm py-3 rounded-xl"
          style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
          🛍️ S&apos;inscrire gratuit
        </a>
      </div>
      <div className="h-16 md:hidden" />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}