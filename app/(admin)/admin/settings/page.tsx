'use client';
import { useState, useEffect, useRef } from 'react';
import { Save, Loader2, Store, Palette, MapPin, Truck, CreditCard, Check, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateShop } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { AFRICAN_COUNTRIES } from '@/lib/utils';

const COLORS = ['#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#a855f7', '#64748b'];

const CURRENCIES = [
  { code: 'XAF', label: 'Franc CFA CEMAC (XAF) — Cameroun, Gabon, Congo...' },
  { code: 'XOF', label: 'Franc CFA UEMOA (XOF) — Côte d\'Ivoire, Sénégal, Mali...' },
  { code: 'GNF', label: 'Franc Guinéen (GNF) — Guinée' },
  { code: 'CDF', label: 'Franc Congolais (CDF) — RDC' },
  { code: 'BIF', label: 'Franc Burundais (BIF) — Burundi' },
  { code: 'RWF', label: 'Franc Rwandais (RWF) — Rwanda' },
  { code: 'MGA', label: 'Ariary (MGA) — Madagascar' },
  { code: 'MRO', label: 'Ouguiya (MRO) — Mauritanie' },
  { code: 'EUR', label: 'Euro (€) — Comores, diaspora' },
  { code: 'USD', label: 'Dollar US ($) — Djibouti, international' },
];

export default function SettingsPage() {
  const { shop, refreshShop } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    description: '',
    slogan: '',
    primaryColor: '#ec4899',
    whatsapp: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Cameroun',
    currency: 'XAF',
    deliveryFee: 1000,
    freeDeliveryAbove: 0,
    pickupAddress: '',
    pickupEnabled: true,
    deliveryEnabled: true,
    mobileMoneyNumber: '',
    mobileMoneyName: '',
    logo: '',
  });

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name || '',
        description: shop.description || '',
        slogan: shop.slogan || '',
        primaryColor: shop.primaryColor || '#ec4899',
        whatsapp: shop.whatsapp || '',
        phone: shop.phone || '',
        email: shop.email || '',
        address: shop.address || '',
        city: shop.city || '',
        country: shop.country || 'Cameroun',
        currency: shop.currency || 'XAF',
        deliveryFee: shop.deliveryFee || 1000,
        freeDeliveryAbove: shop.freeDeliveryAbove || 0,
        pickupAddress: shop.pickupAddress || '',
        pickupEnabled: shop.pickupEnabled ?? true,
        deliveryEnabled: shop.deliveryEnabled ?? true,
        mobileMoneyNumber: shop.mobileMoneyNumber || '',
        mobileMoneyName: shop.mobileMoneyName || '',
        logo: shop.logo || '',
      });
    }
  }, [shop]);

  // Auto-fill phone code when country changes
  function handleCountryChange(countryName: string) {
    const country = AFRICAN_COUNTRIES.find(c => c.name === countryName);
    const newCurrency = country?.currency || 'XAF';
    const phoneCode = country?.phone || '';
    setForm(prev => ({
      ...prev,
      country: countryName,
      currency: newCurrency,
      // Pre-fill phone code if phone is empty
      whatsapp: prev.whatsapp || phoneCode,
    }));
  }

  // Logo handling
  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    // Resize to 200x200
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 200;
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
      const s = Math.min(img.width, img.height);
      const ox = (img.width - s) / 2; const oy = (img.height - s) / 2;
      ctx.drawImage(img, ox, oy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) return;
        const resized = new File([blob], 'logo.jpg', { type: 'image/jpeg' });
        setLogoFile(resized);
        setLogoPreview(canvas.toDataURL('image/jpeg', 0.9));
      }, 'image/jpeg', 0.9);
    };
    img.src = url;
    e.target.value = '';
  }

  async function uploadLogo(): Promise<string> {
    if (!logoFile || !shop?.id) return form.logo;
    setUploadingLogo(true);
    try {
      const r = ref(storage, `shops/${shop.id}/logo.jpg`);
      await uploadBytes(r, logoFile);
      return await getDownloadURL(r);
    } catch { return form.logo; }
    finally { setUploadingLogo(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!shop?.id) return;
    setSaving(true);
    try {
      let logo = form.logo;
      if (logoFile) logo = await uploadLogo();
      await updateShop(shop.id, { ...form, logo });
      await refreshShop();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      alert('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  }

  const primaryColor = form.primaryColor;
  const currentCountry = AFRICAN_COUNTRIES.find(c => c.name === form.country);

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">

      {/* ── Shop Identity ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Store className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Identité de la boutique</h2>
        </div>

        {/* Logo upload */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la boutique</label>
          <div className="flex items-center gap-4">
            <div className="relative">
              {(logoPreview || form.logo) ? (
                <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200">
                  <img src={logoPreview || form.logo} alt="Logo" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setLogoPreview(''); setLogoFile(null); setForm(f => ({ ...f, logo: '' })); }}
                    className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center bg-gray-50">
                  <ImageIcon className="w-8 h-8 text-gray-300" />
                </div>
              )}
            </div>
            <div>
              <button type="button" onClick={() => logoInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 transition-all">
                <Upload className="w-4 h-4" />
                {logoPreview || form.logo ? 'Changer le logo' : 'Importer un logo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">Carré recommandé, JPG/PNG</p>
              {uploadingLogo && <p className="text-xs text-orange-500 mt-1">Upload en cours...</p>}
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
            <input type="text" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} className="input" placeholder="Ex: La qualité à petit prix" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="textarea" rows={3} />
          </div>
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Palette className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Apparence</h2>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Couleur principale</label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map(color => (
              <button key={color} type="button" onClick={() => setForm({ ...form, primaryColor: color })}
                className="w-10 h-10 rounded-xl transition-transform hover:scale-110"
                style={{ backgroundColor: color, outline: form.primaryColor === color ? `3px solid ${color}` : 'none', outlineOffset: '2px' }}>
                {form.primaryColor === color && <Check className="w-5 h-5 text-white mx-auto" />}
              </button>
            ))}
            <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })} className="w-10 h-10 rounded-xl cursor-pointer border-2 border-dashed border-gray-200" />
          </div>
        </div>
      </div>

      {/* ── Location & Contact ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Contact & Localisation</h2>
        </div>

        <div className="space-y-4">
          {/* Country picker with flag */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">{currentCountry?.flag || '🌍'}</span>
              <select value={form.country} onChange={e => handleCountryChange(e.target.value)} className="select pl-10">
                {AFRICAN_COUNTRIES.map(c => (
                  <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
                ))}
              </select>
            </div>
            {currentCountry && <p className="text-xs text-gray-400 mt-1">Code téléphone: {currentCountry.phone} • Devise: {currentCountry.currency}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
              <input type="tel" required value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} className="input" placeholder={currentCountry?.phone + ' 6XX XXX XXX'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
              <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="input" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
              <input type="text" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="input" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Delivery ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Truck className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Livraison</h2>
        </div>
        <div className="space-y-4">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.deliveryEnabled} onChange={e => setForm({ ...form, deliveryEnabled: e.target.checked })} className="w-5 h-5 rounded" /><span>Livraison à domicile</span></label>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.pickupEnabled} onChange={e => setForm({ ...form, pickupEnabled: e.target.checked })} className="w-5 h-5 rounded" /><span>Retrait sur place</span></label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frais de livraison</label>
              <input type="number" min="0" value={form.deliveryFee} onChange={e => setForm({ ...form, deliveryFee: parseInt(e.target.value) || 0 })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livraison gratuite à partir de</label>
              <input type="number" min="0" value={form.freeDeliveryAbove} onChange={e => setForm({ ...form, freeDeliveryAbove: parseInt(e.target.value) || 0 })} className="input" />
            </div>
          </div>
          {form.pickupEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de retrait</label>
              <input type="text" value={form.pickupAddress} onChange={e => setForm({ ...form, pickupAddress: e.target.value })} className="input" placeholder="Ex: Marché Central, stand 42" />
            </div>
          )}
        </div>
      </div>

      {/* ── Payment ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Paiement & Devise</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="select">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Mobile Money</label>
              <input type="tel" value={form.mobileMoneyNumber} onChange={e => setForm({ ...form, mobileMoneyNumber: e.target.value })} className="input" placeholder={currentCountry?.phone + ' XXX...'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
              <input type="text" value={form.mobileMoneyName} onChange={e => setForm({ ...form, mobileMoneyName: e.target.value })} className="input" placeholder="Nom affiché" />
            </div>
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end gap-4">
        {saved && <span className="flex items-center gap-2 text-emerald-600 font-medium"><Check className="w-5 h-5" />Sauvegardé !</span>}
        <button type="submit" disabled={saving || uploadingLogo} className="btn-primary flex items-center gap-2 px-8" style={{ backgroundColor: primaryColor }}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  );
}