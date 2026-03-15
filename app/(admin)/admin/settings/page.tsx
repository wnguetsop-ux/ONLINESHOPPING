'use client';
import { useState, useEffect, useRef } from 'react';
import {
  Save, Loader2, Store, Palette, MapPin, Truck, CreditCard, Check,
  Upload, X, Image as ImageIcon, Share2, Database, Globe, HelpCircle,
  FileText, Shield, RefreshCw, ChevronRight, Copy, QrCode, Download,
  ExternalLink, Smartphone, Star, MessageCircle, Mail, Phone,
  Info, CheckCircle, AlertCircle, Zap, Lock, Eye, EyeOff, LogOut,
  BookOpen, ChevronDown, Package, ShoppingCart, BarChart3, Edit3
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
  { version: '2.0.0', date: 'Fev 2026', highlights: ['Acces PIN rapide', 'Scanner code-barres USB/camera', 'Connexion Google', 'Analyse produit par IA (Gemini + GPT-4o)', 'Numero de telephone international', 'Commandes manuelles avec selection produit', 'Mobile Money + Stripe', 'Archives commandes par date'] },
  { version: '1.5.0', date: 'Jan 2026', highlights: ['Photo produit avec recadrage', 'Recus imprimables thermiques', 'Logo boutique', 'Commandes manuelles', 'SuperAdmin panel'] },
  { version: '1.0.0', date: 'Dec 2025', highlights: ['Lancement initial', 'Gestion produits & commandes', 'Boutique en ligne publique', '21 pays africains', 'Livraison & retrait'] },
];

const COLORS = ['#ec4899','#f43f5e','#f97316','#eab308','#22c55e','#14b8a6','#3b82f6','#8b5cf6','#a855f7','#64748b'];
const CURRENCIES = [
  { code: 'XAF', label: 'Franc CFA CEMAC (XAF) - Cameroun, Gabon, Congo...' },
  { code: 'XOF', label: 'Franc CFA UEMOA (XOF) - Cote d\'Ivoire, Senegal, Mali...' },
  { code: 'GNF', label: 'Franc Guineen (GNF) - Guinee' },
  { code: 'CDF', label: 'Franc Congolais (CDF) - RDC' },
  { code: 'BIF', label: 'Franc Burundais (BIF) - Burundi' },
  { code: 'RWF', label: 'Franc Rwandais (RWF) - Rwanda' },
  { code: 'MGA', label: 'Ariary (MGA) - Madagascar' },
  { code: 'MRO', label: 'Ouguiya (MRO) - Mauritanie' },
  { code: 'EUR', label: 'Euro () - Comores, diaspora' },
  { code: 'USD', label: 'Dollar US ($) - Djibouti, international' },
];

// Templates par défaut
const DEFAULT_TEMPLATES = {
  contact:          'Bonjour {{nom}}, je vous contacte depuis {{boutique}}. Comment puis-je vous aider ?',
  confirm_order:    'Bonjour {{nom}} 👋\n\nVotre commande *#{{reference}}* a bien été confirmée ✅\n\n💰 Total : *{{total}}*\n\nMerci pour votre confiance ! 🙏\n— {{boutique}}',
  payment_reminder: 'Bonjour {{nom}} 👋\n\nNous vous rappelons qu\'il reste *{{reste}}* à régler pour votre commande *#{{reference}}*.\n\nMerci de procéder au paiement dès que possible 🙏\n— {{boutique}}',
  order_ready:      'Bonjour {{nom}} 👋\n\nVotre commande *#{{reference}}* est prête ! 🎉\n\nVous pouvez venir la récupérer.\n\n— {{boutique}}',
  send_receipt:     'Bonjour {{nom}} 👋\n\nVoici le résumé de votre commande *#{{reference}}* :\n\n💰 Total payé : *{{total}}*\n✅ Statut : Payée\n\nMerci pour votre confiance ! 🛍️\n— {{boutique}}',
};

const TEMPLATE_META: Record<string, { label: string; emoji: string; vars: string[] }> = {
  contact:          { label: 'Contact simple',     emoji: '💬', vars: ['{{nom}}', '{{boutique}}'] },
  confirm_order:    { label: 'Confirmation commande', emoji: '✅', vars: ['{{nom}}', '{{reference}}', '{{total}}', '{{boutique}}'] },
  payment_reminder: { label: 'Rappel paiement',    emoji: '💰', vars: ['{{nom}}', '{{reference}}', '{{reste}}', '{{boutique}}'] },
  order_ready:      { label: 'Commande prête',      emoji: '📦', vars: ['{{nom}}', '{{reference}}', '{{boutique}}'] },
  send_receipt:     { label: 'Envoi reçu',          emoji: '🧾', vars: ['{{nom}}', '{{reference}}', '{{total}}', '{{boutique}}'] },
};

const STORAGE_KEY = 'sm_wa_templates';

function Section({ icon: Icon, title, color, children }: { icon: any; title: string; color: string; children: React.ReactNode }) {
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

function ActionRow({ icon: Icon, label, sub, onClick, href, color = '#6b7280', danger = false, external = false }: {
  icon: any; label: string; sub?: string; onClick?: () => void; href?: string;
  color?: string; danger?: boolean; external?: boolean;
}) {
  const cls = `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-left ${danger ? 'hover:bg-red-50' : 'hover:bg-gray-50'}`;
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
  const [showChangelog, setShowChangelog] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<'idle'|'checking'|'latest'|'available'>('idle');

  // ── TEMPLATES STATE ──────────────────────────────────────────────────────
  const [templates, setTemplates] = useState<Record<string, string>>(DEFAULT_TEMPLATES);
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);
  const [templateDraft, setTemplateDraft] = useState('');
  const [templatesSaved, setTemplatesSaved] = useState(false);

  // Charger les templates depuis localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setTemplates({ ...DEFAULT_TEMPLATES, ...JSON.parse(saved) });
    } catch {}
  }, []);

  function saveTemplates(updated: Record<string, string>) {
    setTemplates(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setTemplatesSaved(true);
    setTimeout(() => setTemplatesSaved(false), 2500);
  }

  function startEdit(key: string) {
    setEditingTemplate(key);
    setTemplateDraft(templates[key]);
  }

  function saveTemplate(key: string) {
    const updated = { ...templates, [key]: templateDraft };
    saveTemplates(updated);
    setEditingTemplate(null);
  }

  function resetTemplate(key: string) {
    const updated = { ...templates, [key]: DEFAULT_TEMPLATES[key as keyof typeof DEFAULT_TEMPLATES] };
    saveTemplates(updated);
    setEditingTemplate(null);
  }

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
    setForm(prev => ({ ...prev, country: countryName, currency: country?.currency || 'XAF', whatsapp: prev.whatsapp || country?.phone || '' }));
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
      await updateShop(shop.id, { ...form, logo } as any);
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
    const msg = ` Decouvrez ma boutique *${shop?.name}* sur ShopMaster !\n\nCommandez en ligne ici : ${url}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: shop?.name, text: msg, url }); } catch {}
    } else { copyToClipboard(url, 'share'); }
  }

  function checkUpdate() {
    setUpdateStatus('checking');
    setTimeout(() => setUpdateStatus('latest'), 2000);
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

      {/* BOUTIQUE IDENTITY */}
      <Section icon={Store} title="Identite de la boutique" color={primaryColor}>
        <form onSubmit={handleSave} id="main-form" className="space-y-4">
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
                <p className="text-xs text-gray-400 mt-1.5">Carre recommande  JPG ou PNG  max 2MB</p>
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
            <input type="text" value={form.slogan} onChange={e => setForm({ ...form, slogan: e.target.value })} className="input" placeholder="La qualite a petit prix" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="textarea" rows={3} />
          </div>
        </form>
      </Section>

      {/* APPARENCE */}
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

      {/* CONTACT & LOCALISATION */}
      <Section icon={MapPin} title="Contact & Localisation" color={primaryColor}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pays *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl">{currentCountry?.flag || ''}</span>
              <select value={form.country} onChange={e => handleCountryChange(e.target.value)} className="select pl-10">
                {AFRICAN_COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
              </select>
            </div>
            {currentCountry && <p className="text-xs text-gray-400 mt-1">Indicatif: {currentCountry.phone}  Devise: {currentCountry.currency}</p>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneInput label="WhatsApp *" required value={form.whatsapp} onChange={v => setForm({ ...form, whatsapp: v })} defaultCountry={currentCountry?.code || 'CM'} />
            <PhoneInput label="Telephone" value={form.phone} onChange={v => setForm({ ...form, phone: v })} defaultCountry={currentCountry?.code || 'CM'} />
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

      {/* LIVRAISON */}
      <Section icon={Truck} title="Livraison" color={primaryColor}>
        <div className="space-y-4">
          <div className="flex gap-6 flex-wrap">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.deliveryEnabled} onChange={e => setForm({ ...form, deliveryEnabled: e.target.checked })} className="w-5 h-5 rounded" />
              <span className="text-sm">Livraison a domicile</span>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Livraison gratuite a partir de</label>
              <input type="number" min="0" value={form.freeDeliveryAbove} onChange={e => setForm({ ...form, freeDeliveryAbove: parseInt(e.target.value)||0 })} className="input" />
            </div>
          </div>
          {form.pickupEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de retrait</label>
              <input type="text" value={form.pickupAddress} onChange={e => setForm({ ...form, pickupAddress: e.target.value })} className="input" placeholder="Marche Central, stand 42" />
            </div>
          )}
        </div>
      </Section>

      {/* PAIEMENT */}
      <Section icon={CreditCard} title="Paiement & Devise" color={primaryColor}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })} className="select">
              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PhoneInput label="Numero Mobile Money" value={form.mobileMoneyNumber} onChange={v => setForm({ ...form, mobileMoneyNumber: v })} defaultCountry={currentCountry?.code || 'CM'} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
              <input type="text" value={form.mobileMoneyName} onChange={e => setForm({ ...form, mobileMoneyName: e.target.value })} className="input" placeholder="Nom affiche" />
            </div>
          </div>
        </div>
      </Section>

      {/* Save button */}
      <div className="flex justify-end gap-4">
        {saved && <span className="flex items-center gap-2 text-emerald-600 font-medium text-sm"><Check className="w-5 h-5" />Sauvegarde !</span>}
        <button type="submit" form="main-form" onClick={handleSave} disabled={saving || uploadingLogo}
          className="btn-primary flex items-center gap-2 px-8" style={{ backgroundColor: primaryColor }}>
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      {/* ── TEMPLATES WHATSAPP ────────────────────────────────────────── */}
      <Section icon={MessageCircle} title="Templates WhatsApp" color="#25D366">
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs text-green-700 leading-relaxed">
            <p className="font-bold mb-1">Variables disponibles :</p>
            <div className="flex flex-wrap gap-1.5">
              {['{{nom}}', '{{reference}}', '{{total}}', '{{reste}}', '{{boutique}}'].map(v => (
                <span key={v} className="bg-white border border-green-200 rounded px-2 py-0.5 font-mono text-green-800">{v}</span>
              ))}
            </div>
            <p className="mt-1.5 text-green-600">Ces variables sont remplacées automatiquement par les vraies valeurs lors de l'envoi.</p>
          </div>

          {Object.entries(TEMPLATE_META).map(([key, meta]) => (
            <div key={key} className="border border-gray-100 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <p className="text-sm font-semibold text-gray-700">{meta.label}</p>
                </div>
                <div className="flex gap-2">
                  {editingTemplate !== key && (
                    <>
                      <button onClick={() => startEdit(key)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors">
                        <Edit3 className="w-3 h-3" />Modifier
                      </button>
                      <button onClick={() => resetTemplate(key)}
                        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-400 hover:bg-gray-100 transition-colors">
                        Reset
                      </button>
                    </>
                  )}
                </div>
              </div>

              {editingTemplate === key ? (
                <div className="p-3 space-y-2">
                  <textarea
                    value={templateDraft}
                    onChange={e => setTemplateDraft(e.target.value)}
                    rows={5}
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-green-300"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingTemplate(null)}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50">
                      Annuler
                    </button>
                    <button onClick={() => saveTemplate(key)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-white hover:opacity-90"
                      style={{ backgroundColor: '#25D366' }}>
                      <Check className="w-3.5 h-3.5 inline mr-1" />Sauvegarder
                    </button>
                  </div>
                </div>
              ) : (
                <div className="px-4 py-3">
                  <p className="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed font-mono">{templates[key]}</p>
                </div>
              )}
            </div>
          ))}

          {templatesSaved && (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle className="w-4 h-4" />Template sauvegardé !
            </div>
          )}

          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
            <p className="font-bold mb-1">💡 Note</p>
            <p>Les templates sont sauvegardés sur cet appareil. Ils seront utilisés automatiquement dans les pages Commandes et Clients.</p>
          </div>
        </div>
      </Section>

      {/* PARTAGER */}
      <Section icon={Share2} title="Partager ma boutique" color="#f97316">
        <div className="space-y-2">
          <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3 border border-gray-100">
            <Globe className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <p className="text-sm text-gray-700 flex-1 truncate font-mono">{shopUrl}</p>
            <button onClick={() => copyToClipboard(shopUrl, 'url')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
              style={{ backgroundColor: copied === 'url' ? '#22c55e' : '#f97316', color: 'white' }}>
              {copied === 'url' ? <><Check className="w-3.5 h-3.5" />Copie</> : <><Copy className="w-3.5 h-3.5" />Copier</>}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <ActionRow icon={Share2} label="Partager le lien" sub="Via les apps installees" color="#f97316" onClick={shareApp} />
            <ActionRow icon={MessageCircle} label="Partager sur WhatsApp" color="#25D366"
              href={`https://wa.me/?text=${encodeURIComponent(` Decouvrez *${shop?.name}* sur ShopMaster !\n${shopUrl}`)}`} external />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ActionRow icon={Smartphone} label="Installer l'app" sub="Ajouter a l'ecran d'accueil" color="#3b82f6"
              onClick={() => alert('Ouvrez ce site dans Chrome/Safari  Menu   "Ajouter a l\'ecran d\'accueil"')} />
            <ActionRow icon={ExternalLink} label="Voir ma boutique" sub={`/${shop?.slug}`} color={primaryColor} href={shopUrl} external />
          </div>
          <div className="mt-3 bg-orange-50 rounded-xl p-3 flex items-start gap-2.5 border border-orange-100">
            <QrCode className="w-4 h-4 text-orange-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-orange-700">
              <p className="font-semibold mb-0.5">Generer un QR Code</p>
              <p>Visitez <span className="font-mono">qr-code-generator.com</span> et collez votre lien boutique.</p>
            </div>
          </div>
        </div>
      </Section>

      {/* MES DONNEES */}
      <Section icon={Database} title="Mes donnees" color="#8b5cf6">
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
                {shop?.planExpiry && <span className="text-xs text-gray-400"> expire {new Date(shop.planExpiry).toLocaleDateString('fr')}</span>}
              </div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Boutique', value: shop?.name?.slice(0,12) || '-', icon: Store, color: primaryColor },
            { label: 'Pays', value: shop?.country || '-', icon: Globe, color: '#3b82f6' },
            { label: 'Devise', value: shop?.currency || '-', icon: CreditCard, color: '#22c55e' },
          ].map(s => (
            <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <s.icon className="w-4 h-4 mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-xs font-bold text-gray-700 truncate">{s.value}</p>
              <p className="text-[10px] text-gray-400">{s.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          <ActionRow icon={Download} label="Exporter mes donnees" sub="Telecharger un fichier JSON" color="#8b5cf6" onClick={downloadData} />
          <ActionRow icon={Mail} label="Demander la suppression du compte" sub="Envoi d'une demande par email" color="#ef4444"
            href={`mailto:${EMAIL_SUPPORT}?subject=Suppression compte ShopMaster&body=Boutique: ${shop?.name}%0AEmail: ${admin?.email}`} external danger />
        </div>
      </Section>

      {/* AIDE & SUPPORT */}
      <Section icon={HelpCircle} title="Aide & Support" color="#22c55e">
        <div className="space-y-1">
          <ActionRow icon={MessageCircle} label="Contacter le support" sub="Reponse en moins de 24h" color="#25D366"
            href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent(`Bonjour ShopMaster Support!\n\nBoutique: ${shop?.name}\nSlug: ${shop?.slug}\n\nMon probleme: `)}`} external />
          <ActionRow icon={Mail} label="Envoyer un email" sub={EMAIL_SUPPORT} color="#3b82f6"
            href={`mailto:${EMAIL_SUPPORT}?subject=Support ShopMaster - ${shop?.name}`} external />
          <div className="mt-3 border border-gray-100 rounded-2xl overflow-hidden">
            <p className="text-xs font-bold text-gray-500 px-4 pt-3 pb-2 bg-gray-50 uppercase tracking-wider">Questions frequentes</p>
            {[
              { q: 'Comment ajouter un produit ?', r: 'Menu Produits → bouton "+" → remplir le formulaire → Sauvegarder.' },
              { q: 'Comment recevoir des commandes ?', r: 'Partagez le lien de votre boutique. Les clients commandent directement en ligne.' },
              { q: 'Comment utiliser les templates WhatsApp ?', r: 'Dans Commandes, ouvrez une commande → section verte "Actions WhatsApp" → cliquez sur le bouton voulu. Le message est envoyé avec les infos de la commande.' },
              { q: 'Comment voir mes clients ?', r: 'Menu Clients → liste de tous vos clients avec historique et boutons WhatsApp.' },
            ].map((faq, i) => (
              <div key={i} className="border-t border-gray-100 px-4 py-3">
                <p className="text-sm font-semibold text-gray-700 mb-1">{faq.q}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{faq.r}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* MISES A JOUR */}
      <Section icon={RefreshCw} title="Mises a jour" color="#14b8a6">
        <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 mb-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-teal-800">Version actuelle</p>
              <p className="text-2xl font-bold text-teal-600 mt-0.5">{APP_VERSION}</p>
              <p className="text-xs text-teal-500">Build {APP_BUILD}</p>
            </div>
            <button onClick={checkUpdate}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: updateStatus === 'latest' ? '#22c55e' : '#14b8a6', color: 'white' }}>
              {updateStatus === 'checking' ? <><Loader2 className="w-4 h-4 animate-spin" />Verification...</>
                : updateStatus === 'latest' ? <><CheckCircle className="w-4 h-4" />A jour !</>
                : <><RefreshCw className="w-4 h-4" />Verifier</>}
            </button>
          </div>
        </div>
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
                      <Check className="w-3 h-3 text-teal-400 mt-0.5 flex-shrink-0" />{h}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* LICENCE */}
      <Section icon={FileText} title="Licence" color="#f59e0b">
        <div className="space-y-3">
          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-bold text-amber-800">ShopMaster Licence Commerciale</p>
                <p className="text-xs text-amber-600 mt-0.5">Plan: <strong>{currentPlan.name}</strong>  Boutique: <strong>{shop?.slug}</strong></p>
                {shop?.planExpiry && (
                  <p className="text-xs text-amber-500 mt-0.5">
                    {new Date(shop.planExpiry) < new Date() ? ' Expiree le' : ' Valide jusqu\'au'} {new Date(shop.planExpiry).toLocaleDateString('fr-FR')}
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <ActionRow icon={ExternalLink} label="Voir les CGU completes" color="#f59e0b"
              href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent('Bonjour, je souhaite recevoir les CGU completes de ShopMaster.')}`} external />
            <ActionRow icon={Mail} label="Licence & facturation" sub="Pour toute question sur votre abonnement" color="#f97316"
              href={`mailto:${EMAIL_SUPPORT}?subject=Licence ShopMaster - ${shop?.slug}`} external />
          </div>
          <div className="text-xs text-gray-400 px-2 leading-relaxed">
            ShopMaster utilise des librairies open-source : React, Next.js, Firebase, Tailwind CSS, Lucide Icons.
          </div>
        </div>
      </Section>

      {/* CONFIDENTIALITE */}
      <Section icon={Shield} title="Confidentialite & Securite" color="#6366f1">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Donnees chiffrees', status: true, desc: 'Firebase SSL/TLS' },
              { label: 'Auth securisee', status: true, desc: 'Firebase Auth' },
              { label: 'Acces PIN', status: false, desc: 'Configurable dans sidebar' },
              { label: 'Sauvegarde auto', status: true, desc: 'Firestore en temps reel' },
            ].map(item => (
              <div key={item.label} className={`rounded-xl p-3 border ${item.status ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'}`}>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {item.status ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <AlertCircle className="w-3.5 h-3.5 text-amber-500" />}
                  <p className={`text-xs font-semibold ${item.status ? 'text-emerald-700' : 'text-amber-700'}`}>{item.label}</p>
                </div>
                <p className="text-[10px] text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <ActionRow icon={Shield} label="Politique de confidentialite" color="#6366f1"
              href={`https://wa.me/${WHATSAPP_SUPPORT}?text=${encodeURIComponent('Bonjour, je souhaite consulter la politique de confidentialite de ShopMaster.')}`} external />
            <ActionRow icon={Lock} label="Modifier mon mot de passe" sub="Reinitialisation par email" color="#8b5cf6"
              href={`mailto:${EMAIL_SUPPORT}?subject=Reinitialisation mot de passe&body=Email: ${admin?.email}`} external />
          </div>
          <div className="flex items-start gap-2.5 bg-indigo-50 rounded-xl p-3 border border-indigo-100">
            <Info className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700">Vos donnees sont hebergees sur <strong>Google Firebase</strong> (serveurs europeens).</p>
          </div>
        </div>
      </Section>

      <div className="text-center py-4 space-y-1">
        <p className="text-xs text-gray-400 font-medium">ShopMaster v{APP_VERSION}  Build {APP_BUILD}</p>
        <p className="text-xs text-gray-300"> 2025-2026 ShopMaster. Tous droits reserves.</p>
        <p className="text-xs text-gray-300">Fait avec  pour les commercants africains</p>
      </div>
    </div>
  );
}