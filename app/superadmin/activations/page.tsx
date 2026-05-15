'use client';
import { useEffect, useState } from 'react';
import { Check, X, Loader2, RefreshCw, Zap, CreditCard, Smartphone, AlertTriangle } from 'lucide-react';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const API_KEY    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const BASE       = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const PACK_CREDITS: Record<string, number> = {
  STARTER: 50, STANDARD: 200, PRO: 500,
};

type PendingItem = {
  docId: string;
  type: 'stripe' | 'mobile_money';
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  credits: number;
  pack?: string;
  transactionNumber?: string;
  sessionId?: string;
  amount?: number;
  currency?: string;
  email?: string;
  status: string;
  createdAt: string;
};

function parseDoc(doc: any, type: 'stripe' | 'mobile_money'): PendingItem {
  const f = doc.fields || {};
  const docId = doc.name?.split('/').pop() || '';
  return {
    docId,
    type,
    shopId:            f.shopId?.stringValue,
    shopName:          f.shopName?.stringValue,
    shopSlug:          f.shopSlug?.stringValue,
    credits:           parseInt(f.credits?.integerValue || f.credits?.doubleValue || '0'),
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

async function fetchPending(collection: string) {
  const res = await fetch(`${BASE}/${collection}?key=${API_KEY}&pageSize=50`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.documents || []);
}

async function activateCredits(item: PendingItem): Promise<boolean> {
  // Resolve shopId from slug if needed
  let shopId = item.shopId;
  if (!shopId && item.shopSlug) {
    const q = await fetch(`${BASE}:runQuery?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'shops' }],
          where: { fieldFilter: { field: { fieldPath: 'slug' }, op: 'EQUAL', value: { stringValue: item.shopSlug } } },
          limit: 1,
        },
      }),
    });
    const qData = await q.json();
    shopId = qData[0]?.document?.name?.split('/').pop();
  }
  if (!shopId) return false;

  // Read current credits
  const shopRes = await fetch(`${BASE}/shops/${shopId}?key=${API_KEY}`);
  if (!shopRes.ok) return false;
  const shopDoc = await shopRes.json();
  const current = parseInt(
    shopDoc.fields?.aiCredits?.integerValue ??
    shopDoc.fields?.aiCredits?.doubleValue ?? '0'
  );

  // Add credits
  const patch = await fetch(
    `${BASE}/shops/${shopId}?key=${API_KEY}&updateMask.fieldPaths=aiCredits&updateMask.fieldPaths=updatedAt`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          aiCredits: { integerValue: String(current + item.credits) },
          updatedAt: { stringValue: new Date().toISOString() },
        },
      }),
    }
  );
  if (!patch.ok) return false;

  // Mark as ACTIVATED
  const collection = item.type === 'stripe' ? 'pending_credits' : 'pending_mobile_money';
  await fetch(
    `${BASE}/${collection}/${item.docId}?key=${API_KEY}&updateMask.fieldPaths=status&updateMask.fieldPaths=activatedAt&updateMask.fieldPaths=activatedShopId`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          status:           { stringValue: 'ACTIVATED' },
          activatedAt:      { stringValue: new Date().toISOString() },
          activatedShopId:  { stringValue: shopId },
        },
      }),
    }
  );
  return true;
}

async function createMobileMoneyRequest(form: {
  shopSlug: string; pack: string; transactionNumber: string; amount: string;
}) {
  const credits = PACK_CREDITS[form.pack] || 50;
  await fetch(`${BASE}/pending_mobile_money?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        shopSlug:          { stringValue: form.shopSlug.trim() },
        pack:              { stringValue: form.pack },
        credits:           { integerValue: String(credits) },
        transactionNumber: { stringValue: form.transactionNumber.trim() },
        amount:            { integerValue: String(parseInt(form.amount) || 0) },
        currency:          { stringValue: 'XAF' },
        status:            { stringValue: 'PENDING' },
        createdAt:         { stringValue: new Date().toISOString() },
      },
    }),
  });
}

export default function ActivationsPage() {
  const [tab, setTab]                 = useState<'stripe' | 'mobile'>('stripe');
  const [items, setItems]             = useState<PendingItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [activating, setActivating]   = useState<string | null>(null);
  const [showAll, setShowAll]         = useState(false);
  const [newForm, setNewForm]         = useState({ shopSlug: '', pack: 'STANDARD', transactionNumber: '', amount: '' });
  const [creating, setCreating]       = useState(false);

  async function load() {
    setLoading(true);
    const [stripeDocs, mmDocs] = await Promise.all([
      fetchPending('pending_credits'),
      fetchPending('pending_mobile_money'),
    ]);
    const stripeItems = stripeDocs.map((d: any) => parseDoc(d, 'stripe'));
    const mmItems     = mmDocs.map((d: any)     => parseDoc(d, 'mobile_money'));
    setItems([...stripeItems, ...mmItems]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = items.filter(i =>
    i.type === (tab === 'stripe' ? 'stripe' : 'mobile_money') &&
    (showAll || i.status === 'PENDING' || i.status === 'PENDING_MANUAL')
  );
  const pendingCount = items.filter(i => i.status === 'PENDING' || i.status === 'PENDING_MANUAL').length;

  async function handleActivate(item: PendingItem) {
    setActivating(item.docId);
    const ok = await activateCredits(item);
    if (ok) {
      setItems(prev => prev.map(i => i.docId === item.docId ? { ...i, status: 'ACTIVATED' } : i));
    } else {
      alert('Activation échouée — vérifie le slug ou l\'ID de la boutique.');
    }
    setActivating(null);
  }

  async function handleCreate() {
    if (!newForm.shopSlug || !newForm.transactionNumber) return;
    setCreating(true);
    await createMobileMoneyRequest(newForm);
    setNewForm({ shopSlug: '', pack: 'STANDARD', transactionNumber: '', amount: '' });
    await load();
    setCreating(false);
  }

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Activations crédits</h1>
          <p className="text-sm text-gray-500 mt-1">Stripe auto + Mobile Money manuel</p>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-100 text-orange-700 text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5"/>
              {pendingCount} en attente
            </div>
          )}
          <button onClick={load} disabled={loading} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
            Actualiser
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('stripe')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${tab==='stripe' ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <CreditCard className="w-4 h-4"/> Stripe
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tab==='stripe' ? 'bg-white/25' : 'bg-gray-200'}`}>
            {items.filter(i => i.type==='stripe' && (i.status==='PENDING'||i.status==='PENDING_MANUAL')).length}
          </span>
        </button>
        <button onClick={() => setTab('mobile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition ${tab==='mobile' ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
          <Smartphone className="w-4 h-4"/> Mobile Money
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${tab==='mobile' ? 'bg-white/25' : 'bg-gray-200'}`}>
            {items.filter(i => i.type==='mobile_money' && i.status==='PENDING').length}
          </span>
        </button>
        <div className="flex-1"/>
        <button onClick={() => setShowAll(s => !s)} className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 text-gray-500 hover:bg-gray-200">
          {showAll ? 'Masquer activés' : 'Voir tous'}
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400"/>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-gray-50 border border-gray-100 p-8 text-center">
          <p className="text-gray-400 font-medium">Aucune demande en attente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => {
            const isPending = item.status === 'PENDING' || item.status === 'PENDING_MANUAL';
            return (
              <div key={item.docId}
                className={`rounded-2xl border p-4 flex items-center gap-4 ${isPending ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100 bg-white opacity-60'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type==='stripe' ? 'bg-violet-100' : 'bg-emerald-100'}`}>
                  {item.type === 'stripe'
                    ? <CreditCard className="w-5 h-5 text-violet-600"/>
                    : <Smartphone className="w-5 h-5 text-emerald-600"/>}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-extrabold text-gray-900 text-sm">
                      {item.shopName || item.shopSlug || item.shopId || item.email || 'Boutique inconnue'}
                    </p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700">
                      +{item.credits} crédits
                    </span>
                    {item.amount && item.amount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600">
                        {item.currency === 'eur' ? `${(item.amount / 100).toFixed(2)} EUR` : `${item.amount.toLocaleString('fr-FR')} FCFA`}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.type === 'mobile_money' && item.transactionNumber && `Transaction: ${item.transactionNumber} · `}
                    {item.pack && `Pack ${item.pack} · `}
                    {new Date(item.createdAt).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {item.shopId && <p className="text-[10px] text-gray-300 mt-0.5 font-mono">ID: {item.shopId}</p>}
                </div>

                <div className="flex-shrink-0">
                  {isPending ? (
                    <button onClick={() => handleActivate(item)} disabled={activating === item.docId}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-sm font-extrabold disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
                      {activating === item.docId
                        ? <Loader2 className="w-4 h-4 animate-spin"/>
                        : <Zap className="w-4 h-4"/>}
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

      {/* Nouvelle demande Mobile Money */}
      {tab === 'mobile' && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/30 p-5">
          <p className="text-sm font-extrabold text-gray-800 mb-4">+ Nouvelle activation Mobile Money</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Slug boutique</label>
              <input value={newForm.shopSlug} onChange={e => setNewForm(f => ({ ...f, shopSlug: e.target.value }))}
                placeholder="ma-boutique"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none bg-white"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Pack</label>
              <select value={newForm.pack} onChange={e => setNewForm(f => ({ ...f, pack: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none bg-white">
                <option value="STARTER">Pack 50 crédits — 1 500 FCFA</option>
                <option value="STANDARD">Pack 200 crédits — 5 000 FCFA</option>
                <option value="PRO">Pack 500 crédits — 10 000 FCFA</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">N° transaction</label>
              <input value={newForm.transactionNumber} onChange={e => setNewForm(f => ({ ...f, transactionNumber: e.target.value }))}
                placeholder="123456789"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none bg-white"/>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Montant reçu (FCFA)</label>
              <input type="number" value={newForm.amount} onChange={e => setNewForm(f => ({ ...f, amount: e.target.value }))}
                placeholder="5000"
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-300 focus:outline-none bg-white"/>
            </div>
          </div>
          <button onClick={handleCreate} disabled={creating || !newForm.shopSlug || !newForm.transactionNumber}
            className="mt-4 flex items-center gap-2 px-5 py-3 rounded-xl text-white text-sm font-extrabold disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin"/> : <Zap className="w-4 h-4"/>}
            Créer + Activer maintenant
          </button>
        </div>
      )}
    </div>
  );
}
