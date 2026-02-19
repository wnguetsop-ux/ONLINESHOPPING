'use client';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Clock, CheckCircle, Truck, Package, X, Phone, MapPin, MessageCircle, Plus, Printer, Search, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, updateOrderStatus, createOrder, getProducts } from '@/lib/firestore';
import { Order, Product } from '@/lib/types';
import { formatPrice, formatDate, getWhatsAppLink } from '@/lib/utils';

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',     color: 'bg-amber-100 text-amber-700',   icon: Clock },
  CONFIRMED:  { label: 'Confirmée',      color: 'bg-blue-100 text-blue-700',     icon: CheckCircle },
  PROCESSING: { label: 'En préparation', color: 'bg-purple-100 text-purple-700', icon: Package },
  DELIVERED:  { label: 'Livrée',         color: 'bg-emerald-100 text-emerald-700',icon: Truck },
  CANCELLED:  { label: 'Annulée',        color: 'bg-red-100 text-red-700',       icon: X },
};

interface ManualItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
}

export default function OrdersPage() {
  const { shop } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [savingManual, setSavingManual] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  // Manual order form
  const [manualForm, setManualForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    notes: '',
    paymentMethod: 'CASH_ON_DELIVERY' as Order['paymentMethod'],
    deliveryMethod: 'PICKUP' as Order['deliveryMethod'],
  });
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  useEffect(() => { if (shop?.id) loadData(); }, [shop?.id]);

  async function loadData() {
    if (!shop?.id) return;
    const [ord, prods] = await Promise.all([getOrders(shop.id), getProducts(shop.id)]);
    setOrders(ord); setProducts(prods); setLoading(false);
  }

  async function changeStatus(orderId: string, status: Order['status']) {
    await updateOrderStatus(orderId, status);
    await loadData();
    if (selected?.id === orderId) setSelected(prev => prev ? { ...prev, status } : null);
  }

  // ── MANUAL ORDER ──────────────────────────────────────────────────────────
  function addProductToManual(product: Product) {
    const existing = manualItems.find(i => i.productId === product.id);
    if (existing) {
      setManualItems(prev => prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setManualItems(prev => [...prev, {
        productId: product.id!,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        costPrice: product.costPrice,
      }]);
    }
    setProductSearch('');
  }

  function removeManualItem(productId: string) {
    setManualItems(prev => prev.filter(i => i.productId !== productId));
  }

  function updateManualQty(productId: string, qty: number) {
    if (qty <= 0) { removeManualItem(productId); return; }
    setManualItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  }

  async function saveManualOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!shop?.id || manualItems.length === 0) { alert('Ajoutez au moins un produit.'); return; }
    setSavingManual(true);
    try {
      const deliveryFee = manualForm.deliveryMethod === 'DELIVERY' ? (shop.deliveryFee || 0) : 0;
      await createOrder(shop.id, {
        customerName: manualForm.customerName,
        customerPhone: manualForm.customerPhone,
        customerAddress: manualForm.customerAddress || undefined,
        items: manualItems,
        paymentMethod: manualForm.paymentMethod,
        deliveryMethod: manualForm.deliveryMethod,
        deliveryFee,
        notes: manualForm.notes || undefined,
      });
      await loadData();
      setShowManual(false);
      setManualForm({ customerName: '', customerPhone: '', customerAddress: '', notes: '', paymentMethod: 'CASH_ON_DELIVERY', deliveryMethod: 'PICKUP' });
      setManualItems([]);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la création de la commande');
    }
    setSavingManual(false);
  }

  // ── RECEIPT PRINT ─────────────────────────────────────────────────────────
  function printReceipt() {
    const content = receiptRef.current;
    if (!content) return;
    const printWin = window.open('', '_blank', 'width=380,height=600');
    if (!printWin) return;
    printWin.document.write(`
<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>Reçu ${showReceipt?.orderNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; margin: 0 auto; padding: 4mm; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .large { font-size: 16px; }
  .divider { border-top: 1px dashed #000; margin: 6px 0; }
  .row { display: flex; justify-content: space-between; margin: 2px 0; }
  .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin: 3px 0; }
</style>
</head><body>
${content.innerHTML}
<script>window.onload = function(){ window.print(); window.close(); }<\/script>
</body></html>`);
    printWin.document.close();
  }

  const manualSubtotal = manualItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const manualDelivery = manualForm.deliveryMethod === 'DELIVERY' ? (shop?.deliveryFee || 0) : 0;
  const manualTotal = manualSubtotal + manualDelivery;

  const filteredProducts = products.filter(p =>
    p.isActive && p.stock > 0 &&
    (productSearch === '' || p.name.toLowerCase().includes(productSearch.toLowerCase()))
  );

  const filtered = filter ? orders.filter(o => o.status === filter) : orders;
  const primaryColor = shop?.primaryColor || '#ec4899';

  const stats = {
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
    PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Commandes</h1>
          <p className="text-gray-500 text-sm">{orders.length} commande(s) au total</p>
        </div>
        <button onClick={() => setShowManual(true)} className="btn-primary flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
          <Plus className="w-5 h-5" />Nouvelle commande
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(['PENDING','CONFIRMED','PROCESSING','DELIVERED'] as const).map(s => {
          const cfg = STATUS_CONFIG[s]; const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => setFilter(filter === s ? '' : s)} className={`stat-card text-left transition-all ${filter === s ? 'ring-2' : ''}`} style={filter === s ? { ringColor: primaryColor } : {}}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cfg.color.split(' ')[0]}`}><Icon className={`w-5 h-5 ${cfg.color.split(' ')[1]}`} /></div>
                <div><p className="text-2xl font-bold text-gray-800">{stats[s]}</p><p className="text-sm text-gray-500">{cfg.label}</p></div>
              </div>
            </button>
          );
        })}
      </div>

      {filter && <button onClick={() => setFilter('')} className="text-sm text-gray-500 hover:text-gray-700">✕ Effacer le filtre ({STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label})</button>}

      {/* Orders List */}
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map(order => {
            const status = STATUS_CONFIG[order.status];
            const StatusIcon = status.icon;
            return (
              <div key={order.id} onClick={() => setSelected(order)} className="card cursor-pointer hover:shadow-md transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${status.color.split(' ')[0]}`}><StatusIcon className={`w-6 h-6 ${status.color.split(' ')[1]}`} /></div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-800">{order.customerName}</p>
                        <span className={`badge ${status.color}`}>{status.label}</span>
                        {!order.customerPhone && <span className="badge bg-orange-100 text-orange-600 text-xs">Manuel</span>}
                      </div>
                      <p className="text-sm text-gray-500">{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt, 'time')}</p>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <p className="text-xl font-bold" style={{ color: primaryColor }}>{formatPrice(order.total, shop?.currency)}</p>
                    <p className="text-sm text-emerald-600">+{formatPrice(order.profit, shop?.currency)}</p>
                    <button onClick={e => { e.stopPropagation(); setShowReceipt(order); }} className="text-xs flex items-center gap-1 text-gray-400 hover:text-gray-600">
                      <Printer className="w-3 h-3" />Reçu
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">Aucune commande{filter ? ` "${STATUS_CONFIG[filter as keyof typeof STATUS_CONFIG]?.label}"` : ''}</p>
          <button onClick={() => setShowManual(true)} className="btn-primary mt-4" style={{ backgroundColor: primaryColor }}>
            <Plus className="w-4 h-4 inline mr-2" />Créer la première commande
          </button>
        </div>
      )}

      {/* ══ ORDER DETAIL MODAL ══════════════════════════════════════════════ */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <div><h2 className="text-lg font-bold">{selected.orderNumber}</h2><p className="text-sm text-gray-500">{formatDate(selected.createdAt, 'long')}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowReceipt(selected)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"><Printer className="w-4 h-4" />Imprimer</button>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className={`p-3 rounded-xl ${STATUS_CONFIG[selected.status].color.split(' ')[0]}`}>
                <p className={`font-medium ${STATUS_CONFIG[selected.status].color.split(' ')[1]}`}>Statut: {STATUS_CONFIG[selected.status].label}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.status === 'PENDING' && (<><button onClick={() => changeStatus(selected.id!, 'CONFIRMED')} className="btn-primary text-sm" style={{ backgroundColor: primaryColor }}>✓ Confirmer</button><button onClick={() => changeStatus(selected.id!, 'CANCELLED')} className="btn-danger text-sm">✕ Annuler</button></>)}
                {selected.status === 'CONFIRMED' && <button onClick={() => changeStatus(selected.id!, 'PROCESSING')} className="btn-primary text-sm" style={{ backgroundColor: primaryColor }}>📦 En préparation</button>}
                {selected.status === 'PROCESSING' && <button onClick={() => changeStatus(selected.id!, 'DELIVERED')} className="btn-success text-sm">🚚 Marquer livrée</button>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">Client</h3>
                <p className="text-gray-700 font-medium">{selected.customerName}</p>
                {selected.customerPhone && <p className="flex items-center gap-2 text-gray-600 text-sm mt-1"><Phone className="w-4 h-4" />{selected.customerPhone}</p>}
                {selected.customerAddress && <p className="flex items-center gap-2 text-gray-600 text-sm mt-1"><MapPin className="w-4 h-4" />{selected.customerQuartier ? `${selected.customerQuartier} — ` : ''}{selected.customerAddress}</p>}
                {selected.notes && <p className="text-gray-500 text-sm mt-2 italic">📝 {selected.notes}</p>}
                {selected.customerPhone && (
                  <a href={getWhatsAppLink(selected.customerPhone, `Bonjour ${selected.customerName}, concernant votre commande ${selected.orderNumber}...`)} target="_blank" className="btn-whatsapp mt-3 text-sm"><MessageCircle className="w-4 h-4" />Contacter sur WhatsApp</a>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-3">Articles</h3>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div><p className="font-medium text-gray-800">{item.productName}</p><p className="text-sm text-gray-500">x{item.quantity} × {formatPrice(item.unitPrice, shop?.currency)}</p></div>
                      <p className="font-semibold">{formatPrice(item.total, shop?.currency)}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-gray-600"><span>Sous-total</span><span>{formatPrice(selected.subtotal, shop?.currency)}</span></div>
                <div className="flex justify-between text-gray-600"><span>Livraison</span><span>{formatPrice(selected.deliveryFee, shop?.currency)}</span></div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t" style={{ color: primaryColor }}><span>Total</span><span>{formatPrice(selected.total, shop?.currency)}</span></div>
                <div className="flex justify-between text-emerald-600 font-medium"><span>Bénéfice</span><span>+{formatPrice(selected.profit, shop?.currency)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MANUAL ORDER MODAL ═════════════════════════════════════════════ */}
      {showManual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold">Nouvelle commande manuelle</h2>
              <button onClick={() => setShowManual(false)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveManualOrder} className="p-4 space-y-4">
              {/* Customer */}
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom du client *</label>
                  <input required className="input" placeholder="Nom complet" value={manualForm.customerName} onChange={e => setManualForm({...manualForm, customerName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                  <input className="input" placeholder="+237 6XX..." value={manualForm.customerPhone} onChange={e => setManualForm({...manualForm, customerPhone: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Livraison</label>
                  <select className="select" value={manualForm.deliveryMethod} onChange={e => setManualForm({...manualForm, deliveryMethod: e.target.value as any})}>
                    <option value="PICKUP">Retrait sur place</option>
                    <option value="DELIVERY">Livraison à domicile</option>
                  </select>
                </div>
                {manualForm.deliveryMethod === 'DELIVERY' && (
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de livraison</label>
                    <input className="input" placeholder="Quartier, rue..." value={manualForm.customerAddress} onChange={e => setManualForm({...manualForm, customerAddress: e.target.value})} />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Paiement</label>
                  <select className="select" value={manualForm.paymentMethod} onChange={e => setManualForm({...manualForm, paymentMethod: e.target.value as any})}>
                    <option value="CASH_ON_DELIVERY">Espèces / À la livraison</option>
                    <option value="MOBILE_MONEY">Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input className="input" placeholder="Remarques..." value={manualForm.notes} onChange={e => setManualForm({...manualForm, notes: e.target.value})} />
                </div>
              </div>

              {/* Product search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ajouter des produits *</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input className="input pl-9 text-sm" placeholder="Rechercher un produit..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                </div>
                {productSearch && (
                  <div className="mt-1 border rounded-xl overflow-hidden max-h-40 overflow-y-auto bg-white shadow-lg z-10 relative">
                    {filteredProducts.length === 0 ? (
                      <p className="p-3 text-sm text-gray-500 text-center">Aucun produit disponible</p>
                    ) : filteredProducts.slice(0, 8).map(p => (
                      <button key={p.id} type="button" onClick={() => addProductToManual(p)} className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 text-left text-sm">
                        <span className="font-medium text-gray-800">{p.name}</span>
                        <span className="text-gray-500 ml-2">{formatPrice(p.sellingPrice, shop?.currency)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Cart */}
              {manualItems.length > 0 && (
                <div className="border rounded-xl overflow-hidden">
                  {manualItems.map(item => (
                    <div key={item.productId} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 bg-gray-50">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-500">{formatPrice(item.unitPrice, shop?.currency)}/u</p>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <button type="button" onClick={() => updateManualQty(item.productId, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-white border text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg font-bold">−</button>
                        <span className="w-6 text-center font-medium text-sm">{item.quantity}</span>
                        <button type="button" onClick={() => updateManualQty(item.productId, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-white border text-gray-600 hover:bg-gray-100 flex items-center justify-center text-lg font-bold">+</button>
                        <button type="button" onClick={() => removeManualItem(item.productId)} className="w-7 h-7 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <p className="ml-3 font-semibold text-sm w-20 text-right">{formatPrice(item.unitPrice * item.quantity, shop?.currency)}</p>
                    </div>
                  ))}
                  <div className="p-3 bg-white space-y-1">
                    <div className="flex justify-between text-sm text-gray-600"><span>Sous-total</span><span>{formatPrice(manualSubtotal, shop?.currency)}</span></div>
                    {manualDelivery > 0 && <div className="flex justify-between text-sm text-gray-600"><span>Livraison</span><span>{formatPrice(manualDelivery, shop?.currency)}</span></div>}
                    <div className="flex justify-between font-bold text-base pt-1 border-t" style={{ color: primaryColor }}><span>Total</span><span>{formatPrice(manualTotal, shop?.currency)}</span></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowManual(false)} className="btn-secondary flex-1">Annuler</button>
                <button type="submit" disabled={savingManual || manualItems.length === 0} className="btn-primary flex-1 flex items-center justify-center gap-2" style={{ backgroundColor: primaryColor }}>
                  {savingManual && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer la commande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ RECEIPT MODAL ══════════════════════════════════════════════════ */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold">Reçu de commande</h2>
              <div className="flex items-center gap-2">
                <button onClick={printReceipt} className="btn-primary flex items-center gap-2 text-sm" style={{ backgroundColor: primaryColor }}>
                  <Printer className="w-4 h-4" />Imprimer
                </button>
                <button onClick={() => setShowReceipt(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Receipt content — also used for printing */}
            <div ref={receiptRef} className="p-5 font-mono text-xs">
              {/* Shop header */}
              <div className="center mb-3">
                <p className="bold large">{shop?.name?.toUpperCase()}</p>
                {shop?.slogan && <p>{shop.slogan}</p>}
                {shop?.address && <p>{shop.address}, {shop?.city}</p>}
                {shop?.phone && <p>Tél: {shop.phone}</p>}
                {shop?.whatsapp && <p>WhatsApp: {shop.whatsapp}</p>}
              </div>
              <div className="divider" />

              {/* Order info */}
              <div className="mb-2">
                <div className="row"><span className="bold">Reçu N°:</span><span>{showReceipt.orderNumber}</span></div>
                <div className="row"><span className="bold">Date:</span><span>{formatDate(showReceipt.createdAt, 'time')}</span></div>
                <div className="row"><span className="bold">Client:</span><span>{showReceipt.customerName}</span></div>
                {showReceipt.customerPhone && <div className="row"><span className="bold">Tél:</span><span>{showReceipt.customerPhone}</span></div>}
                <div className="row"><span className="bold">Paiement:</span><span>{showReceipt.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Espèces'}</span></div>
                <div className="row"><span className="bold">Livraison:</span><span>{showReceipt.deliveryMethod === 'DELIVERY' ? 'Domicile' : 'Retrait'}</span></div>
              </div>
              <div className="divider" />

              {/* Items */}
              <div className="mb-2">
                {showReceipt.items.map((item, i) => (
                  <div key={i} className="mb-1">
                    <p className="bold">{item.productName}</p>
                    <div className="row">
                      <span>{item.quantity} × {formatPrice(item.unitPrice, shop?.currency)}</span>
                      <span>{formatPrice(item.total, shop?.currency)}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="divider" />

              {/* Totals */}
              <div className="mb-2">
                <div className="row"><span>Sous-total</span><span>{formatPrice(showReceipt.subtotal, shop?.currency)}</span></div>
                {showReceipt.deliveryFee > 0 && <div className="row"><span>Livraison</span><span>{formatPrice(showReceipt.deliveryFee, shop?.currency)}</span></div>}
                <div className="total-row mt-1"><span>TOTAL</span><span>{formatPrice(showReceipt.total, shop?.currency)}</span></div>
              </div>
              <div className="divider" />

              {/* Footer */}
              <div className="center mt-3">
                <p>Merci pour votre achat !</p>
                <p>Propulsé par ShopMaster</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}