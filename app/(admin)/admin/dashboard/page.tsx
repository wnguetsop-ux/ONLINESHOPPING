'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getProducts } from '@/lib/firestore';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { formatPrice } from '@/lib/utils';
import { sendWhatsApp } from '@/lib/whatsapp';
import { computeDayInsights, DayInsight } from '@/lib/insights';
import {
  ArrowRight, BarChart3, CheckCircle, ChevronRight,
  Copy, ExternalLink, MessageCircle, Package, Plus,
  ShoppingBag, Store, TrendingUp, Users, Zap, RefreshCw,
} from 'lucide-react';

// ── Status helpers ────────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, string> = {
  PENDING:    'badge-pending',
  CONFIRMED:  'badge-confirmed',
  PROCESSING: 'badge-processing',
  DELIVERED:  'badge-delivered',
  CANCELLED:  'badge-cancelled',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING:    'En attente',
  CONFIRMED:  'Confirmée',
  PROCESSING: 'En préparation',
  DELIVERED:  'Livrée',
  CANCELLED:  'Annulée',
};

// ── Onboarding steps ─────────────────────────────────────────────────────────
const STEPS = [
  {
    num: 1, emoji: '🛍️',
    title:  'Créer votre première commande',
    desc:   'Enregistrez une commande reçue sur WhatsApp en 30 secondes.',
    cta:    'Créer une commande',
    href:   '/admin/orders',
  },
  {
    num: 2, emoji: '💰',
    title:  'Suivre le paiement',
    desc:   'Voyez qui a payé, qui doit encore payer, et combien.',
    cta:    'Voir les commandes',
    href:   '/admin/orders',
  },
  {
    num: 3, emoji: '💬',
    title:  'Envoyer un message WhatsApp',
    desc:   'Confirmation, rappel paiement, reçu — en 1 clic.',
    cta:    'Voir mes clients',
    href:   '/admin/clients',
  },
];

// ── Priority border colors ────────────────────────────────────────────────────
const PRIORITY_BORDER: Record<string, string> = {
  high:   'border-l-red-400',
  medium: 'border-l-amber-400',
  low:    'border-l-slate-300',
};

function formatPriceCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000)     return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function HeroKpiCell({ label, value, sub, accent, icon }: {
  label: string; value: string; sub: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div className="px-5 py-5 sm:px-6 border-r border-white/10 last:border-r-0">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${accent}22`, color: accent }}>{icon}</div>
        <div className="text-[10.5px] font-extrabold tracking-[0.22em] uppercase text-white/55">{label}</div>
      </div>
      <div className="display-serif text-3xl sm:text-4xl leading-none mt-1.5" style={{ color: accent }}>{value}</div>
      <div className="text-[11.5px] font-semibold text-white/55 mt-1">{sub}</div>
    </div>
  );
}

export default function DashboardPage() {
  const { shop, admin } = useAuth();
  const [orders,        setOrders]        = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [copied,        setCopied]        = useState(false);
  const [sending,       setSending]       = useState<string | null>(null);
  const [step,          setStep]          = useState(0);
  const [insights,      setInsights]      = useState<DayInsight[]>([]);
  const [productsCount, setProductsCount] = useState(0);
  const [lastUpdated,   setLastUpdated]   = useState<Date | null>(null);
  const lastHash = useRef('');

  // ── Listener temps réel sur les commandes ────────────────────────────────────
  useEffect(() => {
    if (!shop?.id) return;
    const q = query(
      collection(db, 'orders'),
      where('shopId', '==', shop.id),
      orderBy('createdAt', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const o = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      setOrders(o);
      setLoading(false);
      setLastUpdated(new Date());
      const hash = o.map((x: any) => x.id + x.status).join('|');
      if (hash !== lastHash.current) {
        lastHash.current = hash;
        setInsights(computeDayInsights(o, shop?.currency));
      }
    }, () => setLoading(false));
    return () => unsub();
  }, [shop?.id]);

  // ── Comptage produits (une fois) ─────────────────────────────────────────────
  useEffect(() => {
    if (!shop?.id) return;
    getProducts(shop.id, true).then(p => setProductsCount(p.length)).catch(() => {});
  }, [shop?.id]);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/${shop?.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function quickRelance(order: any) {
    if (!shop?.id) return;
    setSending(order.id);
    await sendWhatsApp('payment_reminder', {
      shopId: shop.id, shopName: shop.name,
      customerPhone: order.customerPhone, customerName: order.customerName,
      orderId: order.id, orderRef: order.orderNumber,
      total: order.total, amountPaid: order.amountPaid,
      reste: order.balanceDue, currency: shop.currency,
    });
    setSending(null);
  }

  // ── Computed metrics ─────────────────────────────────────────────────────────
  const pending       = orders.filter(o => o.status === 'PENDING');
  const unpaid        = orders.filter(o =>
    ['PENDING','CONFIRMED','PROCESSING'].includes(o.status) && (o.balanceDue || 0) > 0
  );
  const totalUnpaid   = unpaid.reduce((s, o) => s + (o.balanceDue || 0), 0);
  const today         = new Date(); today.setHours(0, 0, 0, 0);
  const monthStart    = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);
  const todayOrders   = orders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue  = todayOrders.filter(o => o.status === 'DELIVERED').reduce((s,o) => s + (o.total||0), 0);
  const monthRevenue  = orders.filter(o => new Date(o.createdAt) >= monthStart && o.status === 'DELIVERED').reduce((s,o) => s + (o.total||0), 0);
  const totalRevenue  = orders.filter(o => o.status === 'DELIVERED').reduce((s,o) => s + (o.total||0), 0);
  const uniqueClients = new Set(orders.map(o => o.customerPhone).filter(Boolean)).size;
  const twoDaysAgo    = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const toRelance     = orders.filter(o =>
    ['PENDING','CONFIRMED','PROCESSING'].includes(o.status) &&
    (o.balanceDue || 0) > 0 && new Date(o.createdAt) < twoDaysAgo
  );
  const recentOrders  = orders.slice(0, 5);
  const isNewUser     = !loading && orders.length === 0;
  const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;

  const todayLabel = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-[3px] border-t-transparent border-wa rounded-full animate-spin" />
    </div>
  );

  // ════════════════════════════════════════════════════════════════════════════
  // VUE NOUVEL UTILISATEUR
  // ════════════════════════════════════════════════════════════════════════════
  if (isNewUser) {
    return (
      <div className="max-w-xl space-y-4 animate-fadeIn">
        {/* Welcome banner */}
        <div className="card bg-gradient-to-br from-wa to-wa-dark p-5 text-white border-0">
          <p className="text-white/70 text-sm mb-1">Bienvenue sur MasterShopPro 👋</p>
          <h1 className="text-xl font-black">{shop?.name}</h1>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">
            Vous vendez sur WhatsApp&nbsp;? Gérez vos commandes en 3 étapes.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-2.5">
          {STEPS.map((s, i) => {
            const isActive = step === i;
            const isDone   = step > i;
            return (
              <div
                key={i}
                className={`card overflow-hidden transition-all ${
                  isActive ? 'border-wa shadow-wa/10' : 'border-app-border'
                }`}
              >
                <button
                  onClick={() => setStep(isActive ? -1 : i)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 border-2 ${
                    isActive ? 'border-wa bg-wa-soft' : 'border-app-border bg-slate-50'
                  }`}>
                    {isDone ? '✅' : s.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-wa-dark' : 'text-slate-400'}`}>
                      Étape {s.num}
                    </span>
                    <p className="font-bold text-slate-800 text-sm">{s.title}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-slate-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </button>
                {isActive && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-slate-500 mb-3 leading-relaxed">{s.desc}</p>
                    <div className="flex gap-2">
                      <Link href={s.href} className="btn-wa text-sm px-4 py-2.5 rounded-xl">
                        <Plus className="w-4 h-4" /> {s.cta}
                      </Link>
                      {i < STEPS.length - 1 && (
                        <button
                          onClick={() => setStep(i + 1)}
                          className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-500 border border-app-border hover:bg-slate-50"
                        >
                          Suivant →
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Shop link */}
        <div className="card p-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-700">🔗 Lien de votre boutique</p>
            <p className="text-xs text-slate-400 truncate mt-0.5">
              {typeof window !== 'undefined' ? window.location.origin : ''}/{shop?.slug}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={copyLink} className="btn-icon hover:bg-slate-100 text-slate-500">
              {copied ? <CheckCircle className="w-4 h-4 text-wa" /> : <Copy className="w-4 h-4" />}
            </button>
            <Link href={`/${shop?.slug}`} target="_blank" className="btn-icon hover:bg-slate-100 text-slate-500">
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VUE UTILISATEUR ACTIF
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-6 page-enter">

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-[2.25rem] shadow-hi" style={{ background: '#0B1220' }}>
        <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 92% 8%, rgba(31,185,85,0.32), transparent 50%), radial-gradient(circle at 6% 92%, rgba(255,106,44,0.18), transparent 55%)' }} />
        <div className="relative px-6 sm:px-8 py-8 sm:py-10 text-white">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.22em] uppercase text-white/55">
              <span className="pulse-dot" /> {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            {lastUpdated && (
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-white/40">
                <RefreshCw className="w-3 h-3" />
                {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            )}
          </div>
          <h1 className="display-serif text-4xl sm:text-5xl mt-3 leading-[1.02]">
            Bonjour <em className="italic" style={{ color: '#1FB955' }}>{shop?.name || 'Boutique'}.</em>
          </h1>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link href="/admin/orders" className="btn-primary px-5 text-sm">
              {pending.length > 0 && <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] font-black">{pending.length}</span>}
              Commandes
            </Link>
            <button onClick={copyLink} className="btn px-5 py-3 text-sm rounded-full" style={{ background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.18)', color: 'white' }}>
              {copied ? 'Lien copié !' : 'Partager la boutique'}
            </button>
          </div>
        </div>
        <div className="relative grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
          <HeroKpiCell label="Ce mois" value={formatPriceCompact(monthRevenue)} sub={`${shop?.currency || 'FCFA'} encaissé`} accent="#1FB955" icon={<span className="text-xs">📈</span>} />
          <HeroKpiCell label="En attente" value={String(pending.length)} sub="à confirmer" accent={pending.length > 0 ? '#FF6A2C' : '#3F7BDC'} icon={<span className="text-xs">⏳</span>} />
          <HeroKpiCell label="À encaisser" value={formatPriceCompact(totalUnpaid)} sub={`${unpaid.length} commande(s)`} accent="#FF6A2C" icon={<span className="text-xs">💰</span>} />
          <HeroKpiCell label="Clients" value={String(uniqueClients)} sub={`${orders.length} commandes total`} accent="#FFFFFF" icon={<span className="text-xs">👥</span>} />
        </div>
      </div>

      {/* ── Greeting header ──────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-1 capitalize">
            {todayLabel} · {shop?.name}
          </p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Bonjour, {admin?.name?.split(' ')[0] || 'vous'} 👋
          </h1>
        </div>
        {/* WA status */}
        <div className="flex items-center gap-1.5 bg-wa-soft text-wa-dark px-2.5 py-1.5 rounded-full border border-wa-border text-[11px] font-bold flex-shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-wa opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-wa" />
          </span>
          Connecté
        </div>
      </div>

      {/* ── KPI Strip ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Commandes en attente */}
        <Link href="/admin/orders" className="stat-card hover:shadow-ios transition-shadow group">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            {pending.length > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200 animate-pulse">
                <TrendingUp className="w-3 h-3" /> Urgent
              </span>
            )}
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{pending.length}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">En attente · {todayOrders.length} auj.</p>
        </Link>

        {/* Chiffre du jour */}
        <div className="stat-card">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-wa-soft text-wa-dark flex items-center justify-center border border-wa-border">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-wa-dark bg-wa-soft px-2 py-1 rounded-full border border-wa-border">Auj.</span>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight leading-none">
            {todayRevenue > 0 ? formatPrice(todayRevenue, shop?.currency) : formatPriceCompact(todayOrders.length) + ' cmd'}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            {todayRevenue > 0 ? `${todayOrders.length} commande(s)` : 'Ce jour — aucune livraison'}
          </p>
        </div>

        {/* Total livré */}
        <div className="stat-card">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">{deliveredCount} livrées</span>
          </div>
          <p className="text-xl font-black text-slate-900 tracking-tight leading-none">
            {formatPrice(totalRevenue, shop?.currency)}
          </p>
          <p className="text-xs font-semibold text-slate-500 mt-1">Revenu total encaissé</p>
        </div>

        {/* Produits & clients */}
        <Link href="/admin/products" className="stat-card hover:shadow-ios transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-1 rounded-full border border-violet-200">{uniqueClients} clients</span>
          </div>
          <p className="text-3xl font-black text-slate-900 tracking-tight">{productsCount}</p>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">Produits actifs</p>
        </Link>
      </div>

      {/* ── Daily priorities ─────────────────────────────────────────────────── */}
      {insights.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-app-border">
            <div className="w-7 h-7 rounded-lg bg-wa-soft flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-wa-dark" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Priorités du matin</h3>
          </div>
          <div className="divide-y divide-app-border">
            {insights.map((insight, i) => (
              <div
                key={i}
                onClick={() => insight.href && (window.location.href = insight.href)}
                className={`
                  px-4 py-3 flex items-center gap-3 relative border-l-4
                  ${PRIORITY_BORDER[insight.priority]}
                  ${insight.href ? 'cursor-pointer hover:bg-slate-50 transition-colors' : ''}
                `}
              >
                <span className="text-lg flex-shrink-0">{insight.emoji}</span>
                <p className="text-sm text-slate-700 flex-1 leading-snug font-medium">{insight.text}</p>
                {insight.href && (
                  <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Alert banners ────────────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="card bg-amber-50 border-amber-200 p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShoppingBag className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">{pending.length} commande(s) à confirmer</p>
            <p className="text-xs text-amber-600 mt-0.5">Confirmez pour notifier vos clients</p>
          </div>
          <Link href="/admin/orders" className="text-amber-700 font-bold text-sm flex-shrink-0 flex items-center gap-1">
            Voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {toRelance.length > 0 && (
        <div className="card bg-wa-soft border-wa-border p-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 border border-wa-border">
            <MessageCircle className="w-5 h-5 text-wa-dark" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-wa-dark text-sm">{toRelance.length} client(s) à relancer</p>
            <p className="text-xs text-wa-dark/70 mt-0.5">Solde en attente depuis +2 jours</p>
          </div>
          <button
            onClick={() => toRelance[0] && quickRelance(toRelance[0])}
            disabled={!!sending}
            className="btn-wa text-xs px-3 py-2 rounded-xl flex-shrink-0"
          >
            {sending ? '...' : '💬 Relancer'}
          </button>
        </div>
      )}

      {/* ── Boutique link ────────────────────────────────────────────────────── */}
      <div className="card p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Store className="w-5 h-5 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm text-slate-700">Lien de votre boutique</p>
            <p className="text-xs text-slate-400 truncate">
              {typeof window !== 'undefined' ? window.location.origin : ''}/{shop?.slug}
            </p>
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={copyLink} className="btn-icon hover:bg-slate-100 text-slate-500">
            {copied ? <CheckCircle className="w-4 h-4 text-wa" /> : <Copy className="w-4 h-4" />}
          </button>
          <Link href={`/${shop?.slug}`} target="_blank" className="btn-icon hover:bg-slate-100 text-slate-500">
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── Recent orders ────────────────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-app-border">
          <h3 className="font-bold text-slate-800 text-sm">Dernières commandes</h3>
          <Link href="/admin/orders" className="text-xs font-bold text-wa-dark flex items-center gap-1 hover:underline">
            Voir toutes <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-12 h-12 mx-auto text-slate-200 mb-2" />
            <p className="text-slate-400 text-sm">Aucune commande récente</p>
            <Link href="/admin/orders" className="btn-wa inline-flex mt-3 text-sm px-4 py-2.5 rounded-xl">
              <Plus className="w-4 h-4" /> Créer une commande
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-app-border">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-wa-soft text-wa-dark flex items-center justify-center font-bold text-sm border border-wa-border">
                      {order.customerName?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-wa rounded-full border-2 border-white flex items-center justify-center">
                      <MessageCircle className="w-2 h-2 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 text-sm leading-none mb-1">
                      {order.customerName}
                    </p>
                    <span className={`badge text-[9px] ${STATUS_BADGE[order.status] || 'badge-pending'}`}>
                      {STATUS_LABEL[order.status] || order.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-slate-800 text-sm">
                      {formatPrice(order.total, shop?.currency)}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  {order.customerPhone && !['DELIVERED','CANCELLED'].includes(order.status) && (
                    <button
                      onClick={() => quickRelance(order)}
                      disabled={sending === order.id}
                      className="w-8 h-8 bg-wa-soft border border-wa-border rounded-full flex items-center justify-center hover:bg-wa hover:text-white transition-colors flex-shrink-0"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-wa-dark" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Quick action grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/admin/orders',  emoji: '🛍️', label: 'Commandes', bg: 'bg-amber-50',  border: 'border-amber-200' },
          { href: '/admin/clients', emoji: '👥', label: 'Clients',    bg: 'bg-blue-50',   border: 'border-blue-200'  },
          { href: '/admin/whatsapp',emoji: '💬', label: 'WhatsApp',   bg: 'bg-wa-soft',   border: 'border-wa-border' },
        ].map((s, i) => (
          <Link
            key={i}
            href={s.href}
            className={`${s.bg} border ${s.border} rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-80 active:scale-[0.97] transition-all text-center`}
          >
            <span className="text-2xl">{s.emoji}</span>
            <p className="text-xs font-bold text-slate-700">{s.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
