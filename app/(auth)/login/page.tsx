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
    <div className="min-h-screen flex" style={{ background: 'var(--app-bg)' }}>

      {/* ── Branding gauche (desktop) — premium dark ── */}
      <div className="relative hidden lg:flex lg:w-1/2 p-12 flex-col justify-between overflow-hidden"
           style={{ background: '#0B1220' }}>
        <div className="pointer-events-none absolute inset-0"
             style={{
               background: `
                 radial-gradient(circle at 88% 8%, rgba(31,185,85,0.35), transparent 50%),
                 radial-gradient(circle at 6% 92%, rgba(255,106,44,0.20), transparent 55%)`,
             }} />
        <Link href="/" className="relative flex items-center gap-3 text-white">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-wa"
               style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
            <Store className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold">MasterShopPro</span>
        </Link>
        <div className="relative text-white">
          <div className="inline-flex items-center gap-2 text-[11px] font-extrabold tracking-[0.22em] uppercase text-white/55">
            <span className="pulse-dot" /> Espace administration
          </div>
          <h1 className="display-serif text-5xl mt-3 leading-[1.04]">
            Bon retour <em className="italic" style={{ color: '#1FB955' }}>commerçant.</em>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed mt-4 max-w-md">
            Tes commandes, tes clients, tes brochures IA — tout est là où tu les as laissés.
          </p>
          <div className="mt-8 space-y-3 max-w-md">
            {[
              { e: '🤖', t: 'IA pour générer les fiches en 8 sec' },
              { e: '📷', t: 'Studio Photo IA — fond pro automatique' },
              { e: '🧾', t: 'Brochures WhatsApp prêtes à coller' },
              { e: '🌍', t: 'Pensé pour l\'Afrique francophone' },
            ].map(f => (
              <div key={f.t} className="flex items-center gap-3 text-white/85 text-sm">
                <span className="text-base">{f.e}</span>{f.t}
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-white/40 text-sm font-semibold">© {new Date().getFullYear()} MasterShopPro</div>
      </div>

      {/* ── Formulaire ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          <Link href="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 mb-8 lg:hidden font-bold">
            <ArrowLeft className="w-4 h-4" />Retour
          </Link>
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-wa"
                 style={{ background: 'linear-gradient(135deg,#1FB955,#0E5D32)' }}>
              <Store className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-extrabold text-ink">MasterShopPro</span>
          </div>

          {/* ══ CONNEXION ══ */}
          {tab === 'login' && (
            <>
              <h2 className="display-serif text-4xl text-ink mb-1">Connexion</h2>
              <p className="text-slate-500 mb-8 font-semibold">Accède à ton espace administration</p>

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
                      className="text-xs text-wa-dark hover:text-wa font-medium">
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
                <Link href="/register" className="text-wa-dark hover:text-wa font-semibold">
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
              <h2 className="display-serif text-4xl text-ink mb-1">Mot de passe oublié</h2>
              <p className="text-slate-500 mb-6 font-semibold">
                Entre ton email pour recevoir un lien de réinitialisation.
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
                    className="mt-3 text-wa-dark font-extrabold hover:text-wa">
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