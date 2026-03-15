'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, getProducts } from '@/lib/firestore';
import { formatPrice } from '@/lib/utils';
import { sendWhatsApp } from '@/lib/whatsapp';
import { Plus, MessageCircle, Clock, CheckCircle, Package, ArrowRight, Copy, ExternalLink, AlertTriangle, ChevronRight, Users } from 'lucide-react';

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

export default function DashboardPage() {
  const { shop } = useAuth();
  const [orders, setOrders]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const primaryColor = shop?.primaryColor || '#ec4899';

  useEffect(() => {
    if (!shop?.id) return;
    getOrders(shop.id).then(o => { setOrders(o); setLoading(false); });
  }, [shop?.id]);

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}/${shop?.slug}`);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  // ── KPIs clés ────────────────────────────────────────────────────────────
  const pending       = orders.filter(o => o.status === 'PENDING');
  const processing    = orders.filter(o => o.status === 'PROCESSING');
  const unpaid        = orders.filter(o => ['PENDING','CONFIRMED','PROCESSING'].includes(o.status));
  const totalUnpaid   = unpaid.reduce((s, o) => s + o.total, 0);
  const today         = new Date(); today.setHours(0,0,0,0);
  const todayOrders   = orders.filter(o => new Date(o.createdAt) >= today);
  const todayRevenue  = todayOrders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
  const recentOrders  = orders.slice(0, 8);

  // Clients à relancer = commandes non livrées depuis plus de 2 jours
  const twoDaysAgo = new Date(); twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const toRelance = orders.filter(o =>
    ['PENDING','CONFIRMED','PROCESSING'].includes(o.status) &&
    new Date(o.createdAt) < twoDaysAgo
  );

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

  return (
    <div className="space-y-5 max-w-2xl">

      {/* ── ACTIONS RAPIDES ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/admin/orders"
          className="flex items-center gap-3 p-4 rounded-2xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
          style={{ background: `linear-gradient(135deg,${primaryColor},${primaryColor}cc)` }}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Plus className="w-5 h-5" />
          </div>
          <span>Nouvelle commande</span>
        </Link>
        <Link href="/admin/clients"
          className="flex items-center gap-3 p-4 rounded-2xl text-white font-bold text-sm shadow-lg hover:opacity-90 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <span>Contacter client</span>
        </Link>
      </div>

      {/* ── KPIs ESSENTIELS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Commandes en attente */}
        <Link href="/admin/orders?status=PENDING" className="stat-card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">En attente</p>
          </div>
          <p className="text-3xl font-black text-amber-600">{pending.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {processing.length > 0 ? `+ ${processing.length} en préparation` : 'commande(s)'}
          </p>
        </Link>

        {/* Montant à récupérer */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-orange-100 rounded-xl flex items-center justify-center">
              <span className="text-orange-600 font-bold text-sm">💰</span>
            </div>
            <p className="text-xs text-gray-500 font-medium">À récupérer</p>
          </div>
          <p className="text-xl font-black text-orange-600">{formatPrice(totalUnpaid, shop?.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{unpaid.length} commande(s) non livrée(s)</p>
        </div>

        {/* Clients à relancer */}
        <Link href="/admin/clients" className="stat-card hover:shadow-md transition-shadow">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">À relancer</p>
          </div>
          <p className="text-3xl font-black text-green-600">{toRelance.length}</p>
          <p className="text-xs text-gray-400 mt-1">en attente depuis +2j</p>
        </Link>

        {/* CA aujourd'hui */}
        <div className="stat-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Aujourd'hui</p>
          </div>
          <p className="text-xl font-black text-emerald-600">{formatPrice(todayRevenue, shop?.currency)}</p>
          <p className="text-xs text-gray-400 mt-1">{todayOrders.length} commande(s)</p>
        </div>
      </div>

      {/* ── ALERTES ──────────────────────────────────────────────────── */}
      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-amber-800 text-sm">{pending.length} commande(s) en attente de confirmation</p>
            <p className="text-xs text-amber-600">Confirmez-les pour notifier vos clients</p>
          </div>
          <Link href="/admin/orders" className="text-amber-700 font-bold text-sm flex-shrink-0">Voir →</Link>
        </div>
      )}

      {toRelance.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
          <MessageCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-bold text-green-800 text-sm">{toRelance.length} client(s) à relancer</p>
            <p className="text-xs text-green-600">Commandes en attente depuis plus de 2 jours</p>
          </div>
          <button
            onClick={() => toRelance[0] && quickRelance(toRelance[0])}
            disabled={!!sending}
            className="text-white text-xs font-bold px-3 py-1.5 rounded-lg flex-shrink-0"
            style={{ backgroundColor: '#25D366' }}>
            {sending ? '...' : '💬 Relancer'}
          </button>
        </div>
      )}

      {/* ── LIEN BOUTIQUE ────────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 text-white flex items-center justify-between gap-3"
        style={{ background: `linear-gradient(135deg,${primaryColor},${primaryColor}bb)` }}>
        <div className="min-w-0">
          <p className="font-bold text-sm">🔗 Lien de votre boutique</p>
          <p className="text-white/70 text-xs truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/{shop?.slug}</p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={copyLink} className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
            {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <Link href={`/${shop?.slug}`} target="_blank" className="p-2 bg-white/20 rounded-xl hover:bg-white/30 transition-colors">
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── DERNIÈRES COMMANDES ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-100">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
          <h3 className="font-bold text-gray-800">Dernières commandes</h3>
          <Link href="/admin/orders" className="text-xs font-semibold flex items-center gap-1" style={{ color: primaryColor }}>
            Tout voir <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-12 h-12 mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">Aucune commande</p>
            <Link href="/admin/orders"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-xl text-white text-sm font-bold"
              style={{ backgroundColor: primaryColor }}>
              <Plus className="w-4 h-4" />Créer une commande
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order: any) => (
              <div key={order.id} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: primaryColor }}>
                    {order.customerName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{order.customerName}</p>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[order.status]}`}>
                        {STATUS_LABEL[order.status]}
                      </span>
                      <p className="text-xs text-gray-400">{order.orderNumber}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-bold text-gray-800 text-sm">{formatPrice(order.total, shop?.currency)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                  {/* Bouton WhatsApp rapide si pas livré */}
                  {order.customerPhone && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                    <button
                      onClick={() => quickRelance(order)}
                      disabled={sending === order.id}
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

      {/* ── RACCOURCIS ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { href: '/admin/clients',  emoji: '👥', label: 'Clients',    color: '#dbeafe', border: '#93c5fd' },
          { href: '/admin/products', emoji: '📦', label: 'Produits',   color: '#fef3c7', border: '#fde68a' },
          { href: '/admin/whatsapp', emoji: '💬', label: 'WhatsApp',   color: '#dcfce7', border: '#86efac' },
        ].map((s, i) => (
          <Link key={i} href={s.href}
            style={{ background: s.color, border: `2px solid ${s.border}` }}
            className="rounded-2xl p-4 flex flex-col items-center gap-2 hover:opacity-80 transition-opacity text-center">
            <span className="text-2xl">{s.emoji}</span>
            <p className="text-xs font-bold text-gray-700">{s.label}</p>
          </Link>
        ))}
      </div>

    </div>
  );
}