'use client';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';
import { CheckCircle, ArrowRight, Star, MessageCircle, X, Play, WifiOff, Zap, Shield } from 'lucide-react';
import { trackVisit } from '@/lib/analytics';
import MetaPixelEvents, { trackLeadClick } from '@/components/MetaPixel';

const APP_URL  = 'https://mastershoppro.com/register';
const DEMO_URL = '/demo';
const WA_NUM   = '393299639430';
const YT_ID    = 'YDzR6rBbxkM';

// ── Compteur animé ─────────────────────────────────────────────────────────
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

// ── Modal vidéo ─────────────────────────────────────────────────────────────
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
            title="Mastershop démo"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen />
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [showVideo, setShowVideo] = useState(false);
  useEffect(() => { trackVisit({ page: 'landing' }); }, []);

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Plus Jakarta Sans','Nunito',system-ui,sans-serif" }}>
      <MetaPixelEvents />
      {showVideo && <VideoModal onClose={() => setShowVideo(false)} />}

      {/* ── Barre urgence ── */}
      <div className="bg-emerald-600 text-white text-center text-xs font-bold py-2.5 px-4 tracking-wide">
        🔥 +500 commerçants actifs à Dakar, Abidjan, Douala — Inscription 100% GRATUITE
      </div>

      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-gray-100 shadow-sm" style={{ paddingTop: 'env(safe-area-inset-top,0px)' }}>
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-lg"
              style={{ background: 'linear-gradient(135deg,#f97316,#ea580c)' }}>M</div>
            <span className="font-extrabold text-gray-900 text-lg tracking-tight">Mastershop</span>
            <span className="hidden sm:inline text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full">PRO</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-gray-500 hover:text-gray-800 px-3 py-2">Connexion</Link>
            <a href={DEMO_URL} className="text-sm font-bold text-orange-600 border-2 border-orange-400 px-3 py-2 rounded-xl hover:bg-orange-50 transition-colors">
              Tester
            </a>
            <a href={APP_URL} target="_blank"
              className="text-sm font-bold text-white px-4 py-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
              S'inscrire →
            </a>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════
          HERO
      ════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg,#fff7ed 0%,#ffffff 55%,#f0fdf4 100%)' }}>
        {/* Déco */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-20 -translate-y-1/3 translate-x-1/3 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#fb923c,transparent)' }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15 translate-y-1/3 -translate-x-1/3 pointer-events-none"
          style={{ background: 'radial-gradient(circle,#34d399,transparent)' }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-14 md:pt-16 md:pb-20">
          <div className="max-w-2xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-bold px-4 py-2 rounded-full mb-6 border border-orange-200">
              <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
              🌍 Fait pour les commerçants africains — 21 pays
            </div>

            {/* Titre */}
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-5">
              Gérez vos ventes et suivez vos{' '}
              <span className="relative whitespace-nowrap">
                <span className="relative z-10" style={{ color: '#ea580c' }}>bénéfices en FCFA</span>
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 10" preserveAspectRatio="none" style={{ height: 8 }}>
                  <path d="M0,8 Q75,2 150,6 Q225,10 300,4" stroke="#fb923c" strokeWidth="4" fill="none" strokeLinecap="round" />
                </svg>
              </span>
              {' '}automatiquement
            </h1>

            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Votre téléphone devient une vraie caisse enregistreuse.
              Stock, commandes, reçus, statistiques — <strong>tout en 1 application.</strong>
            </p>

            {/* Badges confiance */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-9">
              {[
                { icon: <WifiOff className="w-3.5 h-3.5" />, text: 'Fonctionne sans internet' },
                { icon: <Zap className="w-3.5 h-3.5" />, text: 'Léger sur votre téléphone' },
                { icon: <Shield className="w-3.5 h-3.5" />, text: '100% sécurisé' },
                { icon: <CheckCircle className="w-3.5 h-3.5" />, text: 'Gratuit pour démarrer' },
              ].map((b, i) => (
                <div key={i} className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-600 text-xs font-semibold px-3 py-1.5 rounded-full shadow-sm">
                  <span className="text-emerald-600">{b.icon}</span>{b.text}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <a href={APP_URL} target="_blank" onClick={trackLeadClick}
                className="group w-full sm:w-auto inline-flex items-center justify-center gap-3 text-white font-extrabold text-xl px-8 py-5 rounded-2xl shadow-lg hover:shadow-2xl hover:scale-105 active:scale-100 transition-all duration-200"
                style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', boxShadow: '0 4px 24px rgba(22,163,74,0.4)' }}>
                <span className="text-2xl">📲</span>
                <div className="text-left">
                  <div className="text-xs font-semibold text-green-200 leading-none mb-0.5">Inscription gratuite</div>
                  <div className="leading-tight">Commencer maintenant</div>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <button onClick={() => setShowVideo(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white text-gray-800 font-bold text-base px-6 py-5 rounded-2xl border-2 border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all shadow-sm">
                <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Play className="w-4 h-4 text-orange-600 fill-orange-600 ml-0.5" />
                </div>
                Voir comment ça marche
              </button>
            </div>

            {/* Social proof mini */}
            <div className="flex items-center justify-center gap-3 text-sm text-gray-400">
              <div className="flex -space-x-2">
                {['👩🏾','👨🏿','👩🏾‍💼','👨🏾‍💼','👩🏿'].map((e,i) => (
                  <div key={i} className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center text-sm border-2 border-white">{e}</div>
                ))}
              </div>
              <div className="flex">{[1,2,3,4,5].map(i=><Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400"/>)}</div>
              <span><strong className="text-gray-700">500+</strong> boutiques actives</span>
            </div>
          </div>

          {/* Téléphone + vidéo */}
          <div className="mt-12 flex flex-col items-center">
            <div className="relative max-w-[220px] mx-auto">
              <div className="absolute inset-0 rounded-[3rem] opacity-25 blur-2xl scale-110 pointer-events-none"
                style={{ background: 'linear-gradient(135deg,#34d399,#fb923c)' }} />
              <div className="relative rounded-[3rem] p-[10px] shadow-2xl border-[6px] border-gray-800 bg-gray-900">
                <div className="absolute top-[10px] left-1/2 -translate-x-1/2 w-16 h-4 bg-black rounded-full z-10" />
                <div className="relative rounded-[2.2rem] overflow-hidden bg-black" style={{ aspectRatio:'9/16' }}>
                  {/* Miniature YouTube — pas d'iframe = chargement instantané */}
                  <img
                    src={`https://i.ytimg.com/vi/${YT_ID}/hqdefault.jpg`}
                    alt="Mastershop démo vidéo"
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Overlay play button */}
                  <button onClick={() => setShowVideo(true)}
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 z-10 hover:bg-black/50 transition-colors">
                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-white fill-white ml-1" />
                    </div>
                    <span className="bg-white/95 text-black text-xs font-extrabold px-4 py-2 rounded-full shadow-lg">
                      ▶ Voir la démo (30 sec)
                    </span>
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-4 text-gray-400 text-sm">↑ Votre boutique en action</p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          STATS — orange vif
      ════════════════════════════════════════════════════ */}
      <section style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }} className="py-10">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center text-white">
          {[
            { to:500, suffix:'+', label:'Boutiques actives' },
            { to:21,  suffix:'',  label:'Pays africains' },
            { to:50000, suffix:'+', label:'Ventes traitées' },
            { to:99, suffix:'%', label:'Clients satisfaits' },
          ].map((s,i) => (
            <div key={i}>
              <p className="text-3xl md:text-4xl font-extrabold"><Counter to={s.to} suffix={s.suffix} /></p>
              <p className="text-orange-100 text-sm font-semibold mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          DOULEURS → SOLUTIONS
      ════════════════════════════════════════════════════ */}
      <section className="py-14 bg-white px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-orange-600 font-bold text-sm uppercase tracking-widest mb-2">Reconnaissez-vous ces problèmes ?</p>
            <h2 className="text-3xl font-extrabold text-gray-900">Mastershop les résout tous</h2>
          </div>
          <div className="space-y-3">
            {[
              { pain:'❌ Vous ne savez jamais combien vous avez vraiment gagné', fix:'✅ Bénéfice net calculé automatiquement en FCFA après chaque vente' },
              { pain:'❌ Vous perdez du temps à chercher les prix et le stock', fix:"✅ Photographiez un produit — l'IA remplit tout en 3 secondes" },
              { pain:'❌ Vos clients attendent trop longtemps à la caisse', fix:'✅ Scanner code-barres + encaissement Mobile Money en 10 secondes' },
              { pain:'❌ Vous manquez de stock sans vous en rendre compte', fix:'✅ Alerte automatique quand le stock est bas' },
              { pain:'❌ Pas de reçu = clients qui contestent', fix:'✅ Reçu thermique Bluetooth ou envoyé par WhatsApp immédiatement' },
            ].map((item,i) => (
              <div key={i} className="rounded-2xl p-5 border border-gray-100 bg-gray-50 hover:border-orange-200 transition-colors">
                <p className="text-gray-500 text-sm mb-1.5">{item.pain}</p>
                <p className="font-bold text-sm" style={{ color:'#15803d' }}>{item.fix}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          DÉMO CTA intermédiaire
      ════════════════════════════════════════════════════ */}
      <section className="py-12 px-4" style={{ background:'#fffbeb' }}>
        <div className="max-w-xl mx-auto text-center">
          <p className="text-2xl font-extrabold text-gray-900 mb-3">
            Pas encore convaincu ?{' '}
            <span style={{ color:'#ea580c' }}>Testez avant de vous inscrire.</span>
          </p>
          <p className="text-gray-600 mb-6">Ajoutez des produits avec l'IA, faites des ventes, imprimez des reçus — sans créer de compte.</p>
          <a href={DEMO_URL}
            className="inline-flex items-center gap-3 bg-white border-2 font-bold text-lg px-8 py-4 rounded-2xl hover:scale-105 transition-all shadow-md"
            style={{ borderColor:'#f97316', color:'#ea580c' }}>
            <span className="text-2xl">🧪</span> Essayer la démo interactive <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-gray-400 text-xs mt-3">Aucun compte requis · Données fictives · IA incluse</p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          FONCTIONNALITÉS
      ════════════════════════════════════════════════════ */}
      <section className="py-14 bg-white px-4" id="features">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Tout ce dont vous avez besoin</h2>
            <p className="text-gray-500 mt-2">Aucune formation. Opérationnel en 5 minutes.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { emoji:'🤖', bg:'#fef3c7', border:'#fde68a', title:"IA photo → produit", desc:"Photographiez, l'IA remplit nom, prix et catégorie en 3 secondes" },
              { emoji:'📷', bg:'#dbeafe', border:'#bfdbfe', title:'Scanner codes-barres', desc:'Avec la caméra de votre téléphone Android' },
              { emoji:'💚', bg:'#dcfce7', border:'#bbf7d0', title:'Mobile Money', desc:'Orange Money, MTN MoMo, Wave, Airtel Money' },
              { emoji:'🖨️', bg:'#ffe4e6', border:'#fecdd3', title:'Reçus thermiques', desc:'Imprimante Bluetooth ou envoi WhatsApp instantané' },
              { emoji:'📊', bg:'#f3e8ff', border:'#e9d5ff', title:'Bénéfices en temps réel', desc:'CA, marges, top produits — tout en FCFA automatiquement' },
              { emoji:'📵', bg:'#fff7ed', border:'#fed7aa', title:'Hors connexion', desc:'Fonctionne même sans internet ou en 2G' },
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

      {/* ════════════════════════════════════════════════════
          TÉMOIGNAGES
      ════════════════════════════════════════════════════ */}
      <section className="py-14 px-4" style={{ background:'linear-gradient(160deg,#f0fdf4,#fffbeb)' }} id="testimonials">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Ils gèrent leur boutique avec Mastershop</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { avatar:'👩🏾', name:'Aminata K.', ville:'Dakar, Sénégal', metier:'Boutique de tissus',
                text:"Avant je calculais mes bénéfices à la main chaque soir. Maintenant je vois tout en temps réel. Mes bénéfices ont augmenté de 30% !" },
              { avatar:'👨🏿', name:'Jean-Paul M.', ville:'Abidjan, Côte d\'Ivoire', metier:'Épicerie',
                text:"Le scanner code-barres avec mon téléphone m'a sauvé. Mes clients croient que j'ai une vraie caisse professionnelle. Ils sont épatés !" },
              { avatar:'👩🏾‍💼', name:'Fatou D.', ville:'Douala, Cameroun', metier:'Cosmétiques',
                text:"Ça marche même quand le réseau est coupé. C'est le plus important pour moi. Quand internet revient, tout se synchronise automatiquement." },
              { avatar:'👨🏾‍💼', name:'Moussa T.', ville:'Bamako, Mali', metier:'Téléphonie',
                text:"J'ai 3 vendeurs et chacun a son accès. Je vois toutes les ventes depuis mon téléphone. Support WhatsApp répond en moins de 2h." },
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
                    <p className="text-gray-400 text-xs">{t.metier} · {t.ville}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          TARIFS
      ════════════════════════════════════════════════════ */}
      <section className="py-14 bg-white px-4" id="pricing">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900">Tarifs simples</h2>
            <p className="text-gray-500 mt-2">Commencez gratuitement. Payez uniquement si vous grandissez.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { nom:'Gratuit', prix:'0 F', detail:'Pour débuter',
                features:['20 produits max','50 commandes/mois','Boutique en ligne','Reçus WhatsApp'],
                cta:'Commencer gratuitement', url:APP_URL, primary:false },
              { nom:'Starter', prix:'1 500 F', detail:'/mois — le plus choisi',
                features:['50 produits','100 commandes/mois','Scanner code-barres','Rapports avancés','Support prioritaire'],
                cta:'Choisir Starter', url:`https://wa.me/${WA_NUM}?text=Je veux le plan Starter Mastershop`,
                primary:true, badge:'⭐ POPULAIRE' },
              { nom:'Pro', prix:'2 500 F', detail:'/mois',
                features:['Produits illimités','Commandes illimitées','Multi-boutiques','API accès','Support 24/7'],
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

      {/* ════════════════════════════════════════════════════
          CTA FINAL — vert fort
      ════════════════════════════════════════════════════ */}
      <section className="py-16 px-4" style={{ background:'linear-gradient(135deg,#16a34a,#15803d)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-green-200 font-bold text-sm uppercase tracking-widest mb-3">Prêt à commencer ?</p>
          <h2 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Créez votre boutique<br />en moins de 5 minutes
          </h2>
          <p className="text-green-200 mb-8 text-lg">Rejoignez 500+ commerçants qui gèrent leur boutique depuis leur téléphone.</p>
          <a href={APP_URL} target="_blank"
            className="group inline-flex items-center gap-3 bg-white font-extrabold text-xl px-10 py-5 rounded-2xl hover:scale-105 transition-all duration-200 shadow-2xl w-full sm:w-auto justify-center mb-4"
            style={{ color:'#15803d' }}>
            <span className="text-2xl">📲</span>
            Inscription gratuite →
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
          <p className="text-green-300 text-xs mt-6">✓ Gratuit · ✓ Sans carte bancaire · ✓ 21 pays africains · ✓ mastershoppro.com</p>
        </div>
      </section>

      {/* ── Contact ── */}
      <section className="py-12 bg-white px-4 border-t border-gray-100">
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="font-extrabold text-gray-900 text-xl mb-2">Une question ? On répond en moins de 2h</h3>
          <p className="text-gray-500 text-sm mb-7">Support disponible 7j/7</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji:'💬', label:'WhatsApp', val:'+39 329 963 9430', href:`https://wa.me/${WA_NUM}`, bg:'#dcfce7', border:'#86efac' },
              { emoji:'✉️', label:'Email', val:'wnguetsop@gmail.com', href:'mailto:wnguetsop@gmail.com', bg:'#fff7ed', border:'#fdba74' },
              { emoji:'📱', label:'Mobile Money', val:'+237 651 495 483', href:'#', bg:'#dbeafe', border:'#93c5fd' },
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

      {/* ── Footer ── */}
      <footer className="bg-gray-900 text-gray-400 py-8 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-white text-sm"
              style={{ background:'linear-gradient(135deg,#f97316,#ea580c)' }}>M</div>
            <span className="font-bold text-white">Mastershop</span>
          </div>
          <p>© {new Date().getFullYear()} Mastershop · mastershoppro.com</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <a href={DEMO_URL} className="hover:text-white transition-colors">Démo</a>
            <a href={APP_URL} target="_blank" className="text-orange-400 font-bold hover:text-orange-300">→ S'inscrire</a>
          </div>
        </div>
      </footer>

      {/* ── Barre mobile sticky ── */}
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
          📲 S'inscrire gratuit
        </a>
      </div>
    </div>
  );
}