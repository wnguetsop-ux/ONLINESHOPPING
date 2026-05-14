'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRight, CheckCircle2, Camera, Sparkles, FileText, MessageCircle,
  Play, ShieldCheck, Zap, Image as ImageIcon, ShoppingBag, Bell,
  Users, CreditCard, Smartphone,
} from 'lucide-react';

const PLAY_URL = 'https://www.mastershoppro.com/register';
const DEMO_URL = '/demo';
const WA_NUM   = '393299639430';
const YT_ID    = 'gKLc2s5CcBU';

const BENEFITS = [
  'Photo → Fiche IA en 8 sec',
  'Brochure WhatsApp prête',
  'Commandes & relances sans désordre',
];

const FLOW_STEPS = [
  { icon: Camera,    title: 'Photo',       sub: 'Prends ton produit',           tone: 'wa' as const },
  { icon: Sparkles,  title: 'Fiche IA',    sub: 'Nom, prix, description',       tone: 'orange' as const },
  { icon: FileText,  title: 'Brochure',    sub: 'PDF + image prête à coller',   tone: 'sky' as const },
  { icon: MessageCircle, title: 'WhatsApp', sub: 'Tu partages. Client commande.', tone: 'wa' as const },
];

const PROBLEMS = [
  { pb: 'Tu notes les commandes dans un carnet ou dans ta tête', sol: 'Toutes tes commandes enregistrées, classées et suivies' },
  { pb: "Tu oublies de relancer les clients qui n'ont pas payé", sol: 'Rappel paiement WhatsApp en 1 clic — montant pré-rempli' },
  { pb: "Tu ne sais plus ce que chaque client a acheté", sol: 'Historique client complet — achats, montants, dernier contact' },
  { pb: 'Tes photos produits font amateur', sol: 'Studio Photo IA — fond pro automatique en 1 clic' },
];

const FEATURES = [
  { Icon: ShoppingBag,   title: 'Commandes WhatsApp', desc: 'Centralise, suis et confirme chaque commande' },
  { Icon: Bell,          title: 'Relances 1-clic',     desc: 'Rappel paiement, confirmation, prêt à retirer' },
  { Icon: Users,         title: 'Historique clients',  desc: 'Achats, paiements, dernier contact' },
  { Icon: FileText,      title: 'Reçus WhatsApp',      desc: 'Envoi direct depuis l’app en 1 clic' },
  { Icon: ImageIcon,     title: 'Studio Photo IA',     desc: 'Fond blanc pro — photo prête en 1 clic' },
  { Icon: Smartphone,    title: 'Hors connexion',      desc: 'Continue de fonctionner en 2G ou offline' },
];

const TESTIMONIALS = [
  { name: 'Aminata K.',   loc: 'Dakar · Tissus',       text: "Avant j'oubliais toujours de relancer. Maintenant je clique et le message part. Plus aucun impayé !", color: '#C68A4E' },
  { name: 'Jean-Paul M.', loc: 'Abidjan · Épicerie',   text: "Mes clients reçoivent leur reçu sur WhatsApp dès que je valide. Ils adorent.", color: '#D14C3C' },
  { name: 'Fatou D.',     loc: 'Douala · Cosmétiques', text: "Je vois tout l'historique de chaque cliente. Je sais ce qu'elle a acheté, quand, et combien.", color: '#3F7BDC' },
  { name: 'Moussa T.',    loc: 'Bamako · Téléphonie',  text: "Fini le carnet. Toutes mes commandes WhatsApp sont là. Je gère 3 vendeurs sans confusion.", color: '#1FB955' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [count, setCount] = useState(1247);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    const iv = setInterval(() => setCount(c => c + Math.floor(Math.random() * 2)), 9000);
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(iv); };
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--app-bg)', color: 'var(--ink)' }}>
      {/* Video modal */}
      {showVideo && (
        <div onClick={() => setShowVideo(false)}
             className="fixed inset-0 z-[200] flex items-center justify-center p-4"
             style={{ background: 'rgba(11,18,32,0.92)' }}>
          <div onClick={e => e.stopPropagation()}
               className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-black shadow-hi">
            <div className="relative" style={{ paddingTop: '177.78%' }}>
              <iframe
                className="absolute inset-0 h-full w-full border-0"
                src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
            <button onClick={() => setShowVideo(false)}
                    className="absolute top-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-white text-lg">
              ×
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className={`fixed inset-x-0 top-0 z-[100] transition-all ${scrolled ? 'glass border-b border-slate-100' : ''}`}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl font-black text-white shadow-wa"
                 style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>M</div>
            <span className="text-base font-extrabold tracking-tight">MasterShopPro</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href={DEMO_URL}
                  className="hidden h-10 items-center rounded-full border border-slate-200 bg-white px-4 text-xs font-extrabold text-slate-700 sm:inline-flex hover:border-slate-300">
              Démo
            </Link>
            <Link href={PLAY_URL} className="btn-primary h-10 px-4 text-xs">
              S'inscrire <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden px-5 pb-16 pt-28 lg:px-8 lg:pb-24 lg:pt-36">
        {/* Mesh background */}
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[44rem]"
             style={{
               background: `
                 radial-gradient(60% 60% at 8% 10%, rgba(31,185,85,0.18), transparent 55%),
                 radial-gradient(45% 60% at 92% 18%, rgba(255,106,44,0.14), transparent 55%),
                 radial-gradient(60% 60% at 50% 100%, rgba(63,123,220,0.10), transparent 60%),
                 linear-gradient(180deg, #FBF7EF 0%, #FFFFFF 70%)`,
             }} />

        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <div className="premium-chip premium-chip-wa">
              <span className="pulse-dot" />
              {count.toLocaleString('fr-FR')} commerçants WhatsApp actifs
            </div>

            <h1 className="display-serif mt-6 max-w-3xl text-[2.6rem] leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
              Tu vends sur WhatsApp.
              <span className="block italic" style={{ color: '#1FB955' }}>Ton produit</span>
              devient prêt à vendre.
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-[1.7] text-slate-600 sm:text-lg">
              Prends une photo. MasterShopPro génère la fiche, la brochure et le message client.
              Tu partages sur WhatsApp en <strong className="text-ink">30 secondes</strong>.
            </p>

            <div className="mt-7 grid gap-2.5 sm:grid-cols-1">
              {BENEFITS.map((item) => (
                <div key={item} className="premium-chip">
                  <CheckCircle2 className="h-4 w-4" style={{ color: '#1FB955' }} />
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href={PLAY_URL} className="btn-primary px-6 text-sm sm:text-base">
                Créer ma boutique gratuitement
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button onClick={() => setShowVideo(true)} className="btn-secondary px-6 text-sm sm:text-base">
                <Play className="h-4 w-4" style={{ color: '#1FB955' }} />
                Voir comment ça marche
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex">
                  {['#C68A4E', '#D14C3C', '#3F7BDC', '#1FB955'].map((c, i) => (
                    <div key={i} className="h-7 w-7 rounded-full border-2 border-white shadow-ios"
                         style={{ background: c, marginLeft: i ? -8 : 0 }} />
                  ))}
                </div>
                <div>
                  <div className="text-[13px] font-extrabold text-slate-900">+1 200 commerçants</div>
                  <div className="text-[11px] font-semibold text-slate-500">Cameroun · Sénégal · Côte d'Ivoire</div>
                </div>
              </div>
              <Link href={DEMO_URL} className="text-xs font-extrabold text-wa-dark underline-offset-4 hover:underline">
                → Essayer la démo sans compte
              </Link>
            </div>
          </div>

          {/* Phone visual */}
          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="ambient-orb ambient-orb-green" />
            <div className="ambient-orb ambient-orb-blue" />

            {/* Floating chips above phone */}
            <div className="absolute -left-4 top-8 z-30 float-soft hidden sm:block" style={{ transform: 'rotate(-6deg)' }}>
              <FloatingChip Icon={Camera} title="Photo prise" sub="1 sec" tone="white" />
            </div>
            <div className="absolute -right-2 top-32 z-30 float-soft-slow hidden sm:block" style={{ transform: 'rotate(4deg)' }}>
              <FloatingChip Icon={Sparkles} title="Fiche générée" sub="IA · 8 sec" tone="wa" />
            </div>
            <div className="absolute -bottom-4 left-6 z-30 float-soft hidden sm:block" style={{ transform: 'rotate(-3deg)' }}>
              <FloatingChip Icon={FileText} title="Brochure prête" sub="WhatsApp" tone="orange" />
            </div>

            <div className="relative mx-auto float-soft" style={{ width: 260 }}>
              <div className="absolute inset-0 -z-10 scale-110 rounded-[3rem]"
                   style={{ background: 'radial-gradient(circle, rgba(31,185,85,0.30) 0%, rgba(255,106,44,0.18) 70%)', filter: 'blur(32px)' }} />
              <div className="relative overflow-hidden rounded-[2.8rem] border-[6px] border-ink shadow-hi"
                   style={{ background: '#0B1220', aspectRatio: '9 / 18' }}>
                <div className="absolute left-1/2 top-3 z-10 h-3.5 w-14 -translate-x-1/2 rounded-full bg-black" />
                <iframe className="h-full w-full border-0"
                        style={{ pointerEvents: 'none' }}
                        src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&rel=0&playsinline=1&loop=1&playlist=${YT_ID}&controls=0&modestbranding=1`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                <button onClick={() => setShowVideo(true)}
                        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-float">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] text-white"
                       style={{ background: '#FF6A2C' }}>▶</div>
                  <span className="text-[11px] font-extrabold text-ink">Voir avec son</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div className="relative overflow-hidden py-3" style={{ background: '#0E5D32' }}>
        <div className="flex whitespace-nowrap" style={{ animation: 'ticker 22s linear infinite' }}>
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ['✓ Commandes WhatsApp claires','✓ Relances 1 clic','✓ Historique clients','✓ Paiements suivis','✓ Sans connexion','✓ Studio Photo IA','✓ Mobile Money','✓ Gratuit pour démarrer']
              .map((t, i) => (
                <span key={`${k}-${i}`} className="px-8 text-xs font-extrabold text-white/90">{t}</span>
              ))
          )}
        </div>
        <style jsx>{`@keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }`}</style>
      </div>

      {/* FLOW — Comment ça marche */}
      <section className="px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="section-kicker">Le parcours magique</span>
            <h2 className="section-title mx-auto">Photo → Fiche IA → Brochure → WhatsApp</h2>
            <p className="section-copy mx-auto">
              Quatre étapes. Aucune compétence technique. Ton produit devient une vraie fiche
              prête à coller dans une discussion client.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FLOW_STEPS.map((s, i) => (
              <div key={s.title} className="premium-card relative p-6">
                <div className="absolute right-5 top-5 text-[11px] font-extrabold tracking-[0.22em] text-slate-300">
                  0{i + 1}
                </div>
                <div className={`premium-icon ${s.tone === 'orange' ? 'bg-orange-soft' : s.tone === 'sky' ? 'bg-sky-soft' : ''}`}
                     style={s.tone === 'orange' ? { background: 'var(--orange-soft)', color: 'var(--orange-ink)' }
                          : s.tone === 'sky'    ? { background: 'var(--sky-soft)', color: 'var(--sky)' } : undefined}>
                  <s.icon className="h-5 w-5" />
                </div>
                <h3 className="display-serif mt-4 text-2xl">{s.title}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{s.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROBLEMS → SOLUTIONS */}
      <section className="px-5 py-16 lg:px-8 lg:py-24" style={{ background: 'var(--app-paper)' }}>
        <div className="mx-auto max-w-3xl">
          <div className="mb-10 text-center">
            <span className="section-kicker">Tu te reconnais ?</span>
            <h2 className="section-title mx-auto">Les vrais problèmes des vendeurs WhatsApp</h2>
          </div>

          <div className="grid gap-3">
            {PROBLEMS.map((p) => (
              <div key={p.pb} className="premium-card p-5 sm:p-6">
                <p className="text-[14px] font-semibold text-slate-500">{p.pb}</p>
                <p className="mt-2 inline-flex items-center gap-2 text-[14px] font-extrabold text-wa-dark">
                  <CheckCircle2 className="h-4 w-4" style={{ color: '#1FB955' }} />
                  {p.sol}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="px-5 py-16 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="section-kicker">Ils l'utilisent tous les jours</span>
            <h2 className="section-title mx-auto">+1 200 commerçants à travers l'Afrique francophone</h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="premium-card p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full font-black text-white"
                       style={{ background: t.color }}>
                    {t.name[0]}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] font-extrabold">{t.name}</div>
                    <div className="truncate text-[10.5px] font-semibold text-slate-500">{t.loc}</div>
                  </div>
                </div>
                <p className="mt-4 text-[13.5px] italic leading-[1.65] text-slate-600">"{t.text}"</p>
                <div className="mt-3 text-[12px]" style={{ color: '#F5A623' }}>★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-5 py-16 lg:px-8 lg:py-24" style={{ background: 'var(--app-paper)' }}>
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <span className="section-kicker">Tout-en-un</span>
            <h2 className="section-title mx-auto">Tout ce dont un vendeur WhatsApp a besoin</h2>
            <p className="section-copy mx-auto">Aucune formation. Opérationnel en 5 minutes.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="premium-card p-6">
                <div className="premium-icon">
                  <f.Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-[15px] font-extrabold tracking-[-0.005em]">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-[1.65] text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden px-5 py-20 lg:px-8 lg:py-28"
               style={{ background: '#0B1220' }}>
        <div className="pointer-events-none absolute inset-0"
             style={{
               background: `
                 radial-gradient(circle at 88% 10%, rgba(31,185,85,0.30), transparent 50%),
                 radial-gradient(circle at 8% 92%, rgba(255,106,44,0.18), transparent 55%)`,
             }} />

        <div className="relative mx-auto max-w-3xl text-center text-white">
          <div className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-extrabold tracking-[0.22em] uppercase"
               style={{ background: 'rgba(31,185,85,0.18)', color: '#1FB955' }}>
            <span className="pulse-dot" />
            Prêt à vendre mieux ?
          </div>

          <h2 className="display-serif mt-6 text-5xl leading-[1.04] sm:text-6xl">
            Continue à vendre sur WhatsApp.
            <span className="block italic" style={{ color: '#1FB955' }}>MasterShopPro organise le reste.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-xl text-base text-white/70">
            Commandes · Paiements · Relances · Brochures IA — Tout en 1 app. Gratuit pour démarrer.
          </p>

          <div className="mx-auto mt-8 flex max-w-md flex-col gap-3">
            <Link href={PLAY_URL} className="btn-primary px-6 text-base">
              <Zap className="h-4 w-4" />
              Créer ma boutique gratuitement
            </Link>
            <a href={`https://wa.me/${WA_NUM}?text=Bonjour, je veux essayer MasterShopPro`}
               target="_blank" rel="noopener noreferrer"
               className="btn px-6 py-3 text-sm rounded-full"
               style={{ background: 'rgba(31,185,85,0.15)', border: '1.5px solid rgba(31,185,85,0.4)', color: '#1FB955' }}>
              <MessageCircle className="h-4 w-4" />
              Une question ? Écris-nous sur WhatsApp
            </a>
            <Link href={DEMO_URL} className="text-[13px] font-extrabold text-white/50 underline-offset-4 hover:text-white/80 hover:underline">
              → Essayer la démo sans compte
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-[11px] font-semibold text-white/40">
            <ShieldCheck className="h-3.5 w-3.5" />
            Sans carte bancaire · Sans engagement · Fonctionne en 2G
          </div>
        </div>
      </section>

      <footer className="px-5 py-6 text-center lg:px-8" style={{ background: '#0B1220', color: 'rgba(255,255,255,0.4)' }}>
        <p className="text-[11px] font-semibold">
          mastershoppro.com · {new Date().getFullYear()} · Le back-office des ventes WhatsApp
        </p>
      </footer>
    </div>
  );
}

function FloatingChip({ Icon, title, sub, tone }: {
  Icon: React.ComponentType<{ className?: string }>; title: string; sub: string;
  tone: 'white' | 'wa' | 'orange';
}) {
  const bg = tone === 'white' ? 'white' : tone === 'wa' ? '#1FB955' : '#FF6A2C';
  const fg = tone === 'white' ? '#0B1220' : 'white';
  const iconBg = tone === 'white' ? '#E6F8EE' : 'rgba(255,255,255,0.18)';
  const iconFg = tone === 'white' ? '#0E5D32' : 'white';
  return (
    <div className="inline-flex items-center gap-2.5 rounded-2xl px-3 py-2 shadow-hi"
         style={{ background: bg, color: fg, border: tone === 'white' ? '1px solid rgba(15,23,42,0.08)' : undefined }}>
      <div className="flex h-7 w-7 items-center justify-center rounded-lg"
           style={{ background: iconBg, color: iconFg }}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div>
        <div className="text-[11px] font-extrabold leading-tight">{title}</div>
        <div className="text-[9.5px] font-bold opacity-75">{sub}</div>
      </div>
    </div>
  );
}
