'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders } from '@/lib/firestore';
import { sendWhatsApp } from '@/lib/whatsapp';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/lib/types';
import { ChevronRight, MessageCircle, Phone, Search, ShoppingBag, TrendingUp, UserRound, Users, X } from 'lucide-react';

interface Client {
  name: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string;
  lastOrderStatus: Order['status'];
  orders: Order[];
}

function buildClients(orders: Order[]): Client[] {
  const map: Record<string, Client> = {};
  orders.forEach((o) => {
    const key = o.customerPhone || o.customerName;
    if (!map[key]) {
      map[key] = {
        name: o.customerName,
        phone: o.customerPhone,
        totalOrders: 0,
        totalSpent: 0,
        lastOrderAt: o.createdAt,
        lastOrderStatus: o.status,
        orders: [],
      };
    }
    map[key].totalOrders++;
    if (o.status === 'DELIVERED') map[key].totalSpent += o.total;
    if (new Date(o.createdAt) > new Date(map[key].lastOrderAt)) {
      map[key].lastOrderAt = o.createdAt;
      map[key].lastOrderStatus = o.status;
    }
    map[key].orders.push(o);
  });
  return Object.values(map).sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());
}

const STATUS_BADGE: Record<string, string> = {
  PENDING: 'badge-pending',
  CONFIRMED: 'badge-confirmed',
  PROCESSING: 'badge-processing',
  DELIVERED: 'badge-delivered',
  CANCELLED: 'badge-cancelled',
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmee',
  PROCESSING: 'En preparation',
  DELIVERED: 'Livree',
  CANCELLED: 'Annulee',
};

const AVATAR_COLORS = ['bg-[#25D366]', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500'];
const avatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ClientsPage() {
  const { shop } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  useEffect(() => {
    if (!shop?.id) return;
    getOrders(shop.id).then((orders) => {
      setClients(buildClients(orders));
      setLoading(false);
    });
  }, [shop?.id]);

  const filtered = useMemo(
    () =>
      clients.filter((client) =>
        `${client.name} ${client.phone}`.toLowerCase().includes(search.toLowerCase())
      ),
    [clients, search]
  );

  async function handleWa(type: 'contact' | 'payment_reminder' | 'send_receipt', client: Client) {
    if (!shop?.id || !client.phone) return;
    setSending(type);
    try {
      const lastOrder = client.orders[0];
      await sendWhatsApp(type, {
        shopId: shop.id,
        shopName: shop.name,
        customerPhone: client.phone,
        customerName: client.name,
        orderId: lastOrder?.id,
        orderRef: lastOrder?.orderNumber,
        total: lastOrder?.total,
        amountPaid: lastOrder?.amountPaid,
        reste: lastOrder?.balanceDue,
        currency: shop.currency,
      });
    } finally {
      setSending(null);
    }
  }

  const activeClients = clients.filter((client) => client.lastOrderStatus !== 'CANCELLED').length;
  const repeatClients = clients.filter((client) => client.totalOrders > 1).length;
  const totalRevenue = clients.reduce((sum, client) => sum + client.totalSpent, 0);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-t-transparent border-wa" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-500">Clients</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-gray-900">Retrouver vite le bon client et son historique</h1>
            <p className="mt-2 text-sm leading-7 text-gray-500">
              Cette page doit rester simple: qui est le client, combien il a commande, et quelle action est utile maintenant.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <MetricCard value={clients.length} label="Total" tone="default" />
            <MetricCard value={activeClients} label="Actifs" tone="orange" />
            <MetricCard value={repeatClients} label="Reviennent" tone="emerald" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Base clients</p>
              <h2 className="mt-1 text-xl font-black text-gray-900">Liste des clients</h2>
            </div>
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">CA client total</p>
              <p className="mt-1 text-lg font-black text-emerald-700">{formatPrice(totalRevenue, shop?.currency)}</p>
            </div>
          </div>

          <div className="relative mt-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Nom ou telephone..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-sm outline-none transition focus:border-orange-200 focus:bg-white focus:ring-2 focus:ring-orange-100"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2">
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 rounded-[28px] border border-dashed border-gray-200 bg-gray-50 p-10 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-200" />
              <p className="mt-3 font-semibold text-gray-700">Aucun client trouve</p>
              <p className="mt-1 text-sm text-gray-500">Essaie un autre nom ou un autre numero.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {filtered.map((client, index) => (
                <button
                  key={`${client.phone}-${index}`}
                  onClick={() => setSelected(client)}
                  className={`w-full rounded-[24px] border p-4 text-left transition ${
                    selected?.phone === client.phone
                      ? 'border-orange-200 bg-orange-50 shadow-soft'
                      : 'border-gray-100 bg-white hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-soft'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-sm font-black text-white ${avatarColor(client.name)}`}>
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-black text-gray-900">{client.name}</p>
                        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                          <Phone className="h-3 w-3" />
                          {client.phone || 'Numero non renseigne'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-bold text-gray-700">{client.totalOrders} commande{client.totalOrders > 1 ? 's' : ''}</p>
                        <p className="mt-1 text-xs font-semibold text-emerald-700">{formatPrice(client.totalSpent, shop?.currency)}</p>
                      </div>
                      {client.phone && (
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleWa('contact', client);
                          }}
                          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-gray-300" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <div className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-100 text-orange-700">
                <UserRound className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Fiche client</p>
                <h2 className="mt-1 text-lg font-black text-gray-900">{selected ? selected.name : 'Choisir un client'}</h2>
              </div>
            </div>

            {!selected ? (
              <div className="mt-5 rounded-[24px] border border-dashed border-gray-200 bg-gray-50 p-6 text-sm leading-7 text-gray-500">
                Selectionne un client pour voir son resume, ses commandes et les actions utiles.
              </div>
            ) : (
              <div className="mt-5 space-y-4">
                <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-gray-900">{selected.name}</p>
                      <p className="mt-1 text-sm text-gray-500">{selected.phone || 'Numero non renseigne'}</p>
                    </div>
                    <span className={`badge text-[10px] ${STATUS_BADGE[selected.lastOrderStatus] || 'badge-pending'}`}>
                      {STATUS_LABEL[selected.lastOrderStatus]}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-soft">
                    <ShoppingBag className="mb-2 h-4 w-4 text-gray-400" />
                    <p className="text-2xl font-black text-gray-900">{selected.totalOrders}</p>
                    <p className="text-xs font-semibold text-gray-500">Commandes</p>
                  </div>
                  <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 p-4 shadow-soft">
                    <TrendingUp className="mb-2 h-4 w-4 text-emerald-600" />
                    <p className="text-lg font-black text-emerald-700">{formatPrice(selected.totalSpent, shop?.currency)}</p>
                    <p className="text-xs font-semibold text-emerald-700/80">Total depense</p>
                  </div>
                </div>

                {selected.phone && (
                  <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/80 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Actions rapides</p>
                    <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      {[
                        { type: 'contact' as const, label: 'Contacter' },
                        { type: 'payment_reminder' as const, label: 'Rappel paiement' },
                        { type: 'send_receipt' as const, label: 'Envoyer recu' },
                      ].map(({ type, label }) => (
                        <button
                          key={type}
                          onClick={() => void handleWa(type, selected)}
                          disabled={sending === type}
                          className="rounded-2xl border border-emerald-200 bg-white px-3 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
                        >
                          {sending === type ? '...' : label}
                        </button>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-emerald-700/80">
                      Ces actions ouvrent WhatsApp. Rien n est envoye sans validation.
                    </p>
                  </div>
                )}

                <details className="rounded-[24px] border border-gray-100 bg-white p-4 shadow-soft" open>
                  <summary className="cursor-pointer list-none text-sm font-black text-gray-800">
                    Voir l historique de ce client
                  </summary>
                  <div className="mt-4 space-y-2">
                    {selected.orders.map((order, index) => (
                      <div key={`${order.orderNumber}-${index}`} className="flex items-center justify-between rounded-2xl border border-gray-100 bg-gray-50 p-3">
                        <div>
                          <p className="text-sm font-black text-gray-900">{order.orderNumber}</p>
                          <p className="mt-1 text-xs text-gray-400">{shortDate(order.createdAt)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-gray-900">{formatPrice(order.total, shop?.currency)}</p>
                          <span className={`mt-1 inline-flex ${STATUS_BADGE[order.status] || 'badge-pending'} text-[10px]`}>
                            {STATUS_LABEL[order.status]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>

          <div className="rounded-[32px] border border-gray-100 bg-white p-5 shadow-soft">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Lecture rapide</p>
            <div className="mt-3 space-y-3 text-sm leading-7 text-gray-600">
              <div className="rounded-[24px] border border-gray-100 bg-gray-50 p-4">
                Cette page doit aider a retrouver un client, voir s il revient souvent, et relancer proprement si besoin.
              </div>
              <div className="rounded-[24px] border border-orange-100 bg-orange-50 p-4 text-orange-900">
                Si une fiche client devient trop longue, on garde le resume visible et on replie l historique.
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function MetricCard({ value, label, tone }: { value: number; label: string; tone: 'default' | 'orange' | 'emerald' }) {
  const toneClass =
    tone === 'orange'
      ? 'bg-orange-50 border-orange-100 text-orange-700'
      : tone === 'emerald'
        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
        : 'bg-gray-50 border-gray-100 text-gray-800';

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClass}`}>
      <p className="text-lg font-black">{value}</p>
      <p className="mt-1 text-xs font-semibold opacity-80">{label}</p>
    </div>
  );
}
