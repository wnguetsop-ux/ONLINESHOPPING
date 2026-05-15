'use client';
import { useEffect, useState } from 'react';
import { Check, Loader2, RefreshCw, Zap, CreditCard, Smartphone, AlertTriangle, Search } from 'lucide-react';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'stockflow-b6d58';
const API_KEY    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY    || 'AIzaSyALcMJIbHJxe_nX0Ja1zoeOOXNuYv8K2pw';
const BASE       = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const PACKS = [
  { id: 'STARTER',  label: 'Pack 50 crédits',  credits: 50,  price: '1 500 FCFA' },
  { id: 'STANDARD', label: 'Pack 200 crédits', credits: 200, price: '5 000 FCFA' },
  { id: 'PRO',      label: 'Pack 500 crédits', credits: 500, price: '10 000 FCFA' },
];

type ShopItem = { id: string; name: string; slug: string; aiCredits: number; ownerEmail?: string };
type PendingItem = {
  docId: string; type: 'stripe' | 'mobile_money';
  shopId?: string; shopName?: string; shopSlug?: string;
  credits: number; pack?: string; transactionNumber?: string;
  sessionId?: string; amount?: number; currency?: string; email?: string;
  status: string; createdAt: string;
};

function parseDoc(doc: any, type: 'stripe' | 'mobile_money'): PendingItem {
  const f = doc.fields || {};
  return {
    docId:             doc.name?.split('/').pop() || '',
    type,
    shopId:            f.shopId?.stringValue,
    shopName:          f.shopName?.stringValue,
    shopSlug:          f.shopSlug?.stringValue,
    credits:           parseInt(f.credits?.integerValue || '0'),
    pack:              f.pack?.stringValue,
    transactionNumber: f.transactionNumber?.stringValue,
    sessionId:         f.sessionId?.stringValue,
    amount:            parseInt(f.amount?.integerValue || '0'),
    currency:          f.currency?.stringValue,
    email:             f.email?.stringValue,
    status:            f.status?.stringValue || 'PENDING',
    createdAt:         f.createdAt?.stringValue || '',
  };
}

async function loadShops(): Promise<ShopItem[]> {
  const res = await fetch(`${BASE}/shops?key=${API_KEY}&pageSize=100`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.documents || []).map((doc: any) => {
    const f = doc.fields || {};
    const id = doc.name?.split('/').pop() || '';
    return {
      id,
      name:       f.name?.stringValue || 'Sans nom',
      slug:       f.slug?.stringValue || '',
      aiCredits:  parseInt(f.aiCredits?.integerValue ?? f.aiCredits?.doubleValue ?? f.photoCredits?.integerValue ?? '0'),
      ownerEmail: f.email?.stringValue,
    };
  }).filter((s: ShopItem) => s.slug);
}

async function directActivate(shopId: string, credits: number, transactionRef?: string): Promise<boolean> {
  const res = await fetch('/api/admin-activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopId, credits, transactionRef }),
  });
  return res.ok;
}

async function activatePendingItem(item: PendingItem, shops: ShopItem[]): Promise<boolean> {
  let shopId = item.shopId;
  if (!shopId && item.shopSlug) {
    shopId = shops.find(s => s.slug === item.shopSlug)?.id;
  }
  if (!shopId) return false;
  const res = await fetch('/api/admin-activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shopId, credits: item.credits, transactionRef: item.sessionId || item.transactionNumber }),
  });
  if (!res.ok) return false;
  // Marquer comme activé
  const col = item.type === 'stripe' ? 'pending_credits' : 'pending_mobile_money';
  await fetch(
    `${BASE}/${col}/${item.docId}?key=${API_KEY}&updateMask.fieldPaths=status&updateMask.fieldPaths=activatedAt`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: { status: { stringValue: 'ACTIVATED' }, activatedAt: { stringValue: new Date().toISOString() } } }),
    }
  );
  return true;
}

export default function ActivationsPage() {
  const [tab, setTab]               = useState<'direct' | 'stripe' | 'mobile'>('direct');
  const [shops, setShops]           = useState<ShopItem[]>([]);
  const [items, setItems]           = useState<PendingItem[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [shopSearch, setShopSearch] = useState('');
  const [selectedShop, setSelectedShop] = useState<ShopItem | null>(null);
  const [selectedPack, setSelectedPack] = useState('STANDARD');
  const [txNumber, setTxNumber]     = useState('');
  const [directDone, setDirectDone] = useState(false);

  async function load() {
    setLoading(true);
    const [allShops, stripeDocs, mmDocs] = await Promise.all([
      loadShops(),
      fetch(`${BASE}/pending_credits?key=${API_KEY}&pageSize=50`).then(r => r.ok ? r.json() : { documents: [] }),
      fetch(`${BASE}/pending_mobile_money?key=${API_KEY}&pageSize=50`).then(r => r.ok ? r.json() : { documents: [] }),
    ]);
    setShops(allShops);
    const stripeItems = (stripeDocs.documents || []).map((d: any) => parseDoc(d, 'stripe'));
    const mmItems     = (mmDocs.documents    || []).map((d: any) => parseDoc(d, 'mobile_money'));
    setItems([...stripeItems, ...mmItems]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const pendingCount = items.filter(i => i.status === 'PENDING' || i.status === 'PENDING_MANUAL').length;
  const filteredShops = shops.filter(s =>
    shopSearch === '' ||
    s.name.toLowerCase().includes(shopSearch.toLowerCase()) ||
    s.slug.toLowerCase().includes(shopSearch.toLowerCase())
  );
  const pack = PACKS.find(p => p.id === selectedPack) || PACKS[1];

  async function handleDirectActivate() {
    if (!selectedShop) return;
    setActivating('direct');
    setDirectDone(false);
    const ref = txNumber.trim() || `ADMIN-${Date.now()}`;
    const ok = await directActivate(selectedShop.id, pack.credits, ref);
    if (ok) {
      setShops(prev => prev.map(s => s.id === selectedShop.id ? { ...s, aiCredits: s.aiCredits + pack.credits } : s));
      setSelectedShop(prev => prev ? { ...prev, aiCredits: prev.aiCredits + pack.credits } : prev);
      setTimeout(() => setDirectDone(false), 3000);
    } else {
      alert('Activation échouée — boutique introuvable ?');
    }
    setActivating(null);
  }

  async function handleActivatePending(item: PendingItem) {
    setActivating(item.docId);
    const ok = await activatePendingItem(item, shops);
    if (ok) {
      setItems(prev => prev.map(i => i.docId === item.docId ? { ...i, status: 'ACTIVATED' } : i));
      setShops(prev => prev.map(s => (s.id === item.shopId || s.slug === item.shopSlug) ? { ...s, aiCredits: s.aiCredits + item.credits } : s));
    } else {
      alert('Activation échouée — boutique introuvable.');
    }
    setActivating(null);
  }

  return (
    <div className="max-w-4xl space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Activations crédits</h1>
          <p className="text-sm text-gray-500 mt-0.5">{shops.length} boutiques · {pendingCount} en attente</p>
        </div>
        <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/> Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: 'direct', label: 'Activation directe', color: 'emerald' },
          { id: 'stripe', label: `Stripe (${items.filter(i=>i.type==='stripe'&&(i.status==='PENDING'||i.status==='PENDING_MANUAL')).length})`, color: 'violet' },
          { id: 'mobile', label: `Mobile Money (${items.filter(i=>i.type==='mobile_money'&&i.status==='PENDING').length})`, color: 'blue' },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition ${tab===t.id ? `bg-${t.color}-600 text-white` : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            style={tab===t.id ? { background: t.id==='direct' ? '#16a34a' : t.id==='stripe' ? '#7c3aed' : '#2563eb' } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-gray-300"/></div>
      ) : (
        <>
          {/* ── ACTIVATION DIRECTE ── */}
          {tab === 'direct' && (
            <div className="space-y-4">
              {/* Recherche boutique */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
                <p className="text-sm font-extrabold text-gray-800">1. Sélectionne la boutique</p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                  <input value={shopSearch} onChange={e => { setShopSearch(e.target.value); setSelectedShop(null); setDirectDone(false); }}
                    placeholder="Cherche par nom ou slug..."
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"/>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1.5 rounded-xl">
                  {filteredShops.slice(0, 20).map(s => (
                    <button key={s.id} onClick={() => { setSelectedShop(s); setShopSearch(s.name); setDirectDone(false); }}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-left text-sm transition border ${selectedShop?.id===s.id ? 'border-emerald-400 bg-emerald-50' : 'border-gray-100 bg-gray-50 hover:bg-gray-100'}`}>
                      <div>
                        <p className="font-bold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-400">{s.slug}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-xs font-extrabold" style={{ color: s.aiCredits > 0 ? '#16a34a' : '#dc2626' }}>
                          {s.aiCredits} crédits
                        </p>
                        <p className="text-[10px] text-gray-400">actuels</p>
                      </div>
                    </button>
                  ))}
                  {filteredShops.length === 0 && <p className="text-center text-sm text-gray-400 py-4">Aucune boutique trouvée</p>}
                </div>
              </div>

              {/* Pack + transaction */}
              <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-4">
                <p className="text-sm font-extrabold text-gray-800">2. Choisis le pack</p>
                <div className="grid grid-cols-3 gap-2">
                  {PACKS.map(p => (
                    <button key={p.id} onClick={() => setSelectedPack(p.id)}
                      className={`py-3 px-2 rounded-xl text-center border-2 transition text-sm ${selectedPack===p.id ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
                      <p className="font-extrabold text-gray-800">{p.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.price}</p>
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                    N° transaction <span className="text-gray-300 font-normal">(optionnel)</span>
                  </label>
                  <input value={txNumber} onChange={e => setTxNumber(e.target.value)}
                    placeholder="Ex: 123456789 — laisse vide si activation manuelle"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none"/>
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-5">
                {selectedShop ? (
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <p className="font-extrabold text-gray-900">{selectedShop.name}</p>
                      <p className="text-sm text-gray-500">
                        {selectedShop.aiCredits} crédits actuels
                        <span className="mx-1.5 text-gray-300">→</span>
                        <span className="font-bold text-emerald-700">{selectedShop.aiCredits + pack.credits} crédits après activation</span>
                      </p>
                    </div>
                    <button onClick={handleDirectActivate} disabled={activating === 'direct'}
                      className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-extrabold text-sm disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                      {activating === 'direct' ? <Loader2 className="w-4 h-4 animate-spin"/> : directDone ? <Check className="w-4 h-4"/> : <Zap className="w-4 h-4"/>}
                      {directDone ? 'Activé !' : `Ajouter ${pack.credits} crédits`}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">Sélectionne une boutique ci-dessus</p>
                )}
              </div>
            </div>
          )}

          {/* ── STRIPE PENDING ── */}
          {tab === 'stripe' && (
            <div className="space-y-3">
              {items.filter(i => i.type==='stripe').length === 0 ? (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
                  <p className="text-gray-400 font-medium">Aucun paiement Stripe en attente</p>
                </div>
              ) : items.filter(i => i.type==='stripe').map(item => {
                const isPending = item.status === 'PENDING' || item.status === 'PENDING_MANUAL';
                const shopMatch = shops.find(s => s.id === item.shopId || s.slug === item.shopSlug);
                return (
                  <div key={item.docId}
                    className={`rounded-2xl border p-4 flex items-center gap-4 ${isPending ? 'border-violet-200 bg-violet-50/30' : 'border-gray-100 bg-white opacity-60'}`}>
                    <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-violet-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-gray-900 text-sm">
                          {shopMatch?.name || item.shopName || item.email || item.shopId || 'Boutique inconnue'}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">+{item.credits} crédits</span>
                        {item.amount && item.amount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                            {item.currency === 'eur' ? `${(item.amount/100).toFixed(2)} EUR` : `${item.amount.toLocaleString()} FCFA`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.sessionId && `Session: ${item.sessionId.slice(0,20)}... · `}
                        {new Date(item.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isPending ? (
                        <button onClick={() => handleActivatePending(item)} disabled={activating === item.docId}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-extrabold disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)' }}>
                          {activating === item.docId ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
                          Activer
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold">
                          <Check className="w-3.5 h-3.5 text-emerald-500"/> Activé
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── MOBILE MONEY HISTORY ── */}
          {tab === 'mobile' && (
            <div className="space-y-3">
              {items.filter(i => i.type==='mobile_money').length === 0 ? (
                <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
                  <p className="text-gray-400 font-medium">Aucune activation Mobile Money</p>
                  <p className="text-xs text-gray-400 mt-1">Utilise l'onglet "Activation directe" pour ajouter des crédits</p>
                </div>
              ) : items.filter(i => i.type==='mobile_money').map(item => {
                const isPending = item.status === 'PENDING';
                const shopMatch = shops.find(s => s.id === item.shopId || s.slug === item.shopSlug);
                return (
                  <div key={item.docId}
                    className={`rounded-2xl border p-4 flex items-center gap-4 ${isPending ? 'border-blue-200 bg-blue-50/30' : 'border-gray-100 bg-white opacity-60'}`}>
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Smartphone className="w-5 h-5 text-blue-600"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-extrabold text-gray-900 text-sm">
                          {shopMatch?.name || item.shopName || item.shopSlug || 'Boutique'}
                        </p>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">+{item.credits} crédits</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.transactionNumber && `Tx: ${item.transactionNumber} · `}
                        {new Date(item.createdAt).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      {isPending ? (
                        <button onClick={() => handleActivatePending(item)} disabled={activating === item.docId}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-extrabold disabled:opacity-60"
                          style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)' }}>
                          {activating === item.docId ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
                          Activer
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 px-3 py-2 rounded-xl bg-gray-100 text-gray-500 text-xs font-bold">
                          <Check className="w-3.5 h-3.5 text-emerald-500"/> Activé
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
