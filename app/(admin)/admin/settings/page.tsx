'use client';
import { useState, useEffect } from 'react';
import { Save, Loader2, Store, Palette, MapPin, Truck, CreditCard, Check } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { updateShop } from '@/lib/firestore';

const COLORS = ['#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#a855f7'];

export default function SettingsPage() {
  const { shop, refreshShop } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
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
    currency: 'XAF' as 'XAF' | 'EUR' | 'USD',
    deliveryFee: 1000,
    freeDeliveryAbove: 0,
    pickupAddress: '',
    pickupEnabled: true,
    deliveryEnabled: true,
    mobileMoneyNumber: '',
    mobileMoneyName: '',
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
      });
    }
  }, [shop]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!shop?.id) return;
    
    setSaving(true);
    try {
      await updateShop(shop.id, form);
      await refreshShop();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde');
    }
    setSaving(false);
  }

  const primaryColor = form.primaryColor;

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {/* Shop Identity */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Store className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Identité de la boutique</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la boutique *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({...form, name: e.target.value})}
              className="input"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slogan</label>
            <input
              type="text"
              value={form.slogan}
              onChange={(e) => setForm({...form, slogan: e.target.value})}
              className="input"
              placeholder="Ex: La qualité à petit prix"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({...form, description: e.target.value})}
              className="textarea"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Appearance */}
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
              <button
                key={color}
                type="button"
                onClick={() => setForm({...form, primaryColor: color})}
                className="w-10 h-10 rounded-xl transition-transform hover:scale-110"
                style={{ backgroundColor: color, outline: form.primaryColor === color ? `3px solid ${color}` : 'none', outlineOffset: '2px' }}
              >
                {form.primaryColor === color && <Check className="w-5 h-5 text-white mx-auto" />}
              </button>
            ))}
            <input
              type="color"
              value={form.primaryColor}
              onChange={(e) => setForm({...form, primaryColor: e.target.value})}
              className="w-10 h-10 rounded-xl cursor-pointer border-2 border-dashed border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <MapPin className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Contact & Localisation</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp *</label>
            <input
              type="tel"
              required
              value={form.whatsapp}
              onChange={(e) => setForm({...form, whatsapp: e.target.value})}
              className="input"
              placeholder="237677123456"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({...form, phone: e.target.value})}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({...form, email: e.target.value})}
              className="input"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({...form, city: e.target.value})}
              className="input"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Adresse</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({...form, address: e.target.value})}
              className="input"
            />
          </div>
        </div>
      </div>

      {/* Delivery */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <Truck className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Livraison</h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.deliveryEnabled}
                onChange={(e) => setForm({...form, deliveryEnabled: e.target.checked})}
                className="w-5 h-5 rounded"
              />
              <span>Livraison à domicile</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.pickupEnabled}
                onChange={(e) => setForm({...form, pickupEnabled: e.target.checked})}
                className="w-5 h-5 rounded"
              />
              <span>Retrait sur place</span>
            </label>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Frais de livraison</label>
              <input
                type="number"
                min="0"
                value={form.deliveryFee}
                onChange={(e) => setForm({...form, deliveryFee: parseInt(e.target.value) || 0})}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Livraison gratuite à partir de</label>
              <input
                type="number"
                min="0"
                value={form.freeDeliveryAbove}
                onChange={(e) => setForm({...form, freeDeliveryAbove: parseInt(e.target.value) || 0})}
                className="input"
              />
            </div>
          </div>
          
          {form.pickupEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de retrait</label>
              <input
                type="text"
                value={form.pickupAddress}
                onChange={(e) => setForm({...form, pickupAddress: e.target.value})}
                className="input"
                placeholder="Ex: Carrefour Bastos, à côté de..."
              />
            </div>
          )}
        </div>
      </div>

      {/* Payment */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
            <CreditCard className="w-5 h-5" style={{ color: primaryColor }} />
          </div>
          <h2 className="font-bold text-gray-800 text-lg">Paiement</h2>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
            <select
              value={form.currency}
              onChange={(e) => setForm({...form, currency: e.target.value as any})}
              className="select"
            >
              <option value="XAF">FCFA (XAF)</option>
              <option value="EUR">Euro (EUR)</option>
              <option value="USD">Dollar (USD)</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numéro Mobile Money</label>
              <input
                type="tel"
                value={form.mobileMoneyNumber}
                onChange={(e) => setForm({...form, mobileMoneyNumber: e.target.value})}
                className="input"
                placeholder="+237 6XX XXX XXX"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom du compte</label>
              <input
                type="text"
                value={form.mobileMoneyName}
                onChange={(e) => setForm({...form, mobileMoneyName: e.target.value})}
                className="input"
                placeholder="Nom affiché sur MoMo"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        {saved && (
          <span className="flex items-center gap-2 text-emerald-600 font-medium">
            <Check className="w-5 h-5" /> Sauvegardé !
          </span>
        )}
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-8"
          style={{ backgroundColor: primaryColor }}
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>
    </form>
  );
}