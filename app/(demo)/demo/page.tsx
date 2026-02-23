'use client';
import { useState, useEffect, useRef } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  ShoppingBag, Plus, X, Camera, Loader2, ArrowRight,
  CheckCircle, Trash2, Package, BarChart3, ShoppingCart,
  Zap, Star, Info, ChevronRight, Printer
} from 'lucide-react';

const APP_URL = 'https://mastershoppro.com/register';

// ── Tracking ─────────────────────────────────────────────────────────────────
function getSessionId() {
  if (typeof sessionStorage === 'undefined') return 'ssr';
  let sid = sessionStorage.getItem('demo_session');
  if (!sid) {
    sid = 'demo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
    sessionStorage.setItem('demo_session', sid);
  }
  return sid;
}
async function trackDemo(action: string, detail?: string) {
  try {
    await addDoc(collection(db, 'demo_events'), {
      action, detail: detail || null,
      sessionId: getSessionId(),
      device: /mobile|android|iphone/i.test(navigator?.userAgent || '') ? 'mobile' : 'desktop',
      referrer: typeof document !== 'undefined' ? (document.referrer || 'direct') : 'direct',
      createdAt: new Date().toISOString(),
      dateStr: new Date().toISOString().slice(0, 10),
    });
  } catch { /* silent */ }
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  emoji: string;
  imageUrl?: string;
  isDemo?: boolean;
}

interface CartItem extends Product { qty: number; }

interface Order {
  id: string;
  items: CartItem[];
  total: number;
  payment: string;
  client: string;
  createdAt: string;
  status: 'CONFIRMED' | 'PROCESSING' | 'DELIVERED';
}

// ── Produits démo de départ ───────────────────────────────────────────────────
const INITIAL_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Tissu Bazin Riche 5m', description: 'Tissu bazin de qualité supérieure, parfait pour les tenues traditionnelles', category: 'Tissu', price: 8500, costPrice: 5000, stock: 12, emoji: '🧵' },
  { id: 'p2', name: 'Huile de Palme 5L', description: 'Huile de palme pure, production locale', category: 'Alimentaire', price: 3200, costPrice: 2200, stock: 25, emoji: '🫙' },
  { id: 'p3', name: 'Robe Wax Premium', description: 'Robe en wax africain, coupe moderne et élégante', category: 'Vêtements', price: 15000, costPrice: 9000, stock: 8, emoji: '👗' },
  { id: 'p4', name: 'Sac Cuir Artisanal', description: 'Sac à main en cuir véritable fait main', category: 'Accessoires', price: 22000, costPrice: 14000, stock: 4, emoji: '👜' },
];

// ── Composant badge DÉMO ──────────────────────────────────────────────────────
function DemoBanner({ onSignup }: { onSignup: () => void }) {
  return (
    <div className="bg-amber-500 text-black px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-2 font-semibold text-center sm:text-left">
        🧪 <span>MODE DÉMO — Les données sont fictives et ne sont pas sauvegardées. Toutes les fonctionnalités sont disponibles dans l'application complète.</span>
      </div>
      <button onClick={onSignup}
        className="flex-shrink-0 bg-black text-white font-bold px-4 py-1.5 rounded-lg text-xs hover:bg-gray-900 whitespace-nowrap">
        Créer mon vrai compte →
      </button>
    </div>
  );
}

// ── Badge "fonctionnalité complète dans l'app" ────────────────────────────────
function AppOnlyBadge({ feature }: { feature: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-full border border-indigo-200">
      <Zap className="w-3 h-3" />
      {feature} complet dans l'app
    </div>
  );
}

// ── Reçu ─────────────────────────────────────────────────────────────────────
function ReceiptModal({ order, onClose }: { order: Order; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <p className="font-extrabold text-gray-900">Mastershop Pro</p>
          <p className="text-xs text-gray-400">mastershoppro.com</p>
        </div>
        <div className="border-t border-dashed border-gray-200 py-3 space-y-1 text-sm">
          <div className="flex justify-between text-gray-500"><span>Commande</span><span className="font-mono">{order.id}</span></div>
          <div className="flex justify-between text-gray-500"><span>Client</span><span>{order.client}</span></div>
          <div className="flex justify-between text-gray-500"><span>Paiement</span><span>{order.payment}</span></div>
        </div>
        <div className="border-t border-dashed border-gray-200 py-3 space-y-1.5">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.emoji} {item.name} × {item.qty}</span>
              <span className="font-semibold">{(item.price * item.qty).toLocaleString('fr-FR')} F</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 pt-3 flex justify-between font-extrabold text-lg">
          <span>TOTAL</span>
          <span className="text-green-600">{order.total.toLocaleString('fr-FR')} FCFA</span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center text-xs text-amber-700">
            <Info className="w-3.5 h-3.5 inline mr-1" />
            Démo — Dans l'app : impression thermique Bluetooth + envoi WhatsApp
          </div>
          <button onClick={onClose}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-bold text-sm">
            Fermer
          </button>
          <a href={APP_URL} target="_blank" onClick={() => trackDemo('click_signup', 'receipt')}
            className="block w-full py-2.5 bg-green-500 text-white rounded-xl font-bold text-sm text-center">
            Créer mon vrai compte →
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Page principale ───────────────────────────────────────────────────────────
export default function DemoPage() {
  const [tab, setTab] = useState<'products' | 'sell' | 'orders' | 'stats'>('sell');
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [receipt, setReceipt] = useState<Order | null>(null);

  // Ajout produit
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', category: 'Autre', price: '', costPrice: '', stock: '1', emoji: '📦' });
  const fileRef = useRef<HTMLInputElement>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Commande
  const [clientName, setClientName] = useState('');
  const [payment, setPayment] = useState('Espèces');
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => { trackDemo('open'); }, []);

  // ── IA Photo analyse ────────────────────────────────────────────────────────
  // ── Analyse image (file ou base64 déjà extrait) ──────────────────────────
  async function analyzeImageBase64(base64: string, mediaType: string) {
    setAiLoading(true);
    setAiResult(null);
    trackDemo('ai_photo');
    try {
      const resp = await fetch('/api/analyze-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64, mediaType }),
      });
      const data = await resp.json();
      if (data.name) {
        setAiResult(data);
        setNewProduct(prev => ({
          ...prev,
          name: data.name || '',
          description: data.description || '',
          category: data.category || 'Autre',
          price: data.suggestedPrice?.replace(/[^0-9]/g, '') || '',
          emoji: getCategoryEmoji(data.category),
        }));
        trackDemo('ai_success', data.category);
      } else {
        setAiError(`L'IA n'a pas pu identifier ce produit. Essayez avec une photo plus nette.`);
      }
    } catch (err) {
      setAiError('Erreur réseau. Vérifiez votre connexion.');
      console.error(err);
    } finally {
      setAiLoading(false);
    }
  }

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPhotoPreview(preview);
    setAiError(null);

    // Redimensionner via canvas avant envoi (max 800px, < 300KB)
    const base64 = await resizeImage(file, 800, 0.75);
    await analyzeImageBase64(base64, 'image/jpeg');
    // Reset input pour permettre de re-sélectionner le même fichier
    if (fileRef.current) fileRef.current.value = '';
  }

  // Redimensionne + compresse via canvas
  function resizeImage(file: File, maxPx: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        // base64 sans le préfixe data:image/...;base64,
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl.split(',')[1]);
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  function getCategoryEmoji(cat: string) {
    const map: Record<string, string> = {
      Vêtements: '👗', Chaussures: '👟', Électronique: '📱', Téléphones: '📱',
      Beauté: '💄', Alimentation: '🥗', Maison: '🏠', Sport: '⚽',
      Accessoires: '👜', Tissu: '🧵', Autre: '📦',
    };
    return map[cat] || '📦';
  }

  function addProductToList() {
    if (!newProduct.name || !newProduct.price) return;
    const p: Product = {
      id: 'u_' + Date.now(),
      name: newProduct.name,
      description: newProduct.description,
      category: newProduct.category,
      price: parseInt(newProduct.price) || 0,
      costPrice: parseInt(newProduct.costPrice) || 0,
      stock: parseInt(newProduct.stock) || 1,
      emoji: newProduct.emoji,
      imageUrl: photoPreview || undefined,
      isDemo: true,
    };
    setProducts(prev => [p, ...prev]);
    setShowAddProduct(false);
    setAiResult(null);
    setPhotoPreview(null);
    setNewProduct({ name: '', description: '', category: 'Autre', price: '', costPrice: '', stock: '1', emoji: '📦' });
    trackDemo('product_added', newProduct.category);
    setTab('products');
  }

  // ── Panier ──────────────────────────────────────────────────────────────────
  function addToCart(product: Product) {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    trackDemo('add_to_cart', product.name);
  }

  function removeFromCart(id: string) {
    setCart(prev => prev.filter(i => i.id !== id));
  }

  function updateQty(id: string, delta: number) {
    setCart(prev => prev.map(i => i.id === id
      ? { ...i, qty: Math.max(1, i.qty + delta) } : i
    ));
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── Valider commande ────────────────────────────────────────────────────────
  function confirmOrder() {
    if (cart.length === 0) return;
    const order: Order = {
      id: 'CMD-' + String(orders.length + 1).padStart(3, '0'),
      items: [...cart],
      total: cartTotal,
      payment,
      client: clientName || 'Client anonyme',
      createdAt: new Date().toISOString(),
      status: 'CONFIRMED',
    };
    // Diminuer stock
    setProducts(prev => prev.map(p => {
      const ci = cart.find(i => i.id === p.id);
      if (ci) return { ...p, stock: Math.max(0, p.stock - ci.qty) };
      return p;
    }));
    setOrders(prev => [order, ...prev]);
    setCart([]);
    setClientName('');
    setOrderSuccess(true);
    setReceipt(order);
    trackDemo('order_confirmed', `${cartTotal}F`);
    setTimeout(() => setOrderSuccess(false), 3000);
  }

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalRevenu = orders.reduce((s, o) => s + o.total, 0);
  const totalCost   = orders.reduce((s, o) => s + o.items.reduce((ss, i) => ss + i.costPrice * i.qty, 0), 0);
  const totalBenef  = totalRevenu - totalCost;

  // ── UI ───────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-20" style={{ fontFamily: 'system-ui, sans-serif' }}>

      {receipt && <ReceiptModal order={receipt} onClose={() => setReceipt(null)} />}

      <DemoBanner onSignup={() => { trackDemo('click_signup', 'banner'); window.open(APP_URL, '_blank'); }} />

      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-extrabold text-gray-900 text-sm leading-none">Boutique Démo</p>
            <span className="text-[10px] bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">MODE DÉMO</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Cart badge */}
          {cartCount > 0 && (
            <button onClick={() => setTab('sell')}
              className="relative flex items-center gap-1.5 bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-xl">
              <ShoppingCart className="w-4 h-4" />
              {cartCount}
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center">{cartCount}</span>
            </button>
          )}
          <a href={APP_URL} target="_blank" onClick={() => trackDemo('click_signup', 'header')}
            className="bg-green-500 hover:bg-green-600 text-white text-xs font-bold px-3 py-2 rounded-xl transition-colors">
            Créer mon compte →
          </a>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="bg-white border-b border-gray-100 px-2 flex overflow-x-auto">
        {([
          { id: 'sell',     icon: <ShoppingCart className="w-4 h-4" />, label: 'Vente' },
          { id: 'products', icon: <Package className="w-4 h-4" />,      label: 'Produits' },
          { id: 'orders',   icon: <CheckCircle className="w-4 h-4" />,  label: 'Commandes' },
          { id: 'stats',    icon: <BarChart3 className="w-4 h-4" />,    label: 'Stats' },
        ] as const).map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); trackDemo('tab_' + t.id); }}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-semibold border-b-2 flex-shrink-0 transition-colors ${
              tab === t.id ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">

        {/* ══ TAB VENTE ══ */}
        {tab === 'sell' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-gray-900">Caisse — Nouvelle vente</h2>
              <span className="text-xs text-gray-400">Tapez un produit pour l'ajouter</span>
            </div>

            {/* Grille produits */}
            <div className="grid grid-cols-2 gap-3">
              {products.filter(p => p.stock > 0).map(p => (
                <button key={p.id} onClick={() => addToCart(p)}
                  className="bg-white border border-gray-100 rounded-2xl p-4 text-left hover:border-orange-300 hover:shadow-md transition-all active:scale-95">
                  {p.imageUrl
                    ? <img src={p.imageUrl} className="w-full h-20 object-cover rounded-xl mb-2" alt={p.name} />
                    : <span className="text-3xl block mb-2">{p.emoji}</span>
                  }
                  <p className="font-bold text-gray-900 text-sm leading-tight">{p.name}</p>
                  <p className="text-orange-600 font-extrabold mt-1">{p.price.toLocaleString('fr-FR')} F</p>
                  <p className="text-gray-400 text-xs mt-0.5">Stock: {p.stock}</p>
                </button>
              ))}
              {/* Add product shortcut */}
              <button onClick={() => setShowAddProduct(true)}
                className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50 transition-all">
                <Plus className="w-6 h-6 text-gray-400" />
                <span className="text-xs text-gray-500 font-semibold">Ajouter produit</span>
              </button>
            </div>

            {/* Panier */}
            {cart.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <p className="font-bold text-gray-900">Panier ({cartCount} article{cartCount > 1 ? 's' : ''})</p>
                </div>
                <div className="divide-y divide-gray-50">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center gap-3 px-4 py-3">
                      <span className="text-xl">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{item.name}</p>
                        <p className="text-xs text-gray-400">{item.price.toLocaleString('fr-FR')} F × {item.qty}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-sm font-bold hover:bg-gray-200">−</button>
                        <span className="text-sm font-bold w-4 text-center">{item.qty}</span>
                        <button onClick={() => updateQty(item.id, +1)} className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold hover:bg-orange-200">+</button>
                        <button onClick={() => removeFromCart(item.id)} className="w-6 h-6 rounded-full bg-red-50 text-red-400 flex items-center justify-center hover:bg-red-100 ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Client + paiement */}
                <div className="p-4 bg-gray-50 space-y-3">
                  <input
                    value={clientName}
                    onChange={e => setClientName(e.target.value)}
                    placeholder="Nom du client (optionnel)"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400"
                  />
                  <div className="flex gap-2">
                    {['Espèces', 'Mobile Money', 'Carte'].map(m => (
                      <button key={m} onClick={() => setPayment(m)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                          payment === m ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-gray-200 text-gray-600'
                        }`}>
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Total + confirm */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-gray-700">TOTAL</span>
                    <span className="text-xl font-extrabold text-green-600">{cartTotal.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <button onClick={confirmOrder}
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-extrabold py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Confirmer la vente
                  </button>
                </div>
              </div>
            )}

            {orderSuccess && (
              <div className="bg-green-500 text-white rounded-2xl p-4 flex items-center gap-3 animate-pulse">
                <CheckCircle className="w-6 h-6 flex-shrink-0" />
                <p className="font-bold">Vente confirmée ! Reçu généré.</p>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB PRODUITS ══ */}
        {tab === 'products' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-gray-900">Produits ({products.length})</h2>
              <button onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-1.5 bg-orange-500 text-white text-sm font-bold px-4 py-2 rounded-xl hover:bg-orange-600">
                <Plus className="w-4 h-4" /> Ajouter
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-800">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>En démo, les produits ajoutés disparaissent si vous rechargez la page. Dans l'application, tout est sauvegardé en temps réel dans le cloud.</span>
            </div>

            <div className="space-y-3">
              {products.map(p => (
                <div key={p.id} className={`bg-white rounded-2xl border p-4 flex items-center gap-3 ${p.isDemo ? 'border-orange-200' : 'border-gray-100'}`}>
                  {p.imageUrl
                    ? <img src={p.imageUrl} className="w-14 h-14 object-cover rounded-xl flex-shrink-0" alt={p.name} />
                    : <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">{p.emoji}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900 text-sm">{p.name}</p>
                      {p.isDemo && <span className="text-[9px] bg-orange-100 text-orange-600 font-bold px-1.5 py-0.5 rounded">NOUVEAU</span>}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{p.description}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-orange-600 font-extrabold text-sm">{p.price.toLocaleString('fr-FR')} F</span>
                      {p.costPrice > 0 && (
                        <span className="text-green-600 text-xs font-semibold">
                          +{(p.price - p.costPrice).toLocaleString('fr-FR')} F bénéfice
                        </span>
                      )}
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.stock <= 3 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                        Stock: {p.stock}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => addToCart(p)}
                    className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center hover:bg-orange-600 flex-shrink-0">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ TAB COMMANDES ══ */}
        {tab === 'orders' && (
          <div className="space-y-4">
            <h2 className="font-extrabold text-gray-900">Historique des commandes ({orders.length})</h2>

            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-semibold">Aucune commande pour l'instant</p>
                <p className="text-gray-400 text-sm mt-1">Faites une vente dans l'onglet "Vente"</p>
                <button onClick={() => setTab('sell')} className="mt-4 bg-orange-500 text-white font-bold px-5 py-2.5 rounded-xl text-sm">
                  Faire une vente →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-xs font-bold text-gray-400">{o.id}</span>
                        <p className="font-bold text-gray-900">{o.client}</p>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 font-bold px-2.5 py-1 rounded-full">✓ Confirmée</span>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">
                      {o.items.map(i => `${i.emoji} ${i.name} ×${i.qty}`).join(' · ')}
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-extrabold text-gray-900">{o.total.toLocaleString('fr-FR')} FCFA</p>
                        <p className="text-xs text-gray-400">{o.payment} · {new Date(o.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <button onClick={() => setReceipt(o)}
                        className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-semibold px-3 py-2 rounded-xl transition-colors">
                        <Printer className="w-3.5 h-3.5" />Reçu
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB STATS ══ */}
        {tab === 'stats' && (
          <div className="space-y-4">
            <h2 className="font-extrabold text-gray-900">Statistiques démo</h2>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex items-start gap-2 text-xs text-amber-800">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>Les stats reflètent vos ventes de cette session démo. Dans l'app : historique complet, graphiques par jour/semaine/mois, export Excel.</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Chiffre d\'affaires', val: `${totalRevenu.toLocaleString('fr-FR')} F`, icon: '💰', color: 'text-green-600', bg: 'bg-green-50' },
                { label: 'Commandes', val: orders.length.toString(), icon: '🛒', color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Bénéfice net', val: `${totalBenef.toLocaleString('fr-FR')} F`, icon: '📈', color: 'text-orange-600', bg: 'bg-orange-50' },
                { label: 'Produits', val: products.length.toString(), icon: '📦', color: 'text-purple-600', bg: 'bg-purple-50' },
              ].map((s, i) => (
                <div key={i} className={`${s.bg} rounded-2xl p-4`}>
                  <span className="text-2xl">{s.icon}</span>
                  <p className={`text-xl font-extrabold mt-2 ${s.color}`}>{s.val}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {orders.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <p className="font-bold text-gray-800 mb-3">Produits les plus vendus</p>
                {(() => {
                  const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
                  orders.forEach(o => o.items.forEach(i => {
                    if (!counts[i.id]) counts[i.id] = { name: i.name, qty: 0, revenue: 0 };
                    counts[i.id].qty += i.qty;
                    counts[i.id].revenue += i.price * i.qty;
                  }));
                  return Object.values(counts).sort((a, b) => b.qty - a.qty).map((p, i) => (
                    <div key={i} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-sm">
                      <span className="text-gray-700">{p.name}</span>
                      <div className="text-right">
                        <span className="font-bold text-gray-900">{p.qty} vendus</span>
                        <span className="text-green-600 text-xs ml-2">+{p.revenue.toLocaleString('fr-FR')} F</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            <div className="bg-gray-900 rounded-2xl p-5 text-center">
              <p className="text-white font-extrabold text-lg mb-1">Fonctionnalités complètes dans l'app</p>
              <p className="text-gray-400 text-sm mb-4">Graphiques · Export Excel · Comparaison semaines · Alertes stock · Multi-boutiques</p>
              <a href={APP_URL} target="_blank" onClick={() => trackDemo('click_signup', 'stats')}
                className="inline-flex items-center gap-2 bg-green-500 text-white font-extrabold px-6 py-3 rounded-xl hover:bg-green-400 transition-colors">
                Créer mon compte gratuit <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        {/* ══ MODAL AJOUT PRODUIT ══ */}
        {showAddProduct && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
                <div>
                  <p className="font-extrabold text-gray-900">Ajouter un produit</p>
                  <p className="text-xs text-gray-400">Photo → IA remplit tout automatiquement ✨</p>
                </div>
                <button onClick={() => { setShowAddProduct(false); setAiResult(null); setPhotoPreview(null); }}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* IA Photo zone */}
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2">📸 Analyse par IA <span className="text-xs text-indigo-500 font-normal">(Gemini AI — même technologie que l'app)</span></p>
                  <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />

                  {!photoPreview && !aiLoading && (
                    <button onClick={() => fileRef.current?.click()}
                      className="w-full border-2 border-dashed border-indigo-300 bg-indigo-50 rounded-2xl p-6 flex flex-col items-center gap-2 hover:border-indigo-400 hover:bg-indigo-100 transition-colors">
                      <Camera className="w-8 h-8 text-indigo-400" />
                      <p className="font-bold text-indigo-600 text-sm">Prendre une photo ou choisir une image</p>
                      <p className="text-indigo-400 text-xs">L'IA identifie le produit et remplit tout !</p>
                    </button>
                  )}

                  {aiLoading && (
                    <div className="w-full bg-indigo-50 rounded-2xl p-6 flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                      <p className="font-bold text-indigo-600 text-sm">IA analyse votre produit...</p>
                      <p className="text-indigo-400 text-xs">Redimensionnement + envoi à Gemini</p>
                    </div>
                  )}

                  {aiError && !aiLoading && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700 flex items-start gap-2">
                      <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {photoPreview && !aiLoading && (
                    <div className="relative">
                      <img src={photoPreview} className="w-full h-36 object-cover rounded-2xl" alt="Preview" />
                      {aiResult && (
                        <div className="absolute bottom-2 right-2 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> IA réussie !
                        </div>
                      )}
                      <button onClick={() => fileRef.current?.click()}
                        className="absolute top-2 right-2 bg-white/90 text-gray-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        Changer
                      </button>
                    </div>
                  )}
                </div>

                {/* Formulaire */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Nom du produit *</label>
                    <input value={newProduct.name} onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                      placeholder="Ex: Tissu Bazin 5m"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Description</label>
                    <textarea value={newProduct.description} onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                      rows={2} placeholder="Description du produit..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400 resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Prix de vente (FCFA) *</label>
                      <input value={newProduct.price} onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                        type="number" placeholder="15000"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Prix d'achat (FCFA)</label>
                      <input value={newProduct.costPrice} onChange={e => setNewProduct(p => ({ ...p, costPrice: e.target.value }))}
                        type="number" placeholder="9000"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Stock</label>
                      <input value={newProduct.stock} onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))}
                        type="number" placeholder="10"
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Catégorie</label>
                      <select value={newProduct.category} onChange={e => setNewProduct(p => ({ ...p, category: e.target.value, emoji: getCategoryEmoji(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-orange-400">
                        {['Vêtements', 'Chaussures', 'Électronique', 'Téléphones', 'Beauté', 'Alimentation', 'Maison', 'Tissu', 'Accessoires', 'Autre'].map(c => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Preview bénéfice */}
                {newProduct.price && newProduct.costPrice && parseInt(newProduct.price) > parseInt(newProduct.costPrice) && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex justify-between text-sm">
                    <span className="text-green-700">Bénéfice par vente</span>
                    <span className="font-extrabold text-green-600">+{(parseInt(newProduct.price) - parseInt(newProduct.costPrice)).toLocaleString('fr-FR')} F</span>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  Démo : produit visible cette session uniquement. Dans l'app : sauvegarde cloud permanente, codes-barres, photos stockées, gestion multi-variantes.
                </div>

                <button onClick={addProductToList}
                  disabled={!newProduct.name || !newProduct.price}
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Ajouter le produit
                </button>

                <a href={APP_URL} target="_blank" onClick={() => trackDemo('click_signup', 'add_product_modal')}
                  className="block w-full text-center py-3 border-2 border-green-500 text-green-600 font-bold rounded-2xl hover:bg-green-50 transition-colors text-sm">
                  Créer mon vrai compte pour tout sauvegarder →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* CTA conversion */}
        <div className="mt-8 bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 text-center">
          <p className="text-xl font-extrabold text-white mb-1">Vous avez testé la démo 🎉</p>
          <p className="text-gray-400 text-sm mb-2">L'application complète inclut en plus :</p>
          <div className="flex flex-wrap justify-center gap-2 mb-5">
            {['Sauvegarde cloud', 'Impression thermique', 'Scanner Bluetooth', 'Multi-boutiques', 'Historique complet', 'Export Excel'].map(f => (
              <span key={f} className="text-xs bg-white/10 text-white/70 px-2.5 py-1 rounded-full">{f}</span>
            ))}
          </div>
          <a href={APP_URL} target="_blank" onClick={() => trackDemo('click_signup', 'bottom_cta')}
            className="inline-flex items-center gap-2 bg-green-500 hover:bg-green-400 text-black font-extrabold px-8 py-4 rounded-2xl transition-colors text-base">
            Créer mon compte gratuit
            <ArrowRight className="w-5 h-5" />
          </a>
          <p className="text-gray-500 text-xs mt-3">✓ Gratuit · ✓ Sans carte · ✓ mastershoppro.com</p>
        </div>
      </div>

      {/* Barre mobile sticky */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-lg"
        style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <a href={APP_URL} target="_blank" onClick={() => trackDemo('click_signup', 'mobile_bar')}
          className="flex-1 flex items-center justify-center gap-2 bg-green-500 text-white font-extrabold text-sm py-3 rounded-xl">
          <ArrowRight className="w-4 h-4" />
          Créer mon vrai compte gratuit
        </a>
      </div>
    </div>
  );
}