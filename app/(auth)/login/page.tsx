'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Mail, Lock, Loader2, Eye, EyeOff, AlertCircle, ArrowLeft, Chrome } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Detect if running inside a WebView (Android/iOS in-app browser)
// Google blocks OAuth in WebViews — we must open the real browser instead
function isWebView(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent;
  return (
    // Android WebView
    /wv\b/.test(ua) ||
    ua.includes('Version/') && ua.includes('Chrome/') && !ua.includes('Mobile Safari') ||
    // Facebook / Instagram in-app browser
    ua.includes('FBAN') || ua.includes('FBAV') || ua.includes('Instagram') ||
    // WhatsApp browser
    ua.includes('WhatsApp') ||
    // Other common WebView signals
    ua.includes('GSA/') // Google Search App
  );
}

// Check if on mobile
function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return /android|iphone|ipad|ipod|mobile/i.test(navigator.userAgent);
}

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [webViewWarning, setWebViewWarning] = useState(false);

  // Handle redirect result when returning from Google OAuth
  useEffect(() => {
    async function checkRedirect() {
      try {
        setGoogleLoading(true);
        const result = await getRedirectResult(auth);
        if (result?.user) {
          const user = result.user;
          const adminSnap = await getDoc(doc(db, 'admins', user.uid));
          if (!adminSnap.exists()) {
            const shopsSnap = await getDocs(query(collection(db, 'shops'), where('ownerId', '==', user.uid)));
            if (shopsSnap.empty) { router.push('/register?google=1'); return; }
          }
          router.push('/admin/dashboard');
        }
      } catch (err: any) {
        if (err.code && err.code !== 'auth/no-current-user') {
          setError('Erreur de connexion Google. Réessayez.');
        }
      } finally {
        setGoogleLoading(false);
      }
    }
    checkRedirect();
  }, []);

  // Detect WebView on mount
  useEffect(() => {
    if (isWebView()) setWebViewWarning(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      const codes: Record<string, string> = {
        'auth/user-not-found':    'Aucun compte trouvé avec cet email.',
        'auth/wrong-password':    'Mot de passe incorrect.',
        'auth/invalid-credential':'Email ou mot de passe incorrect.',
        'auth/invalid-email':     'Adresse email invalide.',
        'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
      };
      setError(codes[err.code] || 'Une erreur est survenue. Réessayez.');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError('');

    // If WebView → show instructions to open in real browser
    if (isWebView()) {
      setWebViewWarning(true);
      return;
    }

    setGoogleLoading(true);
    try {
      if (isMobile()) {
        // Mobile real browser → use redirect (more reliable on mobile)
        await signInWithRedirect(auth, googleProvider);
        // Page will redirect — no code after this runs
      } else {
        // Desktop → popup is fine
        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;
        const adminSnap = await getDoc(doc(db, 'admins', user.uid));
        if (!adminSnap.exists()) {
          const shopsSnap = await getDocs(query(collection(db, 'shops'), where('ownerId', '==', user.uid)));
          if (shopsSnap.empty) { router.push('/register?google=1'); return; }
        }
        router.push('/admin/dashboard');
      }
    } catch (err: any) {
      if (err.code === 'auth/disallowed-useragent' || err.message?.includes('disallowed_useragent')) {
        setWebViewWarning(true);
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setError('Connexion Google impossible. Utilisez votre email et mot de passe.');
      }
    }
    setGoogleLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setSuccess(`Email de réinitialisation envoyé à ${resetEmail}. Vérifiez votre boîte mail.`);
    } catch (err: any) {
      setError(err.code === 'auth/user-not-found' ? 'Aucun compte avec cet email.' : 'Erreur lors de l\'envoi. Réessayez.');
    }
    setLoading(false);
  };

  // Open current URL in system browser (for WebView users)
  function openInBrowser() {
    const url = window.location.href;
    // Try intent URL for Android Chrome
    if (/android/i.test(navigator.userAgent)) {
      window.location.href = `intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      // Fallback: copy URL
      navigator.clipboard?.writeText(url).catch(() => {});
      alert(`Copiez ce lien et ouvrez-le dans Chrome :\n\n${url}`);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-orange-500 to-orange-600 p-12 flex-col justify-between">
        <Link href="/" className="flex items-center gap-3 text-white">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><Store className="w-5 h-5" /></div>
          <span className="text-xl font-bold">ShopMaster</span>
        </Link>
        <div className="text-white">
          <h1 className="text-4xl font-bold mb-4">Bienvenue !</h1>
          <p className="text-orange-100 text-lg leading-relaxed">Connectez-vous pour gérer votre boutique, scanner vos produits et analyser vos ventes.</p>
          <div className="mt-8 space-y-3">
            {['🤖 IA pour analyser vos produits', '📷 Scanner de codes-barres', '🖨️ Reçus imprimables', '🌍 21 pays africains supportés'].map(f => (
              <div key={f} className="flex items-center gap-3 text-orange-100 text-sm">{f}</div>
            ))}
          </div>
        </div>
        <div className="text-orange-200 text-sm">© {new Date().getFullYear()} ShopMaster</div>
      </div>

      {/* Right form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8 lg:hidden">
            <ArrowLeft className="w-4 h-4" />Retour
          </Link>
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center"><Store className="w-5 h-5 text-white" /></div>
            <span className="text-xl font-bold text-gray-800">ShopMaster</span>
          </div>

          {tab === 'login' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Connexion</h2>
              <p className="text-gray-500 mb-6">Accédez à votre espace administration</p>

              {/* ── WebView Warning Banner ─────────────────────────── */}
              {webViewWarning && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">⚠️</span>
                    <div>
                      <p className="font-bold text-amber-800 text-sm">Ouvrez dans Chrome pour Google</p>
                      <p className="text-amber-700 text-xs mt-1 leading-relaxed">
                        La connexion Google ne fonctionne pas dans les navigateurs intégrés (WhatsApp, Facebook, Instagram...).
                        Ouvrez ce lien dans <strong>Chrome</strong> ou votre navigateur habituel.
                      </p>
                      <button onClick={openInBrowser}
                        className="mt-2.5 flex items-center gap-1.5 bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-xl hover:bg-amber-700">
                        <Chrome className="w-3.5 h-3.5" />
                        Ouvrir dans Chrome
                      </button>
                      <p className="text-amber-600 text-xs mt-2">
                        Ou utilisez votre <strong>email + mot de passe</strong> ci-dessous.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Google */}
              <button onClick={handleGoogle} disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-gray-200 rounded-xl font-semibold text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all mb-4 disabled:opacity-60">
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <svg viewBox="0 0 24 24" className="w-5 h-5">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                )}
                Continuer avec Google
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400 font-medium">ou par email</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="input pl-12" placeholder="votre@email.com" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gray-700">Mot de passe</label>
                    <button type="button" onClick={() => { setTab('forgot'); setResetEmail(form.email); setError(''); setSuccess(''); }}
                      className="text-xs text-orange-500 hover:text-orange-600 font-medium">Mot de passe oublié ?</button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className="input pl-12 pr-12" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Connexion...</> : 'Se connecter'}
                </button>
              </form>
              <p className="text-center mt-6 text-gray-500 text-sm">
                Pas encore de boutique ?{' '}<Link href="/register" className="text-orange-500 hover:text-orange-600 font-semibold">Créer ma boutique</Link>
              </p>
            </>
          ) : (
            <>
              <button onClick={() => { setTab('login'); setError(''); setSuccess(''); }} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
                <ArrowLeft className="w-4 h-4" />Retour à la connexion
              </button>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">Mot de passe oublié</h2>
              <p className="text-gray-500 mb-6">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              {error && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2 mb-4"><AlertCircle className="w-5 h-5 flex-shrink-0" />{error}</div>}
              {success ? (
                <div className="bg-emerald-50 text-emerald-700 px-4 py-4 rounded-xl text-sm mb-4">
                  <p className="font-semibold mb-1">✅ Email envoyé !</p>
                  <p>{success}</p>
                  <button onClick={() => setTab('login')} className="mt-3 text-orange-500 font-medium hover:text-orange-600">← Retour connexion</button>
                </div>
              ) : (
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input type="email" required value={resetEmail} onChange={e => setResetEmail(e.target.value)} className="input pl-12" placeholder="votre@email.com" />
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Envoi...</> : 'Envoyer le lien'}
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