'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getOrders } from '@/lib/firestore';
import { formatPrice } from '@/lib/utils';
import { sendWhatsApp } from '@/lib/whatsapp';
import { computeDayInsights, DayInsight } from '@/lib/insights';
import {
  Plus, MessageCircle, Clock, CheckCircle, Package,
  ArrowRight, Copy, ExternalLink, Users, ChevronRight,
  ShoppingBag, Zap, TrendingUp, BarChart3
} from 'lucide-react';
import React from 'react';

function formatPriceCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.0', '')}M`;
  if (value >= 1_000)     return `${Math.round(value / 1_000)}k`;
  return String(value);
}

function HeroKpiCell({ label, value, sub, accent, icon }: {
  label: string; value: string; sub: string; accent: string; icon: React.ReactNode;
}) {
  return (
    <div className="px-5 py-5 sm:px-6 sm:py-6 border-r border-white/10 last:border-r-0">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
             style={{ background: `${accent}22`, color: accent }}>
          {icon}
        </div>
        <div className="text-[10.5px] font-extrabold tracking-[0.22em] uppercase text-white/55">
          {label}
        </div>
      </div>
      <div className="display-serif text-3xl sm:text-4xl leading-none mt-1.5" style={{ color: accent }}>
        {value}
      </div>
      <div className="text-[11.5px] font-semibold text-white/55 mt-1">{sub}</div>
    </div>
  );
}

function DayRing({ value, goal, currency }: { value: number; goal: number; currency?: string }) {
  const pct = Math.min(100, Math.round((value / Math.max(goal, 1)) * 100));
  const r = 88, c = 2 * Math.PI * r;
  const dashOffset = c * (1 - pct / 100);
  return (
    <div className="relative w-[220px] h-[220px] mx-auto">
      <svg viewBox="0 0 200 200" width="220" height="220">
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
        <circle cx="100" cy="100" r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="14" strokeLinecap="round"
                strokeDasharray={c} strokeDashoffset={dashOffset} transform="rotate(-90 100 100)" />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1FB955"/>
            <stop offset="100%" stopColor="#FF6A2C"/>
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-[10px] font-extrabold tracking-[0.22em] uppercase text-white/55">Objectif jour</div>
        <div className="display-serif text-[40px] leading-none text-white mt-1">
          {value.toLocaleString('fr-FR')}
        </div>
        <div className="text-[11px] text-white/65 font-bold">sur {goal.toLocaleString('fr-FR')} {currency || 'FCFA'}</div>
        {value > 0 && (
          <div className="mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold"
               style={{ background: 'rgba(31,185,85,0.2)', color: '#1FB955' }}>
            {pct}% de l'objectif
          </div>
        )}
      </div>
    </div>
  );
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation', DELIVERED: 'Livrée', CANCELLED: 'Annulée',
};

const STEPS = [
  { num: 1, emoji: '🛍️', title: 'Créer votre première commande', desc: 'Enregistrez une commande reçue sur WhatsApp en 30 secondes.', cta: 'Créer une commande', href: '/admin/orders', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  { num: 2, emoji: '💰', title: 'Suivre le paiement',             desc: 'Voyez qui a payé, qui doit encore payer, et combien.',         cta: 'Voir les commandes', href: '/admin/orders', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
  { num: 3, emoji: '💬', title: 'Envoyer un message WhatsApp',    desc: 'Confirmation, rappel paiement, reçu — en 1 clic.',             cta: 'Voir mes clients',  href: '/admin/clients', color: '#0891b2', bg: '#f0f9ff', border: '#bae6fd' },
];

const PRIORITY_BG: Record<string, string> = {
  high:   'bg-red-50 border-red-100',
  medium: 'bg-amber-50 border-amber-100',
  low:    'bg-gray-50 border-gray-100',
};
const PRIORITY_DOT: Record<string, string> = {
  high:   'bg-red-400',
  medium: 'bg-amber-400',
  low:    'bg-gray-300',
};

export default function DashboardPage() {
  const { shop } = useAuth();
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [step, setStep]       = useState(0);

  // Insights — recalculés uniquement quand les orders changent
  const [insights, setInsights] = useState<DayInsight[]>([]);
  const lastOrdersHash = useRef('');

  const primaryColor = shop?.primaryColor || '#ec4899';
  const isNewUser    = !loading && orders.length === 0;

  useEffect(() => {
    if (!shop?.id) return;
    getOrders(shop.id).then(o => {
      setOrders(o);
      setLoading(false);
      // Recalcule les insights seulement si les données ont changé
      const hash = o.map((x: any) => x.id + x.status).join('|');
      if (hash !== lastOrdersHash.current) {
        lastOrdersHash.current = hash;
        setInsights(computeDayInsights(o, shop?.currency));
      }
    });
  }, [shop?.id]);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/${shop?.slug}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const pending      = orders.filter(o => o.status === 'PENDING');
  const unpaid       = orders.filter(o => ['PENDING','CONFIRMED','PROCESSING'].includes(o.status));
  const totalUnpaid  = unpaid.reduce((s, o) => s + o.total, 0);
  const today        = new Date(); today.setHours(0,0,0,0);
  const todayOrders  = orders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue = todayOrders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
  const recentOrders = orders.slice(0, 6);
  const twoDaysAgo   = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const toRelance    = orders.filter(o => ['PENDING','CONFIRMED','PROCESSING'].includes(o.status) && new Date(o.createdAt) < twoDaysAgo);

  async function quickRelance(order: any) {
    if (!shop?.id) return;
    setSending(order.id);
    await sendWhatsApp('payment_reminder', {
      shopId: shop.id, shopName: shop.name,
      customerPhone: order.customerPhone, customerName: order.customerName,
      orderId: order.id, orderRef: order.orderNumber,
      total: order.total, reste: order.total, currency: shop.currency,
    });
    setSending(null);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }} />
    </div>
  );

  // ── VUE NOUVEL UTILISATEUR ────────────────────────────────────────────────
  if (isNewUser) {
    return (
      <div className="max-w-xl space-y-5">
        <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg,${primaryColor},${primaryColor}bb)` }}>
          <p className="text-white/70 text-sm mb-1">Bienvenue sur MasterShopPro 👋</p>
          <h1 className="text-xl font-black">{shop?.name}</h1>
          <p className="text-white/80 text-sm mt-2 leading-relaxed">Vous vendez sur WhatsApp ? Voici comment gérer vos commandes en 3 étapes.</p>
        </div>
        <div className="space-y-3">
          {STEPS.map((s, i) => {
            const isActive = step === i;
            const isDone   = step > i;
            return (
              <div key={i} style={{ background: isActive ? s.bg : '#fff', border: `2px solid ${isActive ? s.border : '#f3f4f6'}` }} className="rounded-2xl overflow-hidden transition-all">
                <button onClick={() => setStep(isActive ? -1 : i)} className="w-full flex items-center gap-3 p-4 text-left">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ background: isActive ? s.bg : '#f9fafb', border: `2px solid ${isActive ? s.border : '#e5e7eb'}` }}>
                    {isDone ? '✅' : s.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold" style={{ color: isActive ? s.color : '#9ca3af' }}>Étape {s.num}</span>
                    <p className="font-bold text-gray-800 text-sm">{s.title}</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isActive ? 'rotate-90' : ''}`} />
                </button>
                {isActive && (
                  <div className="px-4 pb-4">
                    <p className="text-sm text-gray-500 mb-3 leading-relaxed">{s.desc}</p>
                    <div className="flex gap-2">
                      <Link href={s.href} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold hover:opacity-90 transition-opacity" style={{ backgroundColor: s.color }}>
                        <Plus className="w-4 h-4" />{s.cta}
                      </Link>
                      {i < STEPS.length - 1 && <button onClick={() => setStep(i + 1)} className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-500 border border-gray-200 hover:bg-gray-50">Suivant →</button>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <Link href="/admin/orders" className="flex items-center gap-4 p-5 rounded-2xl text-white hover:opacity-90 transition-opacity" style={{ background: `linear-gradient(135deg,${primaryColor},${primaryColor}cc)` }}>
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><ShoppingBag className="w-6 h-6" /></div>
          <div className="flex-1"><p className="font-black text-lg">Créer votre première commande</p><p className="text-white/70 text-sm">Enregistrez une vente WhatsApp maintenant</p></div>
          <ArrowRight className="w-5 h-5 text-white/70 flex-shrink-0" />
        </Link>
        <div className="rounded-2xl p-4 bg-gray-50 border border-gray-100 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-700">🔗 Lien de votre boutique</p>
            <p className="text-xs text-gray-400 truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/{shop?.slug}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={copyLink} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">{copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}</button>
            <Link href={`/${shop?.slug}`} target="_blank" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"><ExternalLink className="w-4 h-4 text-gray-400" /></Link>
          </div>
        </div>
      </div>
    );
  }

  // ── VUE UTILISATEUR ACTIF ─────────────────────────────────────────────────
  const todayLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const confirmed = orders.filter(o => o.status === 'CONFIRMED').length;

  return (
    <div className="space-y-6 page-enter">
      {/* HERO — greeting + KPI strip */}
      <div className="relative overflow-hidden rounded-[2.25rem] shadow-hi" style={{ background: '#0B1220' }}>
        <div className="pointer-events-none absolute inset-0"
             style={{
               background: `
                 radial-gradient(circle at 92% 8%, rgba(31,185,85,0.32), transparent 50%),
                 radial-gradient(circle at 6% 92%, rgba(255,106,44,0.18), transparent 55%)`,
             }} />

        <div className="relative grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 px-6 sm:px-8 py-8 sm:py-10 text-white items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.22em] uppercase text-white/55">
              <span className="pulse-dot" /> {todayLabel}
            </div>

            <h1 className="display-serif text-4xl sm:text-5xl mt-3 leading-[1.02]">
              Bonjour <em className="italic" style={{ color: '#1FB955' }}>{shop?.name || 'Boutique'}.</em>
              {pending.length > 0 && (
                <>
                  <br />
                  {pending.length} commande{pending.length > 1 ? 's attendent' : ' attend'} toi.
                </>
              )}
            </h1>

            {(totalUnpaid > 0 || toRelance.length > 0) && (
              <p className="mt-3 text-white/75 text-base leading-relaxed max-w-lg">
                {totalUnpaid > 0 && <>Tu as <strong className="text-white">{formatPrice(totalUnpaid, shop?.currency)}</strong> en attente. </>}
                {toRelance.length > 0 && <>{toRelance.length} commande{toRelance.length > 1 ? 's' : ''} sans nouvelle depuis 2 jours.</>}
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2.5">
              <Link href="/admin/orders" className="btn-primary px-5 text-sm">
                <MessageCircle className="w-4 h-4" /> Ouvrir les commandes
              </Link>
              <Link href="/admin/orders" className="btn px-5 py-3 text-sm rounded-full"
                    style={{ background: 'rgba(255,255,255,0.10)', border: '1.5px solid rgba(255,255,255,0.18)', color: 'white' }}>
                <Plus className="w-4 h-4" /> Nouvelle commande
              </Link>
              <button onClick={copyLink}
                      className="btn px-5 py-3 text-sm rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.14)', color: 'white' }}>
                <Copy className="w-4 h-4" /> {copied ? 'Lien copié !' : 'Partager la boutique'}
              </button>
            </div>
          </div>

          <div className="hidden lg:flex justify-center">
            <DayRing value={todayRevenue} goal={Math.max(todayRevenue * 1.5, 50000)} currency={shop?.currency} />
          </div>
        </div>

        <div className="relative grid grid-cols-2 sm:grid-cols-4 border-t border-white/10">
          <HeroKpiCell
            label="À encaisser"
            value={formatPriceCompact(totalUnpaid)}
            sub={`${shop?.currency || 'FCFA'} · ${unpaid.length} commande${unpaid.length > 1 ? 's' : ''}`}
            accent="#FF6A2C"
            icon={<TrendingUp className="w-3.5 h-3.5" />}
          />
          <HeroKpiCell
            label="À préparer"
            value={String(pending.length + confirmed)}
            sub="commandes"
            accent="#3F7BDC"
            icon={<Package className="w-3.5 h-3.5" />}
          />
          <HeroKpiCell
            label="Aujourd'hui"
            value={formatPriceCompact(todayRevenue)}
            sub={`${shop?.currency || 'FCFA'} · ${todayOrders.length} commande${todayOrders.length > 1 ? 's' : ''}`}
            accent="#1FB955"
            icon={<BarChart3 className="w-3.5 h-3.5" />}
          />
          <HeroKpiCell
            label="Total"
            value={formatPriceCompact(totalRevenue)}
            sub={`${shop?.currency || 'FCFA'} · ${orders.length} commandes`}
            accent="#FFFFFF"
            icon={<ShoppingBag className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Priorités du jour + Activité */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-5">
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="display-serif text-2xl sm:text-3xl">Priorités du jour</h2>
            <Link href="/admin/orders" className="text-xs font-extrabold text-slate-500 inline-flex items-center gap-1">
              Tout voir <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid gap-2.5">
            {insights.length === 0 && toRelance.length === 0 && pending.length === 0 && (
              <div className="premium-card p-6 text-center">
                <CheckCircle className="w-10 h-10 mx-auto text-wa mb-2" />
                <p className="font-extrabold text-gray-800">Tout est sous contrôle</p>
                <p className="text-sm text-gray-500 mt-1">Aucune action urgente pour le moment.</p>
              </div>
            )}

            {insights.slice(0, 4).map((insight, i) => {
              const priority = (insight as any).priority || 'medium';
              const borderColor = priority === 'high' ? '#E1483D' : priority === 'medium' ? '#FF6A2C' : 'rgba(15,23,42,0.08)';
              const accent = priority === 'high' ? '#FF6A2C' : priority === 'medium' ? '#3F7BDC' : '#1FB955';
              return (
                <div key={i} className="premium-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4 cursor-pointer"
                     style={{ borderLeft: `4px solid ${borderColor}` }}
                     onClick={() => (insight as any).href && (window.location.href = (insight as any).href)}>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl"
                       style={{ background: `${accent}18` }}>
                    {(insight as any).emoji || '⚡'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-gray-800 leading-snug">{(insight as any).text}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              );
            })}

            {insights.length < 2 && toRelance.length > 0 && (
              <div className="premium-card p-4 sm:p-5 flex items-center gap-3 sm:gap-4"
                   style={{ borderLeft: '4px solid #FF6A2C' }}>
                <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                     style={{ background: 'rgba(255,106,44,0.18)', color: '#FF6A2C' }}>
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-extrabold tracking-[-0.01em] text-gray-950 m-0 truncate">Relance — {toRelance[0].customerName}</h3>
                  <p className="text-[12.5px] text-gray-500 font-semibold mt-0.5 truncate">
                    Commande {toRelance[0].orderNumber} · {formatPrice(toRelance[0].total, shop?.currency)} · J+{Math.floor((Date.now() - new Date(toRelance[0].createdAt).getTime()) / 86400000)}
                  </p>
                </div>
                <button onClick={() => quickRelance(toRelance[0])}
                        disabled={sending === toRelance[0].id}
                        className="px-4 py-2.5 rounded-full text-[12px] font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap bg-ink text-white">
                  {sending === toRelance[0].id ? 'Envoi...' : 'Relancer'}
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="grid gap-4 content-start">
          <div className="premium-card p-5">
            <div className="text-[11px] font-extrabold tracking-[0.22em] uppercase text-wa-dark">Actions rapides</div>
            <div className="grid gap-2 mt-3">
              <Link href="/admin/products"
                    className="btn-primary px-4 text-sm justify-start rounded-2xl py-3">
                <Plus className="w-4 h-4" /> Ajouter un produit
                <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
              </Link>
              <Link href="/admin/products"
                    className="btn-orange px-4 text-sm justify-start rounded-2xl py-3">
                <Zap className="w-4 h-4" /> Photo + fiche IA
                <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
              </Link>
              <Link href="/admin/orders"
                    className="btn-dark px-4 text-sm justify-start rounded-2xl py-3">
                <CheckCircle className="w-4 h-4" /> Enregistrer un paiement
                <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
              </Link>
              <button onClick={copyLink}
                      className="btn-secondary px-4 text-sm justify-start rounded-2xl py-3">
                <Copy className="w-4 h-4" /> {copied ? 'Lien copié !' : 'Partager la boutique'}
                <ChevronRight className="w-3 h-3 ml-auto opacity-60" />
              </button>
            </div>
          </div>

          <div className="premium-card p-5">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-extrabold tracking-[0.22em] uppercase text-slate-400">Dernières commandes</div>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold text-wa">
                <span className="pulse-dot" /> live
              </span>
            </div>
            <div className="grid gap-3 mt-3">
              {recentOrders.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">Aucune commande</p>
              )}
              {recentOrders.slice(0, 4).map((o: any) => (
                <Link key={o.id} href={`/admin/orders`} className="flex items-center gap-3 group">
                  <div className="w-9 h-9 rounded-full text-white flex items-center justify-center font-black text-xs"
                       style={{ background: o.status === 'DELIVERED' ? '#1FB955' : o.status === 'PENDING' ? '#FF6A2C' : '#3F7BDC' }}>
                    {(o.customerName || 'C').split(' ').map((x: string) => x[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-extrabold truncate">{o.customerName || 'Client'}</div>
                    <div className="text-[10.5px] text-slate-500 font-semibold">{o.orderNumber} · {STATUS_LABEL[o.status]}</div>
                  </div>
                  <div className="display-serif text-base leading-none">
                    {(o.total || 0).toLocaleString('fr-FR')}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}