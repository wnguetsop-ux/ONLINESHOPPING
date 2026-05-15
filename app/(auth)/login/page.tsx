'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle, ArrowLeft, Eye, EyeOff,
  Loader2, Lock, Mail, ShoppingBag,
} from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

const ERROR_CODES: Record<string, string> = {
  'auth/user-not-found':     'Aucun compte trouvé avec cet email.',
  'auth/wrong-password':     'Mot de passe incorrect.',
  'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  'auth/invalid-email':      'Adresse email invalide.',
  'auth/too-many-requests':  'Trop de tentatives. Réessayez plus tard.',
};

export default function LoginPage() {
  const router = useRouter();
  const [tab,          setTab]          = useState<'login' | 'forgot'>('login');
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState('');
  const [success,      setSuccess]      = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form,         setForm]         = useState({ email: '', password: '' });
  const [resetEmail,   setResetEmail]   = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push('/admin/orders');
    } catch (err: any) {
      setError(ERROR_CODES[err.code] || 'Une erreur est survenue. Réessayez.');
    }
    setLoading(false);
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccess(`Email envoyé à ${resetEmail}. Vérifiez votre boîte mail.`);
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found'
        ? 'Aucun compte avec cet email.'
        : "Erreur lors de l'envoi. Réessayez.");
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-app-bg flex">

      {/* ── Left branding panel (desktop only) ────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] bg-gradient-to-br from-wa to-wa-dark flex-col justify-between p-12 flex-shrink-0">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">MasterShopPro</span>
        </Link>

        <div className="text-white">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4 leading-tight">
            Vous vendez<br />sur WhatsApp.
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mb-8">
            On organise le reste. Gérez vos commandes, suivez vos paiements, développez votre activité.
          </p>
          <div className="space-y-3">
            {[
              '💬 Commandes WhatsApp centralisées',
              '📱 Mobile Money (Wave, Orange, MTN)',
              '🤖 IA pour analyser vos produits',
              '🌍 12 pays africains supportés',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-white/80 text-[15px]">
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/40 text-sm">© {new Date().getFullYear()} MasterShopPro</p>
      </div>

      {/* ── Form panel ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md animate-fadeIn">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 text-sm font-medium">
              <ArrowLeft className="w-4 h-4" /> Retour
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-wa rounded-xl flex items-center justify-center shadow-wa">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900">MasterShopPro</span>
            </div>
          </div>

          {/* ══ LOGIN FORM ══════════════════════════════════════════════════ */}
          {tab === 'login' && (
            <>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Connexion</h2>
              <p className="text-slate-500 mb-8">Accédez à votre espace boutique</p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 mb-6">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email" required autoComplete="email"
                      value={form.email}
                      onChange={e => setForm({ ...form, email: e.target.value })}
                      className="input pl-12"
                      placeholder="votre@email.com"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-semibold text-slate-700">Mot de passe</label>
                    <button
                      type="button"
                      onClick={() => { setTab('forgot'); setResetEmail(form.email); setError(''); setSuccess(''); }}
                      className="text-xs text-wa-dark hover:underline font-semibold"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input pl-12 pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-wa w-full h-14 text-base rounded-2xl mt-2"
                >
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Connexion...</>
                    : 'Se connecter'}
                </button>
              </form>

              <p className="text-center mt-6 text-slate-500 text-sm">
                Pas encore de boutique ?{' '}
                <Link href="/register" className="text-wa-dark hover:underline font-bold">
                  Créer ma boutique
                </Link>
              </p>
            </>
          )}

          {/* ══ FORGOT PASSWORD ═════════════════════════════════════════════ */}
          {tab === 'forgot' && (
            <>
              <button
                onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-6 text-sm font-medium"
              >
                <ArrowLeft className="w-4 h-4" /> Retour à la connexion
              </button>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-1 tracking-tight">Mot de passe oublié</h2>
              <p className="text-slate-500 mb-6">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm flex items-center gap-2 mb-4">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
                </div>
              )}

              {success ? (
                <div className="bg-wa-soft border border-wa-border text-wa-dark px-4 py-4 rounded-2xl text-sm mb-4">
                  <p className="font-bold mb-1">✅ Email envoyé !</p>
                  <p>{success}</p>
                  <button
                    onClick={() => { setTab('login'); setSuccess(''); }}
                    className="mt-3 text-wa-dark font-bold hover:underline"
                  >
                    ← Retour connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input
                        type="email" required autoComplete="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        className="input pl-12"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-wa w-full h-14 text-base rounded-2xl"
                  >
                    {loading
                      ? <><Loader2 className="w-5 h-5 animate-spin" /> Envoi...</>
                      : 'Envoyer le lien'}
                  </button>
                </form>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
