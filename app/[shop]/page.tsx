'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Search, ShoppingCart, Plus, Minus, Star, Phone, MapPin, MessageCircle,
  SlidersHorizontal, Heart, Eye, Truck, Shield, RotateCcw, X, ChevronRight,
  Grid3X3, LayoutList, Settings, ArrowLeft, Loader2, CheckCircle, CreditCard, Trash2
} from 'lucide-react';
import { getShopBySlug, getProducts, getCategories, createOrder } from '@/lib/firestore';
import { Shop, Product, Category } from '@/lib/types';
import { useCart } from '@/hooks/useCart';
import { useAuth } from '@/hooks/useAuth';
import { formatPrice, getWhatsAppLink } from '@/lib/utils';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'stock-desc';
type ViewMode = 'grid' | 'list';
type CheckoutStep = 'cart' | 'info' | 'success';

export default function ShopPage() {
  const params = useParams();
  const slug = params.shop as string;
  const { items, addToCart, removeFromCart, updateQuantity, subtotal, totalItems, clearCart } = useCart();
  const { shop: adminShop, user } = useAuth();

  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // UI state
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [showInStock, setShowInStock] = useState(false);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [quickView, setQuickView] = useState<Product | null>(null);
  const [cartAnimId, setCartAnimId] = useState<string | null>(null);

  // ── CHECKOUT MODAL ────────────────────────────────────────────────────────
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [submitting, setSubmitting] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [orderTotal, setOrderTotal] = useState(0);

  const [form, setForm] = useState({
    name: '', phone: '', quartier: '', address: '',
    deliveryMethod: 'PICKUP' as 'DELIVERY' | 'PICKUP',
    paymentMethod: 'CASH_ON_DELIVERY' as 'MOBILE_MONEY' | 'CASH_ON_DELIVERY',
    notes: '',
  });

  useEffect(() => {
    async function loadShop() {
      try {
        const shopData = await getShopBySlug(slug);
        if (!shopData || !shopData.isActive) { setNotFound(true); setLoading(false); return; }
        setShop(shopData);
        setForm(f => ({ ...f, deliveryMethod: shopData.pickupEnabled ? 'PICKUP' : 'DELIVERY' }));
        const [prods, cats] = await Promise.all([getProducts(shopData.id!, true), getCategories(shopData.id!)]);
        setProducts(prods); setCategories(cats);
      } catch { setNotFound(true); }
      setLoading(false);
    }
    if (slug) loadShop();
  }, [slug]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 to-purple-600">
      <div className="text-center text-white">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white/80 font-medium">Chargement...</p>
      </div>
    </div>
  );

  if (notFound || !shop) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="text-6xl mb-4">🏪</div>
      <h1 className="text-2xl font-bold text-gray-800 mb-2">Boutique non trouvée</h1>
      <Link href="/" className="btn-primary mt-4">Retour à l'accueil</Link>
    </div>
  );

  const pc = shop.primaryColor || '#ec4899';
  const featuredProducts = products.filter(p => p.isFeatured);
  const getQty = (id: string) => items.find(i => i.product.id === id)?.quantity || 0;
  const toggleWishlist = (id: string) => setWishlist(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const handleAdd = (product: Product) => {
    addToCart(product, slug);
    setCartAnimId(product.id!);
    setTimeout(() => setCartAnimId(null), 600);
  };

  const deliveryFee = form.deliveryMethod === 'DELIVERY' ? (shop.deliveryFee || 0) : 0;
  const total = subtotal + deliveryFee;

  let filtered = products.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || (p.description || '').toLowerCase().includes(search.toLowerCase());
    const mc = !catFilter || p.category === catFilter;
    const mn = !priceMin || p.sellingPrice >= parseFloat(priceMin);
    const mx = !priceMax || p.sellingPrice <= parseFloat(priceMax);
    const mi = !showInStock || p.stock > 0;
    return ms && mc && mn && mx && mi;
  });
  if (sortBy === 'price-asc') filtered = [...filtered].sort((a, b) => a.sellingPrice - b.sellingPrice);
  else if (sortBy === 'price-desc') filtered = [...filtered].sort((a, b) => b.sellingPrice - a.sellingPrice);
  else if (sortBy === 'name-asc') filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
  else if (sortBy === 'stock-desc') filtered = [...filtered].sort((a, b) => b.stock - a.stock);

  const hasFilters = catFilter || priceMin || priceMax || showInStock || sortBy !== 'default';
  const clearFilters = () => { setCatFilter(''); setPriceMin(''); setPriceMax(''); setShowInStock(false); setSortBy('default'); };

  // ── SUBMIT ORDER ──────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!shop?.id || items.length === 0) return;
    setSubmitting(true);
    const snapShop = shop;
    const snapItems = [...items];
    const snapTotal = total;
    try {
      const orderId = await createOrder(shop.id, {
        customerName: form.name,
        customerPhone: form.phone,
        ...(form.quartier ? { customerQuartier: form.quartier } : {}),
        ...(form.address ? { customerAddress: form.address } : {}),
        ...(form.notes ? { notes: form.notes } : {}),
        items: snapItems.map(({ product, quantity }) => ({
          productId: product.id!,
          productName: product.name,
          quantity,
          unitPrice: product.sellingPrice,
          costPrice: product.costPrice,
        })),
        paymentMethod: form.paymentMethod,
        deliveryMethod: form.deliveryMethod,
        deliveryFee,
      });

      const num = `CMD-${new Date().toISOString().slice(2, 10).replace(/-/g, '')}-${orderId.slice(0, 4).toUpperCase()}`;
      setOrderNumber(num);
      setOrderTotal(snapTotal);
      clearCart();
      setCheckoutStep('success');

      // WhatsApp auto-confirm
      if (snapShop.whatsapp) {
        const lines = snapItems.map(({ product, quantity }) =>
          `• ${product.name} x${quantity} = ${formatPrice(product.sellingPrice * quantity, snapShop.currency)}`
        ).join('\n');
        const msg = `🛒 *Nouvelle commande ${num}!*\n\n👤 *Client:* ${form.name}\n📞 *Tél:* ${form.phone}\n📍 *Livraison:* ${form.deliveryMethod === 'DELIVERY' ? `${form.quartier} - ${form.address}` : 'Retrait sur place'}\n💳 *Paiement:* ${form.paymentMethod === 'MOBILE_MONEY' ? 'Mobile Money' : 'Espèces'}\n\n*Articles:*\n${lines}\n\n💰 *Total: ${formatPrice(snapTotal, snapShop.currency)}*\n\nMerci de confirmer!`;
        setTimeout(() => window.open(getWhatsAppLink(snapShop.whatsapp, msg), '_blank'), 600);
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('LIMIT_REACHED')) alert('⚠️ ' + msg.replace('LIMIT_REACHED: ', ''));
      else alert('Erreur lors de la commande. Vérifiez votre connexion.');
    }
    setSubmitting(false);
  }

  function openCheckout() {
    setCheckoutStep('cart');
    setShowCheckout(true);
  }

  function closeCheckout() {
    setShowCheckout(false);
    setTimeout(() => {
      if (checkoutStep === 'success') {
        setCheckoutStep('cart');
        setForm({ name: '', phone: '', quartier: '', address: '', deliveryMethod: shop?.pickupEnabled ? 'PICKUP' : 'DELIVERY', paymentMethod: 'CASH_ON_DELIVERY', notes: '' });
      }
    }, 300);
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>

      {/* ── HEADER ── */}
      <header className="shop-header bg-white shadow-sm sticky top-0 z-40" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {shop.logo ? (
              <img src={shop.logo} alt="" className="w-10 h-10 rounded-xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg, ${pc}, ${pc}bb)` }}>
                {shop.name.charAt(0)}
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-bold text-gray-800 truncate text-sm">{shop.name}</h1>
              {shop.slogan && <p className="text-xs text-gray-400 truncate">{shop.slogan}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {shop.whatsapp && (
              <a href={getWhatsAppLink(shop.whatsapp, `Bonjour ${shop.name}!`)} target="_blank"
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium text-white bg-green-500 hover:bg-green-600 transition-colors">
                <MessageCircle className="w-4 h-4" /><span className="hidden md:inline">WhatsApp</span>
              </a>
            )}
            {/* Cart button — opens checkout modal */}
            <button onClick={openCheckout}
              className="relative p-2.5 rounded-xl transition-all hover:scale-105"
              style={{ backgroundColor: `${pc}15`, color: pc }}>
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: pc }}>{totalItems}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative overflow-hidden py-10 text-white"
        style={{ background: `linear-gradient(135deg, ${pc} 0%, ${pc}88 100%)` }}>
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-4 right-12 w-32 h-32 rounded-full border-4 border-white" />
          <div className="absolute bottom-2 left-8 w-20 h-20 rounded-full border-2 border-white" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-extrabold mb-2">Bienvenue chez {shop.name} 🛍️</h2>
          <p className="text-white/85 max-w-md mx-auto text-sm">{shop.description || 'Découvrez nos produits sélectionnés avec soin pour vous.'}</p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {[{ icon: Truck, t: 'Livraison rapide' }, { icon: Shield, t: 'Paiement sécurisé' }, { icon: RotateCcw, t: 'Retours faciles' }].map(({ icon: I, t }) => (
              <div key={t} className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
                <I className="w-3.5 h-3.5" />{t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORY PILLS ── */}
      {categories.length > 0 && (
        <div className="bg-white border-b overflow-x-auto">
          <div className="flex items-center gap-2 px-4 py-2.5 max-w-6xl mx-auto min-w-max">
            <button onClick={() => setCatFilter('')}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all"
              style={!catFilter ? { backgroundColor: pc, color: 'white' } : { backgroundColor: '#f3f4f6', color: '#4b5563' }}>
              Tout ({products.length})
            </button>
            {categories.map(cat => (
              <button key={cat.id} onClick={() => setCatFilter(catFilter === cat.name ? '' : cat.name)}
                className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
                style={catFilter === cat.name ? { backgroundColor: cat.color || pc, color: 'white' } : { backgroundColor: '#f3f4f6', color: '#4b5563' }}>
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── FEATURED ── */}
      {featuredProducts.length > 0 && !search && !catFilter && (
        <section className="max-w-6xl mx-auto px-4 pt-5 w-full">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
              <span className="w-6 h-6 bg-amber-400 rounded-lg text-white text-xs flex items-center justify-center">⭐</span>
              Produits vedettes
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featuredProducts.slice(0, 4).map(p => (
              <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border-2"
                style={{ borderColor: `${pc}25` }} onClick={() => setQuickView(p)}>
                {p.imageUrl ? (
                  <div className="relative"><img src={p.imageUrl} alt={p.name} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-bold truncate">{p.name}</p>
                      <p className="text-white text-sm font-extrabold">{formatPrice(p.sellingPrice, shop.currency)}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-32 flex items-center justify-center text-3xl" style={{ background: `${pc}10` }}>⭐</div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── SEARCH + CONTROLS ── */}
      <div className="max-w-6xl mx-auto px-4 py-4 w-full">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un produit..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 transition-all"
              style={{ '--tw-ring-color': `${pc}40` } as any} />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
            style={hasFilters ? { backgroundColor: pc, color: 'white', border: 'none' } : { backgroundColor: 'white', color: '#4b5563', borderColor: '#e5e7eb' }}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
          </button>
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className="p-2.5 transition-colors" style={viewMode === 'grid' ? { backgroundColor: pc, color: 'white' } : { color: '#9ca3af' }}><Grid3X3 className="w-4 h-4" /></button>
            <button onClick={() => setViewMode('list')} className="p-2.5 transition-colors" style={viewMode === 'list' ? { backgroundColor: pc, color: 'white' } : { color: '#9ca3af' }}><LayoutList className="w-4 h-4" /></button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-800 text-sm">Filtres & Tri</p>
              {hasFilters && <button onClick={clearFilters} className="text-xs text-red-500 font-medium">Réinitialiser</button>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Trier par</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
                  <option value="default">Par défaut</option><option value="price-asc">Prix ↑</option>
                  <option value="price-desc">Prix ↓</option><option value="name-asc">Nom A-Z</option>
                  <option value="stock-desc">Stock élevé</option>
                </select>
              </div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Prix min</label>
                <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="0" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" /></div>
              <div><label className="text-xs font-medium text-gray-500 mb-1 block">Prix max</label>
                <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="∞" className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" /></div>
              <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <input type="checkbox" checked={showInStock} onChange={e => setShowInStock(e.target.checked)} className="w-4 h-4 rounded" style={{ accentColor: pc }} />En stock
              </label></div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-gray-500"><span className="font-semibold text-gray-700">{filtered.length}</span> produit{filtered.length !== 1 ? 's' : ''}{catFilter && <span> — <span className="font-medium" style={{ color: pc }}>{catFilter}</span></span>}</p>
          {hasFilters && <button onClick={clearFilters} className="text-xs flex items-center gap-1 font-medium" style={{ color: pc }}><X className="w-3 h-3" />Effacer</button>}
        </div>
      </div>

      {/* ── PRODUCTS GRID ── */}
      <section className="max-w-6xl mx-auto px-4 pb-32 flex-1 w-full">
        {filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                  <div className="relative">
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-40 flex items-center justify-center text-4xl" style={{ background: `${pc}10` }}>📦</div>}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {p.isFeatured && <span className="bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">⭐ Vedette</span>}
                      {p.stock <= 3 && p.stock > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">🔥 Derniers {p.stock}!</span>}
                      {p.stock === 0 && <span className="bg-gray-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Épuisé</span>}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); toggleWishlist(p.id!); }} className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center">
                        <Heart className={`w-4 h-4 ${wishlist.includes(p.id!) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} /></button>
                      <button onClick={e => { e.stopPropagation(); setQuickView(p); }} className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center">
                        <Eye className="w-4 h-4 text-gray-400" /></button>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">{p.category}</p>
                    <h4 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2 my-1">{p.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <p className="font-extrabold text-base" style={{ color: pc }}>{formatPrice(p.sellingPrice, shop.currency)}</p>
                      {p.stock > 0 ? (
                        getQty(p.id!) > 0 ? (
                          <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: pc }}>
                            <button onClick={() => removeFromCart(p.id!, slug)} className="w-7 h-7 flex items-center justify-center text-white" style={{ backgroundColor: pc }}><Minus className="w-3 h-3" /></button>
                            <span className="w-6 text-center text-sm font-bold" style={{ color: pc }}>{getQty(p.id!)}</span>
                            <button onClick={() => handleAdd(p)} className="w-7 h-7 flex items-center justify-center text-white" style={{ backgroundColor: pc }}><Plus className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button onClick={() => handleAdd(p)}
                            className={`w-8 h-8 rounded-xl text-white flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${cartAnimId === p.id ? 'scale-125' : ''}`}
                            style={{ backgroundColor: pc }}>
                            <Plus className="w-4 h-4" />
                          </button>
                        )
                      ) : <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-lg">Épuisé</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2.5">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center gap-3 p-3">
                  <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden cursor-pointer" onClick={() => setQuickView(p)}>
                    {p.imageUrl ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: `${pc}10` }}>📦</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gray-400 uppercase">{p.category}</p>
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{p.name}</h4>
                    {p.description && <p className="text-xs text-gray-500 line-clamp-1">{p.description}</p>}
                    <p className="font-extrabold text-base mt-1" style={{ color: pc }}>{formatPrice(p.sellingPrice, shop.currency)}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-2">
                    <button onClick={() => toggleWishlist(p.id!)}><Heart className={`w-4 h-4 ${wishlist.includes(p.id!) ? 'fill-red-500 text-red-500' : 'text-gray-300'}`} /></button>
                    {p.stock > 0 ? (
                      getQty(p.id!) > 0 ? (
                        <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: pc }}>
                          <button onClick={() => removeFromCart(p.id!, slug)} className="w-7 h-7 flex items-center justify-center text-white" style={{ backgroundColor: pc }}><Minus className="w-3 h-3" /></button>
                          <span className="w-5 text-center text-xs font-bold" style={{ color: pc }}>{getQty(p.id!)}</span>
                          <button onClick={() => handleAdd(p)} className="w-7 h-7 flex items-center justify-center text-white" style={{ backgroundColor: pc }}><Plus className="w-3 h-3" /></button>
                        </div>
                      ) : (
                        <button onClick={() => handleAdd(p)} className="px-3 py-1.5 rounded-xl text-white text-xs font-semibold" style={{ backgroundColor: pc }}>+ Ajouter</button>
                      )
                    ) : <span className="text-xs text-red-500 font-medium">Épuisé</span>}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${pc}15` }}>
              <Search className="w-7 h-7" style={{ color: pc }} />
            </div>
            <p className="text-gray-500 font-medium">Aucun produit trouvé</p>
            {hasFilters && <button onClick={clearFilters} className="mt-2 text-sm font-medium" style={{ color: pc }}>Effacer les filtres</button>}
          </div>
        )}
      </section>

      {/* ── STICKY CART BAR ── */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 z-40 lg:hidden"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <button onClick={openCheckout}
            className="flex items-center justify-between w-full text-white rounded-2xl px-5 py-4 shadow-2xl font-semibold"
            style={{ background: `linear-gradient(135deg, ${pc}, ${pc}bb)` }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white/25 rounded-lg flex items-center justify-center text-sm font-bold">{totalItems}</div>
              <span>Voir mon panier</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold">{formatPrice(subtotal, shop.currency)}</span>
              <ChevronRight className="w-5 h-5" />
            </div>
          </button>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="bg-white border-t py-6">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="font-bold text-gray-800">{shop.name}</p>
              {shop.city && <p className="text-sm text-gray-500 flex items-center gap-1 justify-center md:justify-start"><MapPin className="w-3.5 h-3.5" />{shop.city}, {shop.country}</p>}
            </div>
            <div className="flex gap-3">
              {shop.whatsapp && <a href={getWhatsAppLink(shop.whatsapp, `Bonjour ${shop.name}!`)} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-500"><MessageCircle className="w-4 h-4" />WhatsApp</a>}
              {shop.phone && <a href={`tel:${shop.phone}`} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 text-gray-600"><Phone className="w-4 h-4" />Appeler</a>}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t text-center text-xs text-gray-400">Propulsé par <a href="/" className="hover:text-pink-500 font-medium">ShopMaster</a></div>
        </div>
        <div style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
      </footer>

      {/* ── QUICK VIEW MODAL ── */}
      {quickView && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 sm:p-4 backdrop-blur-sm" onClick={() => setQuickView(null)}>
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800">Aperçu rapide</h3>
              <button onClick={() => setQuickView(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {quickView.imageUrl && <img src={quickView.imageUrl} alt={quickView.name} className="w-full h-56 object-cover" />}
            <div className="p-5">
              <p className="text-xs text-gray-400 uppercase mb-1">{quickView.category}{quickView.brand ? ` • ${quickView.brand}` : ''}</p>
              <h2 className="text-xl font-bold text-gray-800 mb-2">{quickView.name}</h2>
              {quickView.description && <p className="text-gray-600 text-sm mb-3">{quickView.description}</p>}
              {quickView.specifications && (
                <div className="bg-gray-50 rounded-xl p-3 mb-3">
                  <p className="text-xs font-semibold text-gray-500 mb-2">CARACTÉRISTIQUES</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">{quickView.specifications}</pre>
                </div>
              )}
              <div className="flex items-center justify-between">
                <p className="text-2xl font-extrabold" style={{ color: pc }}>{formatPrice(quickView.sellingPrice, shop.currency)}</p>
                {quickView.stock > 0 ? (
                  <button onClick={() => { handleAdd(quickView); setQuickView(null); }}
                    className="px-6 py-3 rounded-xl text-white font-semibold flex items-center gap-2"
                    style={{ backgroundColor: pc }}>
                    <ShoppingCart className="w-4 h-4" />Ajouter au panier
                  </button>
                ) : <span className="text-red-500 font-semibold bg-red-50 px-4 py-2 rounded-xl">Épuisé</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          CHECKOUT MODAL — 3 étapes : Panier → Infos → Confirmation
      ════════════════════════════════════════════════════════════════════ */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 backdrop-blur-sm sm:p-4">
          <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-3xl max-h-[95vh] flex flex-col overflow-hidden">

            {/* ── Modal Header ── */}
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0">
              <div className="flex items-center gap-3">
                {checkoutStep === 'info' && (
                  <button onClick={() => setCheckoutStep('cart')} className="p-1.5 hover:bg-gray-100 rounded-lg -ml-1">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                  </button>
                )}
                <div>
                  <h2 className="font-bold text-gray-800 text-base">
                    {checkoutStep === 'cart' ? '🛒 Mon panier' : checkoutStep === 'info' ? '📋 Finaliser' : '✅ Commande envoyée'}
                  </h2>
                  {checkoutStep !== 'success' && (
                    <p className="text-xs text-gray-400">
                      Étape {checkoutStep === 'cart' ? '1' : '2'}/2 —
                      {checkoutStep === 'cart' ? ' vérifier les articles' : ' vos informations'}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={closeCheckout} className="p-2 hover:bg-gray-100 rounded-xl"><X className="w-5 h-5 text-gray-500" /></button>
            </div>

            {/* ── Step indicator ── */}
            {checkoutStep !== 'success' && (
              <div className="flex px-5 pt-3 pb-1 gap-2 flex-shrink-0">
                {['cart', 'info'].map((s, i) => (
                  <div key={s} className="flex-1 h-1.5 rounded-full transition-all"
                    style={{ backgroundColor: (checkoutStep === 'cart' && i === 0) || (checkoutStep === 'info') ? pc : '#e5e7eb' }} />
                ))}
              </div>
            )}

            {/* ── STEP 1: CART ── */}
            {checkoutStep === 'cart' && (
              <div className="flex-1 overflow-y-auto">
                {items.length === 0 ? (
                  <div className="text-center py-16 px-5">
                    <ShoppingCart className="w-16 h-16 mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-500 font-medium mb-2">Votre panier est vide</p>
                    <p className="text-gray-400 text-sm">Ajoutez des produits pour continuer</p>
                    <button onClick={closeCheckout} className="mt-4 text-sm font-semibold" style={{ color: pc }}>Parcourir les produits</button>
                  </div>
                ) : (
                  <>
                    {/* Items list */}
                    <div className="px-5 pt-3 space-y-3">
                      {items.map(({ product, quantity }) => (
                        <div key={product.id} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-3">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-16 h-16 rounded-xl bg-gray-200 flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">{product.name}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                            <p className="font-bold text-sm mt-1" style={{ color: pc }}>{formatPrice(product.sellingPrice, shop.currency)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <button onClick={() => removeFromCart(product.id!, slug)} className="text-gray-300 hover:text-red-400">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <div className="flex items-center rounded-xl overflow-hidden border" style={{ borderColor: pc }}>
                              <button onClick={() => updateQuantity(product.id!, quantity - 1)} className="w-7 h-7 flex items-center justify-center text-white" style={{ backgroundColor: pc }}><Minus className="w-3 h-3" /></button>
                              <span className="w-7 text-center text-sm font-bold" style={{ color: pc }}>{quantity}</span>
                              <button onClick={() => updateQuantity(product.id!, quantity + 1)} disabled={quantity >= product.stock} className="w-7 h-7 flex items-center justify-center text-white disabled:opacity-50" style={{ backgroundColor: pc }}><Plus className="w-3 h-3" /></button>
                            </div>
                            <p className="text-xs font-bold text-gray-700">{formatPrice(product.sellingPrice * quantity, shop.currency)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Subtotal + CTA */}
                    <div className="px-5 py-4 mt-2 border-t bg-white flex-shrink-0">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Sous-total ({totalItems} article{totalItems > 1 ? 's' : ''})</p>
                          <p className="text-2xl font-extrabold" style={{ color: pc }}>{formatPrice(subtotal, shop.currency)}</p>
                          <p className="text-xs text-gray-400">Livraison calculée à l'étape suivante</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCheckoutStep('info')}
                        className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
                        style={{ backgroundColor: pc }}>
                        Continuer — Mes informations <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── STEP 2: CUSTOMER INFO ── */}
            {checkoutStep === 'info' && (
              <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">

                  {/* Order summary mini */}
                  <div className="bg-gray-50 rounded-2xl p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2">RÉCAPITULATIF</p>
                    {items.map(({ product, quantity }) => (
                      <div key={product.id} className="flex justify-between text-sm py-0.5">
                        <span className="text-gray-700 truncate flex-1 mr-2">{product.name} <span className="text-gray-400">×{quantity}</span></span>
                        <span className="font-semibold text-gray-800 flex-shrink-0">{formatPrice(product.sellingPrice * quantity, shop.currency)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Customer info */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-800 flex items-center gap-2">👤 Vos informations</h3>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Nom complet *</label>
                      <input required className="input text-sm" placeholder="Jean Pierre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Téléphone *</label>
                      <input required type="tel" className="input text-sm" placeholder="677 123 456" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                    </div>
                  </div>

                  {/* Delivery */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">🚚 Livraison</h3>
                    <div className="space-y-2">
                      {shop.pickupEnabled && (
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.deliveryMethod === 'PICKUP' ? 'border-current bg-opacity-5' : 'border-gray-200'}`}
                          style={form.deliveryMethod === 'PICKUP' ? { borderColor: pc, backgroundColor: `${pc}08` } : {}}>
                          <input type="radio" name="delivery" checked={form.deliveryMethod === 'PICKUP'} onChange={() => setForm({ ...form, deliveryMethod: 'PICKUP' })} className="w-4 h-4" style={{ accentColor: pc }} />
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">Retrait sur place</p>
                            {shop.pickupAddress && <p className="text-xs text-gray-500">{shop.pickupAddress}</p>}
                          </div>
                          <span className="text-xs font-bold text-emerald-600">Gratuit</span>
                        </label>
                      )}
                      {shop.deliveryEnabled && (
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.deliveryMethod === 'DELIVERY' ? 'border-current' : 'border-gray-200'}`}
                          style={form.deliveryMethod === 'DELIVERY' ? { borderColor: pc, backgroundColor: `${pc}08` } : {}}>
                          <input type="radio" name="delivery" checked={form.deliveryMethod === 'DELIVERY'} onChange={() => setForm({ ...form, deliveryMethod: 'DELIVERY' })} className="w-4 h-4" style={{ accentColor: pc }} />
                          <Truck className="w-4 h-4 text-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800">Livraison à domicile</p>
                          </div>
                          <span className="text-xs font-bold text-gray-700">{formatPrice(shop.deliveryFee || 0, shop.currency)}</span>
                        </label>
                      )}
                    </div>
                    {form.deliveryMethod === 'DELIVERY' && (
                      <div className="mt-3 space-y-2">
                        <input required className="input text-sm" placeholder="Quartier / Secteur *" value={form.quartier} onChange={e => setForm({ ...form, quartier: e.target.value })} />
                        <input required className="input text-sm" placeholder="Adresse précise *" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                      </div>
                    )}
                  </div>

                  {/* Payment */}
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">💳 Paiement</h3>
                    <div className="space-y-2">
                      <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.paymentMethod === 'CASH_ON_DELIVERY' ? 'border-current' : 'border-gray-200'}`}
                        style={form.paymentMethod === 'CASH_ON_DELIVERY' ? { borderColor: pc, backgroundColor: `${pc}08` } : {}}>
                        <input type="radio" name="payment" checked={form.paymentMethod === 'CASH_ON_DELIVERY'} onChange={() => setForm({ ...form, paymentMethod: 'CASH_ON_DELIVERY' })} className="w-4 h-4" style={{ accentColor: pc }} />
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p className="text-sm font-semibold text-gray-800">{form.deliveryMethod === 'PICKUP' ? 'Paiement au retrait' : 'Paiement à la livraison'}</p>
                      </label>
                      {shop.mobileMoneyNumber && (
                        <label className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${form.paymentMethod === 'MOBILE_MONEY' ? 'border-current' : 'border-gray-200'}`}
                          style={form.paymentMethod === 'MOBILE_MONEY' ? { borderColor: pc, backgroundColor: `${pc}08` } : {}}>
                          <input type="radio" name="payment" checked={form.paymentMethod === 'MOBILE_MONEY'} onChange={() => setForm({ ...form, paymentMethod: 'MOBILE_MONEY' })} className="w-4 h-4" style={{ accentColor: pc }} />
                          <span className="text-lg">📱</span>
                          <div>
                            <p className="text-sm font-semibold text-gray-800">Mobile Money</p>
                            <p className="text-xs text-gray-500">{shop.mobileMoneyNumber}{shop.mobileMoneyName ? ` — ${shop.mobileMoneyName}` : ''}</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notes (optionnel)</label>
                    <textarea className="textarea text-sm" rows={2} placeholder="Instructions spéciales..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                  </div>
                </div>

                {/* Total + Submit */}
                <div className="flex-shrink-0 border-t bg-white px-5 py-4">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 gap-4">
                        <span>Sous-total</span><span>{formatPrice(subtotal, shop.currency)}</span>
                      </div>
                      {deliveryFee > 0 && (
                        <div className="flex justify-between text-xs text-gray-500 gap-4">
                          <span>Livraison</span><span>{formatPrice(deliveryFee, shop.currency)}</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="text-xl font-extrabold" style={{ color: pc }}>{formatPrice(total, shop.currency)}</p>
                    </div>
                  </div>
                  <button type="submit" disabled={submitting}
                    className="w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-60 transition-all"
                    style={{ backgroundColor: pc }}>
                    {submitting ? <><Loader2 className="w-5 h-5 animate-spin" />Envoi...</> : `Confirmer — ${formatPrice(total, shop.currency)}`}
                  </button>
                </div>
              </form>
            )}

            {/* ── STEP 3: SUCCESS ── */}
            {checkoutStep === 'success' && (
              <div className="flex-1 overflow-y-auto px-5 py-6 flex flex-col items-center">
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-1">Commande envoyée ! 🎉</h2>
                <p className="text-gray-500 text-center mb-5">Merci <strong>{form.name}</strong> ! Votre commande a été enregistrée.</p>

                {/* Summary card */}
                <div className="w-full bg-gray-50 rounded-2xl p-4 mb-5 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Livraison</span><span className="font-semibold">{form.deliveryMethod === 'DELIVERY' ? '🚚 Domicile' : '📍 Retrait'}</span></div>
                  {form.deliveryMethod === 'DELIVERY' && form.quartier && (
                    <div className="flex justify-between"><span className="text-gray-500">Adresse</span><span className="font-medium text-right">{form.quartier}{form.address ? `, ${form.address}` : ''}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-gray-500">Paiement</span><span className="font-semibold">{form.paymentMethod === 'MOBILE_MONEY' ? '📱 Mobile Money' : '💵 Espèces'}</span></div>
                  <div className="flex justify-between border-t pt-2 font-bold text-base"><span style={{ color: pc }}>Total payé</span><span style={{ color: pc }}>{formatPrice(orderTotal, shop.currency)}</span></div>
                </div>

                {/* WhatsApp CTA */}
                {shop.whatsapp && (
                  <a href={getWhatsAppLink(shop.whatsapp, `Bonjour ${shop.name}! Je viens de passer commande (${orderNumber}). Merci de confirmer.`)}
                    target="_blank"
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-white font-bold mb-3 text-base"
                    style={{ backgroundColor: '#25D366' }}>
                    <MessageCircle className="w-5 h-5" />
                    Confirmer sur WhatsApp
                  </a>
                )}
                <button onClick={closeCheckout} className="text-sm text-gray-400 hover:text-gray-600">
                  ← Retour à la boutique
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ADMIN FLOATING BUTTON ── */}
      {user && adminShop?.slug === slug && (
        <div className="fixed z-[9999] pointer-events-none"
          style={{ bottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))', left: '1rem' }}>
          <Link href="/admin/dashboard"
            className="pointer-events-auto flex items-center gap-2 px-4 py-3 rounded-2xl text-white text-sm font-semibold shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #1e1b4b, #4f46e5)', boxShadow: '0 8px 32px rgba(79,70,229,0.5)', whiteSpace: 'nowrap' }}>
            <Settings className="w-4 h-4 flex-shrink-0" />
            <span>Tableau de bord</span>
          </Link>
        </div>
      )}
    </div>
  );
}