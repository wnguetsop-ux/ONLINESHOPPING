'use client';
import { useState, useEffect } from 'react';

const PLAY_URL  = 'https://www.mastershoppro.com/register';
const DEMO_URL  = '/demo';
const WA_NUM    = '393299639430';
const YT_ID     = 'gKLc2s5CcBU';

export default function LandingAds() {
  const [scrolled, setScrolled]   = useState(false);
  const [count,    setCount]      = useState(487);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    const iv = setInterval(() => setCount(c => c + Math.floor(Math.random() * 2)), 9000);
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(iv); };
  }, []);

  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans','Nunito',system-ui,sans-serif", background: '#fff', color: '#111', minHeight: '100vh', overflowX: 'hidden' }}>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <style>{`
        @keyframes pulse-green { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.6),0 8px 32px rgba(22,163,74,0.4)} 50%{box-shadow:0 0 0 14px rgba(22,163,74,0),0 8px 32px rgba(22,163,74,0.4)} }
        @keyframes shine { 0%{transform:translateX(-100%) skewX(-15deg)} 100%{transform:translateX(300%) skewX(-15deg)} }
        @keyframes float {0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)}}
        @keyframes ticker {0%{transform:translateX(0)} 100%{transform:translateX(-50%)}}
        .pulse-cta { animation: pulse-green 2s ease-in-out infinite; }
        .shine-btn { position:relative; overflow:hidden; }
        .shine-btn::after { content:''; position:absolute; top:0; left:0; width:40%; height:100%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); animation: shine 2.5s ease-in-out infinite; }
        .float { animation: float 4s ease-in-out infinite; }
        .ticker-wrap { overflow:hidden; white-space:nowrap; }
        .ticker { display:inline-block; animation: ticker 22s linear infinite; }
      `}</style>

      {/* VIDEO MODAL */}
      {showVideo && (
        <div onClick={() => setShowVideo(false)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'relative', borderRadius: 24, overflow: 'hidden', background: '#000', width: '100%', maxWidth: 360 }} onClick={e => e.stopPropagation()}>
            <div style={{ paddingTop: '177.78%', position: 'relative' }}>
              <iframe style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            </div>
            <button onClick={() => setShowVideo(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', width: 32, height: 32, color: '#fff', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, padding: '12px 20px', background: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent', backdropFilter: scrolled ? 'blur(20px)' : 'none', borderBottom: scrolled ? '1px solid #f0f0f0' : 'none', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#f97316,#ea580c)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: 14 }}>M</div>
          <span style={{ fontWeight: 800, fontSize: 16 }}>Mastershop</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a href={DEMO_URL} style={{ padding: '7px 14px', borderRadius: 20, border: '1px solid #e5e7eb', fontSize: 12, fontWeight: 700, color: '#374151', textDecoration: 'none' }}>Demo</a>
          <a href={PLAY_URL} style={{ padding: '7px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#16a34a,#15803d)', fontSize: 12, fontWeight: 700, color: '#fff', textDecoration: 'none' }}>S'inscrire</a>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '100px 20px 60px', background: 'linear-gradient(180deg,#fff7ed 0%,#fff 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#fef3c7', border: '1px solid #fde68a', borderRadius: 20, padding: '6px 14px', marginBottom: 28, fontSize: 12, fontWeight: 700, color: '#92400e' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
          {count.toLocaleString()} vendeurs WhatsApp actifs — Afrique & Diaspora
        </div>

        {/* Titre principal — UNE seule idée */}
        <h1 style={{ fontSize: 'clamp(1.9rem,7vw,3.2rem)', fontWeight: 900, lineHeight: 1.15, marginBottom: 20, maxWidth: 640 }}>
          Vous vendez sur WhatsApp ?<br />
          <span style={{ color: '#ea580c' }}>Gérez vos commandes, paiements<br />et clients sans désordre.</span>
        </h1>

        {/* Sous-titre — clair, une phrase */}
        <p style={{ fontSize: 'clamp(0.95rem,3vw,1.1rem)', color: '#4b5563', maxWidth: 500, margin: '0 0 8px', lineHeight: 1.7 }}>
          MasterShopPro vous aide à suivre chaque commande, relancer les paiements et garder l'historique client — sans changer votre façon de vendre.
        </p>

        {/* Ligne de renfort */}
        <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 700, marginBottom: 32 }}>
          Continuez à vendre sur WhatsApp. MasterShopPro organise le reste.
        </p>

        {/* Mini bénéfices hero — 3 max */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
          {['✅ Commandes claires', '💰 Paiements suivis', '🔔 Relances en 1 clic'].map((b, i) => (
            <span key={i} style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 20, padding: '6px 14px', fontSize: 12, fontWeight: 700, color: '#15803d' }}>{b}</span>
          ))}
        </div>

        {/* CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, width: '100%', maxWidth: 380, marginBottom: 48 }}>
          <a href={PLAY_URL} className="pulse-cta shine-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', textDecoration: 'none', padding: '20px 28px', borderRadius: 18, fontWeight: 800, fontSize: 17, width: '100%' }}>
            <span style={{ fontSize: 20 }}>🛍️</span>
            Créer ma boutique gratuitement
          </a>
          <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>✅ Gratuit · Sans carte bancaire · Fonctionne sur tous les téléphones</p>
          <button onClick={() => setShowVideo(true)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'transparent', color: '#374151', border: '2px solid #e5e7eb', cursor: 'pointer', padding: '13px 24px', borderRadius: 14, fontWeight: 700, fontSize: 14, width: '100%' }}>
            <div style={{ width: 26, height: 26, background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10 }}>▶</div>
            Voir comment ça marche (30 sec)
          </button>
          <a href={DEMO_URL} style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>→ Essayer la démo sans compte</a>
        </div>

        {/* Phone mockup */}
        <div className="float" style={{ position: 'relative', width: 220 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '3rem', background: 'radial-gradient(circle,rgba(249,115,22,0.25) 0%,rgba(52,211,153,0.15) 100%)', filter: 'blur(28px)', transform: 'scale(1.15)' }} />
          <div style={{ position: 'relative', borderRadius: '2.6rem', border: '6px solid #1f2937', background: '#111', overflow: 'hidden', aspectRatio: '9/16' }}>
            <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 52, height: 13, background: '#000', borderRadius: 7, zIndex: 10 }} />
            <iframe style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
              src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&rel=0&playsinline=1&loop=1&playlist=${YT_ID}&controls=0&modestbranding=1`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
            <button onClick={() => setShowVideo(true)} style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.95)', border: 'none', borderRadius: 20, padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              <div style={{ width: 20, height: 20, background: '#f97316', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#fff' }}>▶</div>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#111' }}>Voir avec son</span>
            </button>
          </div>
        </div>
      </section>

      {/* TICKER */}
      <div style={{ background: '#16a34a', padding: '10px 0' }}>
        <div className="ticker-wrap">
          <div className="ticker" style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>
            {['✓ Commandes WhatsApp organisées','✓ Relances en 1 clic','✓ Historique clients','✓ Paiements suivis','✓ Sans internet','✓ Studio Photo IA','✓ Mobile Money','✓ Gratuit pour démarrer',
              '✓ Commandes WhatsApp organisées','✓ Relances en 1 clic','✓ Historique clients','✓ Paiements suivis','✓ Sans internet','✓ Studio Photo IA','✓ Mobile Money','✓ Gratuit pour démarrer']
              .map((t, i) => <span key={i} style={{ marginRight: 48 }}>{t}</span>)}
          </div>
        </div>
      </div>

      {/* ── SECTION WHATSAPP — preuve concrète ──────────────────────── */}
      <section style={{ padding: '70px 20px', background: '#f0fdf4' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#dcfce7', border: '1px solid #86efac', borderRadius: 20, padding: '5px 12px', marginBottom: 16, fontSize: 11, fontWeight: 700, color: '#15803d' }}>
            💬 Ce que MasterShopPro fait pour vous
          </div>
          <h2 style={{ fontSize: 'clamp(1.4rem,4vw,2rem)', fontWeight: 900, marginBottom: 8, maxWidth: 560 }}>
            Fini le désordre dans vos DM WhatsApp
          </h2>
          <p style={{ color: '#6b7280', marginBottom: 32, fontSize: 14, maxWidth: 520 }}>
            Chaque commande prise sur WhatsApp est enregistrée, suivie et relancée automatiquement depuis MasterShopPro.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            {[
              { emoji: '📥', title: 'Commandes centralisées', desc: 'Toutes vos commandes WhatsApp en un seul endroit, classées et claires' },
              { emoji: '💰', title: 'Suivi des paiements', desc: 'Voyez en temps réel qui a payé, qui doit encore payer, et combien' },
              { emoji: '🔔', title: 'Relances en 1 clic', desc: 'Rappel paiement, confirmation de commande, commande prête — message automatique' },
              { emoji: '👥', title: 'Historique clients', desc: 'Chaque client : ses commandes, ses achats, son dernier contact' },
              { emoji: '🧾', title: 'Reçus sur WhatsApp', desc: 'Envoyez un reçu professionnel directement depuis l\'app' },
              { emoji: '📋', title: 'Journal des échanges', desc: 'Retrouvez tout ce que vous avez envoyé à chaque client, avec la date' },
            ].map((f, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #d1fae5', borderRadius: 16, padding: '18px' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 10 }}>{f.emoji}</span>
                <p style={{ fontWeight: 800, fontSize: 13, marginBottom: 4, color: '#111' }}>{f.title}</p>
                <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLÈMES → SOLUTIONS ────────────────────────────────────── */}
      <section style={{ padding: '70px 20px', background: '#f9fafb' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem,5vw,2.2rem)', fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>Ça vous parle ? 👇</h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 32, fontSize: 14 }}>Ce sont les vrais problèmes des vendeurs WhatsApp</p>
          {[
            { pb: '😤 Vous notez les commandes dans un carnet ou dans votre tête', sol: 'Toutes vos commandes sont enregistrées, classées et suivies dans MasterShopPro' },
            { pb: '💸 Vous oubliez de relancer les clients qui n\'ont pas encore payé', sol: 'Rappel paiement WhatsApp en 1 clic — message pré-rempli avec le montant exact' },
            { pb: '🤷 Vous ne savez plus ce que chaque client a acheté par le passé', sol: 'Historique client complet : commandes, montants, dernier contact' },
            { pb: '📸 Vos photos produits font amateur comparé aux vraies boutiques', sol: 'Studio Photo IA : fond blanc pro automatique en 1 clic, sans matériel' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 20px', marginBottom: 10 }}>
              <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 8 }}>{item.pb}</p>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>✅ {item.sol}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── TÉMOIGNAGES ──────────────────────────────────────────────── */}
      <section style={{ padding: '70px 20px', background: 'linear-gradient(160deg,#f0fdf4,#fffbeb)' }}>
        <h2 style={{ fontSize: 'clamp(1.5rem,5vw,2.2rem)', fontWeight: 900, textAlign: 'center', marginBottom: 36 }}>
          Ils vendent sur WhatsApp et gèrent tout avec MasterShopPro 🌍
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14, maxWidth: 900, margin: '0 auto' }}>
          {[
            { av: '👩🏾', name: 'Aminata K.', loc: 'Dakar · Tissus', text: 'Avant j\'oubliais toujours de relancer. Maintenant je clique sur un bouton et le message part. Plus aucun impayé !' },
            { av: '👨🏿', name: 'Jean-Paul M.', loc: 'Abidjan · Épicerie', text: "Mes clients reçoivent leur reçu sur WhatsApp dès que je valide la commande. Ils adorent." },
            { av: '👩🏽', name: 'Fatou D.', loc: 'Douala · Cosmétiques', text: 'Je vois tout l\'historique de chaque cliente. Je sais ce qu\'elle a acheté, quand, et combien elle a dépensé.' },
            { av: '👨🏾', name: 'Moussa T.', loc: 'Bamako · Téléphonie', text: 'Fini le carnet. Toutes mes commandes WhatsApp sont dans MasterShopPro. Je gère 3 vendeurs sans confusion.' },
          ].map((t, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, padding: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 30 }}>{t.av}</span>
                <div><p style={{ fontWeight: 700, fontSize: 13, margin: 0 }}>{t.name}</p><p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{t.loc}</p></div>
                <div style={{ marginLeft: 'auto', color: '#f59e0b', fontSize: 11 }}>★★★★★</div>
              </div>
              <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>"{t.text}"</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES — ordre priorisé ────────────────────────────────── */}
      <section style={{ padding: '70px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem,5vw,2.2rem)', fontWeight: 900, textAlign: 'center', marginBottom: 8 }}>
            Tout ce dont un vendeur WhatsApp a besoin 📱
          </h2>
          <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: 36, fontSize: 14 }}>Aucune formation. Opérationnel en 5 minutes.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {[
              { icon: '💬', bg: '#dcfce7', bd: '#86efac', title: 'Gestion commandes WhatsApp', desc: 'Centralisez, suivez et confirmez chaque commande' },
              { icon: '🔔', bg: '#fef3c7', bd: '#fde68a', title: 'Relances automatiques', desc: 'Rappel paiement, confirmation, prêt à retirer' },
              { icon: '👥', bg: '#dbeafe', bd: '#93c5fd', title: 'Historique clients', desc: 'Achats, paiements, dernier contact par client' },
              { icon: '🧾', bg: '#ffe4e6', bd: '#fecdd3', title: 'Reçus sur WhatsApp', desc: 'Envoi direct depuis l\'app en 1 clic' },
              { icon: '🤖', bg: '#f3e8ff', bd: '#e9d5ff', title: 'Studio Photo IA', desc: 'Fond blanc pro automatique — photo prête en 1 clic' },
              { icon: '📶', bg: '#fff7ed', bd: '#fed7aa', title: 'Hors connexion', desc: 'Continue de fonctionner sans internet ou en 2G' },
            ].map((f, i) => (
              <div key={i} style={{ background: f.bg, border: `2px solid ${f.bd}`, borderRadius: 16, padding: '16px' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 8 }}>{f.icon}</span>
                <p style={{ fontWeight: 800, fontSize: 12, marginBottom: 4 }}>{f.title}</p>
                <p style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────── */}
      <section style={{ padding: '70px 20px', background: 'linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%)', textAlign: 'center' }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#4ade80', textTransform: 'uppercase', letterSpacing: 3, marginBottom: 16 }}>Prêt à organiser vos ventes ?</p>
        <h2 style={{ fontSize: 'clamp(1.6rem,5vw,2.6rem)', fontWeight: 900, color: '#fff', maxWidth: 560, margin: '0 auto 12px', lineHeight: 1.2 }}>
          Continuez à vendre sur WhatsApp.<br />
          <span style={{ color: '#4ade80' }}>MasterShopPro organise le reste.</span>
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 40, fontSize: 14 }}>
          Commandes · Paiements · Relances · Clients — Tout en 1 app · Gratuit pour démarrer
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, maxWidth: 380, margin: '0 auto' }}>
          <a href={PLAY_URL} className="pulse-cta shine-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', textDecoration: 'none', padding: '20px 28px', borderRadius: 18, fontWeight: 800, fontSize: 17, width: '100%' }}>
            <span style={{ fontSize: 20 }}>🛍️</span>
            Créer ma boutique gratuitement
          </a>
          <a href={`https://wa.me/${WA_NUM}?text=Bonjour, je veux essayer MasterShopPro`} target="_blank"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.4)', color: '#4ade80', textDecoration: 'none', padding: '14px 24px', borderRadius: 14, fontWeight: 700, fontSize: 15, width: '100%' }}>
            <span style={{ fontSize: 20 }}>💬</span>
            Une question ? Écrivez-nous sur WhatsApp
          </a>
          <a href={DEMO_URL} style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}>→ Essayer la démo sans compte</a>
        </div>
        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 32 }}>mastershoppro.com · {new Date().getFullYear()}</p>
      </section>
    </div>
  );
}