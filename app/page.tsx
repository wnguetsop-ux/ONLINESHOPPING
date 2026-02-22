'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Store, ShoppingBag, BarChart3, Smartphone, CheckCircle, ArrowRight,
  Star, Package, CreditCard, TrendingUp, Shield, Zap, Globe,
  MessageCircle, Mail, Phone, Play, Download, ChevronDown,
  Scan, Printer, Brain, Users, X
} from 'lucide-react';
import { trackVisit } from '@/lib/analytics';

const APP_URL = 'https://mastershoppro.com/register';
const WHATSAPP       = '393299639430';
const EMAIL          = 'wnguetsop@gmail.com';

// ── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(to / 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= to) { setVal(to); clearInterval(timer); }
      else setVal(start);
    }, 24);
    return () => clearInterval(timer);
  }, [to]);
  return <>{val.toLocaleString('fr-FR')}{suffix}</>;
}

// ── Video modal ──────────────────────────────────────────────────────────────
function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}>
      <div className="relative w-full max-w-3xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-12 right-0 text-white/70 hover:text-white flex items-center gap-2 text-sm">
          <X className="w-5 h-5" />Fermer
        </button>
        {/* YouTube with sound */}
        <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl"
          style={{ paddingTop: '177.77%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src="https://www.youtube.com/embed/YDzR6rBbxkM?autoplay=1&rel=0&modestbranding=1&playsinline=1"
            title="ShopMaster démonstration"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    trackVisit({ page: 'landing' });
  }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Sora', 'Outfit', system-ui, sans-serif" }}>
      {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}

      {/* ══════════════════════════════════════════════════════════════════
          STICKY HEADER
      ══════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-100"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-sm">
              <Store className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">ShopMaster</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <a href="#demo" className="hover:text-orange-500 transition-colors">Démo</a>
            <a href="#features" className="hover:text-orange-500 transition-colors">Fonctionnalités</a>
            <a href="#pricing" className="hover:text-orange-500 transition-colors">Tarifs</a>
            <a href="#testimonials" className="hover:text-orange-500 transition-colors">Avis</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-1.5">
              Connexion
            </Link>
            {/* Header download button */}
            <a href={APP_URL} target="_blank"
              className="flex items-center gap-1.5 bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors">
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Essayer gratuitement</span>
              <span className="sm:hidden">Essayer</span>
            </a>
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════
          HERO — The #1 conversion section
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-orange-50/30 to-white pt-12 pb-20 md:pt-20 md:pb-28">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-300/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-orange-200">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            🇨🇲 Fait pour l'Afrique — 21 pays supportés
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6 max-w-4xl mx-auto">
            Gérez votre boutique
            <span className="relative inline-block mx-3">
              <span className="relative z-10 text-orange-500">depuis votre téléphone</span>
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" preserveAspectRatio="none" style={{ height: 6 }}>
                <path d="M0,6 Q100,0 200,6" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            Ventes, stock, commandes, reçus, analyses — tout en un. 
            Gratuit pour commencer. Fonctionne sur tout appareil.
          </p>

          {/* ★★★ THE BIG DOWNLOAD BUTTON ★★★ */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <a href={APP_URL} target="_blank"
              className="group relative inline-flex items-center gap-3 bg-gray-900 text-white font-bold text-lg px-8 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-105 active:scale-100 transition-all duration-200 overflow-hidden">
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              {/* Icon */}
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0">
                <Store className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <div className="text-xs text-gray-300 leading-none mb-0.5">Accéder à</div>
                <div className="text-xl font-extrabold leading-none">ShopMaster Pro</div>
              </div>
              <ArrowRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* Watch demo button */}
            <button onClick={() => setShowVideo(true)}
              className="inline-flex items-center gap-3 bg-white text-gray-900 font-semibold text-base px-6 py-5 rounded-2xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 shadow-sm">
              <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
              Voir comment ça marche
            </button>
          </div>

          {/* Trust signals under buttons */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />100% gratuit pour commencer</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />Aucune carte bancaire</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" />Fonctionne sur téléphone et PC</span>
          </div>

          {/* Phone mockup */}
          <div className="mt-16 relative max-w-sm mx-auto">
            <div className="relative bg-gray-900 rounded-[3rem] p-3 shadow-2xl mx-auto" style={{ maxWidth: 260 }}>
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
              <div className="bg-white rounded-[2.5rem] overflow-hidden" style={{ minHeight: 420 }}>
                {/* App screenshot mockup */}
                <div className="bg-orange-500 px-4 pt-10 pb-4">
                  <p className="text-orange-100 text-xs font-medium">Bonjour, Marie 👋</p>
                  <p className="text-white text-xl font-bold mt-0.5">Tableau de bord</p>
                </div>
                <div className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Ventes today', val: '85 000 F', color: 'text-green-600', bg: 'bg-green-50' },
                      { label: 'Commandes', val: '12', color: 'text-blue-600', bg: 'bg-blue-50' },
                      { label: 'Produits', val: '48', color: 'text-purple-600', bg: 'bg-purple-50' },
                      { label: 'Bénéfice', val: '32 000 F', color: 'text-orange-600', bg: 'bg-orange-50' },
                    ].map((s, i) => (
                      <div key={i} className={`${s.bg} rounded-xl p-3`}>
                        <p className="text-[10px] text-gray-500">{s.label}</p>
                        <p className={`text-sm font-bold ${s.color} mt-0.5`}>{s.val}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium">Dernières commandes</p>
                    {[
                      { name: 'Aicha D.', amount: '15 000 F', status: '✅' },
                      { name: 'Paul N.', amount: '8 500 F', status: '📦' },
                      { name: 'Fatou S.', amount: '22 000 F', status: '🚚' },
                    ].map((o, i) => (
                      <div key={i} className="flex justify-between items-center py-1.5 border-b border-gray-100 last:border-0 text-xs">
                        <span className="font-medium text-gray-700">{o.name}</span>
                        <span className="text-gray-500">{o.amount} {o.status}</span>
                      </div>
                    ))}
                  </div>
                  <button className="w-full bg-orange-500 text-white text-sm font-bold py-3 rounded-xl">
                    + Nouvelle commande
                  </button>
                </div>
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -left-8 top-24 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-gray-100">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-base">✅</div>
              <div>
                <p className="text-xs font-bold text-gray-800">Vente confirmée</p>
                <p className="text-[10px] text-gray-400">15 000 FCFA</p>
              </div>
            </div>
            <div className="absolute -right-8 top-48 bg-white rounded-2xl shadow-xl p-3 border border-gray-100">
              <div className="flex gap-0.5 mb-1">
                {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
              </div>
              <p className="text-[10px] font-semibold text-gray-800">Super app !</p>
              <p className="text-[9px] text-gray-400">— Jean-Paul K.</p>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="mt-10 flex flex-col items-center gap-1 text-gray-400 text-xs">
            <span>Découvrez tout ce que vous pouvez faire</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SOCIAL PROOF NUMBERS
      ══════════════════════════════════════════════════════════════════ */}
      <section className="bg-gray-900 py-10">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { to: 500, suffix: '+', label: 'Boutiques actives' },
            { to: 50000, suffix: '+', label: 'Ventes traitées' },
            { to: 21, suffix: '', label: 'Pays africains' },
            { to: 99, suffix: '%', label: 'Clients satisfaits' },
          ].map((s, i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-extrabold text-white tabular-nums">
                <Counter to={s.to} suffix={s.suffix} />
              </p>
              <p className="text-gray-400 text-sm mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          VIDEO DEMO SECTION
      ══════════════════════════════════════════════════════════════════ */}
      <section id="demo" className="py-20 bg-gradient-to-b from-white to-orange-50/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              <Play className="w-3.5 h-3.5" />Démonstration en vidéo
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Voyez ShopMaster en action
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              Découvrez comment gérer toute votre boutique depuis votre téléphone.
            </p>
          </div>

          {/* ── Inline autoplay video (muted) ── */}
          <div className="relative max-w-xs mx-auto">
            {/* Phone frame */}
            <div className="relative bg-gray-900 rounded-[3rem] p-2.5 shadow-2xl">
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
              <div className="relative rounded-[2.5rem] overflow-hidden bg-black" style={{ aspectRatio: '9/16' }}>
                <iframe
                  className="absolute inset-0 w-full h-full pointer-events-none"
                  src="https://www.youtube.com/embed/YDzR6rBbxkM?autoplay=1&mute=1&loop=1&playlist=YDzR6rBbxkM&rel=0&modestbranding=1&controls=0&playsinline=1"
                  title="ShopMaster démo"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
                {/* Tap to unmute overlay */}
                <button onClick={() => setShowVideo(true)}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/70 backdrop-blur text-white text-xs font-bold px-4 py-2 rounded-full border border-white/20 hover:bg-black/90 transition-all z-10">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                  Voir avec le son
                </button>
              </div>
            </div>

            {/* Floating glow */}
            <div className="absolute inset-0 -z-10 bg-orange-400/20 blur-3xl rounded-full scale-75" />
          </div>

          {/* Steps below video */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-3xl mx-auto">
            {[
              { step: '01', icon: '📦', text: 'Ajoutez vos produits en 30 sec avec l\'IA' },
              { step: '02', icon: '🛒', text: 'Créez une commande en 3 clics' },
              { step: '03', icon: '🖨️', text: 'Imprimez le reçu ou envoyez par WhatsApp' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
                <span className="text-xs font-bold text-orange-400 block mb-1">Étape {s.step}</span>
                <span className="text-2xl">{s.icon}</span>
                <p className="text-xs text-gray-600 mt-2 leading-snug">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FEATURES GRID
      ══════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Une seule app pour gérer 100% de votre commerce.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: ShoppingBag, color: 'orange', emoji: '🛒', title: 'Caisse rapide', desc: 'Créez une commande en 3 clics. Paiement Mobile Money, espèces ou carte.' },
              { icon: Brain, color: 'purple', emoji: '🤖', title: 'IA intégrée', desc: 'Photographiez un produit, l\'IA remplit le nom, description et prix automatiquement.' },
              { icon: Scan, color: 'blue', emoji: '📷', title: 'Scanner code-barres', desc: 'Utilisez la caméra de votre téléphone ou un scanner USB professionnel.' },
              { icon: Printer, color: 'green', emoji: '🖨️', title: 'Reçus thermiques', desc: 'Imprimez des reçus professionnels sur imprimante Bluetooth ou partagez par WhatsApp.' },
              { icon: BarChart3, color: 'teal', emoji: '📊', title: 'Statistiques live', desc: 'Ventes, bénéfices, top produits — mis à jour en temps réel depuis n\'importe où.' },
              { icon: Package, color: 'amber', emoji: '📦', title: 'Gestion stock', desc: 'Alertes stock faible automatiques. Jamais en rupture au mauvais moment.' },
              { icon: Globe, color: 'indigo', emoji: '🌍', title: 'Boutique en ligne', desc: 'Vos clients commandent sur votre page publique et reçoivent une confirmation WhatsApp.' },
              { icon: Users, color: 'pink', emoji: '👥', title: 'Multi-utilisateurs', desc: 'Ajoutez des vendeurs avec leurs propres accès. Gérez les permissions.' },
              { icon: Shield, color: 'slate', emoji: '🔒', title: 'Données sécurisées', desc: 'Sauvegarde cloud automatique. Vos données ne disparaissent jamais.' },
            ].map((f, i) => (
              <div key={i}
                className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-orange-200 hover:shadow-lg transition-all duration-200">
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════════════════════════════════ */}
      <section id="testimonials" className="py-20 bg-gray-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">Ce que disent nos clients</h2>
            <div className="flex items-center justify-center gap-1 mb-2">
              {[1,2,3,4,5].map(i => <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />)}
            </div>
            <p className="text-gray-500">4.8/5 · Plus de 200 avis</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                name: 'Marie-Claire A.',
                role: 'Boutique vêtements, Douala',
                avatar: '👩🏾',
                text: 'Avant j\'avais un cahier pour noter mes ventes. Maintenant je vois tout sur mon téléphone. Mes ventes ont augmenté de 30% parce que je gère mieux mon stock !',
                stars: 5,
              },
              {
                name: 'Jean-Baptiste N.',
                role: 'Épicerie, Yaoundé',
                avatar: '👨🏾',
                text: 'Le scanner code-barres est incroyable. Je scanne et la commande est créée. Mes clients sont étonnés, ils croient que j\'ai une grosse machine de caisse !',
                stars: 5,
              },
              {
                name: 'Fatou K.',
                role: 'Cosmétiques, Dakar',
                avatar: '👩🏾‍💼',
                text: 'Les commandes en ligne c\'est ce qui m\'a le plus aidée. Mes clientes commandent sur mon lien WhatsApp et je prépare. Plus de confusion !',
                stars: 5,
              },
              {
                name: 'Rodrigue M.',
                role: 'Électronique, Abidjan',
                avatar: '👨🏿',
                text: 'J\'ai ajouté 200 produits en une heure grâce à l\'IA. Avant ça prenait des jours ! L\'application m\'a sauvé beaucoup de temps.',
                stars: 5,
              },
              {
                name: 'Aminata D.',
                role: 'Restaurant, Bamako',
                avatar: '👩🏿‍🍳',
                text: 'Je gère 3 serveurs avec ShopMaster. Chacun a son accès, je vois tout depuis mon téléphone. Le support WhatsApp répond toujours vite.',
                stars: 5,
              },
              {
                name: 'Paul T.',
                role: 'Pharmacie, Lomé',
                avatar: '👨🏾‍⚕️',
                text: 'Les alertes stock faible m\'ont évité plusieurs ruptures. Dans la pharmacie c\'est critique. Je recommande à tous mes collègues.',
                stars: 5,
              },
            ].map((t, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="flex gap-0.5 mb-3">
                  {Array(t.stars).fill(0).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-xl">{t.avatar}</div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-gray-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          PRICING
      ══════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">Tarifs simples et transparents</h2>
            <p className="text-gray-500">Commencez gratuitement. Passez au Pro quand vous êtes prêt.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Free */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8">
              <h3 className="font-bold text-gray-900 text-xl mb-1">Gratuit</h3>
              <p className="text-gray-500 text-sm mb-4">Pour démarrer</p>
              <p className="text-5xl font-extrabold text-gray-900 mb-6">0<span className="text-lg font-normal text-gray-400"> F</span></p>
              <ul className="space-y-3 mb-8">
                {['20 produits', '50 commandes/mois', '1 utilisateur', 'Boutique en ligne', 'Reçus WhatsApp'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href={APP_URL} target="_blank"
                className="block w-full py-3 text-center bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors">
                Commencer gratuitement
              </a>
            </div>

            {/* Starter — highlighted */}
            <div className="relative bg-orange-500 rounded-3xl p-8 shadow-xl shadow-orange-200">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-orange-600 text-xs font-extrabold px-4 py-1.5 rounded-full border-2 border-orange-200">
                LE PLUS POPULAIRE ⭐
              </div>
              <h3 className="font-bold text-white text-xl mb-1">Starter</h3>
              <p className="text-orange-100 text-sm mb-4">Pour les boutiques actives</p>
              <p className="text-5xl font-extrabold text-white mb-6">1 500<span className="text-lg font-normal text-orange-200"> F/mois</span></p>
              <ul className="space-y-3 mb-8">
                {['50 produits', '100 commandes/mois', '2 utilisateurs', 'Rapports avancés', 'Scanner code-barres', 'Support prioritaire'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-white">
                    <CheckCircle className="w-4 h-4 text-orange-200 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href={APP_URL} target="_blank"
                className="block w-full py-3 text-center bg-white text-orange-600 rounded-xl font-extrabold hover:bg-orange-50 transition-colors">
                Commencer maintenant
              </a>
            </div>

            {/* Pro */}
            <div className="bg-white rounded-3xl border-2 border-gray-100 p-8">
              <h3 className="font-bold text-gray-900 text-xl mb-1">Pro</h3>
              <p className="text-gray-500 text-sm mb-4">Pour les entreprises</p>
              <p className="text-5xl font-extrabold text-purple-600 mb-6">2 500<span className="text-lg font-normal text-gray-400"> F/mois</span></p>
              <ul className="space-y-3 mb-8">
                {['Produits illimités', 'Commandes illimitées', 'Utilisateurs illimités', 'Multi-boutiques', 'API accès', 'Support 24/7'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              <a href={`https://wa.me/${WHATSAPP}?text=Je veux le plan Pro ShopMaster`} target="_blank"
                className="block w-full py-3 text-center border-2 border-purple-500 text-purple-600 rounded-xl font-semibold hover:bg-purple-50 transition-colors">
                Nous contacter
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FINAL CTA — Big download banner
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-orange-400 font-semibold text-sm uppercase tracking-widest mb-4">Prêt à commencer ?</p>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
            Créez votre boutique<br />
            <span className="text-orange-400">gratuitement aujourd'hui</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Rejoignez 500+ commerçants qui gèrent leur boutique depuis leur téléphone sur mastershoppro.com
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {/* Big web app button */}
            <a href={APP_URL} target="_blank"
              className="group flex items-center gap-4 bg-white text-gray-900 font-bold text-xl px-8 py-5 rounded-2xl hover:bg-orange-50 hover:scale-105 transition-all duration-200 shadow-2xl">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <div className="text-sm text-gray-400 font-normal leading-none mb-0.5">Accéder à l'application</div>
                <div className="text-2xl font-extrabold leading-none">mastershoppro.com</div>
              </div>
              <ArrowRight className="w-6 h-6 text-orange-500 group-hover:translate-x-1 transition-transform" />
            </a>

            {/* WhatsApp alternative */}
            <a href={`https://wa.me/${WHATSAPP}?text=Bonjour, je veux essayer ShopMaster`} target="_blank"
              className="flex items-center gap-3 bg-green-500 text-white font-semibold text-base px-7 py-5 rounded-2xl hover:bg-green-600 transition-colors">
              <MessageCircle className="w-6 h-6" />
              Recevoir le lien par WhatsApp
            </a>
          </div>

          <p className="text-gray-500 text-sm mt-6">
            ✅ Gratuit · ✅ Sans carte bancaire · ✅ Disponible en 21 pays africains
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          CONTACT
      ══════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-16 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Une question ? On vous répond en moins de 2h</h2>
          <p className="text-gray-500 mb-8">Notre équipe est disponible 7j/7</p>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: MessageCircle, label: 'WhatsApp', val: '+39 329 963 9430', href: `https://wa.me/${WHATSAPP}`, bg: 'bg-green-50', color: 'text-green-600' },
              { icon: Mail, label: 'Email', val: EMAIL, href: `mailto:${EMAIL}`, bg: 'bg-orange-50', color: 'text-orange-600' },
              { icon: Phone, label: 'Mobile Money', val: '+237 651 495 483', href: '#', bg: 'bg-blue-50', color: 'text-blue-600' },
            ].map((c, i) => (
              <a key={i} href={c.href} target="_blank"
                className={`${c.bg} rounded-2xl p-6 flex flex-col items-center gap-3 hover:shadow-md transition-shadow`}>
                <c.icon className={`w-7 h-7 ${c.color}`} />
                <div>
                  <p className="font-semibold text-gray-800">{c.label}</p>
                  <p className="text-gray-500 text-sm">{c.val}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <Store className="w-4 h-4 text-white" style={{ width: 16, height: 16 }} />
            </div>
            <span className="font-bold text-white">ShopMaster</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} ShopMaster · Tous droits réservés</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <Link href="/register" className="hover:text-white transition-colors">S'inscrire</Link>
            <a href={APP_URL} target="_blank" className="text-orange-400 font-semibold hover:text-orange-300">
              → Ouvrir l'app
            </a>
          </div>
        </div>
      </footer>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE STICKY DOWNLOAD BAR (bottom)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-gray-900 border-t border-gray-700 px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <div className="flex-1">
          <p className="text-white font-bold text-sm leading-none">ShopMaster — Gratuit</p>
          <div className="flex gap-0.5 mt-1">
            {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
          </div>
        </div>
        <a href={APP_URL} target="_blank"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm px-5 py-3 rounded-xl transition-colors flex-shrink-0">
          <Zap className="w-4 h-4" />
          Essayer gratuitement
        </a>
      </div>
    </div>
  );
}