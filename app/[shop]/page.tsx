'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Search, ShoppingCart, Plus, Minus, Star, Phone, MapPin, MessageCircle, 
  SlidersHorizontal, Heart, Eye, Truck, Shield, RotateCcw, X, ChevronRight, Grid3X3, LayoutList
} from 'lucide-react';
import { getShopBySlug, getProducts, getCategories } from '@/lib/firestore';
import { Shop, Product, Category } from '@/lib/types';
import { useCart } from '@/hooks/useCart';
import { formatPrice, getWhatsAppLink } from '@/lib/utils';

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'stock-desc';
type ViewMode = 'grid' | 'list';

export default function ShopPage() {
  const params = useParams();
  const slug = params.shop as string;
  const { items, addToCart, removeFromCart, totalItems } = useCart();
  const [shop, setShop] = useState<Shop | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
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

  useEffect(() => {
    async function loadShop() {
      try {
        const shopData = await getShopBySlug(slug);
        if (!shopData || !shopData.isActive) { setNotFound(true); setLoading(false); return; }
        setShop(shopData);
        const [prods, cats] = await Promise.all([getProducts(shopData.id!, true), getCategories(shopData.id!)]);
        setProducts(prods);
        setCategories(cats);
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
  const handleAdd = (product: Product) => { addToCart(product, slug); setCartAnimId(product.id!); setTimeout(() => setCartAnimId(null), 600); };

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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
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
            <Link href={`/${slug}/cart`} className="relative p-2.5 rounded-xl transition-all hover:scale-105"
              style={{ backgroundColor: `${pc}15`, color: pc }}>
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] text-white flex items-center justify-center font-bold"
                  style={{ backgroundColor: pc }}>{totalItems}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
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

      {/* Category Pills */}
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

      {/* Featured */}
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

      {/* Search + Controls */}
      <div className="max-w-6xl mx-auto px-4 py-4 w-full">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Rechercher un produit..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-pink-200 transition-all" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><X className="w-3.5 h-3.5" /></button>}
          </div>
          <button onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all"
            style={hasFilters ? { backgroundColor: pc, color: 'white', border: 'none' } : { backgroundColor: 'white', color: '#4b5563', borderColor: '#e5e7eb' }}>
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">Filtres</span>
            {hasFilters && <span className="text-[10px] bg-white/20 px-1 rounded-full">!</span>}
          </button>
          <div className="flex bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button onClick={() => setViewMode('grid')} className="p-2.5 transition-colors"
              style={viewMode === 'grid' ? { backgroundColor: pc, color: 'white' } : { color: '#9ca3af' }}>
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('list')} className="p-2.5 transition-colors"
              style={viewMode === 'list' ? { backgroundColor: pc, color: 'white' } : { color: '#9ca3af' }}>
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-3 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-800 text-sm">Filtres & Tri</p>
              {hasFilters && <button onClick={clearFilters} className="text-xs text-red-500 font-medium">Réinitialiser tout</button>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Trier par</label>
                <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none">
                  <option value="default">Par défaut</option>
                  <option value="price-asc">Prix ↑</option>
                  <option value="price-desc">Prix ↓</option>
                  <option value="name-asc">Nom A-Z</option>
                  <option value="stock-desc">Stock élevé</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Prix min</label>
                <input type="number" placeholder="0" value={priceMin} onChange={e => setPriceMin(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">Prix max</label>
                <input type="number" placeholder="∞" value={priceMax} onChange={e => setPriceMax(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                  <input type="checkbox" checked={showInStock} onChange={e => setShowInStock(e.target.checked)}
                    className="w-4 h-4 rounded" style={{ accentColor: pc }} />
                  En stock seulement
                </label>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{filtered.length}</span> produit{filtered.length !== 1 ? 's' : ''}
            {catFilter && <span> — <span className="font-medium" style={{ color: pc }}>{catFilter}</span></span>}
          </p>
          {hasFilters && <button onClick={clearFilters} className="text-xs flex items-center gap-1 font-medium" style={{ color: pc }}><X className="w-3 h-3" />Effacer</button>}
        </div>
      </div>

      {/* Products */}
      <section className="max-w-6xl mx-auto px-4 pb-28 flex-1 w-full">
        {filtered.length > 0 ? (
          viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {filtered.map(p => (
                <div key={p.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 group">
                  <div className="relative">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-40 flex items-center justify-center text-4xl" style={{ background: `${pc}10` }}>📦</div>
                    )}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {p.isFeatured && <span className="bg-amber-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">⭐ Vedette</span>}
                      {p.stock <= 3 && p.stock > 0 && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">🔥 Derniers {p.stock}!</span>}
                      {p.stock === 0 && <span className="bg-gray-400 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Épuisé</span>}
                    </div>
                    <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={e => { e.stopPropagation(); toggleWishlist(p.id!); }}
                        className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center">
                        <Heart className={`w-4 h-4 ${wishlist.includes(p.id!) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
                      </button>
                      <button onClick={e => { e.stopPropagation(); setQuickView(p); }}
                        className="w-8 h-8 bg-white rounded-full shadow flex items-center justify-center">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
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
                      ) : (
                        <span className="text-xs text-red-500 font-semibold bg-red-50 px-2 py-1 rounded-lg">Épuisé</span>
                      )}
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

      {/* Sticky cart bar mobile */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 z-40 lg:hidden"
          style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <Link href={`/${slug}/cart`}
            className="flex items-center justify-between w-full text-white rounded-2xl px-5 py-4 shadow-2xl font-semibold"
            style={{ background: `linear-gradient(135deg, ${pc}, ${pc}bb)` }}>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-white/25 rounded-lg flex items-center justify-center text-sm font-bold">{totalItems}</div>
              <span>Voir mon panier</span>
            </div>
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Footer */}
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

      {/* Quick View Modal */}
      {quickView && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 sm:p-4 backdrop-blur-sm" onClick={() => setQuickView(null)}>
          <div className="bg-white w-full sm:rounded-2xl sm:max-w-md max-h-[90vh] overflow-y-auto rounded-t-3xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-gray-800">Aperçu rapide</h3>
              <button onClick={() => setQuickView(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
            {quickView.imageUrl ? <img src={quickView.imageUrl} alt={quickView.name} className="w-full h-56 object-cover" /> : <div className="w-full h-56 flex items-center justify-center text-6xl" style={{ background: `${pc}10` }}>📦</div>}
            <div className="p-4 space-y-3">
              <div>
                <h4 className="font-bold text-gray-800 text-lg">{quickView.name}</h4>
                <p className="text-sm text-gray-500">{quickView.category}{quickView.brand && ` • ${quickView.brand}`}</p>
              </div>
              {quickView.description && <p className="text-sm text-gray-600">{quickView.description}</p>}
              {quickView.specifications && (
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Caractéristiques</p>
                  <p className="text-sm text-gray-700 whitespace-pre-line">{quickView.specifications}</p>
                </div>
              )}
              <div className="flex items-center justify-between pt-2">
                <div>
                  <p className="text-2xl font-extrabold" style={{ color: pc }}>{formatPrice(quickView.sellingPrice, shop.currency)}</p>
                  <p className={`text-xs mt-0.5 font-medium ${quickView.stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {quickView.stock > 0 ? `✓ En stock (${quickView.stock} dispo)` : '✗ Épuisé'}
                  </p>
                </div>
                {quickView.stock > 0 && (
                  <button onClick={() => { handleAdd(quickView); setQuickView(null); }}
                    className="px-5 py-2.5 rounded-xl text-white font-semibold hover:opacity-90 active:scale-95 transition-all"
                    style={{ backgroundColor: pc }}>
                    Ajouter au panier
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
