'use client';
import { useState, useEffect, useRef } from 'react';
import { collection, doc, updateDoc, addDoc, onSnapshot, orderBy, query, getDocs, deleteDoc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PLANS } from '@/lib/types';
import {
  Crown, Search, Check, X, RefreshCw, Shield, Eye, EyeOff, AlertTriangle,
  TrendingUp, Zap, Database, HardDrive, Brain, BarChart3,
  Store, Activity, Wifi, WifiOff
} from 'lucide-react';

const DEV_PASSWORD = 'Bobane12$';

// ── API COST RATES (USD) ──────────────────────────────────────────────────
// Updated: Feb 2026
const RATES = {
  gemini: {
    input_per_1k:    0.000125, // Gemini 2.0 Flash input
    output_per_1k:   0.000375, // Gemini 2.0 Flash output
    image_per_call:  0.0002,   // vision per image
  },
  gpt4o: {
    input_per_1k:    0.0025,   // GPT-4o input
    output_per_1k:   0.01,     // GPT-4o output
    image_per_call:  0.00213,  // GPT-4o vision per image
  },
  firestore: {
    read_per_100k:   0.06,     // per 100K reads
    write_per_100k:  0.18,     // per 100K writes
    delete_per_100k: 0.02,
    storage_per_gb:  0.18,     // per GB/month
  },
  storage: {
    per_gb_month:    0.026,    // Firebase Storage per GB
    per_100k_ops:    0.004,    // per 100K operations
  },
};

const USD_TO_XAF = 620; // approximation FCFA

interface ShopRow {
  id: string; name: string; slug: string; ownerEmail?: string;
  planId: string; planExpiry?: string; isActive: boolean;
  ordersThisMonth: number; createdAt: string; whatsapp?: string;
}

interface CostEvent {
  id?: string;
  shopId: string; shopName?: string;
  type: 'gemini' | 'gpt4o' | 'firestore' | 'storage' | 'subscription';
  subtype?: string;        // e.g. 'vision', 'text', 'read', 'write'
  tokens_in?: number;
  tokens_out?: number;
  images?: number;
  reads?: number; writes?: number;
  bytes?: number;
  planId?: string;
  revenue?: number;        // XAF received for subscriptions
  cost_usd?: number;       // computed
  note?: string;
  createdAt: string;
}

// ── Cost computation ───────────────────────────────────────────────────────
function computeCost(event: CostEvent): number {
  if (event.cost_usd) return event.cost_usd;
  let usd = 0;
  if (event.type === 'gemini') {
    usd += ((event.tokens_in || 0) / 1000) * RATES.gemini.input_per_1k;
    usd += ((event.tokens_out || 0) / 1000) * RATES.gemini.output_per_1k;
    usd += (event.images || 0) * RATES.gemini.image_per_call;
  } else if (event.type === 'gpt4o') {
    usd += ((event.tokens_in || 0) / 1000) * RATES.gpt4o.input_per_1k;
    usd += ((event.tokens_out || 0) / 1000) * RATES.gpt4o.output_per_1k;
    usd += (event.images || 0) * RATES.gpt4o.image_per_call;
  } else if (event.type === 'firestore') {
    usd += ((event.reads || 0) / 100000) * RATES.firestore.read_per_100k;
    usd += ((event.writes || 0) / 100000) * RATES.firestore.write_per_100k;
  } else if (event.type === 'storage') {
    usd += ((event.bytes || 0) / (1024 ** 3)) * RATES.storage.per_gb_month;
  }
  return usd;
}

const TYPE_CONFIG = {
  gemini:       { label: 'Gemini AI',     color: '#4285F4', bg: '#EBF3FF', icon: Brain },
  gpt4o:        { label: 'GPT-4o',        color: '#10A37F', bg: '#E6F7F3', icon: Brain },
  firestore:    { label: 'Firestore',      color: '#FFA000', bg: '#FFF8E1', icon: Database },
  storage:      { label: 'Storage',        color: '#7C3AED', bg: '#EDE9FE', icon: HardDrive },
  subscription: { label: 'Souscription',  color: '#059669', bg: '#D1FAE5', icon: Crown },
};

function fmtUSD(usd: number) { return `$${usd.toFixed(4)}`; }
function fmtXAF(usd: number) { return `${Math.round(usd * USD_TO_XAF).toLocaleString('fr-FR')} F`; }
function fmtRevXAF(xaf: number) { return `${xaf.toLocaleString('fr-FR')} F`; }

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'shops' | 'costs' | 'traffic'>('shops');

  // Shops
  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Costs
  const [events, setEvents] = useState<CostEvent[]>([]);
  const [costsLoading, setCostsLoading] = useState(false);
  const [costPeriod, setCostPeriod] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [costTypeFilter, setCostTypeFilter] = useState<string>('');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState<Partial<CostEvent>>({ type: 'gemini', subtype: 'vision', createdAt: new Date().toISOString().slice(0, 16) });

  // Traffic
  const [trafficEvents, setTrafficEvents] = useState<any[]>([]);
  const [trafficLoading, setTrafficLoading] = useState(false);
  const [trafficPeriod, setTrafficPeriod] = useState<'today' | 'week' | 'month' | 'all'>('week');

  // Relance
  const [relanceShop, setRelanceShop] = useState<ShopRow | null>(null);

  // Real-time connection status
  const [liveStatus, setLiveStatus] = useState<'connecting' | 'live' | 'error'>('connecting');
  // Unsubscribe refs for cleanup
  const unsubShops    = useRef<(() => void) | null>(null);
  const unsubCosts    = useRef<(() => void) | null>(null);
  const unsubTraffic  = useRef<(() => void) | null>(null);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === DEV_PASSWORD) {
      setAuthenticated(true);
      // Real-time listeners start after login
    } else {
      setPasswordError('Mot de passe incorrect.');
    }
  }

  // ── Start real-time listeners when authenticated ─────────────────────────
  useEffect(() => {
    if (!authenticated) return;

    setLiveStatus('connecting');

    // 1. Shops — live, enriched with owner email from admins collection
    unsubShops.current = onSnapshot(
      collection(db, 'shops'),
      async (snap) => {
        const list: ShopRow[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopRow));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Fetch admin emails (ownerId → email)
        try {
          const adminSnap = await getDocs(collection(db, 'admins'));
          const emailMap: Record<string, string> = {};
          adminSnap.docs.forEach(d => {
            const data = d.data();
            if (data.uid && data.email) emailMap[data.uid] = data.email;
          });
          list.forEach(s => {
            if (!s.ownerEmail && (s as any).ownerId && emailMap[(s as any).ownerId]) {
              s.ownerEmail = emailMap[(s as any).ownerId];
            }
          });
        } catch {}
        setShops(list);
        setLoading(false);
        setLiveStatus('live');
      },
      (err) => { console.error('shops listener:', err); setLiveStatus('error'); }
    );

    // 2. Cost events — live
    unsubCosts.current = onSnapshot(
      query(collection(db, 'cost_events')),
      (snap) => {
        const list: CostEvent[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as CostEvent));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEvents(list);
        setCostsLoading(false);
      },
      (err) => { console.error('costs listener:', err); }
    );

    // 3. Traffic events — live (most recent 500)
    unsubTraffic.current = onSnapshot(
      query(collection(db, 'traffic_events')),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTrafficEvents(list);
        setTrafficLoading(false);
      },
      (err) => { console.error('traffic listener:', err); }
    );

    // Cleanup on unmount
    return () => {
      unsubShops.current?.();
      unsubCosts.current?.();
      unsubTraffic.current?.();
    };
  }, [authenticated]);

  // Keep legacy manual reload for the refresh button (simply re-triggers via state)
  function manualRefresh() {
    setLiveStatus('connecting');
    // onSnapshot is already live — just flash status
    setTimeout(() => setLiveStatus('live'), 800);
  }

  async function activatePlan(shopId: string, planId: string, months: number) {
    setSaving(shopId);
    try {
      const expiry = new Date();
      if (months > 0) expiry.setMonth(expiry.getMonth() + months);
      await updateDoc(doc(db, 'shops', shopId), {
        planId, planExpiry: months > 0 ? expiry.toISOString() : null,
        updatedAt: new Date().toISOString(),
      });
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, planId, planExpiry: months > 0 ? expiry.toISOString() : undefined } : s));

      // Log subscription event
      const plan = PLANS[planId as keyof typeof PLANS];
      if (planId !== 'FREE' && months > 0) {
        const shop = shops.find(s => s.id === shopId);
        await addDoc(collection(db, 'cost_events'), {
          shopId, shopName: shop?.name || shopId,
          type: 'subscription',
          planId, months,
          revenue: plan.price * months,
          note: `Activation ${planId} ${months} mois — ${shop?.name}`,
          createdAt: new Date().toISOString(),
        });
        // onSnapshot will auto-update costs list
      }
      setSuccessMsg(`✅ Plan ${planId} activé!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) { console.error(err); }
    setSaving(null);
  }

  async function toggleShopActive(shopId: string, currentActive: boolean) {
    setSaving(shopId);
    try {
      await updateDoc(doc(db, 'shops', shopId), { isActive: !currentActive });
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isActive: !currentActive } : s));
    } catch (err) { console.error(err); }
    setSaving(null);
  }

  async function deleteShop(shop: ShopRow) {
    const confirmed = confirm(
      `⚠️ SUPPRIMER "${shop.name}" ?\n\nCette action est IRRÉVERSIBLE.\nTous les produits et commandes seront effacés.\n\nTapez OK pour confirmer.`
    );
    if (!confirmed) return;
    setSaving(shop.id);
    try {
      // Delete all products of this shop
      const productsSnap = await getDocs(query(collection(db, 'products'), where('shopId', '==', shop.id)));
      await Promise.all(productsSnap.docs.map(d => deleteDoc(d.ref)));
      // Delete all orders
      const ordersSnap = await getDocs(query(collection(db, 'orders'), where('shopId', '==', shop.id)));
      await Promise.all(ordersSnap.docs.map(d => deleteDoc(d.ref)));
      // Delete categories
      const catsSnap = await getDocs(query(collection(db, 'categories'), where('shopId', '==', shop.id)));
      await Promise.all(catsSnap.docs.map(d => deleteDoc(d.ref)));
      // Delete shop doc
      await deleteDoc(doc(db, 'shops', shop.id));
      // onSnapshot will auto-update the list
      setSuccessMsg(`🗑️ Boutique "${shop.name}" supprimée.`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      alert('Erreur lors de la suppression : ' + (err.message || err));
    }
    setSaving(null);
  }

  async function addCostEvent() {
    if (!newEvent.type || !newEvent.shopId) { alert('Remplissez shopId et type'); return; }
    const cost_usd = computeCost(newEvent as CostEvent);
    const eventToSave = {
      ...newEvent,
      cost_usd,
      createdAt: newEvent.createdAt ? new Date(newEvent.createdAt).toISOString() : new Date().toISOString(),
    };
    await addDoc(collection(db, 'cost_events'), eventToSave);
    setShowAddEvent(false);
    setNewEvent({ type: 'gemini', subtype: 'vision', createdAt: new Date().toISOString().slice(0, 16) });
    // onSnapshot auto-updates
  }

  // ── Filter events by period ──────────────────────────────────────────────
  const filteredEvents = events.filter(e => {
    const d = new Date(e.createdAt);
    const now = new Date();
    if (costPeriod === 'today') {
      const today = new Date(); today.setHours(0,0,0,0);
      if (d < today) return false;
    } else if (costPeriod === 'week') {
      const week = new Date(); week.setDate(week.getDate() - 7);
      if (d < week) return false;
    } else if (costPeriod === 'month') {
      const month = new Date(); month.setDate(1); month.setHours(0,0,0,0);
      if (d < month) return false;
    }
    if (costTypeFilter && e.type !== costTypeFilter) return false;
    return true;
  });

  // ── Aggregate stats ──────────────────────────────────────────────────────
  const totalCostUSD = filteredEvents.filter(e => e.type !== 'subscription').reduce((s, e) => s + computeCost(e), 0);
  const totalRevXAF = filteredEvents.filter(e => e.type === 'subscription').reduce((s, e) => s + (e.revenue || 0), 0);
  const profitXAF = totalRevXAF - Math.round(totalCostUSD * USD_TO_XAF);

  const byType: Record<string, number> = {};
  filteredEvents.filter(e => e.type !== 'subscription').forEach(e => {
    byType[e.type] = (byType[e.type] || 0) + computeCost(e);
  });

  // ── Shops per plan ──────────────────────────────────────────────────────
  const planCounts = { FREE: 0, STARTER: 0, PRO: 0 };
  shops.forEach(s => { if (s.planId in planCounts) planCounts[s.planId as keyof typeof planCounts]++; });

  const filteredShops = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  // ── Google Auth guide state ──────────────────────────────────────────────
  const [showAuthGuide, setShowAuthGuide] = useState(false);

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}>
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Super Admin</h1>
            <p className="text-gray-500 text-sm mt-1">ShopMaster — Accès développeur</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                className="w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Mot de passe développeur" autoFocus />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-sm text-center">{passwordError}</p>}
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">
              Accéder au panel
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center"><Shield className="w-5 h-5" /></div>
          <div>
            <span className="font-bold text-white">Super Admin</span>
            <span className="text-gray-400 text-xs block">ShopMaster Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && <span className="text-emerald-400 text-sm animate-pulse">{successMsg}</span>}
          {/* Live status indicator */}
          <div className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border ${
            liveStatus === 'live'       ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
            liveStatus === 'connecting' ? 'bg-amber-950 border-amber-800 text-amber-400' :
                                          'bg-red-950 border-red-800 text-red-400'
          }`}>
            {liveStatus === 'live' ? (
              <><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />En direct</>
            ) : liveStatus === 'connecting' ? (
              <><RefreshCw className="w-3 h-3 animate-spin" />Connexion...</>
            ) : (
              <><WifiOff className="w-3 h-3" />Déconnecté</>
            )}
          </div>
          <button onClick={manualRefresh} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800">
            <RefreshCw className="w-4 h-4" />Rafraîchir
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total boutiques', value: shops.length, icon: Store, color: 'text-indigo-400' },
            { label: 'Plans payants', value: planCounts.STARTER + planCounts.PRO, icon: Crown, color: 'text-amber-400' },
            { label: 'Coût API ce mois', value: fmtUSD(totalCostUSD), icon: Zap, color: 'text-red-400' },
            { label: 'Revenus ce mois', value: fmtRevXAF(totalRevXAF), icon: TrendingUp, color: 'text-emerald-400' },
          ].map(kpi => (
            <div key={kpi.label} className="bg-gray-900 rounded-2xl p-4 border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                <span className="text-xs text-gray-500">{kpi.label}</span>
              </div>
              <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 border border-gray-800 mb-6 w-fit flex-wrap">
          {[
            { id: 'shops', label: '🏪 Boutiques', count: shops.length },
            { id: 'costs', label: '💰 Coûts & Revenus', count: null },
            { id: 'traffic', label: '📊 Trafic & Analytics', count: null },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
              {tab.label}{tab.count !== null && <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* ── SHOPS TAB ── */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            {/* Alert */}
            <div className="bg-amber-950 border border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-200 font-medium text-sm">⚠️ Google Sign-In — Configuration Firebase requise</p>
                  <p className="text-amber-400 text-xs mt-1">
                    Pour activer Google Auth : Firebase Console → Authentication → Sign-in methods → Google → Activer.
                    Ajouter les domaines autorisés (localhost, ton-domaine.vercel.app).
                  </p>
                  <button onClick={() => setShowAuthGuide(!showAuthGuide)} className="text-amber-300 text-xs underline mt-1">
                    {showAuthGuide ? 'Masquer' : 'Voir le guide complet'}
                  </button>
                  {showAuthGuide && (
                    <div className="mt-3 bg-amber-900/40 rounded-lg p-3 text-xs text-amber-200 space-y-1.5">
                      <p className="font-bold">Étapes Firebase Console :</p>
                      <p>1. Va sur <span className="font-mono text-amber-300">console.firebase.google.com</span></p>
                      <p>2. Ton projet → <strong>Authentication</strong> → <strong>Sign-in method</strong></p>
                      <p>3. Clique <strong>Google</strong> → Active → Sauvegarde</p>
                      <p>4. Va dans <strong>Authentication → Settings → Authorized domains</strong></p>
                      <p>5. Ajoute <span className="font-mono">localhost</span> et ton domaine de production</p>
                      <p>6. Dans <strong>Firestore → Rules</strong>, vérifie que les règles permettent la lecture/écriture aux users authentifiés</p>
                      <p className="text-amber-400 mt-2">Le code est déjà prêt — c'est uniquement la config Firebase qui manque.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Plan breakdown */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: 'FREE', label: 'Free', count: planCounts.FREE, color: '#6b7280' },
                { id: 'STARTER', label: 'Starter', count: planCounts.STARTER, color: PLANS.STARTER.color },
                { id: 'PRO', label: 'Pro', count: planCounts.PRO, color: PLANS.PRO.color },
              ].map(p => (
                <div key={p.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
                  <p className="text-2xl font-bold" style={{ color: p.color }}>{p.count}</p>
                  <p className="text-xs text-gray-500 mt-0.5">Plan {p.label}</p>
                </div>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input type="text" placeholder="Rechercher une boutique..."
                value={search} onChange={e => setSearch(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
            </div>

            {/* Shops list */}
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-12 text-gray-500 animate-pulse">Chargement...</div>
              ) : filteredShops.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Aucune boutique trouvée</div>
              ) : filteredShops.map(shop => {
                const plan = PLANS[shop.planId as keyof typeof PLANS] || PLANS.FREE;
                const expiryDate = shop.planExpiry ? new Date(shop.planExpiry).toLocaleDateString('fr-FR') : null;
                const expired = shop.planExpiry ? new Date(shop.planExpiry) < new Date() : false;
                return (
                  <div key={shop.id} className={`bg-gray-900 border rounded-2xl p-4 transition-all ${!shop.isActive ? 'border-red-900 opacity-60' : expired && shop.planId !== 'FREE' ? 'border-amber-800' : 'border-gray-800'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-semibold text-white truncate">{shop.name}</h3>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${plan.color}25`, color: plan.color }}>{plan.name}</span>
                          {!shop.isActive && <span className="text-xs px-2 py-0.5 bg-red-900 text-red-300 rounded-full">Inactif</span>}
                          {expired && shop.planId !== 'FREE' && <span className="text-xs px-2 py-0.5 bg-amber-900 text-amber-300 rounded-full">⚠️ Expiré</span>}
                        </div>
                        <p className="text-gray-400 text-xs">
                          /{shop.slug}
                          {shop.whatsapp && <span className="ml-3">📱 {shop.whatsapp}</span>}
                          {shop.ownerEmail && <span className="ml-3">✉️ {shop.ownerEmail}</span>}
                          {expiryDate && shop.planId !== 'FREE' && <span className={`ml-3 ${expired ? 'text-amber-400' : 'text-emerald-400'}`}>{expired ? '⚠️ Expiré le' : '✓ Jusqu\'au'} {expiryDate}</span>}
                        </p>
                        <p className="text-gray-600 text-xs mt-0.5">{shop.ordersThisMonth || 0} cmd ce mois • Inscrit le {new Date(shop.createdAt).toLocaleDateString('fr')}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {(['STARTER', 'PRO'] as const).map(planId => (
                          <div key={planId} className="flex items-center">
                            {shop.planId === planId && !expired ? (
                              <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: `${PLANS[planId].color}20`, color: PLANS[planId].color }}>
                                <Check className="w-3 h-3" /> {planId} actif
                              </span>
                            ) : (
                              <div className="flex items-center">
                                <button onClick={() => activatePlan(shop.id, planId, 1)} disabled={saving === shop.id}
                                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-l-lg font-medium disabled:opacity-50 hover:brightness-110"
                                  style={{ backgroundColor: PLANS[planId].color, color: 'white' }}>
                                  {saving === shop.id ? '...' : <><Crown className="w-3 h-3" />{planId} 1m</>}
                                </button>
                                <button onClick={() => activatePlan(shop.id, planId, 3)} disabled={saving === shop.id}
                                  className="text-xs px-2.5 py-1.5 rounded-r-lg font-medium border-l border-white/20 disabled:opacity-50 hover:brightness-110"
                                  style={{ backgroundColor: PLANS[planId].color + 'cc', color: 'white' }}>3m</button>
                              </div>
                            )}
                          </div>
                        ))}
                        {shop.planId !== 'FREE' && (
                          <button onClick={() => { if (confirm(`Rétrograder ${shop.name} → FREE?`)) activatePlan(shop.id, 'FREE', 0); }}
                            disabled={saving === shop.id} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700">→ FREE</button>
                        )}
                        <button onClick={() => toggleShopActive(shop.id, shop.isActive)} disabled={saving === shop.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium ${shop.isActive ? 'bg-red-950 text-red-400 hover:bg-red-900' : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'}`}>
                          {shop.isActive ? <><X className="w-3 h-3 inline mr-1" />Désactiver</> : <><Check className="w-3 h-3 inline mr-1" />Activer</>}
                        </button>
                        <a href={`/${shop.slug}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700">Voir →</a>
                        {/* RELANCE BUTTON */}
                        <button onClick={() => setRelanceShop(shop)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-400 hover:bg-indigo-900 font-medium flex items-center gap-1">
                          📨 Relancer
                        </button>
                        {/* DELETE BUTTON */}
                        <button onClick={() => deleteShop(shop)} disabled={saving === shop.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-950 text-red-500 hover:bg-red-900 font-medium flex items-center gap-1 disabled:opacity-40"
                          title="Supprimer définitivement cette boutique">
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── COSTS TAB ── */}
        {activeTab === 'costs' && (
          <div className="space-y-5">
            {/* Period + Type filters */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                {[
                  { id: 'today', label: "Auj." },
                  { id: 'week', label: "7 jours" },
                  { id: 'month', label: "Ce mois" },
                  { id: 'all', label: "Tout" },
                ].map(p => (
                  <button key={p.id} onClick={() => setCostPeriod(p.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${costPeriod === p.id ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 flex-wrap">
                <button onClick={() => setCostTypeFilter('')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${!costTypeFilter ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}>
                  Tout
                </button>
                {Object.entries(TYPE_CONFIG).map(([k, cfg]) => (
                  <button key={k} onClick={() => setCostTypeFilter(costTypeFilter === k ? '' : k)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${costTypeFilter === k ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                    style={costTypeFilter === k ? { backgroundColor: cfg.color } : {}}>
                    {cfg.label}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddEvent(true)}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm font-medium">
                + Ajouter événement
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">💸 Coût total</p>
                <p className="text-xl font-bold text-red-400">{fmtUSD(totalCostUSD)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmtXAF(totalCostUSD)}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">💰 Revenus</p>
                <p className="text-xl font-bold text-emerald-400">{fmtRevXAF(totalRevXAF)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{filteredEvents.filter(e => e.type === 'subscription').length} souscriptions</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">📈 Bénéfice net</p>
                <p className={`text-xl font-bold ${profitXAF >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profitXAF >= 0 ? '+' : ''}{profitXAF.toLocaleString('fr-FR')} F
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Revenus - Coûts</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1">📊 Événements</p>
                <p className="text-xl font-bold text-indigo-400">{filteredEvents.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Appels & transactions</p>
              </div>
            </div>

            {/* Cost breakdown by type */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Répartition par service</h3>
              <div className="space-y-3">
                {Object.entries(TYPE_CONFIG).filter(([k]) => k !== 'subscription').map(([type, cfg]) => {
                  const cost = byType[type] || 0;
                  const pct = totalCostUSD > 0 ? (cost / totalCostUSD) * 100 : 0;
                  const Icon = cfg.icon;
                  return (
                    <div key={type}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: cfg.bg }}>
                            <Icon className="w-3.5 h-3.5" style={{ color: cfg.color }} />
                          </div>
                          <span className="text-sm text-gray-300">{cfg.label}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-white">{fmtUSD(cost)}</span>
                          <span className="text-xs text-gray-500 ml-2">({pct.toFixed(1)}%)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: cfg.color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Per-shop cost breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Coûts par boutique</h3>
              <div className="space-y-2">
                {(() => {
                  const shopCosts: Record<string, { name: string; cost: number; calls: number }> = {};
                  filteredEvents.filter(e => e.type !== 'subscription').forEach(e => {
                    if (!shopCosts[e.shopId]) shopCosts[e.shopId] = { name: e.shopName || e.shopId, cost: 0, calls: 0 };
                    shopCosts[e.shopId].cost += computeCost(e);
                    shopCosts[e.shopId].calls++;
                  });
                  const sorted = Object.entries(shopCosts).sort((a, b) => b[1].cost - a[1].cost);
                  if (sorted.length === 0) return <p className="text-gray-500 text-sm text-center py-4">Aucune donnée</p>;
                  return sorted.map(([id, data]) => (
                    <div key={id} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                      <div>
                        <p className="text-sm text-white font-medium">{data.name}</p>
                        <p className="text-xs text-gray-500">{data.calls} appels API</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-red-400">{fmtUSD(data.cost)}</p>
                        <p className="text-xs text-gray-500">{fmtXAF(data.cost)}</p>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Events log */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">Journal des événements</h3>
                <span className="text-xs text-gray-500">{filteredEvents.length} entrées</span>
              </div>
              <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                {costsLoading ? (
                  <div className="p-8 text-center text-gray-500 animate-pulse">Chargement...</div>
                ) : filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun événement enregistré</p>
                    <p className="text-xs mt-1">Les coûts API et souscriptions apparaîtront ici</p>
                  </div>
                ) : filteredEvents.map((e, i) => {
                  const cfg = TYPE_CONFIG[e.type] || TYPE_CONFIG.firestore;
                  const Icon = cfg.icon;
                  const cost = computeCost(e);
                  return (
                    <div key={e.id || i} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-800/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: cfg.bg }}>
                        <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-white">{cfg.label} {e.subtype ? `· ${e.subtype}` : ''}</p>
                            <p className="text-xs text-gray-500">{e.shopName || e.shopId}</p>
                            {e.note && <p className="text-xs text-gray-600 mt-0.5 italic">{e.note}</p>}
                            {e.tokens_in && <p className="text-xs text-gray-600">{e.tokens_in.toLocaleString()}↑ {e.tokens_out?.toLocaleString()}↓ tokens</p>}
                            {e.reads && <p className="text-xs text-gray-600">{e.reads.toLocaleString()} reads / {e.writes?.toLocaleString()} writes</p>}
                          </div>
                          <div className="text-right flex-shrink-0">
                            {e.type === 'subscription' ? (
                              <p className="text-sm font-bold text-emerald-400">+{fmtRevXAF(e.revenue || 0)}</p>
                            ) : (
                              <p className="text-sm font-bold text-red-400">-{fmtUSD(cost)}</p>
                            )}
                            <p className="text-[10px] text-gray-600">{new Date(e.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── TRAFFIC TAB ── */}
        {activeTab === 'traffic' && (() => {
          const filtered = trafficEvents.filter((e: any) => {
            const d = new Date(e.createdAt);
            if (trafficPeriod === 'today') { const t = new Date(); t.setHours(0,0,0,0); return d >= t; }
            if (trafficPeriod === 'week')  { const w = new Date(); w.setDate(w.getDate()-7); return d >= w; }
            if (trafficPeriod === 'month') { const m = new Date(); m.setDate(1); m.setHours(0,0,0,0); return d >= m; }
            return true;
          });

          const sessions = new Set(filtered.map((e: any) => e.sessionId)).size;
          const orderHits = filtered.filter((e: any) => e.page === 'order_success').length;
          const convRate = sessions > 0 ? ((orderHits / sessions) * 100).toFixed(1) : '0.0';

          const pageCount: Record<string, number> = {};
          filtered.forEach((e: any) => { const k = e.page || 'unknown'; pageCount[k] = (pageCount[k]||0)+1; });

          const shopVisits: Record<string, { visits: number; orders: number }> = {};
          filtered.filter((e: any) => e.shopSlug).forEach((e: any) => {
            if (!shopVisits[e.shopSlug]) shopVisits[e.shopSlug] = { visits:0, orders:0 };
            if (e.page === 'shop') shopVisits[e.shopSlug].visits++;
            if (e.page === 'order_success') shopVisits[e.shopSlug].orders++;
          });

          const deviceCount: Record<string, number> = {};
          filtered.forEach((e: any) => { const k = e.device||'unknown'; deviceCount[k]=(deviceCount[k]||0)+1; });

          const refCount: Record<string, number> = {};
          filtered.forEach((e: any) => {
            const r = e.referrer || 'direct';
            let label = 'Direct';
            if (r.includes('whatsapp')) label = 'WhatsApp';
            else if (r.includes('facebook')||r.includes('fb.')) label = 'Facebook';
            else if (r.includes('instagram')) label = 'Instagram';
            else if (r.includes('tiktok')) label = 'TikTok';
            else if (r.includes('google')) label = 'Google';
            else if (r !== 'direct' && r !== '') label = 'Autre site';
            refCount[label] = (refCount[label]||0)+1;
          });

          const utmCount: Record<string, number> = {};
          filtered.filter((e: any) => e.utmCampaign).forEach((e: any) => {
            utmCount[e.utmCampaign] = (utmCount[e.utmCampaign]||0)+1;
          });

          // 14-day chart
          const dayData: Record<string, { visits: number; orders: number }> = {};
          for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate()-i);
            dayData[d.toISOString().slice(0,10)] = { visits:0, orders:0 };
          }
          trafficEvents.forEach((e: any) => {
            const k = new Date(e.createdAt).toISOString().slice(0,10);
            if (dayData[k]) {
              if (['shop','landing'].includes(e.page)) dayData[k].visits++;
              if (e.page === 'order_success') dayData[k].orders++;
            }
          });
          const maxDay = Math.max(...Object.values(dayData).map(d => d.visits), 1);

          const PAGE_LABELS: Record<string,string> = {
            landing:"🏠 Page d'accueil", shop:"🛍️ Boutique", product:"📦 Produit",
            checkout:"🛒 Checkout", order_success:"✅ Commande passée", register:"📝 Inscription", login:"🔑 Connexion",
          };
          const DEVICE_ICONS: Record<string,string> = { mobile:'📱', desktop:'💻', tablet:'📟', unknown:'❓' };
          const REF_COLORS: Record<string,string> = {
            Direct:'#6366f1', WhatsApp:'#25D366', Facebook:'#1877F2',
            Instagram:'#E1306C', TikTok:'#6b7280', Google:'#4285F4', 'Autre site':'#9ca3af',
          };

          return (
            <div className="space-y-5">
              {/* Filters */}
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                  {[{id:'today',label:'Auj.'},{id:'week',label:'7 jours'},{id:'month',label:'Ce mois'},{id:'all',label:'Tout'}].map(p => (
                    <button key={p.id} onClick={() => setTrafficPeriod(p.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium ${trafficPeriod===p.id?'bg-indigo-600 text-white':'text-gray-400 hover:text-white'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <button onClick={manualRefresh}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 ml-auto">
                  <RefreshCw className={`w-3.5 h-3.5 ${trafficLoading?'animate-spin':''}`} />Actualiser
                </button>
              </div>

              {/* ── LIVE indicator ── */}
              <div className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${
                liveStatus === 'live' ? 'bg-emerald-950 border-emerald-800' : 'bg-gray-900 border-gray-800'
              }`}>
                <div className="flex items-center gap-2">
                  {liveStatus === 'live'
                    ? <><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" /><span className="text-emerald-400 text-sm font-semibold">Synchronisation en direct</span></>
                    : <><RefreshCw className="w-3.5 h-3.5 text-gray-500 animate-spin" /><span className="text-gray-500 text-sm">Connexion...</span></>
                  }
                </div>
                {trafficEvents[0] && (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>Dernier événement :</span>
                    <span className="text-gray-300 font-medium">
                      {trafficEvents[0].page === 'shop' ? '🛍️ Visite boutique' :
                       trafficEvents[0].page === 'order_success' ? '✅ Commande' :
                       trafficEvents[0].page === 'landing' ? '🏠 Landing' : trafficEvents[0].page}
                    </span>
                    <span className="text-gray-600">
                      {new Date(trafficEvents[0].createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label:'Visites totales', value:filtered.length, icon:'👁️', color:'text-indigo-400', border:'border-indigo-900' },
                  { label:'Sessions uniques', value:sessions, icon:'👤', color:'text-blue-400', border:'border-blue-900' },
                  { label:'Commandes', value:orderHits, icon:'✅', color:'text-emerald-400', border:'border-emerald-900' },
                  { label:'Taux de conversion', value:convRate+'%', icon:'📈', color:'text-amber-400', border:'border-amber-900' },
                ].map(k => (
                  <div key={k.label} className={`bg-gray-900 rounded-2xl p-4 border ${k.border}`}>
                    <p className="text-xl mb-1">{k.icon}</p>
                    <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
                  </div>
                ))}
              </div>

              {/* Bar chart — 14 days */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-1 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />Évolution — 14 derniers jours
                </h3>
                <p className="text-xs text-gray-500 mb-4">Visites (barres) et commandes (points verts)</p>
                <div className="flex items-end gap-1" style={{ height: '100px' }}>
                  {Object.entries(dayData).map(([date, d]) => {
                    const barH = Math.round((d.visits / maxDay) * 88);
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: '100px' }}>
                        {/* Bar */}
                        <div className="w-full rounded-t-sm transition-all duration-300 relative"
                          style={{ height: barH > 0 ? `${barH}px` : '2px', backgroundColor: barH > 0 ? '#6366f1' : '#1f2937' }}>
                          {d.orders > 0 && (
                            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full" />
                          )}
                        </div>
                        {/* Label */}
                        <span className="text-[7px] text-gray-600 mt-1">{date.slice(8)}</span>
                        {/* Hover tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
                          <div className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-[10px] text-white whitespace-nowrap shadow-xl">
                            <p className="font-bold text-gray-300">{date.slice(5)}</p>
                            <p className="text-indigo-400">👁️ {d.visits} visites</p>
                            {d.orders > 0 && <p className="text-emerald-400">✅ {d.orders} commandes</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="flex gap-4 mt-2 justify-end">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-3 h-2 bg-indigo-500 rounded inline-block" />Visites</span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500"><span className="w-2 h-2 bg-emerald-400 rounded-full inline-block" />Commandes</span>
                </div>
              </div>

              {/* 3 columns: pages / devices / sources */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Pages */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wide mb-3">Pages visitées</h3>
                  <div className="space-y-2.5">
                    {Object.entries(pageCount).sort((a,b)=>b[1]-a[1]).map(([page,count]) => {
                      const total = Object.values(pageCount).reduce((s,v)=>s+v,0);
                      const pct = total > 0 ? (count/total)*100 : 0;
                      return (
                        <div key={page}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300 truncate pr-1">{PAGE_LABELS[page]||page}</span>
                            <span className="text-gray-400 font-mono">{count}</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width:`${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {!Object.keys(pageCount).length && <p className="text-gray-600 text-xs text-center py-3">Aucune donnée</p>}
                  </div>
                </div>

                {/* Devices */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wide mb-3">Appareils</h3>
                  <div className="space-y-2.5">
                    {Object.entries(deviceCount).sort((a,b)=>b[1]-a[1]).map(([device,count]) => {
                      const total = Object.values(deviceCount).reduce((s,v)=>s+v,0);
                      const pct = total>0?(count/total)*100:0;
                      return (
                        <div key={device}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-gray-300">{DEVICE_ICONS[device]||'❓'} {device}</span>
                            <span className="text-gray-400">{pct.toFixed(0)}%</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width:`${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                    {!Object.keys(deviceCount).length && <p className="text-gray-600 text-xs text-center py-3">Aucune donnée</p>}
                  </div>
                </div>

                {/* Sources */}
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                  <h3 className="font-bold text-white text-xs uppercase tracking-wide mb-3">Sources de trafic</h3>
                  <div className="space-y-2.5">
                    {Object.entries(refCount).sort((a,b)=>b[1]-a[1]).map(([ref,count]) => {
                      const total = Object.values(refCount).reduce((s,v)=>s+v,0);
                      const pct = total>0?(count/total)*100:0;
                      const col = REF_COLORS[ref]||'#6b7280';
                      return (
                        <div key={ref}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-300">{ref}</span>
                            <span className="text-gray-400">{count} ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor:col }} />
                          </div>
                        </div>
                      );
                    })}
                    {!Object.keys(refCount).length && <p className="text-gray-600 text-xs text-center py-3">Aucune donnée</p>}
                  </div>
                </div>
              </div>

              {/* UTM Campaigns */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-3">🎯 Campagnes publicitaires</h3>
                {Object.keys(utmCount).length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {Object.entries(utmCount).sort((a,b)=>b[1]-a[1]).map(([campaign,count]) => {
                      const total = Object.values(utmCount).reduce((s,v)=>s+v,0);
                      const pct = total>0?(count/total)*100:0;
                      return (
                        <div key={campaign} className="flex items-center gap-3">
                          <div className="w-2 h-2 bg-amber-400 rounded-full flex-shrink-0" />
                          <span className="text-sm text-gray-300 flex-1 min-w-0 truncate">{campaign}</span>
                          <div className="w-24 h-1.5 bg-gray-800 rounded-full flex-shrink-0">
                            <div className="h-full rounded-full bg-amber-500" style={{ width:`${pct}%` }} />
                          </div>
                          <span className="text-sm font-bold text-amber-400 w-8 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">Aucune campagne détectée pour cette période.</p>
                )}
                <div className="bg-gray-800 rounded-xl p-3">
                  <p className="text-xs font-bold text-gray-300 mb-2">Comment tracker tes publicités :</p>
                  <div className="font-mono text-xs text-indigo-300 bg-gray-900 rounded-lg p-2 overflow-x-auto">
                    {'https://shopmaster.app/ta-boutique?utm_source=facebook&utm_campaign=soldes_jan'}
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                    <div className="bg-gray-900 rounded-lg p-2"><p className="text-indigo-400 font-mono">utm_source</p><p className="text-gray-500">facebook, whatsapp, tiktok</p></div>
                    <div className="bg-gray-900 rounded-lg p-2"><p className="text-indigo-400 font-mono">utm_medium</p><p className="text-gray-500">social, paid, story</p></div>
                    <div className="bg-gray-900 rounded-lg p-2"><p className="text-indigo-400 font-mono">utm_campaign</p><p className="text-gray-500">promo_noel, soldes_jan</p></div>
                  </div>
                </div>
              </div>

              {/* Shop performance */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-4">Performance par boutique</h3>
                {Object.entries(shopVisits).length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <BarChart3 className="w-7 h-7 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Les visites s'enregistrent automatiquement dès qu'un client visite une boutique</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(shopVisits).sort((a,b)=>b[1].visits-a[1].visits).map(([slug, data]) => {
                      const cr = data.visits > 0 ? ((data.orders/data.visits)*100).toFixed(1) : '0.0';
                      const crNum = parseFloat(cr);
                      return (
                        <div key={slug} className="flex items-center gap-3 py-2.5 border-b border-gray-800 last:border-0">
                          <div className="w-9 h-9 rounded-xl bg-indigo-900/60 flex items-center justify-center text-indigo-300 font-bold text-sm flex-shrink-0">
                            {slug.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">/{slug}</p>
                            <div className="flex gap-3 mt-0.5">
                              <span className="text-xs text-indigo-400">👁️ {data.visits}</span>
                              <span className="text-xs text-emerald-400">✅ {data.orders}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold" style={{ color: crNum>=5?'#22c55e':crNum>=2?'#f59e0b':'#ef4444' }}>{cr}%</p>
                            <p className="text-[10px] text-gray-600">conversion</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Recent events */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wide">Visites récentes</h3>
                  <span className="text-xs text-gray-500">{filtered.length} événements</span>
                </div>
                <div className="max-h-72 overflow-y-auto divide-y divide-gray-800">
                  {trafficLoading ? (
                    <div className="p-8 text-center text-gray-500 animate-pulse">Chargement...</div>
                  ) : filtered.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <Activity className="w-7 h-7 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Aucune visite</p>
                    </div>
                  ) : filtered.slice(0,50).map((e: any, i: number) => (
                    <div key={e.id||i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/40">
                      <span className="text-sm flex-shrink-0">{DEVICE_ICONS[e.device]||'❓'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-medium text-white">{PAGE_LABELS[e.page]||e.page}</span>
                          {e.shopSlug && <span className="text-[10px] text-gray-500">/{e.shopSlug}</span>}
                          {e.utmCampaign && <span className="text-[10px] bg-amber-900 text-amber-300 px-1.5 py-0.5 rounded font-medium">📣 {e.utmCampaign}</span>}
                        </div>
                        <p className="text-[10px] text-gray-600 mt-0.5">
                          {e.referrer && e.referrer !== 'direct' ? `↩ ${e.referrer.slice(0,40)}` : '↩ direct'}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-600 flex-shrink-0">
                        {new Date(e.createdAt).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ══ RELANCE MODAL ══════════════════════════════════════════════════════ */}
      {relanceShop && (() => {
        const shopUrl = `https://mastershoppro.com/${relanceShop.slug}`;
        const adminUrl = `https://mastershoppro.com/admin/dashboard`;

        const waGuide = `Bonjour ! 👋

Je suis votre support ShopMaster. Je voulais m'assurer que tout se passe bien pour la boutique *${relanceShop.name}* 🏪

Voici un guide rapide pour bien démarrer :

*📦 1. Ajouter vos produits*
→ Menu Admin → Produits → "+ Nouveau produit"
→ Astuce : utilisez la caméra 🤖 pour que l'IA remplisse tout automatiquement !
→ Ajoutez le prix d'achat ET le prix de vente pour voir vos bénéfices

*🛒 2. Créer une commande*
→ Menu Admin → Commandes → "+ Commande manuelle"
→ Cherchez le client ou créez-en un nouveau
→ Scannez ou sélectionnez les produits → Confirmer

*🌐 3. Votre boutique en ligne*
→ Partagez ce lien avec vos clients : ${shopUrl}
→ Ils peuvent commander directement depuis leur téléphone !

*🖨️ 4. Imprimer un reçu*
→ Après chaque commande → bouton "Imprimer"
→ Compatible imprimantes Bluetooth thermiques

*📊 5. Voir vos statistiques*
→ Tableau de bord → chiffres du jour, semaine, mois
→ Bénéfice net calculé automatiquement

Besoin d'aide ? Répondez directement à ce message 😊
Support disponible 7j/7 sur WhatsApp.`;

        const emailSubject = `Guide de démarrage – Votre boutique ${relanceShop.name} sur ShopMaster`;
        const emailBody = `Bonjour,

J'espère que vous allez bien ! Je voulais vous envoyer un guide rapide pour bien configurer votre boutique "${relanceShop.name}" sur ShopMaster.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 ÉTAPE 1 — Ajouter vos produits
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Connectez-vous sur ${adminUrl}
2. Allez dans "Produits" → cliquez "+ Nouveau produit"
3. Astuce IA : cliquez sur l'icône caméra 🤖 — photographiez le produit et l'IA remplit tout automatiquement (nom, description, prix suggéré) !
4. Renseignez le prix d'achat ET le prix de vente pour voir vos bénéfices en temps réel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🛒 ÉTAPE 2 — Créer votre première commande
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Allez dans "Commandes" → "+ Commande manuelle"
2. Entrez le nom et numéro du client
3. Sélectionnez les produits (ou scannez leur code-barres)
4. Choisissez le mode de paiement (Espèces ou Mobile Money)
5. Validez → la commande passe automatiquement "En préparation"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌐 ÉTAPE 3 — Partager votre boutique en ligne
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Votre lien boutique public : ${shopUrl}
→ Partagez-le sur WhatsApp, Facebook, Instagram
→ Vos clients peuvent commander directement depuis leur téléphone
→ Vous recevez une notification à chaque nouvelle commande

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖨️ ÉTAPE 4 — Imprimer des reçus
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Après chaque vente, cliquez "Imprimer le reçu"
→ Compatible avec les imprimantes thermiques Bluetooth
→ Vous pouvez aussi envoyer le reçu par WhatsApp directement

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 ÉTAPE 5 — Suivre vos ventes
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
→ Tableau de bord : ventes du jour, semaine, mois
→ Bénéfice net calculé automatiquement
→ Top produits, évolution des ventes, historique complet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Une question ? Répondez à cet email ou contactez-nous sur WhatsApp.
Nous sommes disponibles 7j/7 pour vous aider !

Bonne vente ! 🚀

L'équipe ShopMaster
WhatsApp : +393299639430
Site : https://mastershoppro.com`;

        const waNumber = relanceShop.whatsapp?.replace(/[^0-9]/g, '');
        const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waGuide)}` : null;
        const emailLink = relanceShop.ownerEmail ? `mailto:${relanceShop.ownerEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}` : null;

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-5 flex items-center justify-between">
                <div>
                  <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-0.5">Relancer le client</p>
                  <h2 className="text-white text-lg font-bold">{relanceShop.name}</h2>
                  <p className="text-indigo-300 text-xs mt-0.5">/{relanceShop.slug} · Plan {relanceShop.planId}</p>
                </div>
                <button onClick={() => setRelanceShop(null)}
                  className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Guide preview */}
                <div className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-wide mb-3 flex items-center gap-2">
                    📋 Guide envoyé avec le message
                  </p>
                  <div className="space-y-2 text-xs text-gray-400">
                    {[
                      { icon: '📦', step: '1', title: 'Ajouter les produits', desc: 'Via IA caméra ou manuellement, avec prix achat/vente' },
                      { icon: '🛒', step: '2', title: 'Créer une commande', desc: 'Commande manuelle ou scan code-barres, Mobile Money / Espèces' },
                      { icon: '🌐', step: '3', title: 'Partager la boutique en ligne', desc: `Lien : mastershoppro.com/${relanceShop.slug}` },
                      { icon: '🖨️', step: '4', title: 'Imprimer les reçus', desc: 'Thermique Bluetooth ou envoi WhatsApp' },
                      { icon: '📊', step: '5', title: 'Suivre les ventes', desc: 'Dashboard temps réel, bénéfices, top produits' },
                    ].map(s => (
                      <div key={s.step} className="flex items-start gap-3 py-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-base flex-shrink-0">{s.icon}</span>
                        <div>
                          <p className="text-gray-200 font-semibold text-xs">Étape {s.step} — {s.title}</p>
                          <p className="text-gray-500 text-[11px] mt-0.5">{s.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Send buttons */}
                <div className="space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Envoyer via</p>

                  {/* WhatsApp */}
                  {waLink ? (
                    <a href={waLink} target="_blank" onClick={() => setTimeout(() => setRelanceShop(null), 500)}
                      className="flex items-center gap-4 bg-green-900/50 hover:bg-green-900 border border-green-800 rounded-2xl p-4 transition-all group">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.855L.057 23.882l6.187-1.452A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.882 0-3.64-.49-5.17-1.348l-.37-.22-3.673.862.925-3.57-.24-.385A9.945 9.945 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">WhatsApp</p>
                        <p className="text-green-400 text-xs">+{waNumber}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">Message pré-rempli avec guide complet · 1 clic</p>
                      </div>
                      <div className="text-green-400 text-xs font-bold group-hover:translate-x-1 transition-transform">→</div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-2xl p-4 opacity-50">
                      <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-gray-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold text-sm">WhatsApp</p>
                        <p className="text-gray-600 text-xs">Numéro non configuré pour cette boutique</p>
                      </div>
                    </div>
                  )}

                  {/* Email */}
                  {emailLink ? (
                    <a href={emailLink} onClick={() => setTimeout(() => setRelanceShop(null), 500)}
                      className="flex items-center gap-4 bg-orange-900/30 hover:bg-orange-900/50 border border-orange-800/50 rounded-2xl p-4 transition-all group">
                      <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm">Email</p>
                        <p className="text-orange-400 text-xs truncate">{relanceShop.ownerEmail}</p>
                        <p className="text-gray-400 text-[11px] mt-0.5">Guide complet en 5 étapes · Ouvre votre client mail</p>
                      </div>
                      <div className="text-orange-400 text-xs font-bold group-hover:translate-x-1 transition-transform">→</div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-2xl p-4 opacity-50">
                      <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-gray-500"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold text-sm">Email</p>
                        <p className="text-gray-600 text-xs">Email non disponible pour cette boutique</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Copy shop link */}
                <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">Lien boutique publique</p>
                    <p className="text-sm font-mono text-indigo-300 truncate">{shopUrl}</p>
                  </div>
                  <button onClick={() => { navigator.clipboard.writeText(shopUrl); }}
                    className="text-xs px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors flex-shrink-0">
                    Copier
                  </button>
                </div>

                <button onClick={() => setRelanceShop(null)}
                  className="w-full py-2.5 text-sm text-gray-500 hover:text-gray-300 transition-colors">
                  Fermer
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">Ajouter un événement de coût</h2>
              <button onClick={() => setShowAddEvent(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Type *</label>
                  <select value={newEvent.type} onChange={e => setNewEvent({ ...newEvent, type: e.target.value as any })}
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                    {Object.entries(TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Sous-type</label>
                  <input type="text" value={newEvent.subtype || ''} onChange={e => setNewEvent({ ...newEvent, subtype: e.target.value })}
                    placeholder="vision, text..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Shop ID</label>
                <select value={newEvent.shopId || ''} onChange={e => setNewEvent({ ...newEvent, shopId: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
                  <option value="">— Choisir une boutique —</option>
                  {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              {(newEvent.type === 'gemini' || newEvent.type === 'gpt4o') && (
                <div className="grid grid-cols-3 gap-2">
                  <div><label className="text-xs text-gray-400 mb-1 block">Tokens in</label><input type="number" value={newEvent.tokens_in || ''} onChange={e => setNewEvent({ ...newEvent, tokens_in: +e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Tokens out</label><input type="number" value={newEvent.tokens_out || ''} onChange={e => setNewEvent({ ...newEvent, tokens_out: +e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Images</label><input type="number" value={newEvent.images || ''} onChange={e => setNewEvent({ ...newEvent, images: +e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" /></div>
                </div>
              )}
              {newEvent.type === 'firestore' && (
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs text-gray-400 mb-1 block">Lectures</label><input type="number" value={newEvent.reads || ''} onChange={e => setNewEvent({ ...newEvent, reads: +e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" /></div>
                  <div><label className="text-xs text-gray-400 mb-1 block">Écritures</label><input type="number" value={newEvent.writes || ''} onChange={e => setNewEvent({ ...newEvent, writes: +e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" /></div>
                </div>
              )}
              {newEvent.type === 'subscription' && (
                <div><label className="text-xs text-gray-400 mb-1 block">Revenu (FCFA)</label><input type="number" value={newEvent.revenue || ''} onChange={e => setNewEvent({ ...newEvent, revenue: +e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" /></div>
              )}
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Note / Description</label>
                <input type="text" value={newEvent.note || ''} onChange={e => setNewEvent({ ...newEvent, note: e.target.value })}
                  placeholder="Analyse produit par IA, scan lot de 50..." className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Date & heure</label>
                <input type="datetime-local" value={newEvent.createdAt?.slice(0, 16) || ''} onChange={e => setNewEvent({ ...newEvent, createdAt: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" />
              </div>
              {/* Preview cost */}
              <div className="bg-gray-800 rounded-xl p-3 flex justify-between items-center">
                <span className="text-xs text-gray-400">Coût calculé</span>
                <span className="text-sm font-bold text-amber-400">
                  {newEvent.type === 'subscription' ? `+${fmtRevXAF(newEvent.revenue || 0)}` : `-${fmtUSD(computeCost(newEvent as CostEvent))}`}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setShowAddEvent(false)} className="flex-1 py-2.5 bg-gray-800 text-gray-400 rounded-xl text-sm">Annuler</button>
              <button onClick={addCostEvent} className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}