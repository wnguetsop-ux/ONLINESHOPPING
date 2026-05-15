'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle, ArrowLeft, CheckCircle, Eye, EyeOff,
  Loader2, Lock, Mail, Phone, ShoppingBag, Store, User,
} from 'lucide-react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { trackRegistrationComplete, trackLeadClick } from '@/components/MetaPixel';
import { auth } from '@/lib/firebase';
import { createShop, createAdmin, checkSlugAvailable } from '@/lib/firestore';
import { slugify } from '@/lib/utils';
import PhoneInput from '@/components/PhoneInput';

export default function RegisterPage() {
  const router = useRouter();
  const [step,          setStep]          = useState(1);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [showPassword,  setShowPassword]  = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug,  setCheckingSlug]  = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '',
    shopName: '', shopSlug: '', shopDescription: '', city: '', whatsapp: '',
  });

  async function handleShopNameChange(name: string) {
    setForm(prev => ({ ...prev, shopName: name }));
    const slug = slugify(name);
    setForm(prev => ({ ...prev, shopSlug: slug }));
    if (slug.length >= 3) {
      setCheckingSlug(true); setSlugAvailable(null);
      try { setSlugAvailable(await checkSlugAvailable(slug)); } catch {}
      setCheckingSlug(false);
    } else { setSlugAvailable(null); }
  }

  async function handleSlugChange(slug: string) {
    const clean = slugify(slug);
    setForm(prev => ({ ...prev, shopSlug: clean }));
    if (clean.length >= 3) {
      setCheckingSlug(true); setSlugAvailable(null);
      try { setSlugAvailable(await checkSlugAvailable(clean)); } catch {}
      setCheckingSlug(false);
    } else { setSlugAvailable(null); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (!form.name || !form.email || !form.password) { setError('Veuillez remplir tous les champs obligatoires'); return; }
      if (form.password.length < 6) { setError('Le mot de passe doit contenir au moins 6 caractères'); return; }
      setError(''); setStep(2); return;
    }
    if (!form.shopName || !form.shopSlug || !form.whatsapp) { setError('Veuillez remplir tous les champs obligatoires'); return; }
    if (slugAvailable === false) { setError('Ce nom de boutique est déjà pris'); return; }

    setLoading(true); setError('');
    try {
      const { user } = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const shopId = await createShop({
        slug: form.shopSlug.toLowerCase(),
        ownerId: user.uid,
        name: form.shopName,
        description: form.shopDescription,
        primaryColor: '#25D366',
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
      await createAdmin({
        uid: user.uid, email: form.email, name: form.name,
        phone: form.phone, shopId, shopSlug: form.shopSlug.toLowerCase(),
        createdAt: new Date().toISOString(),
      });
      trackRegistrationComplete('FREE');
      router.push('/admin/orders');
    } catch (err: any) {
      if      (err.code === 'auth/email-already-in-use') setError('Cet email est déjà utilisé. Connectez-vous ou utilisez un autre email.');
      else if (err.code === 'auth/weak-password')        setError('Mot de passe trop faible. Minimum 6 caractères.');
      else if (err.code === 'auth/invalid-email')        setError('Adresse email invalide.');
      else if (err.message?.includes('déjà pris'))       setError(err.message);
      else                                                setError('Une erreur est survenue. Réessayez.');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-app-bg flex">

      {/* ── Left branding panel (desktop) ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col justify-between p-12 flex-shrink-0"
        style={{ background: 'radial-gradient(60% 70% at 20% 30%, rgba(31,185,85,0.22) 0%, transparent 60%), #0B1220' }}
      >
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">MasterShopPro</span>
        </Link>

        <div className="text-white">
          <h1 className="display-serif text-4xl mb-4 leading-tight">
            Créez votre boutique<br />en 2 minutes.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            Gratuit pour commencer. Gérez vos commandes WhatsApp dès aujourd&apos;hui.
          </p>
          <div className="space-y-3">
            {[
              '✅ Aucune carte bancaire requise',
              '📦 8 commandes gratuites pour tester',
              '📱 Mobile Money intégré (Wave, Orange, MTN)',
              '🌍 12 pays africains supportés',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/80 text-[15px]">{f}</div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-sm">© {new Date().getFullYear()} MasterShopPro</p>
      </div>

      {/* ── Form panel ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fadeIn">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-wa rounded-xl flex items-center justify-center shadow-wa">
                <Store className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">MasterShopPro</span>
            </div>
          </div>

          {/* Title + progress */}
          <div className="mb-8">
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Créer ma boutique</h2>
            <p className="text-slate-500 mt-1 text-sm">Étape {step} sur 2</p>
            <div className="flex gap-2 mt-4">
              <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 1 ? 'bg-wa' : 'bg-slate-200'}`} />
              <div className={`h-1.5 flex-1 rounded-full transition-all ${step >= 2 ? 'bg-wa' : 'bg-slate-200'}`} />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 mb-6">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
            </div>
          )}

          <form onSubmit={e => { trackLeadClick(); handleSubmit(e); }} className="space-y-4">

            {/* ── Step 1 ──────────────────────────────────────────────────── */}
            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Votre nom *</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                      className="input pl-12" placeholder="Jean Pierre" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type="email" required autoComplete="email" value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="input pl-12" placeholder="jean@email.com" />
                  </div>
                </div>

                <div>
                  <PhoneInput label="Téléphone" value={form.phone}
                    onChange={v => setForm({ ...form, phone: v })}
                    placeholder="6XX XXX XXX" defaultCountry="CM" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Mot de passe *</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input type={showPassword ? 'text' : 'password'} required minLength={6}
                      autoComplete="new-password" value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input pl-12 pr-12" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Minimum 6 caractères</p>
                </div>
              </>
            )}

            {/* ── Step 2 ──────────────────────────────────────────────────── */}
            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nom de votre boutique *</label>
                  <input type="text" required value={form.shopName}
                    onChange={e => handleShopNameChange(e.target.value)}
                    className="input" placeholder="Ma Super Boutique" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Lien de votre boutique *</label>
                  <div className="flex items-center bg-slate-50 border border-app-border rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-wa/30 focus-within:border-wa">
                    <span className="text-slate-400 text-sm pl-4 whitespace-nowrap">mastershoppro.com/</span>
                    <div className="relative flex-1">
                      <input type="text" required value={form.shopSlug}
                        onChange={e => handleSlugChange(e.target.value)}
                        className={`w-full bg-transparent px-2 py-3.5 text-sm font-medium text-slate-800 outline-none border-none ${
                          slugAvailable === true  ? 'text-emerald-700' :
                          slugAvailable === false ? 'text-red-600' : ''
                        }`}
                        placeholder="ma-boutique" />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingSlug         && <Loader2   className="w-4 h-4 text-slate-400 animate-spin" />}
                        {!checkingSlug && slugAvailable === true  && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                        {!checkingSlug && slugAvailable === false && <AlertCircle className="w-4 h-4 text-red-500" />}
                      </div>
                    </div>
                  </div>
                  {slugAvailable === false && <p className="text-xs text-red-500 mt-1.5">Ce nom est déjà pris</p>}
                  {slugAvailable === true  && <p className="text-xs text-wa-dark mt-1.5 font-semibold">Disponible !</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Description <span className="text-slate-400 font-normal">(optionnel)</span></label>
                  <textarea value={form.shopDescription}
                    onChange={e => setForm({ ...form, shopDescription: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-app-border rounded-2xl text-sm text-slate-800 outline-none focus:border-wa focus:ring-2 focus:ring-wa/20 resize-none"
                    rows={2} placeholder="Décrivez votre boutique en quelques mots..." />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Ville</label>
                  <input type="text" value={form.city}
                    onChange={e => setForm({ ...form, city: e.target.value })}
                    className="input" placeholder="Yaoundé, Douala..." />
                </div>

                <div>
                  <PhoneInput label="Numéro WhatsApp *" required value={form.whatsapp}
                    onChange={v => setForm({ ...form, whatsapp: v })}
                    placeholder="6XX XXX XXX" defaultCountry="CM" />
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Numéro WhatsApp de votre boutique
                  </p>
                </div>
              </>
            )}

            {/* ── Actions ─────────────────────────────────────────────────── */}
            <div className="flex gap-3 pt-2">
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 h-14 rounded-2xl border border-app-border bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors">
                  Retour
                </button>
              )}
              <button type="submit"
                disabled={loading || (step === 2 && slugAvailable === false)}
                className="btn-wa flex-1 h-14 text-base rounded-2xl">
                {loading
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Création...</>
                  : step === 1 ? 'Continuer' : 'Créer ma boutique'}
              </button>
            </div>
          </form>

          <p className="text-center mt-6 text-slate-500 text-sm">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-wa-dark hover:underline font-bold">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
