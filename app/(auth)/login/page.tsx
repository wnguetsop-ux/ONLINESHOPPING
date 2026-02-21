'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, ArrowLeft } from 'lucide-react';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      const codes: Record<string, string> = {
        'auth/user-not-found':     'Aucun compte trouvé avec cet email.',
        'auth/wrong-password':     'Mot de passe incorrect.',
        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
        'auth/invalid-email':      'Adresse email invalide.',
        'auth/too-many-requests':  'Trop de tentatives. Réessayez plus tard.',
      };
      setError(codes[err.code] || 'Une erreur est survenue. Réessayez.');
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
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Branding gauche (desktop) ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Store className="w-5 h-5" />
          </div>
          <span className="text-xl font-bold">ShopMaster</span>
        </Link>
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-4">Bienvenue !</h1>
          <p className="text-orange-100 text-lg leading-relaxed">
            Connectez-vous pour gérer votre boutique, scanner vos produits et analyser vos ventes.
          </p>
          <div className="mt-8 space-y-3">
            {[
              '🤖 IA pour analyser vos produits',
              '📷 Scanner de codes-barres',
              '🖨️ Reçus imprimables',
              '🌍 21 pays africains supportés',
            ].map(f => (
              <div key={f} className="text-orange-100 text-sm">{f}</div>
            ))}
          </div>
        </div>
        <div className="text-orange-200 text-sm">© {new Date().getFullYear()} ShopMaster</div>
      </div>

      {/* ── Formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 lg:hidden">
            <ArrowLeft className="w-4 h-4" />Retour
          </Link>
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-800">ShopMaster</span>
          </div>

          {/* ══ CONNEXION ══ */}
          {tab === 'login' && (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Connexion</h2>
              <p className="text-gray-500 mb-8">Accédez à votre espace administration</p>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-6">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
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
                    <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                    <button type="button"
                      onClick={() => { setTab('forgot'); setResetEmail(form.email); setError(''); setSuccess(''); }}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium">
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'} required autoComplete="current-password"
                      value={form.password}
                      onChange={e => setForm({ ...form, password: e.target.value })}
                      className="input pl-12 pr-12"
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-base font-semibold rounded-xl">
                  {loading
                    ? <><Loader2 className="w-5 h-5 animate-spin" />Connexion...</>
                    : 'Se connecter'}
                </button>
              </form>

              <p className="text-center mt-6 text-gray-500 text-sm">
                Pas encore de boutique ?{' '}
                <Link href="/register" className="text-orange-500 hover:text-orange-600 font-semibold">
                  Créer ma boutique
                </Link>
              </p>
            </>
          )}

          {/* ══ MOT DE PASSE OUBLIÉ ══ */}
          {tab === 'forgot' && (
            <>
              <button onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
                className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4" />Retour à la connexion
              </button>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Mot de passe oublié</h2>
              <p className="text-gray-500 mb-6">
                Entrez votre email pour recevoir un lien de réinitialisation.
              </p>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
              )}

              {success ? (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-4 rounded-xl text-sm mb-4">
                  <p className="font-semibold mb-1">✅ Email envoyé !</p>
                  <p>{success}</p>
                  <button onClick={() => { setTab('login'); setSuccess(''); }}
                    className="mt-3 text-orange-500 font-medium hover:text-orange-600">
                    ← Retour connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" required autoComplete="email"
                        value={resetEmail}
                        onChange={e => setResetEmail(e.target.value)}
                        className="input pl-12"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={loading}
                    className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                    {loading
                      ? <><Loader2 className="w-5 h-5 animate-spin" />Envoi...</>
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