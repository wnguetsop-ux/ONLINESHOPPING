'use client';
import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Clock, CheckCircle, Truck, Package, X, Phone, MapPin,
  MessageCircle, Plus, Printer, Search, Trash2, Loader2, Calendar,
  ChevronDown, Filter, Barcode, ScanLine, Camera, Star, Grid3X3, List
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, updateOrderStatus, createOrder, getProducts } from '@/lib/firestore';
import { Order, Product } from '@/lib/types';
import { formatPrice, formatDate, getWhatsAppLink } from '@/lib/utils';
import PhoneInput from '@/components/PhoneInput';

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',     color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400',   icon: Clock },
  CONFIRMED:  { label: 'Confirmée',      color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400',    icon: CheckCircle },
  PROCESSING: { label: 'En préparation', color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-400',  icon: Package },
  DELIVERED:  { label: 'Livrée',         color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-400', icon: Truck },
  CANCELLED:  { label: 'Annulée',        color: 'bg-red-100 text-red-700',        dot: 'bg-red-400',     icon: X },
};

interface ManualItem { productId: string; productName: string; quantity: number; unitPrice: number; costPrice: number; imageUrl?: string; }

interface FlyItem { id: string; x: number; y: number; productName: string; }

function groupByDate(orders: Order[]) {
  const groups: Record<string, Order[]> = {};
  orders.forEach(o => {
    const d = new Date(o.createdAt);
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const key = d >= today ? 'Aujourd\'hui'
      : d >= yesterday ? 'Hier'
      : d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(o);
  });
  return groups;
}

export default function OrdersPage() {
  const { shop } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [productViewMode, setProductViewMode] = useState<'grid' | 'search'>('grid');
  const [productCatFilter, setProductCatFilter] = useState('');
  const receiptRef = useRef<HTMLDivElement>(null);

  // Manual order form
  const [manualForm, setManualForm] = useState({
    customerName: '', customerPhone: '', customerAddress: '', notes: '',
    paymentMethod: 'CASH_ON_DELIVERY' as Order['paymentMethod'],
    deliveryMethod: 'PICKUP' as Order['deliveryMethod'],
  });
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Flying animation items
  const [flyItems, setFlyItems] = useState<FlyItem[]>([]);
  const cartRef = useRef<HTMLDivElement>(null);

  // Barcode scanner
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scanMode, setScanMode] = useState<'keyboard' | 'camera' | null>(null);
  const [scanStream, setScanStream] = useState<MediaStream | null>(null);
  const [scanError, setScanError] = useState('');
  const scanVideoRef = useRef<HTMLVideoElement>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);
  const barcodeBuffer = useRef('');
  const barcodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (shop?.id) loadData(); }, [shop?.id]);
  useEffect(() => () => { if (scanStream) scanStream.getTracks().forEach(t => t.stop()); }, [scanStream]);

  async function loadData() {
    if (!shop?.id) return;
    const [ord, prods] = await Promise.all([getOrders(shop.id), getProducts(shop.id)]);
    setOrders(ord); setProducts(prods); setLoading(false);
    const groups = groupByDate(ord);
    const defaults: Record<string, boolean> = {};
    Object.keys(groups).slice(0, 2).forEach(k => defaults[k] = true);
    setExpandedDates(defaults);
  }

  async function changeStatus(orderId: string, status: Order['status']) {
    await updateOrderStatus(orderId, status);
    await loadData();
    if (selected?.id === orderId) setSelected(prev => prev ? { ...prev, status } : null);
  }

  // ── BARCODE ───────────────────────────────────────────────────────────────
  function handleBarcodeKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); processBarcodeString(barcodeInput.trim()); setBarcodeInput(''); return; }
    if (barcodeTimer.current) clearTimeout(barcodeTimer.current);
    barcodeTimer.current = setTimeout(() => {
      if (barcodeBuffer.current.length >= 4) processBarcodeString(barcodeBuffer.current);
      barcodeBuffer.current = '';
    }, 100);
    barcodeBuffer.current += e.key;
  }
  function processBarcodeString(code: string) {
    if (!code) return;
    const product = products.find(p => p.barcode === code || p.sku === code);
    if (product) { addProductToManual(product); setScanError(''); }
    else { setScanError(`Code "${code}" non trouvé.`); setTimeout(() => setScanError(''), 3000); }
  }
  async function startCameraScanner() {
    setScanError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setScanStream(stream); setScanMode('camera');
      setTimeout(() => { if (scanVideoRef.current) scanVideoRef.current.srcObject = stream; }, 80);
    } catch { setScanError('Impossible d\'accéder à la caméra.'); }
  }
  function stopCameraScanner() {
    if (scanStream) { scanStream.getTracks().forEach(t => t.stop()); setScanStream(null); }
    setScanMode(null);
  }

  // ── PRODUCT ADD with flying animation ─────────────────────────────────────
  function addProductToManual(product: Product, evt?: React.MouseEvent) {
    setManualItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id!, productName: product.name, quantity: 1, unitPrice: product.sellingPrice, costPrice: product.costPrice, imageUrl: product.imageUrl }];
    });
    setProductSearch('');

    // Flying animation
    if (evt) {
      const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
      const fly: FlyItem = { id: Date.now().toString(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, productName: product.name };
      setFlyItems(prev => [...prev, fly]);
      setTimeout(() => setFlyItems(prev => prev.filter(f => f.id !== fly.id)), 800);
    }
  }
  function removeManualItem(productId: string) { setManualItems(prev => prev.filter(i => i.productId !== productId)); }
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
        customerPhone: manualForm.customerPhone.replace(/[^0-9+]/g, ''),
        ...(manualForm.customerAddress ? { customerAddress: manualForm.customerAddress } : {}),
        ...(manualForm.notes ? { notes: manualForm.notes } : {}),
        items: manualItems.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, costPrice: i.costPrice })),
        paymentMethod: manualForm.paymentMethod,
        deliveryMethod: manualForm.deliveryMethod, deliveryFee,
      });
      await loadData();
      setShowManual(false); stopCameraScanner();
      setManualForm({ customerName: '', customerPhone: '', customerAddress: '', notes: '', paymentMethod: 'CASH_ON_DELIVERY', deliveryMethod: 'PICKUP' });
      setManualItems([]); setScanMode(null); setProductCatFilter(''); setProductSearch('');
    } catch (err: any) { alert(err.message || 'Erreur'); }
    setSavingManual(false);
  }

  function printReceipt() {
    const content = receiptRef.current; if (!content) return;
    const win = window.open('', '_blank', 'width=380,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Reçu</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;width:80mm;margin:0 auto;padding:4mm}.center{text-align:center}.bold{font-weight:bold}.divider{border-top:1px dashed #000;margin:6px 0}.row{display:flex;justify-content:space-between;margin:2px 0}</style></head><body>${content.innerHTML}<script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
    win.document.close();
  }

  // ── DATA ──────────────────────────────────────────────────────────────────
  const primaryColor = shop?.primaryColor || '#ec4899';
  const manualSubtotal = manualItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const manualDelivery = manualForm.deliveryMethod === 'DELIVERY' ? (shop?.deliveryFee || 0) : 0;
  const manualTotal = manualSubtotal + manualDelivery;

  const availableProducts = products.filter(p => p.isActive && p.stock > 0);
  const productCategories = [...new Set(availableProducts.map(p => p.category))];
  const displayedProducts = availableProducts.filter(p =>
    (!productCatFilter || p.category === productCatFilter) &&
    (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.barcode || '').includes(productSearch) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()))
  );

  let filtered = orders;
  if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);
  if (search) filtered = filtered.filter(o =>
    o.customerName.toLowerCase().includes(search.toLowerCase()) ||
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    (o.customerPhone || '').includes(search)
  );
  if (dateFrom) filtered = filtered.filter(o => new Date(o.createdAt) >= new Date(dateFrom));
  if (dateTo) { const to = new Date(dateTo); to.setHours(23,59,59); filtered = filtered.filter(o => new Date(o.createdAt) <= to); }

  const grouped = groupByDate(filtered);
  const dateKeys = Object.keys(grouped);
  const hasFilters = statusFilter || search || dateFrom || dateTo;

  const stats = {
    PENDING: orders.filter(o => o.status === 'PENDING').length,
    CONFIRMED: orders.filter(o => o.status === 'CONFIRMED').length,
    PROCESSING: orders.filter(o => o.status === 'PROCESSING').length,
    DELIVERED: orders.filter(o => o.status === 'DELIVERED').length,
  };
  const todayRevenue = orders.filter(o => {
    const today = new Date(); today.setHours(0,0,0,0);
    return new Date(o.createdAt) >= today && o.status === 'DELIVERED';
  }).reduce((s, o) => s + o.total, 0);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }} /></div>;

  return (
    <div className="space-y-5">

      {/* Flying animation items */}
      {flyItems.map(f => (
        <div key={f.id} className="pointer-events-none fixed z-[9999] flex items-center justify-center"
          style={{
            left: f.x - 20, top: f.y - 20, width: 40, height: 40,
            animation: 'flyToCart 0.8s cubic-bezier(0.2,0.8,0.8,1.2) forwards',
          }}>
          <div className="w-8 h-8 rounded-full bg-white shadow-xl border-2 flex items-center justify-center text-sm"
            style={{ borderColor: primaryColor }}>⭐</div>
        </div>
      ))}
      <style>{`
        @keyframes flyToCart {
          0%  { transform: scale(1); opacity: 1; }
          60% { transform: scale(1.5) translateY(-60px); opacity: 0.9; }
          100%{ transform: scale(0.3) translateY(-200px) translateX(60px); opacity: 0; }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Commandes</h1>
          <p className="text-gray-500 text-sm">{orders.length} commande{orders.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => setShowManual(true)} className="btn-primary flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
          <Plus className="w-5 h-5" />Nouvelle commande
        </button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {(['PENDING','CONFIRMED','PROCESSING','DELIVERED'] as const).map(s => {
          const cfg = STATUS_CONFIG[s]; const Icon = cfg.icon;
          return (
            <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              className={`stat-card text-left transition-all ${statusFilter === s ? 'ring-2 ring-offset-1' : ''}`}
              style={statusFilter === s ? { outlineColor: primaryColor } : {}}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <span className="text-xs text-gray-500 font-medium">{cfg.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{stats[s]}</p>
            </button>
          );
        })}
        <div className="stat-card col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 font-medium mb-1">💰 Revenu aujourd'hui</p>
          <p className="text-lg font-bold text-emerald-600">{formatPrice(todayRevenue, shop?.currency)}</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Nom, téléphone, numéro de commande..."
              value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${(showFilters || dateFrom || dateTo) ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
            style={(showFilters || dateFrom || dateTo) ? { backgroundColor: primaryColor } : {}}>
            <Filter className="w-4 h-4" />Dates
          </button>
          {hasFilters && <button onClick={() => { setStatusFilter(''); setSearch(''); setDateFrom(''); setDateTo(''); }} className="p-2.5 text-gray-400 hover:text-red-500 border border-gray-200 rounded-xl"><X className="w-4 h-4" /></button>}
        </div>
        {showFilters && (
          <div className="grid grid-cols-2 gap-3 pt-2 border-t">
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">📅 Du</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">📅 Au</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input text-sm" /></div>
          </div>
        )}
        {hasFilters && <p className="text-xs text-gray-500">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>}
      </div>

      {/* Status pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setStatusFilter('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${!statusFilter ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
          style={!statusFilter ? { backgroundColor: primaryColor } : {}}>
          Toutes ({orders.length})
        </button>
        {(Object.keys(STATUS_CONFIG) as Array<keyof typeof STATUS_CONFIG>).map(s => (
          <button key={s} onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${statusFilter === s ? STATUS_CONFIG[s].color : 'bg-gray-100 text-gray-500'}`}>
            {STATUS_CONFIG[s].label} ({orders.filter(o => o.status === s).length})
          </button>
        ))}
      </div>

      {/* Orders list */}
      {dateKeys.length === 0 ? (
        <div className="card text-center py-12">
          <ShoppingCart className="w-16 h-16 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 font-medium mb-4">Aucune commande</p>
          <button onClick={() => setShowManual(true)} className="btn-primary inline-flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
            <Plus className="w-4 h-4" />Créer une commande
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {dateKeys.map(dateKey => {
            const dayOrders = grouped[dateKey];
            const isExpanded = expandedDates[dateKey] !== false;
            const dayTotal = dayOrders.filter(o => o.status === 'DELIVERED').reduce((s, o) => s + o.total, 0);
            return (
              <div key={dateKey} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setExpandedDates(prev => ({ ...prev, [dateKey]: !isExpanded }))}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
                      <Calendar className="w-4 h-4" style={{ color: primaryColor }} />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-800 capitalize text-sm">{dateKey}</p>
                      <p className="text-xs text-gray-400">{dayOrders.length} commande{dayOrders.length !== 1 ? 's' : ''}{dayTotal > 0 ? ` • ${formatPrice(dayTotal, shop?.currency)}` : ''}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
                {isExpanded && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {dayOrders.map(order => {
                      const cfg = STATUS_CONFIG[order.status]; const StatusIcon = cfg.icon;
                      return (
                        <div key={order.id} onClick={() => setSelected(order)}
                          className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.color.split(' ')[0]}`}>
                              <StatusIcon className={`w-4 h-4 ${cfg.color.split(' ')[1]}`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-gray-800 text-sm">{order.customerName}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                              </div>
                              <p className="text-xs text-gray-400">{order.orderNumber} • {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="font-bold text-gray-800 text-sm">{formatPrice(order.total, shop?.currency)}</p>
                            <button onClick={e => { e.stopPropagation(); setShowReceipt(order); }}
                              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600">
                              <Printer className="w-3 h-3" />Reçu
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ══ ORDER DETAIL ══════════════════════════════════════════════════ */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
              <div><h2 className="text-base font-bold">{selected.orderNumber}</h2><p className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleString('fr-FR')}</p></div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowReceipt(selected)} className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 rounded-lg text-sm"><Printer className="w-4 h-4" />Imprimer</button>
                <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-4 space-y-4">
              <div className={`p-3 rounded-xl ${STATUS_CONFIG[selected.status].color.split(' ')[0]}`}>
                <p className={`font-medium text-sm ${STATUS_CONFIG[selected.status].color.split(' ')[1]}`}>Statut: {STATUS_CONFIG[selected.status].label}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.status === 'PENDING' && (<><button onClick={() => changeStatus(selected.id!, 'CONFIRMED')} className="btn-primary text-sm" style={{ backgroundColor: primaryColor }}>✓ Confirmer</button><button onClick={() => changeStatus(selected.id!, 'CANCELLED')} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm">✕ Annuler</button></>)}
                {selected.status === 'CONFIRMED' && <button onClick={() => changeStatus(selected.id!, 'PROCESSING')} className="btn-primary text-sm" style={{ backgroundColor: primaryColor }}>📦 En préparation</button>}
                {selected.status === 'PROCESSING' && <button onClick={() => changeStatus(selected.id!, 'DELIVERED')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm">🚚 Marquer livrée</button>}
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-2">👤 Client</h3>
                <p className="font-medium">{selected.customerName}</p>
                {selected.customerPhone && <p className="text-sm text-gray-600 mt-1">📞 {selected.customerPhone}</p>}
                {selected.customerAddress && <p className="text-sm text-gray-600 mt-1">📍 {selected.customerQuartier ? selected.customerQuartier + ' — ' : ''}{selected.customerAddress}</p>}
                {selected.notes && <p className="text-sm text-gray-500 mt-2 italic">📝 {selected.notes}</p>}
                {selected.customerPhone && <a href={getWhatsAppLink(selected.customerPhone, `Bonjour ${selected.customerName}, concernant votre commande ${selected.orderNumber}...`)} target="_blank" className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-green-500 text-white rounded-xl text-sm"><MessageCircle className="w-4 h-4" />Contacter</a>}
              </div>
              <div className="space-y-2">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div><p className="font-medium text-sm">{item.productName}</p><p className="text-xs text-gray-500">x{item.quantity} × {formatPrice(item.unitPrice, shop?.currency)}</p></div>
                    <p className="font-semibold text-sm">{formatPrice(item.total, shop?.currency)}</p>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm text-gray-600"><span>Sous-total</span><span>{formatPrice(selected.subtotal, shop?.currency)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Livraison</span><span>{formatPrice(selected.deliveryFee, shop?.currency)}</span></div>
                <div className="flex justify-between font-bold pt-2 border-t" style={{ color: primaryColor }}><span>Total</span><span>{formatPrice(selected.total, shop?.currency)}</span></div>
                <div className="flex justify-between text-sm text-emerald-600 font-medium"><span>Bénéfice</span><span>+{formatPrice(selected.profit, shop?.currency)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ MANUAL ORDER MODAL ════════════════════════════════════════════ */}
      {showManual && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
              <h2 className="text-lg font-bold">📦 Nouvelle commande</h2>
              <button onClick={() => { setShowManual(false); stopCameraScanner(); setManualItems([]); setProductSearch(''); setProductCatFilter(''); }} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col md:flex-row gap-0 min-h-0">

              {/* ── LEFT: Product catalog ── */}
              <div className="flex flex-col md:w-[55%] border-b md:border-b-0 md:border-r" style={{ minHeight: '200px', maxHeight: '50vh' }}>
                <div className="p-3 border-b bg-gray-50 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Catalogue produits</span>
                    <div className="flex gap-1">
                      {/* Barcode scanner buttons */}
                      <button type="button" onClick={() => { setScanMode(scanMode === 'keyboard' ? null : 'keyboard'); if (scanStream) stopCameraScanner(); setTimeout(() => barcodeRef.current?.focus(), 100); }}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${scanMode === 'keyboard' ? 'text-white' : 'bg-white border text-gray-600'}`}
                        style={scanMode === 'keyboard' ? { backgroundColor: primaryColor } : {}}>
                        <Barcode className="w-3 h-3" />USB
                      </button>
                      <button type="button" onClick={() => scanMode === 'camera' ? stopCameraScanner() : startCameraScanner()}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${scanMode === 'camera' ? 'text-white' : 'bg-white border text-gray-600'}`}
                        style={scanMode === 'camera' ? { backgroundColor: primaryColor } : {}}>
                        <Camera className="w-3 h-3" />Scan
                      </button>
                    </div>
                  </div>
                  {/* Scanner inputs */}
                  {scanMode === 'keyboard' && (
                    <div className="relative mb-2">
                      <ScanLine className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input ref={barcodeRef} type="text" className="input pl-8 text-sm font-mono" placeholder="Code-barres (scanner ou clavier)..."
                        value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeKey} autoComplete="off" />
                    </div>
                  )}
                  {scanMode === 'camera' && (
                    <div className="relative mb-2 bg-gray-900 rounded-xl overflow-hidden" style={{ height: 80 }}>
                      <video ref={scanVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center"><div className="w-40 h-8 border-2 border-orange-400 rounded opacity-70" /></div>
                      <button type="button" onClick={stopCameraScanner} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                  {scanError && <p className="text-xs text-red-500 mb-2 bg-red-50 px-2 py-1 rounded-lg">⚠️ {scanError}</p>}
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input type="text" className="input pl-8 text-sm" placeholder="Rechercher..." value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                  </div>
                  {/* Category pills */}
                  {productCategories.length > 1 && !productSearch && (
                    <div className="flex gap-1.5 mt-2 overflow-x-auto pb-0.5">
                      <button type="button" onClick={() => setProductCatFilter('')}
                        className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${!productCatFilter ? 'text-white' : 'bg-white border text-gray-600'}`}
                        style={!productCatFilter ? { backgroundColor: primaryColor } : {}}>Tout</button>
                      {productCategories.map(cat => (
                        <button key={cat} type="button" onClick={() => setProductCatFilter(productCatFilter === cat ? '' : cat)}
                          className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${productCatFilter === cat ? 'text-white' : 'bg-white border text-gray-600'}`}
                          style={productCatFilter === cat ? { backgroundColor: primaryColor } : {}}>{cat}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Product grid */}
                <div className="flex-1 overflow-y-auto p-2">
                  {displayedProducts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />Aucun produit
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {displayedProducts.map(p => {
                        const qtyInCart = manualItems.find(i => i.productId === p.id)?.quantity || 0;
                        return (
                          <button key={p.id} type="button"
                            onClick={e => addProductToManual(p, e)}
                            className="relative text-left bg-gray-50 hover:bg-orange-50 border-2 border-transparent hover:border-current rounded-xl p-2 transition-all active:scale-95 group"
                            style={{ '--tw-border-opacity': 1 } as any}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = primaryColor)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                            {/* Qty badge */}
                            {qtyInCart > 0 && (
                              <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center z-10"
                                style={{ backgroundColor: primaryColor }}>{qtyInCart}</div>
                            )}
                            {/* Image */}
                            <div className="w-full h-16 rounded-lg mb-1.5 overflow-hidden bg-gray-200">
                              {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>}
                            </div>
                            <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2 mb-0.5">{p.name}</p>
                            <p className="text-xs font-bold" style={{ color: primaryColor }}>{formatPrice(p.sellingPrice, shop?.currency)}</p>
                            <p className="text-[10px] text-gray-400">Stock: {p.stock}</p>
                            {/* Plus overlay on hover */}
                            <div className="absolute inset-0 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ backgroundColor: `${primaryColor}15` }}>
                              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
                                <Plus className="w-4 h-4" />
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* ── RIGHT: Cart + Customer info ── */}
              <div className="flex flex-col md:w-[45%] min-h-0">
                <form onSubmit={saveManualOrder} className="flex flex-col flex-1 min-h-0">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">

                    {/* Customer info */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Informations client</h3>
                      <input required className="input text-sm" placeholder="Nom complet *"
                        value={manualForm.customerName} onChange={e => setManualForm({ ...manualForm, customerName: e.target.value })} />
                      <PhoneInput
                        value={manualForm.customerPhone}
                        onChange={v => setManualForm({ ...manualForm, customerPhone: v })}
                        placeholder="6XX XXX XXX"
                        defaultCountry="CM"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select className="select text-sm" value={manualForm.deliveryMethod} onChange={e => setManualForm({ ...manualForm, deliveryMethod: e.target.value as any })}>
                          <option value="PICKUP">🏪 Retrait</option><option value="DELIVERY">🚚 Livraison</option>
                        </select>
                        <select className="select text-sm" value={manualForm.paymentMethod} onChange={e => setManualForm({ ...manualForm, paymentMethod: e.target.value as any })}>
                          <option value="CASH_ON_DELIVERY">💵 Espèces</option><option value="MOBILE_MONEY">📱 Mobile Money</option>
                        </select>
                      </div>
                      <input className="input text-sm" placeholder="Notes (optionnel)"
                        value={manualForm.notes} onChange={e => setManualForm({ ...manualForm, notes: e.target.value })} />
                    </div>

                    {/* Cart */}
                    <div ref={cartRef}>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          🛒 Panier {manualItems.length > 0 && <span className="text-orange-500">({manualItems.reduce((s, i) => s + i.quantity, 0)} articles)</span>}
                        </h3>
                        {manualItems.length > 0 && <button type="button" onClick={() => setManualItems([])} className="text-xs text-red-400 hover:text-red-600">Vider</button>}
                      </div>

                      {manualItems.length === 0 ? (
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
                          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
                          Cliquez sur un produit pour l'ajouter
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {manualItems.map(item => (
                            <div key={item.productId} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                              {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0 text-lg">📦</div>}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-800 truncate">{item.productName}</p>
                                <p className="text-xs text-gray-500">{formatPrice(item.unitPrice, shop?.currency)}/u</p>
                              </div>
                              <div className="flex items-center gap-1 flex-shrink-0">
                                <button type="button" onClick={() => updateManualQty(item.productId, item.quantity - 1)} className="w-6 h-6 rounded-lg bg-white border text-gray-600 flex items-center justify-center font-bold text-sm">−</button>
                                <span className="w-5 text-center font-bold text-sm">{item.quantity}</span>
                                <button type="button" onClick={() => updateManualQty(item.productId, item.quantity + 1)} className="w-6 h-6 rounded-lg bg-white border text-gray-600 flex items-center justify-center font-bold text-sm">+</button>
                                <button type="button" onClick={() => removeManualItem(item.productId)} className="w-6 h-6 text-red-400 hover:bg-red-50 rounded-lg flex items-center justify-center ml-0.5"><Trash2 className="w-3 h-3" /></button>
                              </div>
                              <p className="text-xs font-bold flex-shrink-0 w-16 text-right">{formatPrice(item.unitPrice * item.quantity, shop?.currency)}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Total + Submit */}
                  <div className="flex-shrink-0 border-t p-4 bg-white">
                    {manualItems.length > 0 && (
                      <div className="space-y-1 mb-3">
                        <div className="flex justify-between text-xs text-gray-500"><span>Sous-total</span><span>{formatPrice(manualSubtotal, shop?.currency)}</span></div>
                        {manualDelivery > 0 && <div className="flex justify-between text-xs text-gray-500"><span>Livraison</span><span>{formatPrice(manualDelivery, shop?.currency)}</span></div>}
                        <div className="flex justify-between font-bold text-base pt-1 border-t" style={{ color: primaryColor }}><span>Total</span><span>{formatPrice(manualTotal, shop?.currency)}</span></div>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setShowManual(false); stopCameraScanner(); setManualItems([]); }} className="btn-secondary flex-1 text-sm">Annuler</button>
                      <button type="submit" disabled={savingManual || manualItems.length === 0}
                        className="btn-primary flex-1 text-sm flex items-center justify-center gap-2 disabled:opacity-50" style={{ backgroundColor: primaryColor }}>
                        {savingManual && <Loader2 className="w-4 h-4 animate-spin" />}Créer commande
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ RECEIPT MODAL ════════════════════════════════════════════════ */}
      {showReceipt && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-base font-bold">Reçu de commande</h2>
              <div className="flex items-center gap-2">
                <button onClick={printReceipt} className="btn-primary flex items-center gap-1.5 text-sm py-2" style={{ backgroundColor: primaryColor }}><Printer className="w-4 h-4" />Imprimer</button>
                <button onClick={() => setShowReceipt(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div ref={receiptRef} className="p-5 font-mono text-xs">
              <div className="text-center mb-3">
                <p className="font-bold text-base">{shop?.name?.toUpperCase()}</p>
                {shop?.slogan && <p>{shop.slogan}</p>}
                {shop?.phone && <p>Tél: {shop.phone}</p>}
              </div>
              <div className="border-t border-dashed my-2" />
              <div className="space-y-0.5 mb-2">
                <div className="flex justify-between"><span className="font-bold">N°:</span><span>{showReceipt.orderNumber}</span></div>
                <div className="flex justify-between"><span className="font-bold">Date:</span><span>{new Date(showReceipt.createdAt).toLocaleString('fr-FR')}</span></div>
                <div className="flex justify-between"><span className="font-bold">Client:</span><span>{showReceipt.customerName}</span></div>
                {showReceipt.customerPhone && <div className="flex justify-between"><span className="font-bold">Tél:</span><span>{showReceipt.customerPhone}</span></div>}
                <div className="flex justify-between"><span className="font-bold">Paiement:</span><span>{showReceipt.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Espèces'}</span></div>
              </div>
              <div className="border-t border-dashed my-2" />
              {showReceipt.items.map((item, i) => (
                <div key={i} className="mb-1">
                  <p className="font-bold truncate">{item.productName}</p>
                  <div className="flex justify-between"><span>{item.quantity} × {formatPrice(item.unitPrice, shop?.currency)}</span><span>{formatPrice(item.total, shop?.currency)}</span></div>
                </div>
              ))}
              <div className="border-t border-dashed my-2" />
              <div className="flex justify-between"><span>Sous-total</span><span>{formatPrice(showReceipt.subtotal, shop?.currency)}</span></div>
              {showReceipt.deliveryFee > 0 && <div className="flex justify-between"><span>Livraison</span><span>{formatPrice(showReceipt.deliveryFee, shop?.currency)}</span></div>}
              <div className="flex justify-between font-bold text-sm mt-1"><span>TOTAL</span><span>{formatPrice(showReceipt.total, shop?.currency)}</span></div>
              <div className="border-t border-dashed my-2" />
              <div className="text-center"><p>Merci pour votre achat !</p><p>Propulsé par ShopMaster</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}