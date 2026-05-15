'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  getWhatsappThreads,
  getWhatsappMessages,
  getCustomerProfileById,
  markThreadAsProcessed,
} from '@/lib/merchant-firestore';
import { getOrders } from '@/lib/firestore';
import { formatPrice } from '@/lib/utils';
import {
  WhatsappThread,
  WhatsappMessage,
  Customer,
  Order,
  MessageIntentCategory,
} from '@/lib/types';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  Inbox,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  ShoppingBag,
  X,
} from 'lucide-react';

// ── Intent metadata ──────────────────────────────────────────────────────────

const INTENT: Record<MessageIntentCategory, { label: string; color: string }> = {
  new_order_request: { label: 'Nouvelle commande',  color: 'bg-emerald-100 text-emerald-700' },
  product_question:  { label: 'Question produit',   color: 'bg-blue-100 text-blue-700'       },
  payment_proof:     { label: 'Preuve paiement',    color: 'bg-purple-100 text-purple-700'   },
  delivery_question: { label: 'Question livraison', color: 'bg-amber-100 text-amber-700'     },
  order_followup:    { label: 'Suivi commande',     color: 'bg-slate-100 text-slate-600'     },
  support_issue:     { label: 'Support',            color: 'bg-red-100 text-red-600'         },
  unknown:           { label: '',                   color: ''                                 },
};

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

// ── Helpers ──────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'à l\'instant';
  if (m < 60) return `${m}min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}j`;
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function initials(name: string): string {
  return name
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  'bg-[#25D366]', 'bg-blue-500', 'bg-purple-500',
  'bg-orange-500', 'bg-pink-500', 'bg-indigo-500',
];
function avatarColor(name: string) {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

// ── Thread list item ─────────────────────────────────────────────────────────

function ThreadItem({
  thread,
  customerName,
  active,
  onClick,
}: {
  thread: WhatsappThread;
  customerName: string;
  active: boolean;
  onClick: () => void;
}) {
  const intent = INTENT[thread.lastCategory || 'unknown'];
  return (
    <button
      onClick={onClick}
      className={`w-full text-left flex items-center gap-3 px-4 py-3.5 transition-colors border-b border-app-border ${
        active ? 'bg-wa-soft' : 'hover:bg-slate-50'
      }`}
    >
      {/* Avatar */}
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(customerName)}`}>
        {initials(customerName)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={`text-sm font-bold truncate ${active ? 'text-wa-dark' : 'text-slate-800'}`}>
            {customerName}
          </p>
          <span className="text-[10px] text-slate-400 flex-shrink-0">{relativeTime(thread.lastMessageAt)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-400 truncate">{thread.lastMessage || '—'}</p>
          <div className="flex items-center gap-1 flex-shrink-0">
            {thread.unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 bg-wa rounded-full flex items-center justify-center text-[9px] font-black text-white">
                {thread.unreadCount > 99 ? '99+' : thread.unreadCount}
              </span>
            )}
          </div>
        </div>
        {intent.label && (
          <span className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${intent.color}`}>
            {intent.label}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: WhatsappMessage }) {
  const isOut = msg.direction === 'outgoing';
  const intent = INTENT[msg.category || 'unknown'];
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-[80%] ${isOut ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {/* Intent badge on first meaningful message */}
        {!isOut && intent.label && (
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${intent.color}`}>
            {intent.label}
          </span>
        )}
        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
          isOut
            ? 'bg-[#DCF8C6] text-slate-800 rounded-br-sm'
            : 'bg-white border border-app-border text-slate-800 rounded-bl-sm'
        }`}>
          {msg.type === 'image' && msg.media?.url ? (
            <img src={msg.media.url} alt="media" className="rounded-lg max-w-[200px] mb-1" />
          ) : null}
          {msg.text || msg.media?.caption || (msg.type !== 'text' ? `[${msg.type}]` : '—')}
        </div>
        <span className="text-[9px] text-slate-400 px-1">
          {new Date(msg.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function InboxPage() {
  const { shop } = useAuth();

  const [threads,       setThreads]       = useState<WhatsappThread[]>([]);
  const [customers,     setCustomers]     = useState<Record<string, Customer>>({});
  const [loadingList,   setLoadingList]   = useState(true);

  const [selectedThread, setSelectedThread] = useState<WhatsappThread | null>(null);
  const [messages,       setMessages]       = useState<WhatsappMessage[]>([]);
  const [linkedOrder,    setLinkedOrder]    = useState<Order | null>(null);
  const [loadingChat,    setLoadingChat]    = useState(false);
  const [showOrderPanel, setShowOrderPanel] = useState(false);

  // Mobile: which panel is visible
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Load thread list ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!shop?.id) return;
    setLoadingList(true);
    getWhatsappThreads(shop.id).then(async ts => {
      setThreads(ts);
      // Load customer names in batch
      const map: Record<string, Customer> = {};
      await Promise.all(
        ts.map(async t => {
          if (!customers[t.customerId]) {
            const c = await getCustomerProfileById(t.customerId).catch(() => null);
            if (c) map[t.customerId] = c;
          }
        })
      );
      setCustomers(prev => ({ ...prev, ...map }));
      setLoadingList(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.id]);

  // ── Open a thread ──────────────────────────────────────────────────────────
  async function openThread(thread: WhatsappThread) {
    setSelectedThread(thread);
    setMessages([]);
    setLinkedOrder(null);
    setLoadingChat(true);
    setMobileView('chat');

    const [msgs, orders] = await Promise.all([
      getWhatsappMessages(thread.id!),
      thread.linkedOrderId && shop?.id ? getOrders(shop.id) : Promise.resolve([]),
    ]);
    setMessages(msgs);

    if (thread.linkedOrderId && Array.isArray(orders)) {
      const o = (orders as Order[]).find(o => o.id === thread.linkedOrderId) || null;
      setLinkedOrder(o);
    }

    // Mark as read
    if (thread.unreadCount > 0) {
      markThreadAsProcessed(thread.id!).catch(() => null);
      setThreads(prev =>
        prev.map(t => t.id === thread.id ? { ...t, unreadCount: 0, status: 'processed' } : t)
      );
    }

    setLoadingChat(false);
  }

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Customer name helper ───────────────────────────────────────────────────
  function customerName(thread: WhatsappThread): string {
    const c = customers[thread.customerId];
    return c?.name || thread.customerId.slice(-8);
  }

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!loadingList && threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-16 h-16 bg-wa-soft border border-wa-border rounded-2xl flex items-center justify-center mb-4">
          <Inbox className="w-8 h-8 text-wa-dark" />
        </div>
        <h2 className="text-lg font-extrabold text-slate-800 mb-1">Inbox vide</h2>
        <p className="text-sm text-slate-400 max-w-xs">
          Les conversations WhatsApp apparaîtront ici dès que vos clients vous écriront.
        </p>
        <div className="mt-4 bg-wa-soft border border-wa-border rounded-xl px-4 py-3 text-xs text-wa-dark font-semibold max-w-xs">
          Connectez votre numéro WhatsApp Business dans &ldquo;WhatsApp&rdquo; pour commencer.
        </div>
      </div>
    );
  }

  // ── Layout ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-var(--admin-header-h,56px)-var(--bottom-nav-h,0px))] -m-4 lg:-m-6 flex overflow-hidden">

      {/* ════════════════════════════════════════════════════════════════════
          LEFT — Thread list
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`
        flex flex-col border-r border-app-border bg-white
        w-full lg:w-80 xl:w-96 flex-shrink-0
        ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}
      `}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-app-border flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-base font-extrabold text-slate-900">Inbox</h1>
            {totalUnread > 0 && (
              <p className="text-[11px] text-wa-dark font-semibold">
                {totalUnread} message{totalUnread > 1 ? 's' : ''} non lu{totalUnread > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button
            onClick={() => {
              if (!shop?.id) return;
              setLoadingList(true);
              getWhatsappThreads(shop.id).then(ts => { setThreads(ts); setLoadingList(false); });
            }}
            className="btn-icon hover:bg-slate-100 text-slate-400"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-4 h-4 ${loadingList ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loadingList ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-[3px] border-t-transparent border-wa rounded-full animate-spin" />
            </div>
          ) : (
            threads.map(t => (
              <ThreadItem
                key={t.id}
                thread={t}
                customerName={customerName(t)}
                active={selectedThread?.id === t.id}
                onClick={() => openThread(t)}
              />
            ))
          )}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          CENTER — Chat view
      ════════════════════════════════════════════════════════════════════ */}
      <div className={`
        flex-1 flex flex-col bg-[#F0FDF4] min-w-0
        ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}
      `}>
        {!selectedThread ? (
          /* No thread selected placeholder */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageCircle className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-400 font-medium">Sélectionnez une conversation</p>
            <p className="text-xs text-slate-300 mt-1">Les messages s&apos;affichent ici</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-4 py-3 bg-white border-b border-app-border flex items-center gap-3 flex-shrink-0">
              {/* Back (mobile) */}
              <button
                onClick={() => setMobileView('list')}
                className="lg:hidden btn-icon hover:bg-slate-100 text-slate-500 -ml-1"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Avatar */}
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${avatarColor(customerName(selectedThread))}`}>
                {initials(customerName(selectedThread))}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-slate-900 text-sm">{customerName(selectedThread)}</p>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {customers[selectedThread.customerId]?.phone || '—'}
                </p>
              </div>

              {/* Intent badge */}
              {selectedThread.lastCategory && selectedThread.lastCategory !== 'unknown' && (
                <span className={`hidden sm:inline-flex text-[10px] font-bold px-2 py-1 rounded-full ${INTENT[selectedThread.lastCategory].color}`}>
                  {INTENT[selectedThread.lastCategory].label}
                </span>
              )}

              {/* Order panel toggle */}
              {linkedOrder && (
                <button
                  onClick={() => setShowOrderPanel(p => !p)}
                  className="btn-icon hover:bg-slate-100 text-slate-500 relative"
                  title="Voir la commande"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-wa rounded-full" />
                </button>
              )}

              {/* Thread status */}
              {selectedThread.status === 'needs_attention' && (
                <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
              )}
              {selectedThread.status === 'processed' && (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {loadingChat ? (
                <div className="flex items-center justify-center h-full">
                  <div className="w-8 h-8 border-[3px] border-t-transparent border-wa rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm">Aucun message dans cette conversation</p>
                </div>
              ) : (
                messages.map((msg, i) => <MessageBubble key={msg.id || i} msg={msg} />)
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Mobile order summary (collapsible) */}
            {linkedOrder && showOrderPanel && (
              <div className="xl:hidden border-t border-app-border bg-white p-4">
                <OrderPanel order={linkedOrder} currency={shop?.currency} onClose={() => setShowOrderPanel(false)} />
              </div>
            )}
          </>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          RIGHT — Order panel (desktop only)
      ════════════════════════════════════════════════════════════════════ */}
      {selectedThread && (
        <div className="hidden xl:flex flex-col w-72 border-l border-app-border bg-white overflow-y-auto flex-shrink-0">
          {linkedOrder ? (
            <div className="p-4">
              <OrderPanel order={linkedOrder} currency={shop?.currency} />
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Package className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-semibold text-slate-400">Aucune commande liée</p>
              <p className="text-xs text-slate-300 mt-1">
                Cette conversation n&apos;est pas encore associée à une commande.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Order panel component ─────────────────────────────────────────────────────

function OrderPanel({
  order,
  currency,
  onClose,
}: {
  order: Order;
  currency?: string;
  onClose?: () => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Commande liée</p>
        {onClose && (
          <button onClick={onClose} className="btn-icon hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Order header */}
      <div className="bg-slate-50 rounded-2xl border border-app-border p-3.5 mb-3">
        <div className="flex items-center justify-between mb-2">
          <p className="font-black text-slate-900 text-sm">{order.orderNumber}</p>
          <span className={`badge text-[9px] ${STATUS_BADGE[order.status] || 'badge-pending'}`}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}
        </p>
      </div>

      {/* Items */}
      <div className="space-y-1.5 mb-3">
        {order.items.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-xs">
            <span className="text-slate-600 truncate max-w-[60%]">
              {item.quantity}× {item.productName}
            </span>
            <span className="font-semibold text-slate-800">
              {formatPrice(item.total, currency as any)}
            </span>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-app-border pt-3 space-y-1.5 text-xs">
        <div className="flex justify-between text-slate-500">
          <span>Sous-total</span>
          <span>{formatPrice(order.subtotal, currency as any)}</span>
        </div>
        {order.deliveryFee > 0 && (
          <div className="flex justify-between text-slate-500">
            <span>Livraison</span>
            <span>{formatPrice(order.deliveryFee, currency as any)}</span>
          </div>
        )}
        <div className="flex justify-between font-black text-slate-900 text-sm pt-1">
          <span>Total</span>
          <span>{formatPrice(order.total, currency as any)}</span>
        </div>
        {order.balanceDue > 0 && (
          <div className="flex justify-between text-red-600 font-bold">
            <span>Reste à payer</span>
            <span>{formatPrice(order.balanceDue, currency as any)}</span>
          </div>
        )}
      </div>

      {/* Quick action */}
      <a
        href={`/admin/orders?id=${order.id}`}
        className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-wa-soft border border-wa-border rounded-xl text-xs font-bold text-wa-dark hover:bg-wa hover:text-white transition-colors"
      >
        <ShoppingBag className="w-3.5 h-3.5" />
        Voir la commande
        <ChevronRight className="w-3 h-3 ml-auto" />
      </a>
    </div>
  );
}
