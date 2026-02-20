'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Save, Loader2, Store, Palette, MapPin, Truck, CreditCard, Check,
  Upload, X, Image as ImageIcon, Share2, Database, Globe, HelpCircle,
  FileText, Shield, RefreshCw, ChevronRight, Copy, QrCode, Download,
  ExternalLink, Smartphone, Star, MessageCircle, Mail, Phone,
  Info, CheckCircle, AlertCircle, Zap, Lock, Eye, EyeOff, LogOut,
  BookOpen, ChevronDown, Package, ShoppingCart, BarChart3
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateShop } from '@/lib/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { AFRICAN_COUNTRIES, formatPrice } from '@/lib/utils';
import { PLANS } from '@/lib/types';
import PhoneInput from '@/components/PhoneInput';

const APP_VERSION = '2.0.0';
const APP_BUILD   = '2026.02';
const WHATSAPP_SUPPORT = '393299639430';
const EMAIL_SUPPORT    = 'wnguetsop@gmail.com';
const WEBSITE_URL      = 'https://shopmaster.app';
const CHANGELOG = [
  { version: '2.0.0', date: 'Fév 2026', highlights: ['Accès PIN rapide', 'Scanner code-barres USB/caméra', 'Connexion Google', 'Analyse produit par IA (Gemini + GPT-4o)', 'Numéro de téléphone international', 'Commandes manuelles avec sélection produit', 'Mobile Money + Stripe', 'Archives commandes par date'] },
  { version: '1.5.0', date: 'Jan 2026', highlights: ['Photo produit avec recadrage', 'Reçus imprimables thermiques', 'Logo boutique', 'Commandes manuelles', 'SuperAdmin panel'] },
  { version: '1.0.0', date: 'Déc 2025', highlights: ['Lancement initial', 'Gestion produits & commandes', 'Boutique en ligne publique', '21 pays africains', 'Livraison & retrait'] },
];

const COLORS = ['#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#a855f7','#64748b'];
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

// ── Section component ─────────────────────────────────────────────────────
function Section({ icon: Icon, title, color, children }: {
  icon: any; title: string; color: string; children: React.ReactNode;
}) {
  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        <h2 className="font-bold text-gray-800 text-base">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ── Action row ───────────────────────────────────────────────────────────
function ActionRow({ icon: Icon, label, sub, onClick, href, color = '#6b7280', danger = false, external = false }: {
  icon: any; label: string; sub?: string; onClick?: () => void; href?: string;
  color?: string; danger?: boolean; external?: boolean;
}) {
  const cls = `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${
    danger ? 'hover:bg-red-50' : 'hover:bg-gray-50'
  }`;
  const inner = (
    <>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-600' : 'text-gray-800'}`}>{label}</p>
        {sub && <p className="text-xs text-gray-400 truncate">{sub}</p>}
      </div>
      {external ? <ExternalLink className="w-4 h-4 text-gray-300" /> : <ChevronRight className="w-4 h-4 text-gray-300" />}
    </>
  );
  if (href) return <a href={href} target="_blank" className={cls}>{inner}</a>;
  return <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

export default function SettingsPage() {
  const { shop, admin, refreshShop, logout } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState('');
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showChangelog, setShowChangelog] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle'|'checking'|'latest'|'available'>('idle');

  const [form, setForm] = useState({
    name: '', description: '', slogan: '', primaryColor: '#ec4899',
    whatsapp: '', phone: '', email: '', address: '', city: '',
    country: 'Cameroun', currency: 'XAF',
    deliveryFee: 1000, freeDeliveryAbove: 0,
    pickupAddress: '', pickupEnabled: true, deliveryEnabled: true,
    mobileMoneyNumber: '', mobileMoneyName: '', logo: '',
  });

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name || '', description: shop.description || '',
        slogan: shop.slogan || '', primaryColor: shop.primaryColor || '#ec4899',
        whatsapp: shop.whatsapp || '', phone: shop.phone || '',
        email: shop.email || '', address: shop.address || '',
        city: shop.city || '', country: shop.country || 'Cameroun',
        currency: shop.currency || 'XAF', deliveryFee: shop.deliveryFee || 1000,
        freeDeliveryAbove: shop.freeDeliveryAbove || 0,
        pickupAddress: shop.pickupAddress || '',
        pickupEnabled: shop.pickupEnabled ?? true,
        deliveryEnabled: shop.deliveryEnabled ?? true,
        mobileMoneyNumber: shop.mobileMoneyNumber || '',
        mobileMoneyName: shop.mobileMoneyName || '', logo: shop.logo || '',
      });
    }
  }, [shop]);

  function handleCountryChange(countryName: string) {
    const country = AFRICAN_COUNTRIES.find(c => c.name === countryName);
    setForm(prev => ({
      ...prev, country: countryName,
      currency: country?.currency || 'XAF',
      whatsapp: prev.whatsapp || country?.phone || '',
    }));
  }

  function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 200; canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, size, size);
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width-s)/2, (img.height-s)/2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob(blob => {
        if (!blob) return;
        setLogoFile(new File([blob], 'logo.jpg', { type: 'image/jpeg' }));
        setLogoPreview(canvas.toDataURL('image/jpeg', 0.9));
      }, 'image/jpeg', 0.9);
    };
    img.src = url; e.target.value = '';
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
    e.preventDefault(); if (!shop?.id) return;
    setSaving(true);
    try {
      let logo = form.logo;
      if (logoFile) logo = await uploadLogo();
      await updateShop(shop.id, { ...form, logo });
      await refreshShop();
      setSaved(true); setTimeout(() => setSaved(false), 3000);
    } catch { alert('Erreur lors de la sauvegarde'); }
    setSaving(false);
  }

  function copyToClipboard(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key); setTimeout(() => setCopied(''), 2000);
  }

  async function shareApp() {
    const url = `${typeof window !== 'undefined' ? window.location.origin : ''}/${shop?.slug}`;
    const msg = `🛍️ Découvrez ma boutique *${shop?.name}* sur ShopMaster !\n\nCommandez en ligne ici : ${url}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: shop?.name, text: msg, url }); } catch {}
    } else {
      copyToClipboard(url, 'share');
    }
  }

  function checkUpdate() {
    setUpdateStatus('checking');
    setTimeout(() => setUpdateStatus('latest'), 2000); // In real app: fetch version API
  }

  function downloadData() {
    if (!shop) return;
    const data = { exportDate: new Date().toISOString(), shop: { ...shop }, exportedBy: admin?.email };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `shopmaster-${shop.slug}-${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  const primaryColor = form.primaryColor;
  const currentCountry = AFRICAN_COUNTRIES.find(c => c.name === form.country);
  const shopUrl = typeof window !== 'undefined' ? `${window.location.origin}/${shop?.slug}` : `https://shopmaster.app/${shop?.slug}`;
  const currentPlan = PLANS[shop?.planId || 'FREE'];

  return (
    <div className="max-w-2xl space-y-5">

      {/* ══════════════════════════════════════════════
          BOUTIQUE IDENTITY
      ══════════════════════════════════════════════ */}
      <Section icon={Store} title="Identité de la boutique" color={primaryColor}>
        <form onSubmit={handleSave} id="main-form" className="space-y-4">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la boutique</label>
            <div className="flex items-center gap-4">
              <div className="relative">
                {(logoPreview || form.logo) ? (
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-gray-200">
                    <img src={logoPreview || form.logo} alt="Logo" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setLogoPreview(''); setLogoFile(null); setForm(f => ({ ...f, logo: '' })); }}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50">
                    <ImageIcon className="w-7 h-7 text-gray-300" />
                  </div>
                )}
              </div>
              <div>
                <button type="button" onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50">
                  <Upload className="w-4 h-4" />{uploadingLogo ? 'Upload...' : 'Choisir un logo'}
                </button>
                <p className="text-xs text-gray-400 mt-1.5">Carré recommandé · JPG ou PNG · max 2MB</p>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoSelect} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique *</label>
            <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
            <input type="text" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} className="input" placeholder="La qualité à petit prix" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="textarea" rows={3} />
          </div>
        </form>
      </Section>

      {/* ══════════════════════════════════════════════
          APPARENCE
      ══════════════════════════════════════════════ */}
      <Section icon={Palette} title="Apparence" color={primaryColor}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Couleur principale</label>
          <div className="flex flex-wrap gap-3">
            {COLORS.map(color => (
              <button key={color} type="button" form="main-form" onClick={() => setForm({ ...form, primaryColor: color })}
                className="w-10 h-10 rounded-xl transition-transform hover:scale-110"
                style={{ backgroundColor: color, outline: form.primaryColor === color ? `3px solid ${color}` : 'none', outlineOffset: '2px' }}>
                {form.primaryColor === color && <Check className="w-5 h-5 text-white mx-auto" />}
              </button>
            ))}
            <input type="color" value={form.primaryColor} onChange={e => setForm({ ...form, primaryColor: e.target.value })}
              className="w-10 h-10 rounded-xl cursor-pointer border-2 border-dashed border-gray-200" />
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          CONTACT & LOCALISATION
      ══════════════════════════════════════════════ */}
      <Section icon={MapPin} title="Contact & Localisation" color={primaryColor}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">{currentCountry?.flag || '🌍'}</span>
              <select value={form.country} onChange={e => handleCountryChange(e.target.value)} className="select pl-10">
                {AFRICAN_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            {currentCountry && <p className="text-xs text-gray-400 mt-1">Indicatif: {currentCountry.phone} · Devise: {currentCountry.currency}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneInput label="WhatsApp *" required value={form.whatsapp} onChange={v => setForm({ ...form, whatsapp: v })} defaultCountry={currentCountry?.code || 'CM'} />
            <PhoneInput label="Téléphone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} defaultCountry={currentCountry?.code || 'CM'} />
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
      </Section>

      {/* ══════════════════════════════════════════════
          LIVRAISON
      ══════════════════════════════════════════════ */}
      <Section icon={Truck} title="Livraison" color={primaryColor}>
        <div className="space-y-4">
          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.deliveryEnabled} onChange={e => setForm({ ...form, deliveryEnabled: e.target.checked })} className="w-5 h-5 rounded" />
              <span className="text-sm">Livraison à domicile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.pickupEnabled} onChange={e => setForm({ ...form, pickupEnabled: e.target.checked })} className="w-5 h-5 rounded" />
              <span className="text-sm">Retrait sur place</span>
            </label>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frais de livraison</label>
              <input type="number" min="0" value={form.deliveryFee} onChange={e => setForm({ ...form, deliveryFee: parseInt(e.target.value)||0 })} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livraison gratuite à partir de</label>
              <input type="number" min="0" value={form.freeDeliveryAbove} onChange={e => setForm({ ...form, freeDeliveryAbove: parseInt(e.target.value)||0 })} className="input" />
            </div>
          </div>
          {form.pickupEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de retrait</label>
              <input type="text" value={form.pickupAddress} onChange={e => setForm({ ...form, pickupAddress: e.target.value })} className="input" placeholder="Marché Central, stand 42" />
            </div>
          )}
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          PAIEMENT
      ══════════════════════════════════════════════ */}
      <Section icon={CreditCard} title="Paiement & Devise" color={primaryColor}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="select">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneInput label="Numéro Mobile Money" value={form.mobileMoneyNumber} onChange={v => setForm({ ...form, mobileMoneyNumber: v })} defaultCountry={currentCountry?.code || 'CM'} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
              <input type="text" value={form.mobileMoneyName} onChange={e => setForm({ ...form, mobileMoneyName: e.target.value })} className="input" placeholder="Nom affiché" />
            </div>
          </div>
        </div>
      </Section>

      {/* ── Save button ── */}
      <div className="flex justify-end gap-4">
        {saved && <span className="flex items-center gap-2 text-emerald-600 font-medium text-sm"><Check className="w-5 h-5" />Sauvegardé !</span>}
        <button type="submit" form="main-form" onClick={handleSave} disabled={saving || uploadingLogo}
          className="btn-primary flex items-center gap-2 px-8" style={{ backgroundColor: primaryColor }}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* ══════════════════════════════════════════════
          PARTAGER L'APPLICATION
      ══════════════════════════════════════════════ */}
      <Section icon={Share2} title="Partager ma boutique" color="#f97316">
        <div className="space-y-2">
          {/* URL display */}
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-700 flex-1 truncate font-mono">{shopUrl}</p>
            <button onClick={() => copyToClipboard(shopUrl, 'url')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: copied === 'url' ? '#22c55e' : '#f97316', color: 'white' }}>
              {copied === 'url' ? <><Check className="w-3.5 h-3.5" />Copié</> : <><Copy className="w-3.5 h-3.5" />Copier</>}
            </button>
          </div>

          {/* Share actions */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <ActionRow icon={Share2} label="Partager le lien" sub="Via les apps installées" color="#f97316" onClick={shareApp} />
            <ActionRow icon={MessageCircle} label="Partager sur WhatsApp" color="#25D366"
              href={`https://wa.me/?text=${encodeURIComponent(`🛍️ Découvrez *${shop?.name}* sur ShopMaster !\n${shopUrl}`)}`}
              external />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ActionRow icon={Smartphone} label="Installer l'app" sub="Ajouter à l'écran d'accueil" color="#3b82f6"
              onClick={() => alert('Ouvrez ce site dans Chrome/Safari → Menu ⋮ → "Ajouter à l\'écran d\'accueil"')} />
            <ActionRow icon={ExternalLink} label="Voir ma boutique" sub={`/${shop?.slug}`} color={primaryColor}
              href={shopUrl} external />
          </div>

          {/* QR Code hint */}
          <div className="mt-3 bg-orange-50 rounded-xl p-3 flex items-start gap-2.5 border border-orange-100">
            <QrCode className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-700">
              <p className="font-semibold mb-0.5">Générer un QR Code</p>
              <p>Visitez <span className="font-mono">qr-code-generator.com</span> et collez votre lien boutique pour créer un QR Code à imprimer.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          MES DONNÉES
      ══════════════════════════════════════════════ */}
      <Section icon={Database} title="Mes données" color="#8b5cf6">
        {/* Account info */}
        <div className="bg-gray-50 rounded-xl p-4 mb-3 border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg">
              {admin?.name?.charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800">{admin?.name}</p>
              <p className="text-sm text-gray-500">{admin?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${currentPlan.color}20`, color: currentPlan.color }}>
                  Plan {currentPlan.name}
                </span>
                {shop?.planExpiry && (
                  <span className="text-xs text-gray-400">· expire {new Date(shop.planExpiry).toLocaleDateString('fr')}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Boutique', value: shop?.name?.slice(0,12) || '—', icon: Store, color: primaryColor },
            { label: 'Pays', value: shop?.country || '—', icon: Globe, color: '#3b82f6' },
            { label: 'Devise', value: shop?.currency || '—', icon: CreditCard, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-xs font-bold text-gray-700 truncate">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-1">
          <ActionRow icon={Download} label="Exporter mes données" sub="Télécharger un fichier JSON de votre boutique" color="#8b5cf6"
            onClick={downloadData} />
          <ActionRow icon={Mail} label="Demander la suppression du compte" sub="Envoi d'une demande par email" color="#ef4444"
            href={`mailto:${EMAIL_SUPPORT}?subject=Suppression compte ShopMaster&body=Bonjour, je souhaite supprimer mon compte ShopMaster.%0A%0ABoutique: ${shop?.name}%0ASlug: ${shop?.slug}%0AEmail: ${admin?.email}`}
            external danger />
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          SITE WEB
      ══════════════════════════════════════════════ */}
      <Section icon={Globe} title="Site web & Application" color="#3b82f6">
        <div className="space-y-1">
          <ActionRow icon={Globe} label="Site officiel ShopMaster" sub={WEBSITE_URL} color="#3b82f6" href={WEBSITE_URL} external />
          <ActionRow icon={BookOpen} label="Documentation & Guides" sub="Tutoriels pour bien utiliser ShopMaster" color="#14b8a6"
            href={`${WEBSITE_URL}/docs`} external />
          <ActionRow icon={Star} label="Laisser un avis" sub="Aidez-nous à améliorer ShopMaster" color="#eab308"
            href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent('Bonjour! Voici mon avis sur ShopMaster:\n\n')}`} external />

          {/* App install banner */}
          <div className="mt-3 rounded-2xl overflow-hidden border border-blue-100"
            style={{ background: 'linear-gradient(135deg, #eff6ff, #dbeafe)' }}>
            <div className="p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center flex-shrink-0 shadow-sm">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-blue-900 text-sm">Installer ShopMaster</p>
                <p className="text-xs text-blue-600 mt-0.5">Accédez à votre boutique comme une vraie app mobile</p>
                <p className="text-[10px] text-blue-400 mt-1">Chrome → ⋮ → "Ajouter à l'écran d'accueil" · Safari → ↑ → "Sur l'écran d'accueil"</p>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          AIDE & SUPPORT
      ══════════════════════════════════════════════ */}
      <Section icon={HelpCircle} title="Aide & Support" color="#22c55e">
        <div className="space-y-1">
          <ActionRow icon={MessageCircle} label="Contacter le support" sub="Réponse en moins de 24h" color="#25D366"
            href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(`Bonjour ShopMaster Support!\n\nBoutique: ${shop?.name}\nSlug: ${shop?.slug}\n\nMon problème: `)}`} external />
          <ActionRow icon={Mail} label="Envoyer un email" sub={EMAIL_SUPPORT} color="#3b82f6"
            href={`mailto:${EMAIL_SUPPORT}?subject=Support ShopMaster - ${shop?.name}`} external />
          <ActionRow icon={BookOpen} label="Guide d'utilisation" sub="Apprendre toutes les fonctionnalités" color="#22c55e"
            href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent('Bonjour, j\'aimerais recevoir le guide complet ShopMaster.')}`} external />

          {/* FAQ */}
          <div className="mt-3 border border-gray-100 rounded-2xl overflow-hidden">
            <p className="text-xs font-bold text-gray-500 px-4 pt-3 pb-2 bg-gray-50 uppercase tracking-wider">Questions fréquentes</p>
            {[
              { q: 'Comment ajouter un produit ?', r: 'Menu Produits → bouton "+" → remplir le formulaire → Sauvegarder. L\'IA peut analyser vos photos automatiquement.' },
              { q: 'Comment recevoir des commandes ?', r: 'Partagez le lien de votre boutique (section "Partager"). Les clients commandent directement en ligne.' },
              { q: 'Comment imprimer un reçu ?', r: 'Dans Commandes → cliquer sur une commande → bouton "Imprimer". Compatible imprimante thermique 80mm.' },
              { q: 'Comment scanner un code-barres ?', r: 'Dans Nouvelle commande → icône Scanner USB ou Caméra. Votre scanner USB est automatiquement détecté.' },
            ].map((faq, i) => (
              <div key={i} className="border-t border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-700 mb-1">{faq.q}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{faq.r}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          MISES À JOUR
      ══════════════════════════════════════════════ */}
      <Section icon={RefreshCw} title="Mises à jour" color="#14b8a6">
        {/* Current version */}
        <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-teal-800">Version actuelle</p>
              <p className="text-2xl font-bold text-teal-600 mt-0.5">{APP_VERSION}</p>
              <p className="text-xs text-teal-500">Build {APP_BUILD}</p>
            </div>
            <button onClick={checkUpdate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all"
              style={{ backgroundColor: updateStatus === 'latest' ? '#22c55e' : '#14b8a6', color: 'white' }}>
              {updateStatus === 'checking' ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Vérification...</>
              ) : updateStatus === 'latest' ? (
                <><CheckCircle className="w-4 h-4" />À jour !</>
              ) : (
                <><RefreshCw className="w-4 h-4" />Vérifier</>
              )}
            </button>
          </div>
        </div>

        {/* Changelog */}
        <button onClick={() => setShowChangelog(!showChangelog)}
          className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors mb-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Historique des versions</span>
          </div>
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showChangelog ? 'rotate-180' : ''}`} />
        </button>

        {showChangelog && (
          <div className="space-y-3">
            {CHANGELOG.map((v, i) => (
              <div key={v.version} className={`rounded-xl p-4 border ${i === 0 ? 'border-teal-200 bg-teal-50' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm" style={{ color: i === 0 ? '#0d9488' : '#6b7280' }}>v{v.version}</span>
                    {i === 0 && <span className="text-[10px] bg-teal-500 text-white px-2 py-0.5 rounded-full font-bold">ACTUELLE</span>}
                  </div>
                  <span className="text-xs text-gray-400">{v.date}</span>
                </div>
                <ul className="space-y-1">
                  {v.highlights.map((h, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-gray-600">
                      <Check className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* ══════════════════════════════════════════════
          LICENCE
      ══════════════════════════════════════════════ */}
      <Section icon={FileText} title="Licence" color="#f59e0b">
        <div className="space-y-3">
          {/* License badge */}
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-amber-800">ShopMaster Licence Commerciale</p>
                <p className="text-xs text-amber-600 mt-0.5">Plan: <strong>{currentPlan.name}</strong> · Boutique: <strong>{shop?.slug}</strong></p>
                {shop?.planExpiry && (
                  <p className="text-xs text-amber-500 mt-0.5">
                    {new Date(shop.planExpiry) < new Date() ? '⚠️ Expirée le' : '✓ Valide jusqu\'au'} {new Date(shop.planExpiry).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-700 mb-1">Conditions d'utilisation</p>
              Cette licence vous permet d'utiliser ShopMaster pour gérer votre boutique commerciale. Vous ne pouvez pas redistribuer, revendre ou sous-licencier le logiciel.
              La licence est valable pour une boutique et un administrateur principal.
            </div>
          </div>

          <div className="space-y-1">
            <ActionRow icon={ExternalLink} label="Voir les CGU complètes" color="#f59e0b"
              href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent('Bonjour, je souhaite recevoir les CGU complètes de ShopMaster.')}`} external />
            <ActionRow icon={Mail} label="Licence & facturation" sub="Pour toute question sur votre abonnement" color="#f97316"
              href={`mailto:${EMAIL_SUPPORT}?subject=Licence ShopMaster - ${shop?.slug}`} external />
          </div>

          {/* Open source */}
          <div className="text-xs text-gray-400 px-2 leading-relaxed">
            ShopMaster utilise des librairies open-source : React, Next.js, Firebase, Tailwind CSS, Lucide Icons.
          </div>
        </div>
      </Section>

      {/* ══════════════════════════════════════════════
          CONFIDENTIALITÉ
      ══════════════════════════════════════════════ */}
      <Section icon={Shield} title="Confidentialité & Sécurité" color="#6366f1">
        <div className="space-y-3">
          {/* Security status */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Données chiffrées', status: true, desc: 'Firebase SSL/TLS' },
              { label: 'Auth sécurisée', status: true, desc: 'Firebase Auth' },
              { label: 'Accès PIN', status: false, desc: 'Configurable dans sidebar' },
              { label: 'Sauvegarde auto', status: true, desc: 'Firestore en temps réel' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-3 border ${item.status ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {item.status
                    ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <p className={`text-xs font-semibold ${item.status ? 'text-emerald-700' : 'text-amber-700'}`}>{item.label}</p>
                </div>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <div className="px-4 py-3 bg-gray-50 rounded-xl text-xs text-gray-600 leading-relaxed">
              <p className="font-semibold text-gray-700 mb-1">Collecte de données</p>
              Nous collectons uniquement les données nécessaires au fonctionnement de votre boutique : nom, email, informations de boutique, produits et commandes.
              Ces données sont stockées sur les serveurs sécurisés de Google Firebase en Europe.
              Nous ne vendons jamais vos données à des tiers.
            </div>
          </div>

          <div className="space-y-1">
            <ActionRow icon={Shield} label="Politique de confidentialité" color="#6366f1"
              href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent('Bonjour, je souhaite consulter la politique de confidentialité de ShopMaster.')}`} external />
            <ActionRow icon={Lock} label="Modifier mon mot de passe" sub="Réinitialisation par email" color="#8b5cf6"
              href={`mailto:${EMAIL_SUPPORT}?subject=Réinitialisation mot de passe&body=Email: ${admin?.email}`} external />
            <ActionRow icon={Database} label="Mes droits RGPD" sub="Accès, correction, suppression de données" color="#ec4899"
              href={`mailto:${EMAIL_SUPPORT}?subject=Droits RGPD - ${admin?.email}`} external />
          </div>

          {/* Data hosted info */}
          <div className="flex items-start gap-2.5 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700">
              Vos données sont hébergées sur <strong>Google Firebase</strong> (serveurs européens).
              L'accès est protégé par les règles de sécurité Firestore et Firebase Auth.
            </p>
          </div>
        </div>
      </Section>

      {/* ── App footer ── */}
      <div className="text-center py-4 space-y-1">
        <p className="text-xs text-gray-400 font-medium">ShopMaster v{APP_VERSION} · Build {APP_BUILD}</p>
        <p className="text-xs text-gray-300">© 2025-2026 ShopMaster. Tous droits réservés.</p>
        <p className="text-xs text-gray-300">Fait avec ❤️ pour les commerçants africains</p>
      </div>
    </div>
  );
}