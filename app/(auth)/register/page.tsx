'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Mail, Lock, User, Loader2, Eye, EyeOff, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { trackRegistrationComplete, trackLeadClick } from '@/components/MetaPixel';
import { auth } from '@/lib/firebase';
import { createShop, createAdmin, checkSlugAvailable } from '@/lib/firestore';
import { slugify } from '@/lib/utils';
import PhoneInput from '@/components/PhoneInput';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  
  const [form, setForm] = useState({
    // Step 1: Admin info
    name: '',
    email: '',
    phone: '',
    password: '',
    
    // Step 2: Shop info
    shopName: '',
    shopSlug: '',
    shopDescription: '',
    city: '',
    whatsapp: '',
  });

  const handleShopNameChange = async (name: string) => {
    setForm(prev => ({ ...prev, shopName: name }));
    const slug = slugify(name);
    setForm(prev => ({ ...prev, shopSlug: slug }));
    
    if (slug.length >= 3) {
      setCheckingSlug(true);
      setSlugAvailable(null);
      try {
        const available = await checkSlugAvailable(slug);
        setSlugAvailable(available);
      } catch (e) {
        console.error(e);
      }
      setCheckingSlug(false);
    } else {
      setSlugAvailable(null);
    }
  };

  const handleSlugChange = async (slug: string) => {
    const cleanSlug = slugify(slug);
    setForm(prev => ({ ...prev, shopSlug: cleanSlug }));
    
    if (cleanSlug.length >= 3) {
      setCheckingSlug(true);
      setSlugAvailable(null);
      try {
        const available = await checkSlugAvailable(cleanSlug);
        setSlugAvailable(available);
      } catch (e) {
        console.error(e);
      }
      setCheckingSlug(false);
    } else {
      setSlugAvailable(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      // Validation step 1
      if (!form.name || !form.email || !form.password) {
        setError('Veuillez remplir tous les champs obligatoires');
        return;
      }
      if (form.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        return;
      }
      setError('');
      setStep(2);
      return;
    }
    
    // Step 2: Create account and shop
    if (!form.shopName || !form.shopSlug || !form.whatsapp) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    if (slugAvailable === false) {
      setError('Ce nom de boutique est déjà pris');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;
      
      // 2. Create Shop
      const shopId = await createShop({
        slug: form.shopSlug.toLowerCase(),
        ownerId: uid,
        name: form.shopName,
        description: form.shopDescription,
        primaryColor: '#ec4899',
        whatsapp: form.whatsapp.replace(/[^0-9]/g, ''),
        phone: form.phone.replace(/[^0-9+]/g, '') || form.phone,
        city: form.city,
        country: 'Cameroun',
        currency: 'XAF',
        deliveryFee: 1000,
        pickupEnabled: true,
        deliveryEnabled: true,
        planId: 'FREE',
      });
      
      // 3. Create Admin record
      await createAdmin({
        uid,
        email: form.email,
        name: form.name,
        phone: form.phone,
        shopId,
        shopSlug: form.shopSlug.toLowerCase(),
        createdAt: new Date().toISOString(),
      });
      
      // 4. Track conversion Meta Pixel
      trackRegistrationComplete('FREE');

      // 5. Redirect to dashboard
      router.push('/admin/dashboard');
      
    } catch (err: any) {
      console.error('Registration error:', err);
      
      if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.');
      } else if (err.code === 'auth/weak-password') {
        setError('Le mot de passe est trop faible. Utilisez au moins 6 caractères.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Adresse email invalide.');
      } else if (err.message?.includes('déjà pris')) {
        setError(err.message);
      } else {
        setError('Une erreur est survenue. Veuillez réessayer.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 premium-mesh">
      <div className="ambient-panel w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="relative overflow-hidden p-6 text-white text-center" style={{ background: '#0B1220' }}>
          <div className="pointer-events-none absolute inset-0"
               style={{
                 background: `
                   radial-gradient(circle at 88% 8%, rgba(31,185,85,0.35), transparent 50%),
                   radial-gradient(circle at 6% 92%, rgba(255,106,44,0.20), transparent 55%)`,
               }} />
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-wa"
                 style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
              <Store className="w-8 h-8" />
            </div>
            <h1 className="display-serif text-3xl">Crée ta <em className="italic" style={{ color: '#1FB955' }}>boutique</em></h1>
            <p className="text-white/65 mt-2 text-sm font-extrabold tracking-[0.18em] uppercase">Étape {step} sur 2</p>

            {/* Progress bar */}
            <div className="flex gap-2 mt-4 max-w-[200px] mx-auto">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-wa' : 'bg-white/20'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-wa' : 'bg-white/20'}`} />
            </div>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={(e) => { trackLeadClick(); handleSubmit(e); }} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          )}
          
          {step === 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Votre nom *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                    className="input pl-12"
                    placeholder="Jean Pierre"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({...form, email: e.target.value})}
                    className="input pl-12"
                    placeholder="jean@email.com"
                  />
                </div>
              </div>
              
              <div>
                <PhoneInput
                  label="Téléphone"
                  value={form.phone}
                  onChange={(v) => setForm({...form, phone: v})}
                  placeholder="6XX XXX XXX"
                  defaultCountry="CM"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={(e) => setForm({...form, password: e.target.value})}
                    className="input pl-12 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
              </div>
            </>
          )}
          
          {step === 2 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nom de votre boutique *</label>
                <input
                  type="text"
                  required
                  value={form.shopName}
                  onChange={(e) => handleShopNameChange(e.target.value)}
                  className="input"
                  placeholder="Ma Super Boutique"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lien de votre boutique *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">shopmaster.vercel.app/</span>
                  <div className="relative flex-1">
                    <input
                      type="text"
                      required
                      value={form.shopSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      className={`input ${
                        slugAvailable === true ? 'border-emerald-500 focus:border-emerald-500' : 
                        slugAvailable === false ? 'border-red-500 focus:border-red-500' : ''
                      }`}
                      placeholder="ma-boutique"
                    />
                    {checkingSlug && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    {!checkingSlug && slugAvailable === true && (
                      <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                    )}
                    {!checkingSlug && slugAvailable === false && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                {slugAvailable === false && (
                  <p className="text-xs text-red-500 mt-1">Ce nom est déjà pris</p>
                )}
                {slugAvailable === true && (
                  <p className="text-xs text-emerald-500 mt-1">✓ Disponible !</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (optionnel)</label>
                <textarea
                  value={form.shopDescription}
                  onChange={(e) => setForm({...form, shopDescription: e.target.value})}
                  className="textarea"
                  rows={2}
                  placeholder="Décrivez votre boutique en quelques mots..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Ville</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => setForm({...form, city: e.target.value})}
                  className="input"
                  placeholder="Yaoundé, Douala..."
                />
              </div>
              
              <div>
                <PhoneInput
                  label="WhatsApp *"
                  required
                  value={form.whatsapp}
                  onChange={(v) => setForm({...form, whatsapp: v})}
                  placeholder="6XX XXX XXX"
                  defaultCountry="CM"
                />
                <p className="text-xs text-gray-500 mt-1">Numéro WhatsApp de la boutique</p>
              </div>
            </>
          )}
          
          <div className="flex gap-3 pt-4">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary flex-1"
              >
                Retour
              </button>
            )}
            <button
              type="submit"
              disabled={loading || (step === 2 && slugAvailable === false)}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Création...
                </>
              ) : step === 1 ? (
                'Continuer'
              ) : (
                '🚀 Créer ma boutique'
              )}
            </button>
          </div>
        </form>
        
        {/* Footer */}
        <div className="px-6 pb-6 text-center">
          <p className="text-sm text-gray-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-wa-dark hover:text-wa font-extrabold">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}