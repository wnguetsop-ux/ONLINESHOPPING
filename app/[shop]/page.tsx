'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CheckCircle, ArrowRight, Star, MessageCircle, X, Zap, Play, Wifi, WifiOff } from 'lucide-react';
import { trackVisit } from '@/lib/analytics';

// ── Config ───────────────────────────────────────────────────────────────────
const APP_URL     = 'https://mastershoppro.com/register';
const APK_URL     = 'https://mastershoppro.com/mastershop.apk'; // remplace par ton vrai lien APK
const DEMO_URL    = '/demo';
const WHATSAPP    = '393299639430';
const EMAIL       = 'wnguetsop@gmail.com';
const YT_ID       = 'YDzR6rBbxkM';

// ── Video modal ───────────────────────────────────────────────────────────────
function VideoModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}>
      <div className="relative w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white flex items-center gap-1.5 text-sm">
          <X className="w-4 h-4" /> Fermer
        </button>
        {/* Vertical short — proper 9:16 ratio */}
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-2xl"
          style={{ paddingTop: '177.78%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
            title="Mastershop démonstration"
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
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    trackVisit({ page: 'landing' });
    // Pulse animation stops after 5s for perf
    const t = setTimeout(() => setPulse(false), 8000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}

      {/* ═══════════════════════════════════════════════════════
          HEADER — minimal, dark
      ═══════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-[#0f0f0f]/95 backdrop-blur border-b border-white/5"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center font-black text-black text-sm">M</div>
            <span className="font-extrabold text-white tracking-tight">Mastershop</span>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/login" className="text-sm text-white/50 hover:text-white px-3 py-1.5 transition-colors hidden sm:block">
              Connexion
            </Link>
            <a href={DEMO_URL}
              className="text-sm font-semibold text-black bg-white px-4 py-2 rounded-xl hover:bg-white/90 transition-colors">
              Tester sans compte
            </a>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
          HERO — tout en haut, tout de suite
      ═══════════════════════════════════════════════════════ */}
      <section className="relative px-4 pt-10 pb-12 md:pt-16 md:pb-20 overflow-hidden">
        {/* Background grid subtle */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)', backgroundSize: '48px 48px' }} />

        <div className="relative max-w-2xl mx-auto text-center">

          {/* Country badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-white/10">
            🌍 Dakar · Abidjan · Douala · Bamako
          </div>

          {/* Headline — exact wording requested */}
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-[1.1] tracking-tight mb-4">
            Gérez votre boutique sur téléphone et suivez vos bénéfices en{' '}
            <span className="text-green-400">FCFA automatiquement</span>
          </h1>

          <p className="text-white/60 text-lg mb-8 leading-relaxed">
            Ventes, stock, commandes, reçus — tout depuis votre téléphone.
            Pas de formation. Pas de matériel. Juste votre téléphone.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
            {[
              { icon: <WifiOff className="w-3.5 h-3.5" />, label: 'Fonctionne sans connexion' },
              { icon: <Zap className="w-3.5 h-3.5" />, label: 'Léger pour votre téléphone' },
              { icon: <CheckCircle className="w-3.5 h-3.5" />, label: '100% gratuit pour démarrer' },
            ].map((b, i) => (
              <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 text-white/70 text-xs font-medium px-3 py-1.5 rounded-full">
                <span className="text-green-400">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>

          {/* ★★★ THE MAIN DOWNLOAD BUTTON ★★★ */}
          <a href={APK_URL}
            className={`
              group relative inline-flex items-center justify-center gap-3
              w-full sm:w-auto
              bg-green-500 hover:bg-green-400
              text-black font-extrabold text-xl
              px-10 py-5 rounded-2xl
              shadow-[0_0_40px_rgba(34,197,94,0.5)]
              hover:shadow-[0_0_60px_rgba(34,197,94,0.7)]
              transition-all duration-300
              ${pulse ? 'animate-pulse' : ''}
            `}
            style={pulse ? { animation: 'apk-pulse 1.5s ease-in-out infinite' } : {}}>
            <span className="text-2xl">📲</span>
            <div className="text-left">
              <div className="text-[11px] font-semibold text-black/60 leading-none mb-0.5 uppercase tracking-wide">Télécharger l'application</div>
              <div className="leading-none">ANDROID APK</div>
            </div>
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
          </a>
          <p className="text-white/30 text-xs mt-3">Fichier APK · Android 6.0+ · Gratuit</p>

          {/* Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <a href={DEMO_URL}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm px-6 py-3 rounded-xl transition-all">
              <Play className="w-4 h-4 text-green-400" />
              Tester sans compte
            </a>
            <button onClick={() => setShowVideo(true)}
              className="flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium px-4 py-3 transition-colors">
              <div className="w-7 h-7 rounded-full border border-white/20 flex items-center justify-center">
                <Play className="w-3 h-3 fill-white ml-0.5" />
              </div>
              Voir la vidéo démo
            </button>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          VIDÉO — inline autoplay muted, dans cadre téléphone
      ═══════════════════════════════════════════════════════ */}
      <section className="px-4 pb-16">
        <div className="max-w-xs mx-auto">
          {/* Phone frame */}
          <div className="relative bg-[#1a1a1a] rounded-[2.8rem] p-2.5 shadow-2xl border border-white/10">
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-5 bg-black rounded-full z-10" />
            <div className="relative rounded-[2.3rem] overflow-hidden bg-black" style={{ aspectRatio: '9/16' }}>
              {/* Autoplay muted loop — navigateurs l'autorisent */}
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_ID}&rel=0&modestbranding=1&controls=0&playsinline=1&enablejsapi=1`}
                title="Mastershop démo"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                style={{ pointerEvents: 'none' }}
              />
              {/* Tap overlay pour ouvrir avec son */}
              <button onClick={() => setShowVideo(true)}
                className="absolute inset-0 flex items-end justify-center pb-5 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10">
                <span className="flex items-center gap-2 bg-white/90 text-black text-xs font-bold px-4 py-2 rounded-full">
                  <Play className="w-3.5 h-3.5 fill-black" />
                  Voir avec le son
                </span>
              </button>
            </div>
          </div>
          <p className="text-center text-white/30 text-xs mt-4">
            Vidéo muette · Tapez pour activer le son
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FEATURES — 6 points essentiels, rapide à lire
      ═══════════════════════════════════════════════════════ */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-8">
            Tout ce qu'il vous faut, rien de plus
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '🤖', title: 'IA catalogue', desc: 'Photo → produit ajouté en 3 secondes' },
              { emoji: '📷', title: 'Scanner codes-barres', desc: 'Avec la caméra de votre téléphone' },
              { emoji: '🖨️', title: 'Reçus thermiques', desc: 'Bluetooth ou envoi WhatsApp' },
              { emoji: '📊', title: 'Bénéfices en temps réel', desc: 'Ventes, dépenses, marges en FCFA' },
              { emoji: '🌐', title: 'Boutique en ligne', desc: 'Lien à partager sur WhatsApp' },
              { emoji: '📵', title: 'Hors connexion', desc: 'Fonctionne sans internet' },
            ].map((f, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-2xl p-4 hover:bg-white/8 transition-colors">
                <span className="text-2xl">{f.emoji}</span>
                <p className="font-bold text-white text-sm mt-2">{f.title}</p>
                <p className="text-white/40 text-xs mt-1">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          SOCIAL PROOF — 3 avis courts, percutants
      ═══════════════════════════════════════════════════════ */}
      <section className="px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl font-extrabold text-center mb-6">Ce qu'ils disent</h2>
          <div className="space-y-3">
            {[
              { avatar: '👩🏾', name: 'Aminata K.', ville: 'Dakar', text: 'Je vois mes bénéfices en FCFA en temps réel. Avant je calculais à la main le soir !' },
              { avatar: '👨🏿', name: 'Jean-Paul M.', ville: 'Abidjan', text: 'Le scanner code-barres avec mon téléphone m\'a sauvé. Mes clients croient que j\'ai une vraie caisse !' },
              { avatar: '👩🏾‍💼', name: 'Fatou D.', ville: 'Douala', text: 'Fonctionne même quand le réseau est coupé. Pour moi c\'est le plus important.' },
            ].map((t, i) => (
              <div key={i} className="bg-white/5 border border-white/8 rounded-2xl p-4 flex gap-3">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-xl flex-shrink-0">{t.avatar}</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-white text-sm">{t.name}</p>
                    <span className="text-white/30 text-xs">{t.ville}</span>
                    <div className="flex gap-0.5 ml-auto">
                      {[1,2,3,4,5].map(j => <Star key={j} className="w-3 h-3 fill-amber-400 text-amber-400" />)}
                    </div>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed">"{t.text}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          TARIFS — simple, direct
      ═══════════════════════════════════════════════════════ */}
      <section className="px-4 pb-16" id="pricing">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-extrabold text-center mb-2">Tarifs</h2>
          <p className="text-white/40 text-center text-sm mb-8">Commencez gratuitement. Payez quand vous grandissez.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { nom: 'Gratuit', prix: '0', unite: 'F', features: ['20 produits', '50 commandes/mois', 'Boutique en ligne'], cta: 'Commencer', url: APK_URL, style: 'border-white/10 bg-white/5' },
              { nom: 'Starter', prix: '1 500', unite: 'F/mois', features: ['50 produits', '100 commandes/mois', 'Support prioritaire'], cta: 'Choisir Starter', url: `https://wa.me/${WHATSAPP}?text=Je veux Starter Mastershop`, style: 'border-green-500/50 bg-green-500/10', badge: '⭐ Populaire' },
              { nom: 'Pro', prix: '2 500', unite: 'F/mois', features: ['Illimité', 'Multi-boutiques', 'Support 24/7'], cta: 'Contacter', url: `https://wa.me/${WHATSAPP}?text=Je veux le plan Pro Mastershop`, style: 'border-white/10 bg-white/5' },
            ].map((p, i) => (
              <div key={i} className={`relative border rounded-2xl p-5 ${p.style}`}>
                {p.badge && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-xs font-extrabold px-3 py-1 rounded-full">{p.badge}</span>
                )}
                <p className="font-extrabold text-white mb-1">{p.nom}</p>
                <p className="text-3xl font-extrabold text-white mb-0.5">{p.prix}<span className="text-sm font-normal text-white/40"> {p.unite}</span></p>
                <ul className="space-y-1.5 my-4">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm text-white/60">
                      <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />{f}
                    </li>
                  ))}
                </ul>
                <a href={p.url} target={p.url.startsWith('http') ? '_blank' : undefined}
                  className="block w-full text-center py-2.5 rounded-xl text-sm font-bold bg-white/10 hover:bg-white/20 text-white transition-colors">
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          CTA FINAL — gros bouton vert
      ═══════════════════════════════════════════════════════ */}
      <section className="px-4 pb-20">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold mb-4">Prêt à commencer ?</h2>
          <p className="text-white/50 mb-8">500+ commerçants utilisent déjà Mastershop à Dakar, Abidjan et Douala.</p>

          <a href={APK_URL}
            className="group inline-flex items-center gap-3 bg-green-500 hover:bg-green-400 text-black font-extrabold text-xl px-10 py-5 rounded-2xl shadow-[0_0_40px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)] transition-all duration-300 w-full sm:w-auto justify-center">
            <span className="text-2xl">📲</span>
            TÉLÉCHARGER L'APK ANDROID
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </a>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-5">
            <a href={DEMO_URL}
              className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
              <Play className="w-4 h-4" />Tester sans compte d'abord
            </a>
            <a href={`https://wa.me/${WHATSAPP}?text=Bonjour, je veux essayer Mastershop`} target="_blank"
              className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm transition-colors">
              <MessageCircle className="w-4 h-4" />Recevoir le lien par WhatsApp
            </a>
          </div>

          <p className="text-white/20 text-xs mt-6">✓ Gratuit · ✓ Sans carte · ✓ Android 6.0+ · ✓ mastershoppro.com</p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════ */}
      <footer className="border-t border-white/5 px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-green-500 rounded-lg flex items-center justify-center font-black text-black text-xs">M</div>
            <span className="font-bold text-white/60">Mastershop</span>
          </div>
          <p>© {new Date().getFullYear()} Mastershop · mastershoppro.com</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <a href={`mailto:${EMAIL}`} className="hover:text-white transition-colors">Contact</a>
            <a href={APK_URL} className="text-green-400 font-semibold hover:text-green-300">📲 APK</a>
          </div>
        </div>
      </footer>

      {/* ═══════════════════════════════════════════════════════
          BARRE MOBILE STICKY BAS — toujours visible
      ═══════════════════════════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[#0f0f0f]/97 border-t border-white/10 px-4 py-3 flex items-center gap-3"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <a href={DEMO_URL}
          className="flex-1 text-center py-3 rounded-xl border border-white/20 text-white font-semibold text-sm hover:bg-white/5 transition-colors">
          Tester d'abord
        </a>
        <a href={APK_URL}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black font-extrabold text-sm py-3 rounded-xl transition-colors">
          📲 Télécharger APK
        </a>
      </div>

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes apk-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(34,197,94,0.5); }
          50%       { box-shadow: 0 0 70px rgba(34,197,94,0.9); }
        }
      `}</style>
    </div>
  );
}