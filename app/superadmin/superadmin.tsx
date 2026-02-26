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

// -- API COST RATES (USD) --------------------------------------------------
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

// -- Cost computation -------------------------------------------------------
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

// ==============================================================================
// STRIPE PAYMENTS TAB - Paiements Studio Photo IA
// ==============================================================================
function StripePaymentsTab({ shops }: { shops: any[] }) {
  const [pending, setPending]     = useState<any[]>([]);
  const [confirmed, setConfirmed] = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [msg, setMsg]             = useState('');
  const [manualShopId, setManualShopId] = useState('');
  const [manualCredits, setManualCredits] = useState('200');

  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  const base      = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  useEffect(() => { loadPayments(); }, []);

  async function loadPayments() {
    setLoading(true);
    try {
      // Paiements en attente d'activation manuelle
      const pendingRes = await fetch(`${base}/pending_credits?key=${apiKey}&pageSize=50`);
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        const docs = (data.documents || []).map((d: any) => ({
          id: d.name?.split('/').pop(),
          shopName: d.fields?.shopName?.stringValue || '?',
          credits:  parseInt(d.fields?.credits?.integerValue || '0'),
          amount:   parseInt(d.fields?.amount?.integerValue || '0'),
          currency: d.fields?.currency?.stringValue || 'eur',
          email:    d.fields?.email?.stringValue || '',
          status:   d.fields?.status?.stringValue || 'PENDING_MANUAL',
          sessionId: d.fields?.sessionId?.stringValue || '',
          createdAt: d.fields?.createdAt?.stringValue || '',
        }));
        setPending(docs.filter((d: any) => d.status === 'PENDING_MANUAL'));
      }
      // Paiements Stripe traites automatiquement
      const confirmedRes = await fetch(`${base}/stripe_payments?key=${apiKey}&pageSize=20`);
      if (confirmedRes.ok) {
        const data = await confirmedRes.json();
        const docs = (data.documents || []).map((d: any) => ({
          id: d.name?.split('/').pop(),
          shopId:     d.fields?.shopId?.stringValue || '',
          credits:    parseInt(d.fields?.credits?.integerValue || '0'),
          processedAt: d.fields?.processedAt?.stringValue || '',
          sessionId:  d.fields?.sessionId?.stringValue || '',
        }));
        setConfirmed(docs.sort((a: any, b: any) => b.processedAt.localeCompare(a.processedAt)));
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function activateManually(pendingDoc: any, shopId: string) {
    if (!shopId.trim()) { setMsg(' Selectionne une boutique !'); return; }
    setActivating(pendingDoc.id);
    try {
      // Ajouter credits a la boutique
      const shopRes = await fetch(`${base}/shops/${shopId}?key=${apiKey}`);
      if (!shopRes.ok) throw new Error('Boutique introuvable');
      const shopDoc = await shopRes.json();
      const current = parseInt(shopDoc.fields?.photoCredits?.integerValue ?? '0');

      await fetch(`${base}/shops/${shopId}?key=${apiKey}&updateMask.fieldPaths=photoCredits&updateMask.fieldPaths=updatedAt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: {
          photoCredits: { integerValue: String(current + pendingDoc.credits) },
          updatedAt:    { stringValue: new Date().toISOString() },
        }}),
      });

      // Marquer comme active
      await fetch(`${base}/pending_credits/${pendingDoc.id}?key=${apiKey}&updateMask.fieldPaths=status&updateMask.fieldPaths=activatedShopId&updateMask.fieldPaths=activatedAt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: {
          status:          { stringValue: 'ACTIVATED' },
          activatedShopId: { stringValue: shopId },
          activatedAt:     { stringValue: new Date().toISOString() },
        }}),
      });

      setMsg(` ${pendingDoc.credits} credits ajoutes a la boutique`);
      await loadPayments();
    } catch (e: any) { setMsg(` Erreur: ${e.message}`); }
    setActivating(null);
    setTimeout(() => setMsg(''), 4000);
  }

  async function addManualCredits() {
    if (!manualShopId.trim()) { setMsg(' ShopId requis'); return; }
    const credits = parseInt(manualCredits);
    if (!credits || credits <= 0) { setMsg(' Credits invalides'); return; }
    setActivating('manual');
    try {
      const shopRes = await fetch(`${base}/shops/${manualShopId}?key=${apiKey}`);
      if (!shopRes.ok) throw new Error('Boutique introuvable');
      const shopDoc = await shopRes.json();
      const current = parseInt(shopDoc.fields?.photoCredits?.integerValue ?? '0');
      await fetch(`${base}/shops/${manualShopId}?key=${apiKey}&updateMask.fieldPaths=photoCredits&updateMask.fieldPaths=updatedAt`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fields: {
          photoCredits: { integerValue: String(current + credits) },
          updatedAt:    { stringValue: new Date().toISOString() },
        }}),
      });
      setMsg(` ${credits} credits ajoutes a ${manualShopId}`);
      setManualShopId(''); setManualCredits('200');
    } catch (e: any) { setMsg(` ${e.message}`); }
    setActivating(null);
    setTimeout(() => setMsg(''), 4000);
  }

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">

      {msg && (
        <div className={`p-3 rounded-xl text-sm font-bold text-center ${msg.startsWith('') ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'}`}>
          {msg}
        </div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-amber-400">{pending.length}</p>
          <p className="text-xs text-gray-400 mt-1">En attente</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-emerald-400">{confirmed.length}</p>
          <p className="text-xs text-gray-400 mt-1">Auto-actives</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
          <p className="text-2xl font-extrabold text-violet-400">
            {confirmed.reduce((s: number, c: any) => s + c.credits, 0) + pending.filter((p: any) => p.status !== 'ACTIVATED').reduce((s: number, c: any) => s + c.credits, 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">Credits vendus</p>
        </div>
      </div>

      {/* Config webhook */}
      <div className="bg-indigo-950 border border-indigo-800 rounded-2xl p-4 space-y-2">
        <p className="text-indigo-300 font-bold text-sm"> Configuration Webhook Stripe</p>
        <div className="space-y-1 text-xs font-mono">
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-2">
            <span className="text-gray-400">URL :</span>
            <span className="text-green-400">https://mastershoppro.com/api/stripe-webhook</span>
          </div>
          <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-2">
            <span className="text-gray-400">Event :</span>
            <span className="text-amber-400">checkout.session.completed</span>
          </div>
        </div>
        <p className="text-indigo-400 text-xs">
           dashboard.stripe.com  Developpeurs  Webhooks  Ajouter un endpoint<br/>
           Copie le "Signing secret"  ajoute dans .env.local  <span className="text-white font-bold">STRIPE_WEBHOOK_SECRET=whsec_xxx</span>
        </p>
      </div>

      {/* Paiements en attente d'activation manuelle */}
      {pending.length > 0 && (
        <div>
          <p className="text-amber-400 font-bold text-sm mb-3"> En attente d'activation manuelle ({pending.length})</p>
          <div className="space-y-3">
            {pending.map((p: any) => (
              <div key={p.id} className="bg-amber-950/40 border border-amber-800 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-white">{p.shopName || 'Boutique non identifiee'}</p>
                    <p className="text-xs text-gray-400">{p.email} . {new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
                    <p className="text-xs text-amber-400 mt-1">
                      {p.credits} credits . {(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-gray-500 font-mono mt-1">{p.sessionId}</p>
                  </div>
                  <span className="text-[10px] bg-amber-900 text-amber-300 px-2 py-1 rounded-full font-bold">MANUEL</span>
                </div>
                {/* Selecteur boutique */}
                <div className="flex gap-2">
                  <select
                    className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white"
                    onChange={e => setManualShopId(e.target.value)}
                    defaultValue="">
                    <option value="" disabled>Selectionner la boutique...</option>
                    {shops.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.name} . /{s.slug}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => activateManually(p, manualShopId)}
                    disabled={activating === p.id}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl disabled:opacity-50 flex items-center gap-1">
                    {activating === p.id ? '...' : ' Activer'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paiements automatiques recents */}
      <div>
        <p className="text-emerald-400 font-bold text-sm mb-3"> Actives automatiquement ({confirmed.length})</p>
        {confirmed.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
            <p className="text-gray-500 text-sm">Aucun paiement automatique encore</p>
            <p className="text-xs text-gray-600 mt-1">Configure le webhook Stripe pour activer l'automatisation</p>
          </div>
        ) : (
          <div className="space-y-2">
            {confirmed.map((c: any) => {
              const shop = shops.find((s: any) => s.id === c.shopId);
              return (
                <div key={c.id} className="bg-gray-900 border border-gray-800 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">{shop?.name || c.shopId}</p>
                    <p className="text-xs text-gray-400">{new Date(c.processedAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-violet-400">+{c.credits} credits</p>
                    <p className="text-[10px] text-gray-500">auto-active </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Ajout manuel de credits */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
        <p className="text-gray-300 font-bold text-sm"> Ajouter des credits manuellement</p>
        <div className="flex gap-2">
          <select
            value={manualShopId}
            onChange={e => setManualShopId(e.target.value)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white">
            <option value="">Selectionner boutique...</option>
            {shops.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name} . /{s.slug}</option>
            ))}
          </select>
          <select
            value={manualCredits}
            onChange={e => setManualCredits(e.target.value)}
            className="w-24 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white">
            <option value="50">50 credits</option>
            <option value="200">200 credits</option>
            <option value="100">100 credits</option>
            <option value="500">500 credits</option>
          </select>
          <button
            onClick={addManualCredits}
            disabled={activating === 'manual'}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl disabled:opacity-50">
            {activating === 'manual' ? '...' : 'Ajouter'}
          </button>
        </div>
        <button onClick={loadPayments} className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1">
           Actualiser
        </button>
      </div>
    </div>
  );
}

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'shops' | 'costs' | 'traffic' | 'demo' | 'logs' | 'stripe'>('shops');

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

  // Demo events
  const [demoEvents, setDemoEvents] = useState<any[]>([]);
  const unsubDemo = useRef<(() => void) | null>(null);

  // API logs
  const [apiLogs, setApiLogs] = useState<any[]>([]);

  // Relance
  const [relanceShop, setRelanceShop] = useState<ShopRow | null>(null);
  const [showAuthGuide, setShowAuthGuide] = useState(false);

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

  // -- Start real-time listeners when authenticated -------------------------
  useEffect(() => {
    if (!authenticated) return;

    setLiveStatus('connecting');

    // 1. Shops - live, enriched with owner email from admins collection
    unsubShops.current = onSnapshot(
      collection(db, 'shops'),
      async (snap) => {
        const list: ShopRow[] = snap.docs.map(d => ({ id: d.id, ...d.data() } as ShopRow));
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        // Fetch admin emails (ownerId  email)
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

    // 2. Cost events - live
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

    // 3. Traffic events - live (most recent 500)
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

    // 4. Demo events - live
    unsubDemo.current = onSnapshot(
      query(collection(db, 'demo_events')),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setDemoEvents(list);
      },
      (err) => { console.error('demo listener:', err); }
    );

    // 5. API logs - live (derniers 200)
    const unsubLogs = onSnapshot(
      query(collection(db, 'api_logs')),
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setApiLogs(list.slice(0, 200));
      },
      () => {}
    );

    // Cleanup on unmount
    return () => {
      unsubShops.current?.();
      unsubCosts.current?.();
      unsubTraffic.current?.();
      unsubDemo.current?.();
      unsubLogs();
    };
  }, [authenticated]);

  // Keep legacy manual reload for the refresh button (simply re-triggers via state)
  function manualRefresh() {
    setLiveStatus('connecting');
    // onSnapshot is already live - just flash status
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
          note: `Activation ${planId} ${months} mois - ${shop?.name}`,
          createdAt: new Date().toISOString(),
        });
        // onSnapshot will auto-update costs list
      }
      setSuccessMsg(` Plan ${planId} active!`);
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
      ` SUPPRIMER "${shop.name}" ?\n\nCette action est IRREVERSIBLE.\nTous les produits et commandes seront effaces.\n\nTapez OK pour confirmer.`
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
      setSuccessMsg(` Boutique "${shop.name}" supprimee.`);
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

  // -- Filter events by period ----------------------------------------------
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

  // -- Aggregate stats ------------------------------------------------------
  const totalCostUSD = filteredEvents.filter(e => e.type !== 'subscription').reduce((s, e) => s + computeCost(e), 0);
  const totalRevXAF = filteredEvents.filter(e => e.type === 'subscription').reduce((s, e) => s + (e.revenue || 0), 0);
  const profitXAF = totalRevXAF - Math.round(totalCostUSD * USD_TO_XAF);

  const byType: Record<string, number> = {};
  filteredEvents.filter(e => e.type !== 'subscription').forEach(e => {
    byType[e.type] = (byType[e.type] || 0) + computeCost(e);
  });

  // -- Shops per plan ------------------------------------------------------
  const planCounts = { FREE: 0, STARTER: 0, PRO: 0 };
  shops.forEach(s => { if (s.planId in planCounts) planCounts[s.planId as keyof typeof planCounts]++; });

  const filteredShops = shops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}>
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Super Admin</h1>
            <p className="text-gray-500 text-sm mt-1">ShopMaster - Acces developpeur</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password}
                onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                className="w-full border rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                placeholder="Mot de passe developpeur" autoFocus />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {passwordError && <p className="text-red-500 text-sm text-center">{passwordError}</p>}
            <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold">
              Acceder au panel
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
              <><WifiOff className="w-3 h-3" />Deconnecte</>
            )}
          </div>
          <button onClick={manualRefresh} className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-gray-800">
            <RefreshCw className="w-4 h-4" />Rafraichir
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total boutiques', value: shops.length, icon: Store, color: 'text-indigo-400' },
            { label: 'Plans payants', value: planCounts.STARTER + planCounts.PRO, icon: Crown, color: 'text-amber-400' },
            { label: 'Cout API ce mois', value: fmtUSD(totalCostUSD), icon: Zap, color: 'text-red-400' },
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
            { id: 'shops',   label: ' Boutiques',          count: shops.length },
            { id: 'costs',   label: ' Couts & Revenus',     count: null },
            { id: 'traffic', label: ' Trafic & Analytics',  count: null },
            { id: 'demo',    label: ' Utilisateurs Demo',   count: demoEvents.filter((e: any) => e.action === 'open').length || null },
            { id: 'logs',    label: ' Logs API',             count: apiLogs.filter((l: any) => l.status === 'all_failed' || l.status === 'fatal_error').length || null },
            { id: 'stripe',  label: ' Paiements Stripe',    count: null },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-white'}`}>
              {tab.label}{tab.count !== null && <span className="ml-1.5 text-xs opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* -- SHOPS TAB -- */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            {/* Alert */}
            <div className="bg-amber-950 border border-amber-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-amber-200 font-medium text-sm"> Google Sign-In - Configuration Firebase requise</p>
                  <p className="text-amber-400 text-xs mt-1">
                    Pour activer Google Auth : Firebase Console  Authentication  Sign-in methods  Google  Activer.
                    Ajouter les domaines autorises (localhost, ton-domaine.vercel.app).
                  </p>
                  <button onClick={() => setShowAuthGuide(!showAuthGuide)} className="text-amber-300 text-xs underline mt-1">
                    {showAuthGuide ? 'Masquer' : 'Voir le guide complet'}
                  </button>
                  {showAuthGuide && (
                    <div className="mt-3 bg-amber-900/40 rounded-lg p-3 text-xs text-amber-200 space-y-1.5">
                      <p className="font-bold">Etapes Firebase Console :</p>
                      <p>1. Va sur <span className="font-mono text-amber-300">console.firebase.google.com</span></p>
                      <p>2. Ton projet  <strong>Authentication</strong>  <strong>Sign-in method</strong></p>
                      <p>3. Clique <strong>Google</strong>  Active  Sauvegarde</p>
                      <p>4. Va dans <strong>Authentication  Settings  Authorized domains</strong></p>
                      <p>5. Ajoute <span className="font-mono">localhost</span> et ton domaine de production</p>
                      <p>6. Dans <strong>Firestore  Rules</strong>, verifie que les regles permettent la lecture/ecriture aux users authentifies</p>
                      <p className="text-amber-400 mt-2">Le code est deja pret - c'est uniquement la config Firebase qui manque.</p>
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
                <div className="text-center py-12 text-gray-500">Aucune boutique trouvee</div>
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
                          {expired && shop.planId !== 'FREE' && <span className="text-xs px-2 py-0.5 bg-amber-900 text-amber-300 rounded-full"> Expire</span>}
                        </div>
                        <p className="text-gray-400 text-xs">
                          /{shop.slug}
                          {shop.whatsapp && <span className="ml-3"> {shop.whatsapp}</span>}
                          {shop.ownerEmail && <span className="ml-3"> {shop.ownerEmail}</span>}
                          {expiryDate && shop.planId !== 'FREE' && <span className={`ml-3 ${expired ? 'text-amber-400' : 'text-emerald-400'}`}>{expired ? ' Expire le' : ' Jusqu\'au'} {expiryDate}</span>}
                        </p>
                        <p className="text-gray-600 text-xs mt-0.5">{shop.ordersThisMonth || 0} cmd ce mois * Inscrit le {new Date(shop.createdAt).toLocaleDateString('fr')}</p>
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
                          <button onClick={() => { if (confirm(`Retrograder ${shop.name}  FREE?`)) activatePlan(shop.id, 'FREE', 0); }}
                            disabled={saving === shop.id} className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700"> FREE</button>
                        )}
                        <button onClick={() => toggleShopActive(shop.id, shop.isActive)} disabled={saving === shop.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium ${shop.isActive ? 'bg-red-950 text-red-400 hover:bg-red-900' : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'}`}>
                          {shop.isActive ? <><X className="w-3 h-3 inline mr-1" />Desactiver</> : <><Check className="w-3 h-3 inline mr-1" />Activer</>}
                        </button>
                        <a href={`/${shop.slug}`} target="_blank" className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700">Voir </a>
                        {/* RELANCE BUTTON */}
                        <button onClick={() => setRelanceShop(shop)}
                          className="text-xs px-3 py-1.5 rounded-lg bg-indigo-950 text-indigo-400 hover:bg-indigo-900 font-medium flex items-center gap-1">
                           Relancer
                        </button>
                        {/* DELETE BUTTON */}
                        <button onClick={() => deleteShop(shop)} disabled={saving === shop.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-red-950 text-red-500 hover:bg-red-900 font-medium flex items-center gap-1 disabled:opacity-40"
                          title="Supprimer definitivement cette boutique">
                          
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* -- COSTS TAB -- */}
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
                + Ajouter evenement
              </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1"> Cout total</p>
                <p className="text-xl font-bold text-red-400">{fmtUSD(totalCostUSD)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{fmtXAF(totalCostUSD)}</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1"> Revenus</p>
                <p className="text-xl font-bold text-emerald-400">{fmtRevXAF(totalRevXAF)}</p>
                <p className="text-xs text-gray-500 mt-0.5">{filteredEvents.filter(e => e.type === 'subscription').length} souscriptions</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1"> Benefice net</p>
                <p className={`text-xl font-bold ${profitXAF >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profitXAF >= 0 ? '+' : ''}{profitXAF.toLocaleString('fr-FR')} F
                </p>
                <p className="text-xs text-gray-500 mt-0.5">Revenus - Couts</p>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
                <p className="text-xs text-gray-500 mb-1"> Evenements</p>
                <p className="text-xl font-bold text-indigo-400">{filteredEvents.length}</p>
                <p className="text-xs text-gray-500 mt-0.5">Appels & transactions</p>
              </div>
            </div>

            {/* Cost breakdown by type */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Repartition par service</h3>
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
              <h3 className="font-bold text-white mb-4 text-sm uppercase tracking-wide">Couts par boutique</h3>
              <div className="space-y-2">
                {(() => {
                  const shopCosts: Record<string, { name: string; cost: number; calls: number }> = {};
                  filteredEvents.filter(e => e.type !== 'subscription').forEach(e => {
                    if (!shopCosts[e.shopId]) shopCosts[e.shopId] = { name: e.shopName || e.shopId, cost: 0, calls: 0 };
                    shopCosts[e.shopId].cost += computeCost(e);
                    shopCosts[e.shopId].calls++;
                  });
                  const sorted = Object.entries(shopCosts).sort((a, b) => b[1].cost - a[1].cost);
                  if (sorted.length === 0) return <p className="text-gray-500 text-sm text-center py-4">Aucune donnee</p>;
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
                <h3 className="font-bold text-white text-sm uppercase tracking-wide">Journal des evenements</h3>
                <span className="text-xs text-gray-500">{filteredEvents.length} entrees</span>
              </div>
              <div className="divide-y divide-gray-800 max-h-96 overflow-y-auto">
                {costsLoading ? (
                  <div className="p-8 text-center text-gray-500 animate-pulse">Chargement...</div>
                ) : filteredEvents.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun evenement enregistre</p>
                    <p className="text-xs mt-1">Les couts API et souscriptions apparaitront ici</p>
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
                            <p className="text-sm font-medium text-white">{cfg.label} {e.subtype ? `. ${e.subtype}` : ''}</p>
                            <p className="text-xs text-gray-500">{e.shopName || e.shopId}</p>
                            {e.note && <p className="text-xs text-gray-600 mt-0.5 italic">{e.note}</p>}
                            {e.tokens_in && <p className="text-xs text-gray-600">{e.tokens_in.toLocaleString()} {e.tokens_out?.toLocaleString()} tokens</p>}
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

        {/* == TAB PIXEL FACEBOOK - TOUR DE CONTROLE ============================ */}
        {activeTab === 'traffic' && (() => {
          // -- Calculs ------------------------------------------------------------
          const filtered = trafficEvents.filter((e: any) => {
            const d = new Date(e.createdAt);
            if (trafficPeriod === 'today') { const t = new Date(); t.setHours(0,0,0,0); return d >= t; }
            if (trafficPeriod === 'week')  { const w = new Date(); w.setDate(w.getDate()-7); return d >= w; }
            if (trafficPeriod === 'month') { const m = new Date(); m.setDate(1); m.setHours(0,0,0,0); return d >= m; }
            return true;
          });

          // Separer events Pixel vs anciens events
          const pixelEvents   = filtered.filter((e: any) => e.source === 'pixel');
          const fbEvents      = filtered.filter((e: any) => e.fbclid || e.utmSource === 'facebook');

          // KPIs Pixel
          const pageViews     = filtered.filter((e: any) => e.event === 'PageView').length;
          const scrollReads   = filtered.filter((e: any) => e.event === 'ViewContent').length;
          const cartAbandons  = filtered.filter((e: any) => e.event === 'AddToCart' && !e.converted).length;
          const leads         = filtered.filter((e: any) => e.event === 'Lead' || e.event === 'CompleteRegistration').length;
          const purchases     = filtered.filter((e: any) => e.event === 'Purchase').length;
          const fbVisitors    = new Set(fbEvents.map((e: any) => e.sessionId)).size;

          // Funnel
          const funnelSteps = [
            { label: 'PageView - Arrivee sur le site',          count: pageViews,   color: '#6366f1', icon: '' },
            { label: 'ViewContent - A lu la page (scroll 60%)', count: scrollReads, color: '#3b82f6', icon: '' },
            { label: 'AddToCart - A clique S'inscrire',        count: leads,       color: '#f59e0b', icon: '' },
            { label: 'Purchase - A finalise l'inscription',    count: purchases,   color: '#10b981', icon: '' },
          ];
          const funnelMax = Math.max(pageViews, 1);

          // Drop-offs
          const dropViewToRead  = pageViews > 0   ? (((pageViews - scrollReads) / pageViews) * 100).toFixed(0) : '0';
          const dropReadToCart  = scrollReads > 0 ? (((scrollReads - leads) / scrollReads) * 100).toFixed(0)   : '0';
          const dropCartToBuy   = leads > 0       ? (((leads - purchases) / leads) * 100).toFixed(0)           : '0';

          // Campagnes Facebook
          const campaignMap: Record<string, { clicks: number; leads: number; purchases: number }> = {};
          filtered.filter((e: any) => e.utmCampaign).forEach((e: any) => {
            const c = e.utmCampaign;
            if (!campaignMap[c]) campaignMap[c] = { clicks: 0, leads: 0, purchases: 0 };
            if (e.event === 'PageView')              campaignMap[c].clicks++;
            if (e.event === 'Lead' || e.event === 'CompleteRegistration') campaignMap[c].leads++;
            if (e.event === 'Purchase')              campaignMap[c].purchases++;
          });

          // 14-day chart  
          const dayData: Record<string, { views: number; leads: number }> = {};
          for (let i = 13; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate()-i);
            dayData[d.toISOString().slice(0,10)] = { views: 0, leads: 0 };
          }
          filtered.forEach((e: any) => {
            const k = new Date(e.createdAt).toISOString().slice(0,10);
            if (dayData[k]) {
              if (e.event === 'PageView') dayData[k].views++;
              if (e.event === 'Lead' || e.event === 'CompleteRegistration') dayData[k].leads++;
            }
          });
          const maxDay = Math.max(...Object.values(dayData).map(d => d.views), 1);

          return (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <h2 className="text-white font-extrabold text-lg flex items-center gap-2">
                     Tour de controle - Meta Pixel
                  </h2>
                  <p className="text-gray-500 text-xs mt-0.5">Pixel ID : <span className="text-indigo-400 font-mono">1805294393481637</span></p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
                    {[{id:'today',label:'Auj.'},{id:'week',label:'7j'},{id:'month',label:'Mois'},{id:'all',label:'Tout'}].map(p => (
                      <button key={p.id} onClick={() => setTrafficPeriod(p.id as any)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium ${trafficPeriod===p.id?'bg-indigo-600 text-white':'text-gray-400 hover:text-white'}`}>
                        {p.label}
                      </button>
                    ))}
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
                    liveStatus === 'live' ? 'bg-emerald-950 border-emerald-800 text-emerald-400' : 'bg-gray-900 border-gray-800 text-gray-500'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${liveStatus === 'live' ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                    {liveStatus === 'live' ? 'Live' : 'Connexion...'}
                  </div>
                </div>
              </div>

              {/* -- KPI CARDS -- */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'PageViews', val: pageViews,    icon: '',  color: 'text-indigo-400', bg: 'border-indigo-900', sub: 'Arrivees sur le site' },
                  { label: 'Lectures',  val: scrollReads,  icon: '',  color: 'text-blue-400',   bg: 'border-blue-900',   sub: 'Ont scrolle 60%+' },
                  { label: 'Inscriptions', val: leads,     icon: '',  color: 'text-amber-400',  bg: 'border-amber-900',  sub: 'Ont clique S'inscrire' },
                  { label: 'Conversions', val: purchases,  icon: '',  color: 'text-emerald-400',bg: 'border-emerald-900', sub: 'Compte cree' },
                ].map((k, i) => (
                  <div key={i} className={`bg-gray-900 rounded-2xl p-4 border ${k.bg}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-lg">{k.icon}</span>
                      {i > 0 && funnelSteps[i-1].count > 0 && (
                        <span className="text-[10px] text-red-400 font-bold bg-red-900/30 px-1.5 py-0.5 rounded">
                          -{Math.round(((funnelSteps[i-1].count - funnelSteps[i].count) / funnelSteps[i-1].count) * 100)}%
                        </span>
                      )}
                    </div>
                    <p className={`text-2xl font-extrabold ${k.color}`}>{k.val}</p>
                    <p className="text-xs text-white font-semibold mt-0.5">{k.label}</p>
                    <p className="text-[10px] text-gray-500">{k.sub}</p>
                  </div>
                ))}
              </div>

              {/* -- FUNNEL VISUEL -- */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-1 flex items-center gap-2">
                   Entonnoir de conversion Facebook
                </h3>
                <p className="text-gray-500 text-xs mb-5">Ou perdez-vous vos visiteurs Facebook ?</p>
                <div className="space-y-3">
                  {funnelSteps.map((step, i) => {
                    const pct = Math.round((step.count / funnelMax) * 100);
                    const dropPct = i > 0 && funnelSteps[i-1].count > 0
                      ? Math.round(((funnelSteps[i-1].count - step.count) / funnelSteps[i-1].count) * 100)
                      : 0;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <div className="flex items-center gap-2">
                            <span>{step.icon}</span>
                            <span className="text-gray-300 font-semibold">{step.label}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            {dropPct > 0 && (
                              <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                                dropPct > 70 ? 'text-red-400 bg-red-900/40' :
                                dropPct > 40 ? 'text-amber-400 bg-amber-900/40' :
                                'text-green-400 bg-green-900/40'
                              }`}> -{dropPct}%</span>
                            )}
                            <span className="text-white font-extrabold tabular-nums w-10 text-right">{step.count}</span>
                          </div>
                        </div>
                        <div className="h-7 bg-gray-800 rounded-lg overflow-hidden relative">
                          <div className="h-full rounded-lg transition-all duration-700 flex items-center pl-3"
                            style={{ width: `${Math.max(pct, 2)}%`, backgroundColor: step.color }}>
                            {pct > 10 && <span className="text-white text-[10px] font-bold">{pct}%</span>}
                          </div>
                        </div>
                        {i < funnelSteps.length - 1 && dropPct > 60 && (
                          <div className="flex items-center gap-2 mt-1.5 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-1.5">
                            <span className="text-red-400 text-[10px] font-bold"> Point de friction :</span>
                            <span className="text-red-300 text-[10px]">
                              {i === 0 && 'Votre landing page ne retient pas - ameliorez le titre et le visuel hero'}
                              {i === 1 && 'Votre CTA S'inscrire n'est pas assez visible - grossissez le bouton vert'}
                              {i === 2 && 'Le formulaire fait peur - simplifiez-le (juste email + mot de passe)'}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* -- ABANDONS DETAILLES -- */}
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: 'Abandon lecture', icon: '', pct: dropViewToRead, desc: 'Ont quitte sans lire la page', tip: 'Chargement trop lent ou titre pas accrocheur', color: 'red' },
                  { title: 'Abandon inscription', icon: '', pct: dropReadToCart, desc: 'Ont lu mais pas clique S'inscrire', tip: 'CTA pas assez visible ou offre peu claire', color: 'amber' },
                  { title: 'Abandon formulaire', icon: '', pct: dropCartToBuy, desc: 'Ont clique mais pas cree de compte', tip: 'Formulaire trop long ou erreur technique', color: 'orange' },
                ].map((a, i) => {
                  const p = parseInt(a.pct as string);
                  const severity = p > 70 ? 'critique' : p > 40 ? 'attention' : 'ok';
                  const severityColor = p > 70 ? 'text-red-400 bg-red-900/30 border-red-800' : p > 40 ? 'text-amber-400 bg-amber-900/30 border-amber-800' : 'text-green-400 bg-green-900/30 border-green-800';
                  return (
                    <div key={i} className={`rounded-2xl p-4 border ${severityColor}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-gray-400">{a.icon}</span>
                        <span className={`text-2xl font-extrabold`}>{a.pct}%</span>
                      </div>
                      <p className="font-bold text-white text-sm mb-1">{a.title}</p>
                      <p className="text-[11px] text-gray-400 mb-2">{a.desc}</p>
                      {p > 40 && (
                        <div className="bg-black/30 rounded-lg p-2">
                          <p className="text-[10px] text-yellow-300"> {a.tip}</p>
                        </div>
                      )}
                      <div className="mt-2 flex items-center gap-1.5">
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${
                          severity === 'critique' ? 'bg-red-900 text-red-300' :
                          severity === 'attention' ? 'bg-amber-900 text-amber-300' :
                          'bg-green-900 text-green-300'
                        }`}>{severity}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* -- VISITEURS FACEBOOK -- */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-white flex items-center gap-2">
                    <span className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center text-white text-xs font-black">f</span>
                    Visiteurs depuis Facebook Ads
                  </h3>
                  <span className="text-blue-400 font-extrabold text-lg">{fbVisitors}</span>
                </div>
                {fbEvents.length === 0 ? (
                  <div className="bg-blue-950/40 border border-blue-900/50 rounded-xl p-4 text-center">
                    <p className="text-blue-300 text-sm font-semibold mb-1">En attente de donnees Facebook</p>
                    <p className="text-blue-400/70 text-xs">Les visiteurs venant de tes pubs apparaitront ici automatiquement des que le Pixel sera actif</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {fbEvents.slice(0, 10).map((e: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-800 last:border-0">
                        <div className="w-7 h-7 bg-blue-900 rounded-full flex items-center justify-center text-xs">f</div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-xs font-semibold truncate">
                            {e.event || 'PageView'} - {e.utmCampaign || 'Pub Facebook'}
                          </p>
                          <p className="text-gray-500 text-[10px]">
                            fbclid: {e.fbclid ? e.fbclid.slice(0,16)+'...' : 'n/a'} . {new Date(e.createdAt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          e.event === 'Purchase' ? 'bg-green-900 text-green-400' :
                          e.event === 'Lead'     ? 'bg-amber-900 text-amber-400' :
                          'bg-gray-800 text-gray-400'
                        }`}>{e.event || 'View'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* -- GRAPHIQUE 14 JOURS -- */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white text-sm mb-1"> Evolution - 14 derniers jours</h3>
                <p className="text-xs text-gray-500 mb-4">PageViews (barres) et inscriptions (points verts)</p>
                <div className="flex items-end gap-1" style={{ height: '100px' }}>
                  {Object.entries(dayData).map(([date, d]) => {
                    const barH = Math.round((d.views / maxDay) * 88);
                    return (
                      <div key={date} className="flex-1 flex flex-col items-center justify-end group relative" style={{ height: '100px' }}>
                        <div className="w-full rounded-t-sm transition-all duration-300 relative"
                          style={{ height: barH > 0 ? `${barH}px` : '2px', backgroundColor: barH > 0 ? '#6366f1' : '#1f2937' }}>
                          {d.leads > 0 && <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-400 rounded-full" />}
                        </div>
                        <span className="text-[7px] text-gray-600 mt-1">{date.slice(8)}</span>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block z-20 pointer-events-none">
                          <div className="bg-gray-800 border border-gray-600 rounded-lg px-2 py-1.5 text-[10px] text-white whitespace-nowrap shadow-xl">
                            <p className="font-bold text-gray-300">{date.slice(5)}</p>
                            <p className="text-indigo-400"> {d.views} vues</p>
                            {d.leads > 0 && <p className="text-emerald-400"> {d.leads} inscriptions</p>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* -- CAMPAGNES PUB -- */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
                <h3 className="font-bold text-white mb-4"> Performance des campagnes publicitaires</h3>
                {Object.keys(campaignMap).length === 0 ? (
                  <div className="bg-gray-800 rounded-xl p-4 text-center">
                    <p className="text-gray-400 text-sm mb-2">Aucune campagne detectee pour cette periode</p>
                    <p className="text-gray-600 text-xs">Assure-toi que tes pubs Facebook pointent vers mastershoppro.com avec le Pixel actif</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-gray-800 text-gray-500">
                          {['Campagne','Clics','Inscriptions','Conversions','Taux'].map(h => (
                            <th key={h} className="text-left px-3 py-2 font-semibold">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(campaignMap).sort((a,b)=>b[1].clicks-a[1].clicks).map(([name, data], i) => {
                          const rate = data.clicks > 0 ? ((data.purchases / data.clicks)*100).toFixed(1) : '0.0';
                          return (
                            <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                              <td className="px-3 py-2.5 text-amber-300 font-semibold">{name}</td>
                              <td className="px-3 py-2.5 text-indigo-400 font-bold">{data.clicks}</td>
                              <td className="px-3 py-2.5 text-amber-400 font-bold">{data.leads}</td>
                              <td className="px-3 py-2.5 text-emerald-400 font-bold">{data.purchases}</td>
                              <td className="px-3 py-2.5">
                                <span className={`font-extrabold px-2 py-0.5 rounded ${parseFloat(rate)>5?'bg-green-900 text-green-400':parseFloat(rate)>1?'bg-amber-900 text-amber-400':'bg-red-900 text-red-400'}`}>
                                  {rate}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* -- TEST EVENTS GUIDE -- */}
              <div className="bg-gray-900 border border-amber-800/50 rounded-2xl p-5">
                <h3 className="font-bold text-amber-400 mb-3 flex items-center gap-2">
                   Comment tester que le Pixel fonctionne
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">1</span>
                    <div>
                      <p className="text-white font-semibold">Installe l'extension "Meta Pixel Helper" sur Chrome</p>
                      <p className="text-gray-400 text-xs">Quand tu ouvres mastershoppro.com, l'icone devient verte = Pixel actif </p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">2</span>
                    <div>
                      <p className="text-white font-semibold">Va dans Events Manager  Test Events</p>
                      <p className="text-gray-400 text-xs">business.facebook.com  Gestionnaire d'evenements  Ton Pixel  Tester les evenements</p>
                      <div className="mt-2 bg-gray-800 rounded-lg p-2 font-mono text-xs text-indigo-300 overflow-x-auto">
                        https://business.facebook.com/events_manager2/list/pixel/1805294393481637/test_events
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <span className="w-6 h-6 bg-blue-600 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold">3</span>
                    <div>
                      <p className="text-white font-semibold">Ouvre mastershoppro.com  les events s'affichent en direct</p>
                      <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                        {[
                          { e: 'PageView',              desc: 'Arrivee sur la page' },
                          { e: 'ViewContent',           desc: 'A scrolle 60%+' },
                          { e: 'Lead',                  desc: 'Clique sur S'inscrire' },
                          { e: 'CompleteRegistration',  desc: 'Compte cree' },
                          { e: 'CustomEvent: CartAbandon', desc: 'Parti du formulaire' },
                          { e: 'CustomEvent: FbAdClick',   desc: 'Venu d'une pub Facebook' },
                        ].map((ev, i) => (
                          <div key={i} className="bg-gray-800 rounded-lg px-2.5 py-1.5">
                            <p className="text-blue-300 text-[10px] font-mono">{ev.e}</p>
                            <p className="text-gray-400 text-[10px]">{ev.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

            {/* == TAB DEMO ========================================================== */}
      {activeTab === 'demo' && (() => {
        // Sessions uniques (par sessionId)
        const sessions = [...new Set(demoEvents.map((e: any) => e.sessionId))];
        const totalSessions = sessions.length;

        // Filtres periode
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

        const today    = demoEvents.filter((e: any) => e.dateStr === todayStr);
        const thisWeek = demoEvents.filter((e: any) => new Date(e.createdAt) >= weekAgo);

        const sessionsToday = new Set(today.map((e: any) => e.sessionId)).size;
        const sessionsWeek  = new Set(thisWeek.map((e: any) => e.sessionId)).size;

        // Conversions (click_signup)
        const signups = demoEvents.filter((e: any) => e.action === 'click_signup');
        const signupsToday = signups.filter((e: any) => e.dateStr === todayStr).length;
        const convRate = totalSessions > 0 ? ((signups.length / totalSessions) * 100).toFixed(1) : '0';

        // Tab popularity
        const tabCounts: Record<string, number> = { dashboard: 0, commandes: 0, produits: 0 };
        demoEvents.forEach((e: any) => {
          if (e.action === 'tab_dashboard') tabCounts.dashboard++;
          if (e.action === 'tab_commandes') tabCounts.commandes++;
          if (e.action === 'tab_produits')  tabCounts.produits++;
        });

        // Device split
        const mobile  = demoEvents.filter((e: any) => e.device === 'mobile' && e.action === 'open').length;
        const desktop = demoEvents.filter((e: any) => e.device === 'desktop' && e.action === 'open').length;
        const mobileRate = totalSessions > 0 ? Math.round((mobile / (mobile + desktop || 1)) * 100) : 0;

        // Sessions groupees (1 ligne par session)
        const sessionMap: Record<string, any> = {};
        demoEvents.forEach((e: any) => {
          if (!sessionMap[e.sessionId]) {
            sessionMap[e.sessionId] = {
              sessionId: e.sessionId,
              device: e.device,
              referrer: e.referrer,
              firstSeen: e.createdAt,
              lastSeen: e.createdAt,
              tabs: [],
              converted: false,
            };
          }
          const s = sessionMap[e.sessionId];
          if (new Date(e.createdAt) < new Date(s.firstSeen)) s.firstSeen = e.createdAt;
          if (new Date(e.createdAt) > new Date(s.lastSeen))  s.lastSeen  = e.createdAt;
          if (e.action.startsWith('tab_')) s.tabs.push(e.action.replace('tab_', ''));
          if (e.action === 'click_signup') s.converted = true;
        });
        const sessionList = Object.values(sessionMap)
          .sort((a: any, b: any) => new Date(b.firstSeen).getTime() - new Date(a.firstSeen).getTime());

        return (
          <div className="space-y-6">
            {/* KPI cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Sessions total', val: totalSessions, sub: `${sessionsToday} aujourd'hui`, color: 'text-indigo-400', bg: 'bg-indigo-900/30 border-indigo-800/50' },
                { label: 'Cette semaine', val: sessionsWeek, sub: `${sessionsToday} aujourd'hui`, color: 'text-cyan-400', bg: 'bg-cyan-900/30 border-cyan-800/50' },
                { label: 'Clics "Creer compte"', val: signups.length, sub: `${signupsToday} aujourd'hui`, color: 'text-green-400', bg: 'bg-green-900/30 border-green-800/50' },
                { label: 'Taux de conversion', val: `${convRate}%`, sub: 'demo  inscription', color: 'text-amber-400', bg: 'bg-amber-900/30 border-amber-800/50' },
              ].map((s, i) => (
                <div key={i} className={`rounded-2xl border p-4 ${s.bg}`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                  <p className="text-gray-300 text-xs font-semibold mt-1">{s.label}</p>
                  <p className="text-gray-500 text-[11px] mt-0.5">{s.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Tab popularity */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <p className="text-white font-bold mb-4">Onglets explores</p>
                {[
                  { label: ' Tableau de bord', count: tabCounts.dashboard },
                  { label: ' Commandes', count: tabCounts.commandes },
                  { label: ' Produits', count: tabCounts.produits },
                ].map((t, i) => {
                  const maxVal = Math.max(...Object.values(tabCounts), 1);
                  const pct = Math.round((t.count / maxVal) * 100);
                  return (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{t.label}</span>
                        <span className="text-white font-semibold">{t.count} clics</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Device + referrer */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <p className="text-white font-bold mb-4">Profil des visiteurs</p>

                {/* Mobile vs Desktop */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span> Mobile</span><span className="text-white font-semibold">{mobileRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${mobileRate}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2 mb-1">
                    <span> Desktop</span><span className="text-white font-semibold">{100 - mobileRate}%</span>
                  </div>
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${100 - mobileRate}%` }} />
                  </div>
                </div>

                {/* Top referrers */}
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2 mt-4">Provenance</p>
                {(() => {
                  const refs: Record<string, number> = {};
                  demoEvents.filter((e: any) => e.action === 'open').forEach((e: any) => {
                    const r = e.referrer?.includes('facebook') ? ' Facebook'
                            : e.referrer?.includes('instagram') ? ' Instagram'
                            : e.referrer?.includes('whatsapp') ? ' WhatsApp'
                            : e.referrer === 'direct' ? ' Direct'
                            : ' Autre';
                    refs[r] = (refs[r] || 0) + 1;
                  });
                  return Object.entries(refs)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 4)
                    .map(([r, c], i) => (
                      <div key={i} className="flex justify-between text-xs text-gray-400 py-1 border-b border-gray-800 last:border-0">
                        <span>{r}</span>
                        <span className="text-white font-semibold">{c} sessions</span>
                      </div>
                    ));
                })()}
              </div>
            </div>

            {/* Sessions log */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <p className="text-white font-bold">Log des sessions ({sessionList.length})</p>
                <span className="text-xs text-gray-500">Temps reel . plus recent en premier</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800">
                      {['Date/heure', 'Appareil', 'Onglets visites', 'Provenance', 'Inscrit ?'].map(h => (
                        <th key={h} className="text-left text-gray-500 font-semibold px-4 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessionList.length === 0 ? (
                      <tr><td colSpan={5} className="text-center text-gray-600 py-8">Aucune session demo pour l'instant</td></tr>
                    ) : sessionList.slice(0, 50).map((s: any, i: number) => (
                      <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${s.converted ? 'bg-green-900/10' : ''}`}>
                        <td className="px-4 py-2.5 text-gray-400 whitespace-nowrap">
                          {new Date(s.firstSeen).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                          {' '}
                          <span className="text-gray-600">{new Date(s.firstSeen).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`font-semibold ${s.device === 'mobile' ? 'text-cyan-400' : 'text-blue-400'}`}>
                            {s.device === 'mobile' ? ' Mobile' : ' Desktop'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-1 flex-wrap">
                            {[...new Set(s.tabs)].map((t: any, j: number) => (
                              <span key={j} className="bg-gray-700 text-gray-300 px-2 py-0.5 rounded text-[10px]">{t}</span>
                            ))}
                            {s.tabs.length === 0 && <span className="text-gray-600">accueil seulement</span>}
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-gray-500">
                          {s.referrer?.includes('facebook') ? ' Facebook'
                          : s.referrer?.includes('instagram') ? ' Instagram'
                          : s.referrer?.includes('whatsapp') ? ' WhatsApp'
                          : s.referrer === 'direct' ? ' Direct'
                          : ' Autre'}
                        </td>
                        <td className="px-4 py-2.5">
                          {s.converted
                            ? <span className="bg-green-900 text-green-400 font-bold px-2.5 py-1 rounded-full"> Oui</span>
                            : <span className="text-gray-600">-</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* == TAB LOGS API ====================================================== */}
      {activeTab === 'logs' && (() => {
        const success  = apiLogs.filter((l: any) => l.status === 'success' || l.status === 'success_fallback');
        const failed   = apiLogs.filter((l: any) => l.status === 'all_failed' || l.status === 'fatal_error');
        const fallback = apiLogs.filter((l: any) => l.status === 'success_fallback');
        const avgDur   = success.length ? Math.round(success.reduce((s: number, l: any) => s + (l.durationMs || 0), 0) / success.length) : 0;

        const providerCount: Record<string, number> = {};
        apiLogs.forEach((l: any) => { if (l.provider) providerCount[l.provider] = (providerCount[l.provider] || 0) + 1; });

        return (
          <div className="space-y-5">
            {/* KPI */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total appels IA', val: apiLogs.length, color: 'text-indigo-400', bg: 'bg-indigo-900/30 border-indigo-800' },
                { label: 'Succes', val: success.length, color: 'text-green-400', bg: 'bg-green-900/30 border-green-800' },
                { label: ' Echecs complets', val: failed.length, color: 'text-red-400', bg: `bg-red-900/30 border-red-800` },
                { label: 'Duree moyenne', val: `${avgDur}ms`, color: 'text-cyan-400', bg: 'bg-cyan-900/30 border-cyan-800' },
              ].map((s, i) => (
                <div key={i} className={`rounded-2xl border p-4 ${s.bg}`}>
                  <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                  <p className="text-gray-400 text-xs font-semibold mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Provider breakdown */}
            <div className="grid md:grid-cols-2 gap-5">
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <p className="text-white font-bold mb-4">Repartition par IA</p>
                {Object.entries(providerCount).sort((a,b) => b[1]-a[1]).map(([p, c], i) => {
                  const pct = apiLogs.length ? Math.round((c / apiLogs.length) * 100) : 0;
                  const color = p.includes('gemini') ? 'bg-blue-500' : p.includes('openai') ? 'bg-green-500' : 'bg-red-500';
                  return (
                    <div key={i} className="mb-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span className="font-mono">{p}</span>
                        <span className="text-white font-bold">{c} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {fallback.length > 0 && (
                  <div className="mt-4 bg-amber-900/30 border border-amber-800 rounded-xl p-3 text-xs text-amber-300">
                     <strong>{fallback.length} fois</strong> Gemini a echoue  OpenAI a pris le relais.
                    Verifiez votre quota Gemini sur aistudio.google.com
                  </div>
                )}
              </div>

              {/* Erreurs frequentes */}
              <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5">
                <p className="text-white font-bold mb-4">Erreurs les plus frequentes</p>
                {(() => {
                  const errCount: Record<string, number> = {};
                  failed.forEach((l: any) => {
                    const key = (l.error || 'Unknown').slice(0, 80);
                    errCount[key] = (errCount[key] || 0) + 1;
                  });
                  const sorted = Object.entries(errCount).sort((a,b) => b[1]-a[1]).slice(0,5);
                  if (sorted.length === 0) return <p className="text-green-400 text-sm"> Aucune erreur recente</p>;
                  return sorted.map(([err, count], i) => (
                    <div key={i} className="border-b border-gray-800 py-2 last:border-0">
                      <div className="flex justify-between">
                        <span className="text-red-400 text-xs font-mono leading-relaxed flex-1 mr-2">{err}</span>
                        <span className="text-white text-xs font-bold flex-shrink-0">{count}</span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Log detaille */}
            <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
              <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <p className="text-white font-bold">Log detaille (200 derniers)</p>
                <span className="text-xs text-gray-500">Temps reel . nouveau en haut</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-500 font-semibold">
                      {['Heure','Statut','Provider','Duree','Image','Produit trouve','Erreur'].map(h => (
                        <th key={h} className="text-left px-3 py-2.5">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {apiLogs.length === 0 && (
                      <tr><td colSpan={7} className="text-center text-gray-600 py-8">
                        Les logs apparaitront ici des qu'un utilisateur analyse une photo
                      </td></tr>
                    )}
                    {apiLogs.map((l: any, i: number) => {
                      const isOk  = l.status === 'success' || l.status === 'success_fallback';
                      const isFallback = l.status === 'success_fallback';
                      const isFail = l.status === 'all_failed' || l.status === 'fatal_error';
                      return (
                        <tr key={i} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${isFail ? 'bg-red-900/10' : isFallback ? 'bg-amber-900/10' : ''}`}>
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                            {new Date(l.createdAt).toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit', second:'2-digit' })}
                          </td>
                          <td className="px-3 py-2">
                            {isOk && !isFallback && <span className="bg-green-900 text-green-400 font-bold px-2 py-0.5 rounded text-[10px]"> OK</span>}
                            {isFallback && <span className="bg-amber-900 text-amber-400 font-bold px-2 py-0.5 rounded text-[10px]"> Fallback</span>}
                            {isFail && <span className="bg-red-900 text-red-400 font-bold px-2 py-0.5 rounded text-[10px]"> ECHEC</span>}
                            {!isOk && !isFail && <span className="text-gray-600 text-[10px]">{l.status}</span>}
                          </td>
                          <td className="px-3 py-2 font-mono text-indigo-400 text-[10px]">{l.provider || '-'}</td>
                          <td className="px-3 py-2 text-gray-400">
                            <span className={l.durationMs > 5000 ? 'text-red-400 font-bold' : l.durationMs > 2000 ? 'text-amber-400' : 'text-green-400'}>
                              {l.durationMs ? `${l.durationMs}ms` : '-'}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-gray-400">{l.imageKb ? `${l.imageKb}KB` : '-'}</td>
                          <td className="px-3 py-2 text-white font-semibold max-w-[140px] truncate">{l.productName || '-'}</td>
                          <td className="px-3 py-2 text-red-400 text-[10px] max-w-[200px] truncate">{l.error || ''}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })()}

      {/* == RELANCE MODAL ====================================================== */}
      {relanceShop && (() => {
        const shopUrl = `https://mastershoppro.com/${relanceShop.slug}`;
        const adminUrl = `https://mastershoppro.com/admin/dashboard`;

        const waGuide = `Bonjour ! 

Je suis votre support ShopMaster. Je voulais m'assurer que tout se passe bien pour la boutique *${relanceShop.name}* 

Voici un guide rapide pour bien demarrer :

* 1. Ajouter vos produits*
 Menu Admin  Produits  "+ Nouveau produit"
 Astuce : utilisez la camera  pour que l'IA remplisse tout automatiquement !
 Ajoutez le prix d'achat ET le prix de vente pour voir vos benefices

* 2. Creer une commande*
 Menu Admin  Commandes  "+ Commande manuelle"
 Cherchez le client ou creez-en un nouveau
 Scannez ou selectionnez les produits  Confirmer

* 3. Votre boutique en ligne*
 Partagez ce lien avec vos clients : ${shopUrl}
 Ils peuvent commander directement depuis leur telephone !

* 4. Imprimer un recu*
 Apres chaque commande  bouton "Imprimer"
 Compatible imprimantes Bluetooth thermiques

* 5. Voir vos statistiques*
 Tableau de bord  chiffres du jour, semaine, mois
 Benefice net calcule automatiquement

Besoin d'aide ? Repondez directement a ce message 
Support disponible 7j/7 sur WhatsApp.`;

        const emailSubject = 'Guide de demarrage - Boutique ' + relanceShop.name + ' sur ShopMaster';
        const emailLines = [
          'Bonjour,',
          '',
          'J espere que vous allez bien ! Voici un guide rapide pour configurer votre boutique ' + relanceShop.name + ' sur ShopMaster.',
          '',
          '--------------------------------------------------',
          'ETAPE 1 - Ajouter vos produits',
          '--------------------------------------------------',
          '1. Connectez-vous sur ' + adminUrl,
          '2. Allez dans Produits puis cliquez + Nouveau produit',
          '3. Astuce IA : cliquez icone camera, photographiez le produit - l IA remplit nom, description, prix automatiquement !',
          '4. Renseignez le prix d achat ET le prix de vente pour voir vos benefices.',
          '',
          '--------------------------------------------------',
          'ETAPE 2 - Creer une commande',
          '--------------------------------------------------',
          '1. Allez dans Commandes puis + Commande manuelle',
          '2. Entrez le nom et numero du client',
          '3. Selectionnez les produits ou scannez leur code-barres',
          '4. Choisissez Especes ou Mobile Money',
          '5. Validez - la commande passe automatiquement en preparation',
          '',
          '--------------------------------------------------',
          'ETAPE 3 - Partager votre boutique en ligne',
          '--------------------------------------------------',
          'Votre lien boutique : ' + shopUrl,
          '- Partagez sur WhatsApp, Facebook, Instagram',
          '- Vos clients commandent depuis leur telephone',
          '- Vous recevez une notification a chaque commande',
          '',
          '--------------------------------------------------',
          'ETAPE 4 - Imprimer des recus',
          '--------------------------------------------------',
          '- Apres chaque vente cliquez Imprimer le recu',
          '- Compatible imprimantes thermiques Bluetooth',
          '- Vous pouvez aussi envoyer par WhatsApp',
          '',
          '--------------------------------------------------',
          'ETAPE 5 - Suivre vos ventes',
          '--------------------------------------------------',
          '- Tableau de bord : ventes du jour, semaine, mois',
          '- Benefice net calcule automatiquement',
          '- Top produits, historique complet',
          '',
          '--------------------------------------------------',
          '',
          'Une question ? Repondez a cet email ou contactez-nous sur WhatsApp.',
          'Nous sommes disponibles 7j/7 !',
          '',
          'L equipe ShopMaster',
          'WhatsApp : +393299639430',
          'Site : https://mastershoppro.com',
        ];
        const emailBody = emailLines.join('%0D%0A');
        const emailLink = relanceShop.ownerEmail
          ? 'mailto:' + relanceShop.ownerEmail + '?subject=' + encodeURIComponent(emailSubject) + '&body=' + emailBody
          : null;

        const waNumber = relanceShop.whatsapp?.replace(/[^0-9]/g, '');
        const waLink = waNumber ? `https://wa.me/${waNumber}?text=${encodeURIComponent(waGuide)}` : null;

        return (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-5 flex items-center justify-between">
                <div>
                  <p className="text-indigo-300 text-xs font-semibold uppercase tracking-wide mb-0.5">Relancer le client</p>
                  <h2 className="text-white text-lg font-bold">{relanceShop.name}</h2>
                  <p className="text-indigo-300 text-xs mt-0.5">/{relanceShop.slug} . Plan {relanceShop.planId}</p>
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
                     Guide envoye avec le message
                  </p>
                  <div className="space-y-2 text-xs text-gray-400">
                    {[
                      { icon: '', step: '1', title: 'Ajouter les produits', desc: 'Via IA camera ou manuellement, avec prix achat/vente' },
                      { icon: '', step: '2', title: 'Creer une commande', desc: 'Commande manuelle ou scan code-barres, Mobile Money / Especes' },
                      { icon: '', step: '3', title: 'Partager la boutique en ligne', desc: `Lien : mastershoppro.com/${relanceShop.slug}` },
                      { icon: '', step: '4', title: 'Imprimer les recus', desc: 'Thermique Bluetooth ou envoi WhatsApp' },
                      { icon: '', step: '5', title: 'Suivre les ventes', desc: 'Dashboard temps reel, benefices, top produits' },
                    ].map(s => (
                      <div key={s.step} className="flex items-start gap-3 py-2 border-b border-gray-700/50 last:border-0">
                        <span className="text-base flex-shrink-0">{s.icon}</span>
                        <div>
                          <p className="text-gray-200 font-semibold text-xs">Etape {s.step} - {s.title}</p>
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
                        <p className="text-gray-400 text-[11px] mt-0.5">Message pre-rempli avec guide complet . 1 clic</p>
                      </div>
                      <div className="text-green-400 text-xs font-bold group-hover:translate-x-1 transition-transform"></div>
                    </a>
                  ) : (
                    <div className="flex items-center gap-4 bg-gray-800 border border-gray-700 rounded-2xl p-4 opacity-50">
                      <div className="w-12 h-12 bg-gray-700 rounded-xl flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-6 h-6 fill-gray-500"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
                      </div>
                      <div>
                        <p className="text-gray-400 font-bold text-sm">WhatsApp</p>
                        <p className="text-gray-600 text-xs">Numero non configure pour cette boutique</p>
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
                        <p className="text-gray-400 text-[11px] mt-0.5">Guide complet en 5 etapes . Ouvre votre client mail</p>
                      </div>
                      <div className="text-orange-400 text-xs font-bold group-hover:translate-x-1 transition-transform"></div>
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
              <h2 className="font-bold text-white">Ajouter un evenement de cout</h2>
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
                  <option value="">- Choisir une boutique -</option>
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
                  <div><label className="text-xs text-gray-400 mb-1 block">Ecritures</label><input type="number" value={newEvent.writes || ''} onChange={e => setNewEvent({ ...newEvent, writes: +e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none" /></div>
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
                <span className="text-xs text-gray-400">Cout calcule</span>
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
      {/* -- STRIPE PAYMENTS TAB -- */}
      {activeTab === 'stripe' && (
        <StripePaymentsTab shops={shops} />
      )}

    </div>
  );
}