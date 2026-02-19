'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Clock, CheckCircle, Truck, Package, X, Phone, MapPin, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, updateOrderStatus } from '@/lib/firestore';
import { Order } from '@/lib/types';
import { formatPrice, formatDate, getWhatsAppLink } from '@/lib/utils';

const STATUS_CONFIG = {
  PENDING: { label: 'En attente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  CONFIRMED: { label: 'Confirmée', color: 'bg-blue-100 text-blue-700', icon: CheckCircle },
  PROCESSING: { label: 'En préparation', color: 'bg-purple-100 text-purple-700', icon: Package },
  DELIVERED: { label: 'Livrée', color: 'bg-emerald-100 text-emerald-700', icon: Truck },
  CANCELLED: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: X },
};

export default function OrdersPage() {
  const { shop } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<Order | null>(null);

  useEffect(() => {
    if (shop?.id) loadOrders();
  }, [shop?.id]);

  async function loadOrders() {
    if (!shop?.id) return;
    const data = await getOrders(shop.id);
    setOrders(data);
    setLoading(false);
  }

  async function changeStatus(orderId: string, status: Order['status']) {
    await updateOrderStatus(orderId, status);
    await loadOrders();
    if (selected?.id === orderId) {
      setSelected(prev => prev ? { ...prev, status } : null);
    }
  }

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;
  const primaryColor = shop?.primaryColor || '#ec4899';

  const stats = {
    pending: orders.filter(o => o.status === 'PENDING').length,
    confirmed: orders.filter(o => o.status === 'CONFIRMED').length,
    processing: orders.filter(o => o.status === 'PROCESSING').length,
    delivered: orders.filter(o => o.status === 'DELIVERED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button onClick={() => setFilter('PENDING')} className={`stat-card text-left transition-all ${filter === 'PENDING' ? 'ring-2 ring-amber-500' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              <p className="text-sm text-gray-500">En attente</p>
            </div>
          </div>
        </button>
        <button onClick={() => setFilter('CONFIRMED')} className={`stat-card text-left transition-all ${filter === 'CONFIRMED' ? 'ring-2 ring-blue-500' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.confirmed}</p>
              <p className="text-sm text-gray-500">Confirmées</p>
            </div>
          </div>
        </button>
        <button onClick={() => setFilter('PROCESSING')} className={`stat-card text-left transition-all ${filter === 'PROCESSING' ? 'ring-2 ring-purple-500' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.processing}</p>
              <p className="text-sm text-gray-500">En préparation</p>
            </div>
          </div>
        </button>
        <button onClick={() => setFilter('DELIVERED')} className={`stat-card text-left transition-all ${filter === 'DELIVERED' ? 'ring-2 ring-emerald-500' : ''}`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stats.delivered}</p>
              <p className="text-sm text-gray-500">Livrées</p>
            </div>
          </div>
        </button>
      </div>

      {/* Filter Reset */}
      {filter && (
        <button onClick={() => setFilter('')} className="text-sm text-gray-500 hover:text-gray-700">
          ✕ Effacer le filtre ({STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label})
        </button>
      )}

      {/* Orders List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(order => {
            const status = STATUS_CONFIG[order.status];
            const StatusIcon = status.icon;
            return (
              <div 
                key={order.id} 
                onClick={() => setSelected(order)}
                className="card cursor-pointer hover:shadow-md transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.color.split(' ')[0]}`}>
                      <StatusIcon className={`w-6 h-6 ${status.color.split(' ')[1]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-800">{order.customerName}</p>
                        <span className={`badge ${status.color}`}>{status.label}</span>
                      </div>
                      <p className="text-sm text-gray-500">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt, 'time')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold" style={{ color: primaryColor }}>
                      {formatPrice(order.total, shop?.currency)}
                    </p>
                    <p className="text-sm text-emerald-600">+{formatPrice(order.profit, shop?.currency)}</p>
                    <p className="text-xs text-gray-400">{order.items.length} article(s)</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune commande {filter ? `"${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label}"` : ''}</p>
        </div>
      )}

      {/* Order Detail Modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold">{selected.orderNumber}</h2>
                <p className="text-sm text-gray-500">{formatDate(selected.createdAt, 'long')}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Status */}
              <div className={`p-3 rounded-xl ${STATUS_CONFIG[selected.status].color.split(' ')[0]}`}>
                <p className={`font-medium ${STATUS_CONFIG[selected.status].color.split(' ')[1]}`}>
                  Statut: {STATUS_CONFIG[selected.status].label}
                </p>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2">
                {selected.status === 'PENDING' && (
                  <>
                    <button onClick={() => changeStatus(selected.id!, 'CONFIRMED')} className="btn-primary text-sm" style={{ backgroundColor: primaryColor }}>
                      ✓ Confirmer
                    </button>
                    <button onClick={() => changeStatus(selected.id!, 'CANCELLED')} className="btn-danger text-sm">
                      ✕ Annuler
                    </button>
                  </>
                )}
                {selected.status === 'CONFIRMED' && (
                  <button onClick={() => changeStatus(selected.id!, 'PROCESSING')} className="btn-primary text-sm" style={{ backgroundColor: primaryColor }}>
                    📦 En préparation
                  </button>
                )}
                {selected.status === 'PROCESSING' && (
                  <button onClick={() => changeStatus(selected.id!, 'DELIVERED')} className="btn-success text-sm">
                    🚚 Marquer livrée
                  </button>
                )}
              </div>

              {/* Customer Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Client</h3>
                <div className="space-y-2">
                  <p className="text-gray-700">{selected.customerName}</p>
                  <p className="flex items-center gap-2 text-gray-600 text-sm">
                    <Phone className="w-4 h-4" /> {selected.customerPhone}
                  </p>
                  {selected.customerAddress && (
                    <p className="flex items-center gap-2 text-gray-600 text-sm">
                      <MapPin className="w-4 h-4" /> {selected.customerQuartier} - {selected.customerAddress}
                    </p>
                  )}
                </div>
                <a
                  href={getWhatsAppLink(selected.customerPhone, `Bonjour ${selected.customerName}, concernant votre commande ${selected.orderNumber}...`)}
                  target="_blank"
                  className="btn-whatsapp mt-3 text-sm"
                >
                  <MessageCircle className="w-4 h-4" /> Contacter sur WhatsApp
                </a>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Articles</h3>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{item.productName}</p>
                        <p className="text-sm text-gray-500">x{item.quantity}</p>
                      </div>
                      <p className="font-semibold">{formatPrice(item.total, shop?.currency)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-gray-600">
                  <span>Sous-total</span>
                  <span>{formatPrice(selected.subtotal, shop?.currency)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Livraison</span>
                  <span>{formatPrice(selected.deliveryFee, shop?.currency)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ color: primaryColor }}>
                  <span>Total</span>
                  <span>{formatPrice(selected.total, shop?.currency)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Bénéfice</span>
                  <span>+{formatPrice(selected.profit, shop?.currency)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
