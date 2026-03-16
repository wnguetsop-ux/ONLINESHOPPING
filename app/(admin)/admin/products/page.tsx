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
  ShoppingBag, Zap
} from 'lucide-react';

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
            <button onClick={copyLink} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">{copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <CopyIcon className="w-4 h-4 text-gray-400" />}</button>
            <Link href={`/${shop?.slug}`} target="_blank" className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"><ExternalLink className="w-4 h-4 text-gray-400" /></Link>
          </div>
        </div>
      </div>
    );
  }

  // ── VUE UTILISATEUR ACTIF ─────────────────────────────────────────────────
  return (
    <div className="space-y-5 max-w-2xl">

      {/* Actions rapides */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/orders" className="flex items-center gap-3 p-4 rounded-2xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity" style={{ background: `linear-gradient(135deg,${primaryColor},${primaryColor}cc)` }}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><Plus className="w-5 h-5" /></div>
          <span>Nouvelle commande</span>
        </Link>
        <Link href="/admin/clients" className="flex items-center gap-3 p-4 rounded-2xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity" style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0"><MessageCircle className="w-5 h-5" /></div>
          <span>Contacter client</span>
        </Link>
      </div>

      {/* ── PRIORITÉS DU JOUR ── */}
      {insights.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-50">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
              <Zap className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            </div>
            <h3 className="font-black text-gray-800 text-sm">Priorités du jour</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {insights.map((insight, i) => (
              <div key={i} className={`px-4 py-3 flex items-center gap-3 ${insight.href ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
                onClick={() => insight.href && (window.location.href = insight.href)}>
                <span className="text-lg flex-shrink-0">{insight.emoji}</span>
                <p className="text-sm text-gray-700 flex-1 leading-snug">{insight.text}</p>
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${PRIORITY_DOT[insight.priority]}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/orders" className="stat-card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center"><Clock className="w-4 h-4 text-amber-600" /></div><p className="text-xs text-gray-500 font-medium">En attente</p></div>
          <p className="text-3xl font-black text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-400 mt-1">commande(s)</p>
        </Link>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center"><span className="text-orange-600 font-bold text-sm">💰</span></div><p className="text-xs text-gray-500 font-medium">À récupérer</p></div>
          <p className="text-xl font-black text-orange-600">{formatPrice(totalUnpaid, shop?.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{unpaid.length} commande(s)</p>
        </div>
        <Link href="/admin/clients" className="stat-card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center"><Users className="w-4 h-4 text-green-600" /></div><p className="text-xs text-gray-500 font-medium">À relancer</p></div>
          <p className="text-3xl font-black text-green-600">{toRelance.length}</p>
          <p className="text-xs text-gray-400 mt-1">depuis +2j</p>
        </Link>
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-4 h-4 text-emerald-600" /></div><p className="text-xs text-gray-500 font-medium">Aujourd'hui</p></div>
          <p className="text-xl font-black text-emerald-600">{formatPrice(todayRevenue, shop?.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{todayOrders.length} commande(s)</p>
        </div>
      </div>

      {/* Alertes */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1"><p className="font-bold text-amber-800 text-sm">{pending.length} commande(s) à confirmer</p><p className="text-xs text-amber-600">Confirmez pour notifier vos clients sur WhatsApp</p></div>
          <Link href="/admin/orders" className="text-amber-700 font-bold text-sm flex-shrink-0">Voir →</Link>
        </div>
      )}
      {toRelance.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1"><p className="font-bold text-green-800 text-sm">{toRelance.length} client(s) à relancer</p><p className="text-xs text-green-600">En attente depuis plus de 2 jours</p></div>
          <button onClick={() => toRelance[0] && quickRelance(toRelance[0])} disabled={!!sending}
            className="text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0" style={{ backgroundColor: '#25D366' }}>
            {sending ? '...' : '💬 Relancer'}
          </button>
        </div>
      )}

      {/* Lien boutique */}
      <div className="rounded-2xl p-4 text-white flex items-center justify-between gap-3" style={{ background: `linear-gradient(135deg,${primaryColor},${primaryColor}bb)` }}>
        <div className="min-w-0">
          <p className="font-bold text-sm">🔗 Lien de votre boutique</p>
          <p className="text-white/70 text-xs truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/{shop?.slug}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={copyLink} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">{copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</button>
          <Link href={`/${shop?.slug}`} target="_blank" className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"><ExternalLink className="w-4 h-4" /></Link>
        </div>
      </div>

      {/* Dernières commandes */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h3 className="font-bold text-gray-800">Dernières commandes</h3>
          <Link href="/admin/orders" className="text-xs font-semibold flex items-center gap-1" style={{ color: primaryColor }}>Tout voir <ArrowRight className="w-3.5 h-3.5" /></Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-12 h-12 mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">Aucune commande</p>
            <Link href="/admin/orders" className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-white text-sm font-bold" style={{ backgroundColor: primaryColor }}>
              <Plus className="w-4 h-4" />Créer une commande
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: primaryColor }}>
                    {order.customerName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{order.customerName}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm">{formatPrice(order.total, shop?.currency)}</p>
                    <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</p>
                  </div>
                  {order.customerPhone && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                    <button onClick={() => quickRelance(order)} disabled={sending === order.id}
                      className="w-8 h-8 bg-green-50 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                      <MessageCircle className="w-4 h-4 text-green-600" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/admin/clients',  emoji: '👥', label: 'Clients',  color: '#dbeafe', border: '#93c5fd' },
          { href: '/admin/products', emoji: '📦', label: 'Produits', color: '#fef3c7', border: '#fde68a' },
          { href: '/admin/whatsapp', emoji: '💬', label: 'WhatsApp', color: '#dcfce7', border: '#86efac' },
        ].map((s, i) => (
          <Link key={i} href={s.href} style={{ background: s.color, border: `2px solid ${s.border}` }}
            className="rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity text-center">
            <span className="text-2xl">{s.emoji}</span>
            <p className="text-xs font-bold text-gray-700">{s.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}