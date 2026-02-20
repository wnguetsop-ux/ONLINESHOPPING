'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PLANS } from '@/lib/types';
import { Crown, Search, Check, X, Clock, RefreshCw, Shield, Eye, EyeOff, AlertTriangle } from 'lucide-react';

// ⚠️ MOT DE PASSE DÉVELOPPEUR — changez cette valeur !
const DEV_PASSWORD = 'Bobane12$';

interface ShopRow {
  id: string;
  name: string;
  slug: string;
  ownerEmail?: string;
  planId: string;
  planExpiry?: string;
  isActive: boolean;
  ordersThisMonth: number;
  createdAt: string;
  whatsapp?: string;
}

export default function SuperAdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [shops, setShops] = useState<ShopRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === DEV_PASSWORD) {
      setAuthenticated(true);
      loadShops();
    } else {
      setPasswordError('Mot de passe incorrect.');
    }
  }

  async function loadShops() {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, 'shops'));
      const list: ShopRow[] = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data()
      } as ShopRow));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setShops(list);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function activatePlan(shopId: string, planId: string, months: number = 1) {
    setSaving(shopId);
    try {
      const expiry = new Date();
      expiry.setMonth(expiry.getMonth() + months);

      await updateDoc(doc(db, 'shops', shopId), {
        planId,
        planExpiry: expiry.toISOString(),
        updatedAt: new Date().toISOString(),
      });

      setShops(prev => prev.map(s =>
        s.id === shopId ? { ...s, planId, planExpiry: expiry.toISOString() } : s
      ));

      setSuccessMsg(`✅ Plan ${planId} activé pour ${months} mois!`);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('Erreur lors de l\'activation: ' + err);
    }
    setSaving(null);
  }

  async function toggleShopActive(shopId: string, currentActive: boolean) {
    setSaving(shopId);
    try {
      await updateDoc(doc(db, 'shops', shopId), {
        isActive: !currentActive,
        updatedAt: new Date().toISOString(),
      });
      setShops(prev => prev.map(s => s.id === shopId ? { ...s, isActive: !currentActive } : s));
    } catch (err) {
      alert('Erreur: ' + err);
    }
    setSaving(null);
  }

  const filtered = shops.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.slug?.toLowerCase().includes(search.toLowerCase()) ||
    s.whatsapp?.includes(search)
  );

  const planStats = {
    FREE: shops.filter(s => (s.planId || 'FREE') === 'FREE').length,
    STARTER: shops.filter(s => s.planId === 'STARTER').length,
    PRO: shops.filter(s => s.planId === 'PRO').length,
  };

  const isPlanExpired = (shop: ShopRow) => {
    if (!shop.planExpiry || shop.planId === 'FREE') return false;
    return new Date(shop.planExpiry) < new Date();
  };

  // ── LOGIN SCREEN ──
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }}>
        <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Super Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Accès développeur uniquement</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPasswordError(''); }}
                  className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Mot de passe développeur"
                  autoFocus
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
            </div>
            <button type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors">
              Accéder
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            URL: <code>/superadmin</code>
          </p>
        </div>
      </div>
    );
  }

  // ── MAIN PANEL ──
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white">ShopMaster — Super Admin</h1>
            <p className="text-gray-400 text-xs">Panneau développeur</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {successMsg && (
            <span className="bg-emerald-900 text-emerald-300 px-3 py-1 rounded-full text-sm font-medium">
              {successMsg}
            </span>
          )}
          <button onClick={loadShops} className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-lg text-sm transition-colors">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Rafraîchir
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total boutiques', value: shops.length, color: 'bg-blue-900 text-blue-300' },
            { label: 'Plan FREE', value: planStats.FREE, color: 'bg-gray-800 text-gray-300' },
            { label: 'Plan STARTER', value: planStats.STARTER, color: 'bg-blue-900 text-blue-300' },
            { label: 'Plan PRO', value: planStats.PRO, color: 'bg-purple-900 text-purple-300' },
          ].map(s => (
            <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
              <p className="text-3xl font-bold">{s.value}</p>
              <p className="text-sm opacity-80 mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Guide d'utilisation */}
        <div className="bg-amber-950 border border-amber-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-semibold text-sm">Comment activer un plan premium :</p>
              <ol className="text-amber-200/80 text-xs mt-1.5 space-y-1 list-decimal list-inside">
                <li>Le client vous envoie un message WhatsApp avec preuve de paiement</li>
                <li>Retrouvez sa boutique ici (cherchez par nom ou numéro WhatsApp)</li>
                <li>Cliquez sur <strong>STARTER</strong> ou <strong>PRO</strong> → choisissez la durée</li>
                <li>Le plan est activé immédiatement dans Firebase</li>
                <li>Confirmez l'activation au client sur WhatsApp</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" placeholder="Rechercher par nom, slug, WhatsApp..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-9 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500" />
        </div>

        {/* Shops Table */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
              <p>Chargement...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">Aucune boutique trouvée</div>
          ) : (
            filtered.map(shop => {
              const plan = PLANS[shop.planId as keyof typeof PLANS] || PLANS.FREE;
              const expired = isPlanExpired(shop);
              const expiryDate = shop.planExpiry ? new Date(shop.planExpiry).toLocaleDateString('fr') : null;

              return (
                <div key={shop.id} className={`bg-gray-900 border rounded-2xl p-4 transition-all ${
                  !shop.isActive ? 'border-red-900 opacity-60' : expired && shop.planId !== 'FREE' ? 'border-amber-800' : 'border-gray-800'
                }`}>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    {/* Shop info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{shop.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium`}
                          style={{ backgroundColor: `${plan.color}25`, color: plan.color }}>
                          {plan.name}
                        </span>
                        {!shop.isActive && <span className="text-xs px-2 py-0.5 bg-red-900 text-red-300 rounded-full">Inactif</span>}
                        {expired && shop.planId !== 'FREE' && <span className="text-xs px-2 py-0.5 bg-amber-900 text-amber-300 rounded-full">⚠️ Expiré</span>}
                      </div>
                      <p className="text-gray-400 text-xs">
                        /{shop.slug}
                        {shop.whatsapp && <span className="ml-3">📱 {shop.whatsapp}</span>}
                        {expiryDate && shop.planId !== 'FREE' && (
                          <span className={`ml-3 ${expired ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {expired ? '⚠️ Expiré le' : '✓ Valide jusqu\'au'} {expiryDate}
                          </span>
                        )}
                      </p>
                      <p className="text-gray-600 text-xs mt-0.5">
                        {shop.ordersThisMonth || 0} cmd ce mois • Inscrit le {new Date(shop.createdAt).toLocaleDateString('fr')}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Plan activation buttons */}
                      {(['STARTER', 'PRO'] as const).map(planId => (
                        <div key={planId} className="flex items-center">
                          {shop.planId === planId && !expired ? (
                            <span className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
                              style={{ backgroundColor: `${PLANS[planId].color}20`, color: PLANS[planId].color }}>
                              <Check className="w-3 h-3" /> {planId} actif
                            </span>
                          ) : (
                            <div className="flex items-center">
                              <button
                                onClick={() => activatePlan(shop.id, planId, 1)}
                                disabled={saving === shop.id}
                                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-l-lg font-medium transition-all disabled:opacity-50 hover:brightness-110"
                                style={{ backgroundColor: PLANS[planId].color, color: 'white' }}>
                                {saving === shop.id ? '...' : <><Crown className="w-3 h-3" />{planId} 1 mois</>}
                              </button>
                              <button
                                onClick={() => activatePlan(shop.id, planId, 3)}
                                disabled={saving === shop.id}
                                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-r-lg font-medium border-l border-white/20 transition-all disabled:opacity-50 hover:brightness-110"
                                style={{ backgroundColor: PLANS[planId].color + 'cc', color: 'white' }}
                                title={`Activer ${planId} pour 3 mois`}>
                                3m
                              </button>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* Downgrade to FREE */}
                      {shop.planId !== 'FREE' && (
                        <button
                          onClick={() => { if (confirm(`Rétrograder ${shop.name} vers FREE?`)) activatePlan(shop.id, 'FREE', 0); }}
                          disabled={saving === shop.id}
                          className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-400 hover:bg-gray-700 transition-colors">
                          → FREE
                        </button>
                      )}

                      {/* Toggle active */}
                      <button
                        onClick={() => toggleShopActive(shop.id, shop.isActive)}
                        disabled={saving === shop.id}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${
                          shop.isActive
                            ? 'bg-red-950 text-red-400 hover:bg-red-900'
                            : 'bg-emerald-950 text-emerald-400 hover:bg-emerald-900'
                        }`}>
                        {shop.isActive ? <><X className="w-3 h-3 inline mr-1" />Désactiver</> : <><Check className="w-3 h-3 inline mr-1" />Activer</>}
                      </button>

                      {/* View shop */}
                      <a href={`/${shop.slug}`} target="_blank"
                        className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 transition-colors">
                        Voir →
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}