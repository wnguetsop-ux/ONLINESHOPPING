'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders } from '@/lib/firestore';
import { sendWhatsApp } from '@/lib/whatsapp';
import { formatPrice } from '@/lib/utils';
import { Order } from '@/lib/types';
import { Search, MessageCircle, Phone, ShoppingBag, TrendingUp, X, ChevronRight } from 'lucide-react';

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
  orders.forEach(o => {
    const key = o.customerPhone || o.customerName;
    if (!map[key]) {
      map[key] = { name: o.customerName, phone: o.customerPhone, totalOrders: 0, totalSpent: 0, lastOrderAt: o.createdAt, lastOrderStatus: o.status, orders: [] };
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

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', PROCESSING: 'En préparation',
  DELIVERED: 'Livrée', CANCELLED: 'Annulée',
};
const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', CONFIRMED: 'bg-blue-100 text-blue-700',
  PROCESSING: 'bg-purple-100 text-purple-700', DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function ClientsPage() {
  const { shop } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const primaryColor = shop?.primaryColor || '#ec4899';

  useEffect(() => {
    if (!shop?.id) return;
    getOrders(shop.id).then(orders => {
      setClients(buildClients(orders));
      setLoading(false);
    });
  }, [shop?.id]);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  async function handleWa(type: 'contact' | 'payment_reminder' | 'send_receipt', client: Client) {
    if (!shop?.id || !client.phone) return;
    setSending(type);
    const lastOrder = client.orders[0];
    await sendWhatsApp(type, {
      shopId: shop.id,
      shopName: shop.name,
      customerPhone: client.phone,
      customerName: client.name,
      orderId: lastOrder?.id,
      orderRef: lastOrder?.orderNumber,
      total: lastOrder?.total,
      reste: lastOrder?.total,
      currency: shop.currency,
    });
    setSending(null);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }} />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Clients</h1>
        <p className="text-gray-500 text-sm">{clients.length} client{clients.length !== 1 ? 's' : ''} au total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Total clients</p>
          <p className="text-2xl font-bold text-gray-800">{clients.length}</p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">Clients actifs</p>
          <p className="text-2xl font-bold text-gray-800">
            {clients.filter(c => c.lastOrderStatus !== 'CANCELLED').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-gray-500 mb-1">CA total</p>
          <p className="text-lg font-bold text-emerald-600">
            {formatPrice(clients.reduce((s, c) => s + c.totalSpent, 0), shop?.currency)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input type="text" placeholder="Rechercher par nom ou téléphone..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="input pl-9 text-sm w-full" />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
      </div>

      {/* Liste clients */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Aucun client trouvé</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {filtered.map((client, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelected(client)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: primaryColor }}>
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{client.name}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Phone className="w-3 h-3" />{client.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-700">{client.totalOrders} cmd</p>
                  <p className="text-xs text-emerald-600 font-medium">{formatPrice(client.totalSpent, shop?.currency)}</p>
                </div>
                {/* Bouton WhatsApp rapide */}
                {client.phone && (
                  <button onClick={e => { e.stopPropagation(); handleWa('contact', client); }}
                    className="w-8 h-8 bg-green-50 hover:bg-green-100 rounded-full flex items-center justify-center transition-colors flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                  </button>
                )}
                <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* == DETAIL CLIENT ============================================== */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: primaryColor }}>
                  {selected.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-bold">{selected.name}</h2>
                  <p className="text-xs text-gray-400">{selected.phone}</p>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 space-y-4">
              {/* Stats client */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <ShoppingBag className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                  <p className="text-xl font-bold text-gray-800">{selected.totalOrders}</p>
                  <p className="text-xs text-gray-500">Commandes</p>
                </div>
                <div className="bg-emerald-50 rounded-xl p-3 text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
                  <p className="text-lg font-bold text-emerald-700">{formatPrice(selected.totalSpent, shop?.currency)}</p>
                  <p className="text-xs text-gray-500">Total dépensé</p>
                </div>
              </div>

              {/* Actions WhatsApp */}
              {selected.phone && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                  <p className="text-xs font-bold text-green-700 mb-3 flex items-center gap-1.5">
                    <MessageCircle className="w-3.5 h-3.5" />Actions WhatsApp
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'contact' as const, label: '💬 Contacter' },
                      { type: 'payment_reminder' as const, label: '💰 Rappel paiement' },
                      { type: 'send_receipt' as const, label: '🧾 Envoyer reçu' },
                    ].map(({ type, label }) => (
                      <button key={type}
                        onClick={() => handleWa(type, selected)}
                        disabled={sending === type}
                        className="flex items-center justify-center px-2 py-2 bg-white border border-green-200 rounded-lg text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 text-center">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Historique commandes */}
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Historique commandes</p>
                <div className="space-y-2">
                  {selected.orders.map((order, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium text-sm text-gray-800">{order.orderNumber}</p>
                        <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        <p className="font-bold text-sm text-gray-800">{formatPrice(order.total, shop?.currency)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[order.status]}`}>
                          {STATUS_LABEL[order.status]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}