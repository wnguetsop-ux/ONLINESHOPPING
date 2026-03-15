'use client';
import { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Clock, CheckCircle, Truck, Package, X,
  MessageCircle, Plus, Printer, Search, Trash2, Loader2, Calendar,
  ChevronDown, Filter, Barcode, ScanLine, Camera, ArrowRight,
  User, Phone, MapPin, ChevronLeft, Send, Check
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { getOrders, updateOrderStatus, createOrder, getProducts } from '@/lib/firestore';
import { Order, Product } from '@/lib/types';
import { formatPrice, formatDate, getWhatsAppLink } from '@/lib/utils';
import { sendWhatsApp } from '@/lib/whatsapp';
import PhoneInput from '@/components/PhoneInput';

const STATUS_CONFIG = {
  PENDING:    { label: 'En attente',     color: 'bg-amber-100 text-amber-700',    dot: 'bg-amber-400',   icon: Clock },
  CONFIRMED:  { label: 'Confirmee',      color: 'bg-blue-100 text-blue-700',      dot: 'bg-blue-400',    icon: CheckCircle },
  PROCESSING: { label: 'En preparation', color: 'bg-purple-100 text-purple-700',  dot: 'bg-purple-400',  icon: Package },
  DELIVERED:  { label: 'Livree',         color: 'bg-emerald-100 text-emerald-700',dot: 'bg-emerald-400', icon: Truck },
  CANCELLED:  { label: 'Annulee',        color: 'bg-red-100 text-red-700',        dot: 'bg-red-400',     icon: X },
};

interface ManualItem { productId: string; productName: string; quantity: number; unitPrice: number; costPrice: number; imageUrl?: string; }
interface FlyItem { id: string; x: number; y: number; }

// ── Étapes du formulaire ──────────────────────────────────────────────────
type Step = 'client' | 'products' | 'summary';

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
  const [orders, setOrders]   = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch]   = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo]   = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [orderMode, setOrderMode] = useState<'pick' | null>(null);
  const [showReceipt, setShowReceipt] = useState<Order | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});
  const [productCatFilter, setProductCatFilter] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);

  // ── Formulaire par étapes ──────────────────────────────────────────────
  const [step, setStep] = useState<Step>('client');
  const [manualForm, setManualForm] = useState({
    customerName: '', customerPhone: '', customerAddress: '', notes: '',
    paymentMethod: 'CASH_ON_DELIVERY' as Order['paymentMethod'],
    deliveryMethod: 'PICKUP' as Order['deliveryMethod'],
  });
  const [manualItems, setManualItems] = useState<ManualItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [flyItems, setFlyItems] = useState<FlyItem[]>([]);
  const cartRef = useRef<HTMLDivElement>(null);

  // Barcode
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

  function openManual() {
    setStep('client');
    setManualForm({ customerName: '', customerPhone: '', customerAddress: '', notes: '', paymentMethod: 'CASH_ON_DELIVERY', deliveryMethod: 'PICKUP' });
    setManualItems([]);
    setProductSearch('');
    setProductCatFilter('');
    setShowManual(true);
    setOrderMode(null);
  }

  function closeManual() {
    setShowManual(false);
    stopCameraScanner();
    setManualItems([]);
    setProductSearch('');
    setProductCatFilter('');
    setScanMode(null);
  }

  async function changeStatus(orderId: string, status: Order['status']) {
    await updateOrderStatus(orderId, status);
    await loadData();
    if (selected?.id === orderId) setSelected(prev => prev ? { ...prev, status } : null);
  }

  async function waAction(type: 'confirm_order' | 'payment_reminder' | 'order_ready' | 'send_receipt' | 'contact', order: Order) {
    if (!order.customerPhone || !shop?.id) return;
    await sendWhatsApp(type, {
      shopId: shop.id, shopName: shop.name,
      customerPhone: order.customerPhone, customerName: order.customerName,
      orderId: order.id, orderRef: order.orderNumber,
      total: order.total, reste: order.total, currency: shop.currency,
    });
  }

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
    const product = products.find(p => p.barcode === code || p.sku === code);
    if (product) { addProduct(product); setScanError(''); }
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

  function addProduct(product: Product, evt?: React.MouseEvent) {
    setManualItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { productId: product.id!, productName: product.name, quantity: 1, unitPrice: product.sellingPrice, costPrice: product.costPrice, imageUrl: product.imageUrl }];
    });
    setProductSearch('');
    if (evt) {
      const rect = (evt.currentTarget as HTMLElement).getBoundingClientRect();
      const fly: FlyItem = { id: Date.now().toString(), x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      setFlyItems(prev => [...prev, fly]);
      setTimeout(() => setFlyItems(prev => prev.filter(f => f.id !== fly.id)), 700);
    }
  }
  function removeItem(productId: string) { setManualItems(prev => prev.filter(i => i.productId !== productId)); }
  function updateQty(productId: string, qty: number) {
    if (qty <= 0) { removeItem(productId); return; }
    setManualItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i));
  }

  async function saveOrder() {
    if (!shop?.id || manualItems.length === 0) return;
    setSavingManual(true);
    try {
      const deliveryFee = manualForm.deliveryMethod === 'DELIVERY' ? (shop.deliveryFee || 0) : 0;
      const subtotal = manualItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
      const orderId = await createOrder(shop.id, {
        customerName: manualForm.customerName,
        customerPhone: manualForm.customerPhone.replace(/[^0-9+]/g, ''),
        ...(manualForm.customerAddress ? { customerAddress: manualForm.customerAddress } : {}),
        ...(manualForm.notes ? { notes: manualForm.notes } : {}),
        items: manualItems.map(i => ({ productId: i.productId, productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, costPrice: i.costPrice })),
        paymentMethod: manualForm.paymentMethod,
        deliveryMethod: manualForm.deliveryMethod,
        deliveryFee,
      });
      await updateOrderStatus(orderId, 'CONFIRMED');
      await updateOrderStatus(orderId, 'PROCESSING');
      await loadData();
      const previewOrder: any = {
        id: orderId,
        orderNumber: 'CMD-' + Date.now().toString().slice(-6),
        customerName: manualForm.customerName,
        customerPhone: manualForm.customerPhone,
        customerAddress: manualForm.customerAddress,
        notes: manualForm.notes,
        items: manualItems.map(i => ({ productName: i.productName, quantity: i.quantity, unitPrice: i.unitPrice, total: i.unitPrice * i.quantity })),
        subtotal, deliveryFee, total: subtotal + deliveryFee,
        paymentMethod: manualForm.paymentMethod,
        deliveryMethod: manualForm.deliveryMethod,
        status: 'PROCESSING',
        createdAt: new Date().toISOString(),
      };
      closeManual();
      setCreatedOrder(previewOrder);
    } catch (err: any) { alert(err.message || 'Erreur'); }
    setSavingManual(false);
  }

  function printReceipt() {
    const content = receiptRef.current; if (!content) return;
    const win = window.open('', '_blank', 'width=380,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Recu</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Courier New',monospace;font-size:12px;width:80mm;margin:0 auto;padding:4mm}</style></head><body>${content.innerHTML}<script>window.onload=function(){window.print();window.close()}<\/script></body></html>`);
    win.document.close();
  }

  const primaryColor = shop?.primaryColor || '#ec4899';
  const manualSubtotal = manualItems.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const manualDelivery = manualForm.deliveryMethod === 'DELIVERY' ? (shop?.deliveryFee || 0) : 0;
  const manualTotal = manualSubtotal + manualDelivery;
  const availableProducts = products.filter(p => p.isActive && p.stock > 0);
  const productCategories = Array.from(new Set(availableProducts.map(p => p.category)));
  const displayedProducts = availableProducts.filter(p =>
    (!productCatFilter || p.category === productCatFilter) &&
    (!productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.barcode || '').includes(productSearch) || (p.sku || '').toLowerCase().includes(productSearch.toLowerCase()))
  );
  let filtered = orders;
  if (statusFilter) filtered = filtered.filter(o => o.status === statusFilter);
  if (search) filtered = filtered.filter(o => o.customerName.toLowerCase().includes(search.toLowerCase()) || o.orderNumber.toLowerCase().includes(search.toLowerCase()) || (o.customerPhone || '').includes(search));
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
  const todayRevenue = orders.filter(o => { const today = new Date(); today.setHours(0,0,0,0); return new Date(o.createdAt) >= today && o.status === 'DELIVERED'; }).reduce((s, o) => s + o.total, 0);
  const canGoProducts = manualForm.customerName.trim().length > 0;
  const canSave = manualItems.length > 0;

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: primaryColor }} /></div>;

  return (
    <div className="space-y-5">
      {flyItems.map(f => (
        <div key={f.id} className="pointer-events-none fixed z-[9999]"
          style={{ left: f.x - 16, top: f.y - 16, width: 32, height: 32, animation: 'flyUp 0.7s ease forwards' }}>
          <div className="w-8 h-8 rounded-full bg-white shadow-xl border-2 flex items-center justify-center text-sm" style={{ borderColor: primaryColor }}>+1</div>
        </div>
      ))}
      <style>{`
        @keyframes flyUp { 0%{transform:scale(1) translateY(0);opacity:1} 100%{transform:scale(0.5) translateY(-80px);opacity:0} }
        @keyframes slideUp { from{transform:translateY(100%);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        .slide-up { animation: slideUp 0.3s ease forwards; }
        .fade-in { animation: fadeIn 0.2s ease forwards; }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Commandes</h1>
          <p className="text-gray-500 text-sm">{orders.length} commande{orders.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => setOrderMode('pick')} className="btn-primary flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
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
              <div className="flex items-center gap-2 mb-1"><div className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} /><span className="text-xs text-gray-500 font-medium">{cfg.label}</span></div>
              <p className="text-2xl font-bold text-gray-800">{stats[s]}</p>
            </button>
          );
        })}
        <div className="stat-card col-span-2 lg:col-span-1">
          <p className="text-xs text-gray-500 font-medium mb-1">Revenu aujourd'hui</p>
          <p className="text-lg font-bold text-emerald-600">{formatPrice(todayRevenue, shop?.currency)}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Nom, téléphone, numéro..." value={search} onChange={e => setSearch(e.target.value)} className="input pl-9 text-sm" />
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
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Du</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input text-sm" /></div>
            <div><label className="text-xs font-medium text-gray-500 mb-1 block">Au</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input text-sm" /></div>
          </div>
        )}
        {hasFilters && <p className="text-xs text-gray-500">{filtered.length} résultat{filtered.length !== 1 ? 's' : ''}</p>}
      </div>

      {/* Status pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setStatusFilter('')}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold ${!statusFilter ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
          style={!statusFilter ? { backgroundColor: primaryColor } : {}}>Toutes ({orders.length})</button>
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
          <p className="text-gray-500 font-medium mb-1">Aucune commande</p>
          <p className="text-xs text-gray-400 mb-4">Les commandes en ligne apparaissent ici automatiquement</p>
          <button onClick={() => setOrderMode('pick')} className="btn-primary inline-flex items-center gap-2" style={{ backgroundColor: primaryColor }}>
            <Plus className="w-4 h-4" />Enregistrer une commande
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
                      <p className="text-xs text-gray-400">{dayOrders.length} commande{dayOrders.length !== 1 ? 's' : ''}{dayTotal > 0 ? `  ${formatPrice(dayTotal, shop?.currency)}` : ''}</p>
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
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.color.split(' ')[0]}`}><StatusIcon className={`w-4 h-4 ${cfg.color.split(' ')[1]}`} /></div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-gray-800 text-sm">{order.customerName}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${cfg.color}`}>{cfg.label}</span>
                              </div>
                              <p className="text-xs text-gray-400">{order.orderNumber} · {new Date(order.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <p className="font-bold text-gray-800 text-sm">{formatPrice(order.total, shop?.currency)}</p>
                            <button onClick={e => { e.stopPropagation(); setShowReceipt(order); }}
                              className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"><Printer className="w-3 h-3" />Reçu</button>
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

      {/* ── CHOIX TYPE ──────────────────────────────────────────────────── */}
      {orderMode === 'pick' && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl slide-up">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4 sm:hidden" />
            <div className="px-6 pb-2 text-center">
              <h2 className="text-lg font-black text-gray-800">Quelle commande enregistrer ?</h2>
              <p className="text-sm text-gray-400 mt-1">Choisissez la source de la commande</p>
            </div>
            <div className="p-4 space-y-3">
              <button onClick={() => setOrderMode(null)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all text-left group">
                <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-105 transition-transform">🛒</div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">Commande en ligne</p>
                  <p className="text-xs text-gray-400 mt-0.5">Déjà dans la liste — cliquez dessus pour confirmer</p>
                </div>
              </button>
              <button onClick={openManual}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-green-200 hover:bg-green-50 transition-all text-left group">
                <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl group-hover:scale-105 transition-transform">💬</div>
                <div>
                  <p className="font-bold text-gray-800 text-sm">WhatsApp / En personne</p>
                  <p className="text-xs text-gray-400 mt-0.5">Enregistrer manuellement une commande reçue</p>
                </div>
              </button>
            </div>
            <div className="px-4 pb-6"><button onClick={() => setOrderMode(null)} className="w-full py-3 text-sm text-gray-400 font-medium">Annuler</button></div>
          </div>
        </div>
      )}

      {/* ── FORMULAIRE MODERNE PAR ÉTAPES ──────────────────────────────── */}
      {showManual && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl slide-up flex flex-col" style={{ maxHeight: '95vh' }}>

            {/* ── Header avec étapes ── */}
            <div className="flex-shrink-0 px-5 pt-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                {step !== 'client' && (
                  <button onClick={() => setStep(step === 'summary' ? 'products' : 'client')}
                    className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                )}
                <div className="flex-1">
                  <p className="text-xs font-bold text-green-600 uppercase tracking-wider">💬 Commande WhatsApp</p>
                  <h2 className="text-base font-black text-gray-800">
                    {step === 'client' ? 'Infos client' : step === 'products' ? 'Produits commandés' : 'Récapitulatif'}
                  </h2>
                </div>
                <button onClick={closeManual} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors flex-shrink-0">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Progress bar */}
              <div className="flex gap-1.5">
                {(['client','products','summary'] as Step[]).map((s, i) => (
                  <div key={s} className="flex-1 h-1.5 rounded-full transition-all"
                    style={{ backgroundColor: step === s ? primaryColor : i < (['client','products','summary'] as Step[]).indexOf(step) ? `${primaryColor}60` : '#e5e7eb' }} />
                ))}
              </div>
            </div>

            {/* ── ÉTAPE 1 : Client ── */}
            {step === 'client' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4 fade-in">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      <User className="w-3 h-3 inline mr-1" />Nom du client *
                    </label>
                    <input
                      autoFocus
                      className="input text-base font-semibold"
                      placeholder="Ex: Aminata Koné"
                      value={manualForm.customerName}
                      onChange={e => setManualForm({ ...manualForm, customerName: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      <Phone className="w-3 h-3 inline mr-1" />WhatsApp / Téléphone
                    </label>
                    <PhoneInput
                      value={manualForm.customerPhone}
                      onChange={v => setManualForm({ ...manualForm, customerPhone: v })}
                      placeholder="6XX XXX XXX"
                      defaultCountry="CM"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Livraison</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[['PICKUP','🏪 Retrait'],['DELIVERY','🚚 Livraison']].map(([val, label]) => (
                          <button key={val} type="button"
                            onClick={() => setManualForm({ ...manualForm, deliveryMethod: val as any })}
                            className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${manualForm.deliveryMethod === val ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            style={manualForm.deliveryMethod === val ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Paiement</label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {[['CASH_ON_DELIVERY','💵 Espèces'],['MOBILE_MONEY','📱 Mobile Money']].map(([val, label]) => (
                          <button key={val} type="button"
                            onClick={() => setManualForm({ ...manualForm, paymentMethod: val as any })}
                            className={`py-2 rounded-xl text-xs font-bold border-2 transition-all ${manualForm.paymentMethod === val ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                            style={manualForm.paymentMethod === val ? { backgroundColor: '#16a34a', borderColor: '#16a34a' } : {}}>
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      <MapPin className="w-3 h-3 inline mr-1" />Notes / Adresse
                    </label>
                    <input
                      className="input text-sm"
                      placeholder="Quartier, adresse, instructions..."
                      value={manualForm.notes}
                      onChange={e => setManualForm({ ...manualForm, notes: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── ÉTAPE 2 : Produits ── */}
            {step === 'products' && (
              <div className="flex-1 flex flex-col min-h-0 fade-in">
                {/* Barre recherche + scanner */}
                <div className="p-4 border-b border-gray-50 flex-shrink-0 space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input type="text" className="input pl-9 text-sm" placeholder="Rechercher un produit..."
                        value={productSearch} onChange={e => setProductSearch(e.target.value)} />
                    </div>
                    <button type="button" onClick={() => { setScanMode(scanMode === 'keyboard' ? null : 'keyboard'); setTimeout(() => barcodeRef.current?.focus(), 100); }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${scanMode === 'keyboard' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                      style={scanMode === 'keyboard' ? { backgroundColor: primaryColor } : {}}>
                      <Barcode className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => scanMode === 'camera' ? stopCameraScanner() : startCameraScanner()}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${scanMode === 'camera' ? 'text-white border-transparent' : 'border-gray-200 text-gray-600'}`}
                      style={scanMode === 'camera' ? { backgroundColor: primaryColor } : {}}>
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>
                  {scanMode === 'keyboard' && (
                    <input ref={barcodeRef} type="text" className="input text-sm font-mono" placeholder="Scanner le code-barres..."
                      value={barcodeInput} onChange={e => setBarcodeInput(e.target.value)} onKeyDown={handleBarcodeKey} autoComplete="off" />
                  )}
                  {scanMode === 'camera' && (
                    <div className="relative bg-gray-900 rounded-xl overflow-hidden" style={{ height: 80 }}>
                      <video ref={scanVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center"><div className="w-40 h-8 border-2 border-orange-400 rounded opacity-70" /></div>
                      <button type="button" onClick={stopCameraScanner} className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full text-white flex items-center justify-center"><X className="w-3 h-3" /></button>
                    </div>
                  )}
                  {scanError && <p className="text-xs text-red-500 bg-red-50 px-3 py-1.5 rounded-lg">{scanError}</p>}

                  {/* Catégories */}
                  {productCategories.length > 1 && !productSearch && (
                    <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                      <button type="button" onClick={() => setProductCatFilter('')}
                        className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold ${!productCatFilter ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                        style={!productCatFilter ? { backgroundColor: primaryColor } : {}}>Tout</button>
                      {productCategories.map(cat => (
                        <button key={cat} type="button" onClick={() => setProductCatFilter(productCatFilter === cat ? '' : cat)}
                          className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${productCatFilter === cat ? 'text-white' : 'bg-gray-100 text-gray-600'}`}
                          style={productCatFilter === cat ? { backgroundColor: primaryColor } : {}}>{cat}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Liste produits */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
                  {displayedProducts.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                      <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucun produit disponible</p>
                    </div>
                  ) : displayedProducts.map(p => {
                    const qty = manualItems.find(i => i.productId === p.id)?.quantity || 0;
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                        {/* Image */}
                        <div className="w-11 h-11 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-100">
                          {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>}
                        </div>
                        {/* Infos */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{p.name}</p>
                          <p className="text-xs font-bold" style={{ color: primaryColor }}>{formatPrice(p.sellingPrice, shop?.currency)}</p>
                        </div>
                        {/* Contrôle quantité */}
                        {qty === 0 ? (
                          <button onClick={e => addProduct(p, e)}
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold transition-all hover:scale-110 flex-shrink-0"
                            style={{ backgroundColor: primaryColor }}>
                            <Plus className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button onClick={() => updateQty(p.id!, qty - 1)}
                              className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 hover:bg-gray-200 transition-colors">
                              −
                            </button>
                            <span className="w-7 text-center font-black text-gray-800 text-sm">{qty}</span>
                            <button onClick={e => addProduct(p, e)}
                              className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white transition-all hover:scale-105"
                              style={{ backgroundColor: primaryColor }}>
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Panier mini */}
                {manualItems.length > 0 && (
                  <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 bg-gray-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: primaryColor }}>
                        {manualItems.reduce((s, i) => s + i.quantity, 0)}
                      </div>
                      <span className="text-sm text-gray-500">article{manualItems.reduce((s,i)=>s+i.quantity,0) > 1 ? 's' : ''}</span>
                    </div>
                    <p className="font-black text-gray-800">{formatPrice(manualSubtotal, shop?.currency)}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── ÉTAPE 3 : Récapitulatif ── */}
            {step === 'summary' && (
              <div className="flex-1 overflow-y-auto p-5 space-y-4 fade-in">
                {/* Client */}
                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                      style={{ backgroundColor: primaryColor }}>
                      {manualForm.customerName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-black text-gray-800">{manualForm.customerName}</p>
                      {manualForm.customerPhone && <p className="text-sm text-gray-500">{manualForm.customerPhone}</p>}
                      {manualForm.notes && <p className="text-xs text-gray-400 mt-0.5">{manualForm.notes}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${manualForm.deliveryMethod === 'DELIVERY' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {manualForm.deliveryMethod === 'DELIVERY' ? '🚚 Livraison' : '🏪 Retrait'}
                    </span>
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold bg-gray-100 text-gray-600">
                      {manualForm.paymentMethod === 'MOBILE_MONEY' ? '📱 Mobile Money' : '💵 Espèces'}
                    </span>
                  </div>
                </div>

                {/* Articles */}
                <div className="space-y-2">
                  {manualItems.map(item => (
                    <div key={item.productId} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3">
                      {item.imageUrl ? <img src={item.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">📦</div>}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-400">{item.quantity} × {formatPrice(item.unitPrice, shop?.currency)}</p>
                      </div>
                      <p className="font-black text-gray-800 text-sm flex-shrink-0">{formatPrice(item.unitPrice * item.quantity, shop?.currency)}</p>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="rounded-2xl p-4 border-2" style={{ borderColor: `${primaryColor}30`, background: `${primaryColor}06` }}>
                  {manualDelivery > 0 && (
                    <div className="flex justify-between text-sm text-gray-500 mb-2">
                      <span>Livraison</span><span>{formatPrice(manualDelivery, shop?.currency)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xl" style={{ color: primaryColor }}>
                    <span>Total</span><span>{formatPrice(manualTotal, shop?.currency)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer avec CTA ── */}
            <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-white" style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))' }}>
              {step === 'client' && (
                <button
                  onClick={() => setStep('products')}
                  disabled={!canGoProducts}
                  className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}>
                  Choisir les produits <ArrowRight className="w-5 h-5" />
                </button>
              )}
              {step === 'products' && (
                <button
                  onClick={() => setStep('summary')}
                  disabled={!canSave}
                  className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ backgroundColor: primaryColor }}>
                  Voir le récapitulatif ({manualItems.reduce((s,i)=>s+i.quantity,0)} article{manualItems.reduce((s,i)=>s+i.quantity,0) > 1 ? 's' : ''} · {formatPrice(manualSubtotal, shop?.currency)})
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
              {step === 'summary' && (
                <button
                  onClick={saveOrder}
                  disabled={savingManual}
                  className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 disabled:opacity-40 transition-all hover:opacity-90"
                  style={{ backgroundColor: '#16a34a' }}>
                  {savingManual ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                  {savingManual ? 'Enregistrement...' : 'Confirmer la commande'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* == ORDER DETAIL ================================================== */}
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
                <p className={`font-medium text-sm ${STATUS_CONFIG[selected.status].color.split(' ')[1]}`}>Statut : {STATUS_CONFIG[selected.status].label}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selected.status === 'PENDING' && (<><button onClick={() => changeStatus(selected.id!, 'CONFIRMED')} className="btn-primary text-sm" style={{ backgroundColor: primaryColor }}>✅ Confirmer</button><button onClick={() => changeStatus(selected.id!, 'CANCELLED')} className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm">✕ Annuler</button></>)}
                {selected.status === 'CONFIRMED' && <button onClick={() => changeStatus(selected.id!, 'PROCESSING')} className="btn-primary text-sm" style={{ backgroundColor: primaryColor }}>📦 En préparation</button>}
                {selected.status === 'PROCESSING' && <button onClick={() => changeStatus(selected.id!, 'DELIVERED')} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm">✅ Livrée</button>}
              </div>
              {selected.customerPhone && (
                <div className="bg-green-50 border border-green-100 rounded-xl p-3">
                  <p className="text-xs font-bold text-green-700 mb-2 flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5" />Actions WhatsApp</p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { type: 'contact' as const,          label: '💬 Contacter' },
                      { type: 'confirm_order' as const,    label: '✅ Confirmer' },
                      { type: 'order_ready' as const,      label: '📦 Prête' },
                      { type: 'payment_reminder' as const, label: '💰 Rappel' },
                      { type: 'send_receipt' as const,     label: '🧾 Reçu' },
                    ].map(({ type, label }) => (
                      <button key={type} onClick={() => waAction(type, selected)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-green-200 rounded-lg text-xs font-semibold text-green-700 hover:bg-green-100 transition-colors">
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-semibold text-sm mb-2">Client</h3>
                <p className="font-medium">{selected.customerName}</p>
                {selected.customerPhone && <p className="text-sm text-gray-600 mt-1">{selected.customerPhone}</p>}
                {selected.customerAddress && <p className="text-sm text-gray-600 mt-1">{selected.customerAddress}</p>}
                {selected.notes && <p className="text-sm text-gray-500 mt-2 italic">{selected.notes}</p>}
              </div>
              <div className="space-y-2">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <div><p className="font-medium text-sm">{item.productName}</p><p className="text-xs text-gray-500">x{item.quantity} · {formatPrice(item.unitPrice, shop?.currency)}</p></div>
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

      {/* == RECEIPT ====================================================== */}
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

      {/* == CONFIRMATION FINALE ========================================== */}
      {createdOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[60] p-0 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl slide-up overflow-hidden">
            {/* Header succès */}
            <div className="p-6 text-center" style={{ background: `linear-gradient(135deg,${primaryColor}15,${primaryColor}05)` }}>
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-3 shadow-md border border-gray-100">
                <span className="text-3xl">🎉</span>
              </div>
              <h2 className="text-xl font-black text-gray-800">Commande enregistrée !</h2>
              <p className="text-gray-400 text-sm mt-1">{createdOrder.orderNumber}</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-sm font-black" style={{ color: primaryColor }}>{formatPrice(createdOrder.total, shop?.currency)}</span>
                <span className="text-gray-400 text-sm">·</span>
                <span className="text-sm text-gray-500 font-semibold">{createdOrder.customerName}</span>
              </div>
            </div>

            <div className="p-5 space-y-3">
              {/* Actions WhatsApp — MISE EN AVANT */}
              {createdOrder.customerPhone && (
                <div className="space-y-2">
                  <p className="text-xs font-black text-gray-400 uppercase tracking-wider text-center">Envoyer sur WhatsApp</p>

                  {/* Bouton principal : Confirmation */}
                  <button
                    onClick={() => waAction('confirm_order', createdOrder as any)}
                    className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 hover:opacity-90 transition-all"
                    style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
                    <MessageCircle className="w-5 h-5" />
                    Envoyer la confirmation WhatsApp
                  </button>

                  {/* Actions secondaires */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { type: 'payment_reminder' as const, emoji: '💰', label: 'Rappel\npaiement' },
                      { type: 'order_ready' as const,      emoji: '📦', label: 'Commande\nprête' },
                      { type: 'send_receipt' as const,     emoji: '🧾', label: 'Envoyer\nle reçu' },
                    ].map(({ type, emoji, label }) => (
                      <button key={type}
                        onClick={() => waAction(type, createdOrder as any)}
                        className="flex flex-col items-center gap-1 py-3 rounded-2xl bg-green-50 border border-green-100 hover:bg-green-100 transition-colors">
                        <span className="text-xl">{emoji}</span>
                        <span className="text-[10px] font-bold text-green-700 text-center leading-tight whitespace-pre-line">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions secondaires */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  onClick={async () => {
                    if (createdOrder.id) { await updateOrderStatus(createdOrder.id, 'DELIVERED'); await loadData(); }
                    setCreatedOrder(null);
                  }}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-bold text-sm hover:bg-emerald-100 transition-colors">
                  <Check className="w-4 h-4" />Marquer livrée
                </button>
                <button onClick={() => { setShowReceipt(createdOrder as any); setCreatedOrder(null); }}
                  className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-gray-100 text-gray-700 font-bold text-sm hover:bg-gray-200 transition-colors">
                  <Printer className="w-4 h-4" />Imprimer
                </button>
              </div>

              <button onClick={() => setCreatedOrder(null)} className="w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 transition-colors font-medium">
                Continuer sans envoyer →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}