'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Info,
  Lock,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Wallet,
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useAuth } from '@/hooks/useAuth';
import { getMerchantWhatsappAccounts, upsertMerchantWhatsappAccount } from '@/lib/merchant-firestore';
import { evaluateOutboundMessageSafety } from '@/lib/whatsapp-outbound-safety';
import { MerchantWhatsappAccount } from '@/lib/types';
import PhoneInput from '@/components/PhoneInput';

const META_SETUP_URL = 'https://developers.facebook.com/apps/2156393638456818/dashboard/';
const FB_APP_ID = (process.env.NEXT_PUBLIC_WHATSAPP_APP_ID || '2156393638456818').trim();
const FB_CONFIG_ID = (process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID || '').trim();
const FB_GRAPH_VERSION = 'v22.0';

declare global {
  interface Window {
    FB?: {
      init: (opts: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }) => void;
      login: (
        cb: (r: { authResponse?: { code?: string } | null; status?: string }) => void,
        opts: Record<string, unknown>
      ) => void;
    };
    fbAsyncInit?: () => void;
  }
}

function StatusBadge({ status }: { status: MerchantWhatsappAccount['status'] }) {
  const config =
    status === 'connected'
      ? 'bg-wa-soft text-wa-dark border border-wa-border'
      : status === 'pending'
        ? 'bg-amber-50 text-amber-700 border border-amber-200'
        : status === 'error'
          ? 'bg-red-50 text-red-600 border border-red-200'
          : 'bg-slate-100 text-slate-500 border border-slate-200';

  const label =
    status === 'connected'
      ? 'Connecte'
      : status === 'pending'
        ? 'En cours'
        : status === 'error'
          ? 'Erreur'
          : 'Non connecte';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${config}`}>
      {status === 'connected' && (
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-wa opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-wa" />
        </span>
      )}
      {label}
    </span>
  );
}

function WorkflowBadge({
  step,
}: {
  step?: MerchantWhatsappAccount['setupStep'];
}) {
  if (!step || step === 'draft') return null;

  const map = {
    meta_signup: 'Connexion Meta lancee',
    migration_required: 'Coexistence a finaliser',
    awaiting_verification: 'Verification en cours',
    connected: 'Pret a recevoir les messages',
  } as const;

  const tone =
    step === 'connected'
      ? 'bg-wa-soft text-wa-dark border-wa-border'
      : step === 'migration_required'
        ? 'bg-red-50 text-red-600 border-red-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${tone}`}>
      {map[step]}
    </span>
  );
}

function StepCard({
  step,
  title,
  copy,
  done,
}: {
  step: string;
  title: string;
  copy: string;
  done?: boolean;
}) {
  return (
    <div className={`rounded-3xl border p-4 transition-all ${done ? 'border-wa-border bg-wa-soft' : 'border-app-border bg-white'}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-2xl text-sm font-black ${done ? 'bg-wa text-white' : 'bg-slate-100 text-slate-500'}`}>
          {done ? <CheckCircle2 className="h-4 w-4" /> : step}
        </div>
        <p className="text-sm font-black text-slate-900">{title}</p>
      </div>
      <p className="text-sm leading-7 text-slate-600">{copy}</p>
    </div>
  );
}

export default function WhatsAppPage() {
  const { shop } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [accounts, setAccounts] = useState<MerchantWhatsappAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);
  const [requestedPhoneNumber, setRequestedPhoneNumber] = useState('');
  const [phoneNumberId, setPhoneNumberId] = useState('');
  const [wabaId, setWabaId] = useState('');
  const [metaBusinessEmail, setMetaBusinessEmail] = useState('');
  const [fbReady, setFbReady] = useState(false);
  const [esLaunching, setEsLaunching] = useState(false);
  const [esError, setEsError] = useState('');
  const [esDebug, setEsDebug] = useState<{
    startedAt?: string;
    popupAttempted?: boolean;
    authCodeReceived?: boolean;
    waEventReceived?: boolean;
    waEventName?: string;
    lastStatus?: string;
    lastPayload?: string;
    lastError?: string;
  }>({});

  // Charge le SDK Meta JS une fois (web-only). Sans FB_CONFIG_ID on n initialise
  // pas : l admin voit un message explicatif a la place.
  useEffect(() => {
    if (!FB_CONFIG_ID) return;
    if (window.FB) { setFbReady(true); return; }
    window.fbAsyncInit = () => {
      window.FB!.init({ appId: FB_APP_ID, cookie: true, xfbml: false, version: FB_GRAPH_VERSION });
      setFbReady(true);
    };
    const s = document.createElement('script');
    s.async = true;
    s.defer = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://connect.facebook.net/en_US/sdk.js';
    document.body.appendChild(s);
    return () => { s.remove(); };
  }, []);

  // Ecoute les evenements postMessage que Meta envoie pendant Embedded Signup.
  // On stocke { wabaId, phoneNumberId, businessId } pour l appel serveur.
  const [esPayload, setEsPayload] = useState<{ waba_id?: string; phone_number_id?: string; business_id?: string } | null>(null);
  const esPayloadRef = useRef<typeof esPayload>(null);
  const handledRedirectCodeRef = useRef<string | null>(null);
  useEffect(() => {
    function onMsg(ev: MessageEvent) {
      if (typeof ev.data !== 'string' && typeof ev.data !== 'object') return;
      try {
        const data = typeof ev.data === 'string' ? JSON.parse(ev.data) : ev.data;
        if (data?.type !== 'WA_EMBEDDED_SIGNUP') return;
        setEsDebug((current) => ({
          ...current,
          waEventReceived: true,
          waEventName: String(data?.event || ''),
          lastPayload: JSON.stringify(data?.data || data).slice(0, 500),
        }));
        if (
          (data?.event === 'FINISH' || data?.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING') &&
          data?.data
        ) {
          esPayloadRef.current = data.data;
          setEsPayload(data.data);
        }
        if (data?.event === 'CANCEL') setEsError('Connexion Meta annulee.');
      } catch { /* pas un JSON WA_EMBEDDED_SIGNUP */ }
    }
    window.addEventListener('message', onMsg);
    return () => window.removeEventListener('message', onMsg);
  }, []);

  async function launchEmbeddedSignup() {
    setEsError('');
    if (!FB_CONFIG_ID) {
      setEsError('NEXT_PUBLIC_WHATSAPP_CONFIG_ID manquant : cree la config Embedded Signup dans Meta avant.');
      return;
    }
    if (!fbReady || !window.FB) {
      setEsError('SDK Meta en cours de chargement, reessaie dans une seconde.');
      return;
    }
    if (!shop?.id) return;
    setEsLaunching(true);
    esPayloadRef.current = null;
    setEsPayload(null);
    setEsDebug({
      startedAt: new Date().toISOString(),
      popupAttempted: false,
      authCodeReceived: false,
      waEventReceived: false,
      waEventName: '',
      lastStatus: '',
      lastPayload: '',
      lastError: '',
    });

    const loginTimeout = window.setTimeout(() => {
      setEsLaunching(false);
      setEsDebug((current) => ({
        ...current,
        lastError: 'Timeout: Meta n a pas termine la connexion dans le delai imparti.',
      }));
      setEsError(
        'Meta n a pas termine la connexion. Verifie que la fenetre Facebook n est pas bloquee, puis reessaie.'
      );
    }, 90000);

    try {
      setEsDebug((current) => ({ ...current, popupAttempted: true }));
      window.FB.login(
        (response) => {
          void (async () => {
            window.clearTimeout(loginTimeout);
            setEsDebug((current) => ({
              ...current,
              lastStatus: String(response?.status || ''),
              authCodeReceived: Boolean(response?.authResponse?.code),
            }));
            const code = response?.authResponse?.code;
            if (!code) {
              setEsLaunching(false);
              setEsDebug((current) => ({
                ...current,
                lastError: 'Meta n a retourne aucun code OAuth.',
              }));
              setEsError('Aucun code retourne par Meta. Verifie que le numero est valide puis reessaie.');
              return;
            }
            // Attend un tick que l event postMessage remonte le wabaId/phone_number_id.
            const payload = await waitForEsPayload();
            if (!payload?.waba_id || !payload?.phone_number_id) {
              setEsLaunching(false);
              setEsDebug((current) => ({
                ...current,
                lastError: 'Aucun evenement WA_EMBEDDED_SIGNUP complet n a ete recu.',
                lastPayload: payload ? JSON.stringify(payload).slice(0, 500) : current.lastPayload,
              }));
              setEsError('Meta n a pas renvoye les identifiants WABA. Recharge la page et reessaie.');
              return;
            }
            try {
              const user = getAuth().currentUser;
              const idToken = user ? await user.getIdToken() : '';
              const res = await fetch('/api/whatsapp/oauth/exchange', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                  code,
                  wabaId: payload.waba_id,
                  phoneNumberId: payload.phone_number_id,
                  businessAccountId: payload.business_id,
                }),
              });
              const json = await res.json();
              if (!res.ok) {
                setEsDebug((current) => ({
                  ...current,
                  lastError: JSON.stringify(json).slice(0, 500),
                }));
                if (json?.setupStep === 'migration_required') {
                  setEsError('Ce numero est deja utilise sur un autre compte Cloud API. Parcours migration necessaire.');
                } else {
                  setEsError(json?.message || json?.error || 'Echec de la connexion Meta.');
                }
              } else {
                if (payload.phone_number_id) setPhoneNumberId(payload.phone_number_id);
                if (payload.waba_id) setWabaId(payload.waba_id);
                const refreshed = await getMerchantWhatsappAccounts(shop.id);
                setAccounts(refreshed);
                setSaved(true);
                setTimeout(() => setSaved(false), 2500);
              }
            } catch (e) {
              setEsDebug((current) => ({
                ...current,
                lastError: e instanceof Error ? e.message : 'Erreur reseau pendant l echange du code.',
              }));
              setEsError(e instanceof Error ? e.message : 'Erreur reseau pendant l echange du code.');
            } finally {
              setEsLaunching(false);
            }
          })();
        },
        {
          config_id: FB_CONFIG_ID,
          response_type: 'code',
          override_default_response_type: true,
          extras: {
            setup: {},
            version: 'v3',
            featureType: 'whatsapp_business_app_onboarding',
            sessionInfoVersion: '3',
          },
        }
      );
    } catch (error) {
      window.clearTimeout(loginTimeout);
      setEsLaunching(false);
      setEsDebug((current) => ({
        ...current,
        lastError: error instanceof Error ? error.message : 'Impossible d ouvrir la connexion Meta.',
      }));
      setEsError(error instanceof Error ? error.message : 'Impossible d ouvrir la connexion Meta.');
    }
  }

  function launchRedirectSignup() {
    setEsError('');
    setEsDebug({
      startedAt: new Date().toISOString(),
      popupAttempted: false,
      authCodeReceived: false,
      waEventReceived: false,
      waEventName: 'redirect_fallback',
      lastStatus: 'redirect_started',
      lastPayload: '',
      lastError: '',
    });

    const target = new URL('/api/whatsapp/oauth/start', window.location.origin);
    target.searchParams.set('returnTo', '/admin/whatsapp');
    if (phoneNumberId.trim()) target.searchParams.set('phoneNumberId', phoneNumberId.trim());
    if (wabaId.trim()) target.searchParams.set('wabaId', wabaId.trim());
    if (requestedPhoneNumber.trim()) target.searchParams.set('requestedPhoneNumber', requestedPhoneNumber.trim());
    window.location.href = target.toString();
  }

  useEffect(() => {
    const waCode = searchParams.get('wa_code');
    const waError = searchParams.get('wa_error');
    const waErrorReason = searchParams.get('wa_error_reason');
    const urlPhoneNumberId = searchParams.get('wa_phone_number_id');
    const urlWabaId = searchParams.get('wa_waba_id');
    const urlRequestedNumber = searchParams.get('wa_requested_number');
    if (urlPhoneNumberId) setPhoneNumberId(urlPhoneNumberId);
    if (urlWabaId) setWabaId(urlWabaId);
    if (urlRequestedNumber) setRequestedPhoneNumber(urlRequestedNumber);

    if (waError) {
      setEsError(`Meta a renvoye une erreur : ${waError}${waErrorReason ? ` (${waErrorReason})` : ''}.`);
      setEsDebug((current) => ({
        ...current,
        lastStatus: 'redirect_error',
        lastError: `${waError}${waErrorReason ? ` (${waErrorReason})` : ''}`,
      }));
      router.replace('/admin/whatsapp');
      return;
    }

    if (!waCode || handledRedirectCodeRef.current === waCode || !shop?.id) return;
    handledRedirectCodeRef.current = waCode;

    const finalPhoneNumberId = urlPhoneNumberId || phoneNumberId.trim();
    const finalWabaId = urlWabaId || wabaId.trim();
    if (!finalPhoneNumberId || !finalWabaId) {
      setEsError('Le retour Meta a bien eu lieu, mais il manque le Phone Number ID ou le WABA ID pour terminer la connexion.');
      setEsDebug((current) => ({
        ...current,
        authCodeReceived: true,
        lastStatus: 'redirect_missing_ids',
        lastError: 'Phone Number ID ou WABA ID manquant apres le retour Meta.',
      }));
      router.replace('/admin/whatsapp');
      return;
    }

    setEsLaunching(true);
    setEsError('');
    setEsDebug((current) => ({
      ...current,
      authCodeReceived: true,
      lastStatus: 'redirect_code_received',
      lastError: '',
    }));

    void (async () => {
      try {
        const user = getAuth().currentUser;
        const idToken = user ? await user.getIdToken() : '';
        const redirectUri = new URL('/api/whatsapp/oauth/callback', window.location.origin).toString();
        const res = await fetch('/api/whatsapp/oauth/exchange', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            code: waCode,
            wabaId: finalWabaId,
            phoneNumberId: finalPhoneNumberId,
            displayPhoneNumber: urlRequestedNumber || requestedPhoneNumber.trim(),
            redirectUri,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setEsDebug((current) => ({
            ...current,
            lastStatus: 'redirect_exchange_failed',
            lastError: JSON.stringify(json).slice(0, 500),
          }));
          setEsError(json?.message || json?.error || 'Echec de la connexion Meta en mode redirection.');
          return;
        }

        const refreshed = await getMerchantWhatsappAccounts(shop.id);
        setAccounts(refreshed);
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
        setEsDebug((current) => ({
          ...current,
          lastStatus: 'redirect_exchange_ok',
          lastError: '',
        }));
      } catch (error) {
        setEsDebug((current) => ({
          ...current,
          lastStatus: 'redirect_exchange_error',
          lastError: error instanceof Error ? error.message : 'Erreur inconnue pendant la finalisation.',
        }));
        setEsError(error instanceof Error ? error.message : 'Erreur inconnue pendant la finalisation.');
      } finally {
        setEsLaunching(false);
        router.replace('/admin/whatsapp');
      }
    })();
  }, [phoneNumberId, requestedPhoneNumber, router, searchParams, shop?.id, wabaId]);

  function waitForEsPayload(timeoutMs = 2000): Promise<typeof esPayload> {
    return new Promise((resolve) => {
      if (esPayloadRef.current?.waba_id && esPayloadRef.current?.phone_number_id) {
        return resolve(esPayloadRef.current);
      }
      const start = Date.now();
      const iv = setInterval(() => {
        if (esPayloadRef.current?.waba_id && esPayloadRef.current?.phone_number_id) {
          clearInterval(iv);
          resolve(esPayloadRef.current);
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(iv);
          resolve(esPayloadRef.current);
        }
      }, 100);
    });
  }

  useEffect(() => {
    if (!shop?.id) return;
    getMerchantWhatsappAccounts(shop.id)
      .then((items) => {
        setAccounts(items);
        if (items[0]) {
          setRequestedPhoneNumber(items[0].requestedPhoneNumber || items[0].displayPhoneNumber || shop.whatsapp || '');
          setPhoneNumberId(items[0].phoneNumberId || '');
          setWabaId(items[0].wabaId || '');
          setMetaBusinessEmail(items[0].metaBusinessEmail || shop.email || '');
        } else {
          setRequestedPhoneNumber(shop.whatsapp || '');
          setPhoneNumberId('');
          setWabaId('');
          setMetaBusinessEmail(shop.email || '');
        }
      })
      .catch(() => setLoadError('Impossible de charger les informations WhatsApp.'))
      .finally(() => setLoading(false));
  }, [shop?.email, shop?.id, shop?.whatsapp]);

  const safety = useMemo(
    () =>
      evaluateOutboundMessageSafety({
        automaticOutgoingEnabled: false,
        userTriggered: true,
        lastInboundAt: null,
        recentOutboundTimestamps: [],
      }),
    []
  );

  const activeAccount = accounts[0];
  const isConnected = activeAccount?.status === 'connected';
  const isPending = activeAccount?.status === 'pending';
  const needsMigration = activeAccount?.setupStep === 'migration_required';

  async function saveConnectionRequest(step: MerchantWhatsappAccount['setupStep']) {
    if (!shop?.id || !requestedPhoneNumber.trim()) {
      setSaveError('Ajoutez d abord le numero WhatsApp du commercant.');
      return;
    }

    setSaving(true);
    setSaveError('');

    try {
      await upsertMerchantWhatsappAccount(shop.id, {
        requestedPhoneNumber: requestedPhoneNumber.trim(),
        displayPhoneNumber: requestedPhoneNumber.trim(),
        phoneNumberId: phoneNumberId.trim() || undefined,
        wabaId: wabaId.trim() || undefined,
        metaBusinessEmail: metaBusinessEmail.trim() || undefined,
        setupStep: step,
        status: step === 'connected' ? 'connected' : step === 'migration_required' ? 'error' : 'pending',
        incomingEnabled: true,
        outgoingEnabled: false,
        automaticOutgoingEnabled: false,
      });

      const refreshed = await getMerchantWhatsappAccounts(shop.id);
      setAccounts(refreshed);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Impossible de sauvegarder la connexion WhatsApp.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-wa border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-5 animate-fadeIn">
      <div className="grid gap-5 lg:grid-cols-[1.08fr_0.92fr]">
        <section className="premium-card p-6 sm:p-7">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-[11px] font-black uppercase tracking-[0.2em] text-[#128C7E]">
                <MessageCircle className="h-4 w-4" />
                Connexion WhatsApp simple
              </div>
              <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Connectez votre numero WhatsApp sans le quitter.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                Le commercant garde son application WhatsApp Business habituelle. MasterShopPro ajoute simplement la gestion des messages et des commandes.
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <StatusBadge status={activeAccount?.status || 'not_connected'} />
              <WorkflowBadge step={activeAccount?.setupStep} />
            </div>
          </div>

          <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-black text-slate-950">Le chemin le plus simple</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => router.push('/admin/orders')}
                className="rounded-2xl border border-wa-border bg-wa-soft p-4 text-left transition hover:-translate-y-0.5 hover:shadow-ios"
              >
                <p className="text-sm font-black text-wa-dark">Commencer tout de suite</p>
                <p className="mt-1 text-xs leading-6 text-wa-dark/75">
                  Collez un message WhatsApp dans Commandes. MasterShopPro analyse, prepare la commande et garde le suivi.
                </p>
              </button>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-900">Connecter Meta ensuite</p>
                <p className="mt-1 text-xs leading-6 text-slate-600">
                  Quand le numero est pret cote Meta, les messages arriveront automatiquement. Aucun client n installe une nouvelle app.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <StepCard
              step="1"
              title="Enregistrer le numero"
              copy="Le commerce renseigne son numero et les identifiants Meta visibles dans WhatsApp Manager."
              done={Boolean(activeAccount?.requestedPhoneNumber && activeAccount?.phoneNumberId)}
            />
            <StepCard
              step="2"
              title="Confirmer dans Meta"
              copy="Meta relie le numero a la plateforme sans changer les habitudes du client final."
              done={activeAccount?.setupStep === 'meta_signup' || activeAccount?.setupStep === 'awaiting_verification' || activeAccount?.setupStep === 'migration_required' || isConnected}
            />
            <StepCard
              step="3"
              title="Verifier un message"
              copy="Le test final est simple : envoyer un message et verifier qu il arrive dans Commandes."
              done={isConnected}
            />
          </div>

          <div className="mt-6 rounded-[28px] border border-app-border bg-slate-50 p-5">
            <div className="grid gap-4">
              <PhoneInput
                label="Numero WhatsApp Business"
                value={requestedPhoneNumber}
                onChange={setRequestedPhoneNumber}
                defaultCountry="IT"
                required
                placeholder="329 963 9430"
              />
              <details className="rounded-2xl border border-slate-200 bg-white p-4">
                <summary className="cursor-pointer list-none text-sm font-black text-slate-900">
                  Reglages avances Meta
                  <span className="ml-2 text-xs font-semibold text-slate-400">a ouvrir seulement si Meta vous donne des IDs</span>
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">Phone Number ID Meta</label>
                    <input
                      type="text"
                      value={phoneNumberId}
                      onChange={(event) => setPhoneNumberId(event.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 1004697572729146"
                      className="input font-mono text-sm"
                    />
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Dans Meta : WhatsApp Manager &gt; Numeri di telefono.
                    </p>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">WABA ID Meta</label>
                    <input
                      type="text"
                      value={wabaId}
                      onChange={(event) => setWabaId(event.target.value.replace(/\D/g, ''))}
                      placeholder="Ex: 1379990030816790"
                      className="input font-mono text-sm"
                    />
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Utile seulement si Meta le demande pendant la connexion.
                    </p>
                  </div>
                </div>
              </details>
            </div>

            <div className="mt-5 rounded-2xl border border-wa-border bg-wa-soft p-4">
              <p className="text-sm font-black text-wa-dark">Connexion automatique Meta</p>
              <p className="mt-1 text-xs leading-6 text-wa-dark/70">
                A utiliser si le numero est pret dans WhatsApp Manager. Si Meta bloque, continuez quand meme avec le collage de messages dans Commandes.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={launchRedirectSignup}
                  disabled={esLaunching || !FB_CONFIG_ID}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-wa-dark px-6 py-3 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  {esLaunching ? 'Connexion en cours...' : 'Connecter mon numero avec Meta'}
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                onClick={launchRedirectSignup}
                  disabled={esLaunching || !FB_CONFIG_ID}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-wa-border bg-white px-6 py-3 text-sm font-bold text-wa-dark transition hover:-translate-y-0.5 disabled:opacity-60"
                >
                  Si la fenetre Meta ne s ouvre pas
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
              {!FB_CONFIG_ID && (
                <p className="mt-2 text-xs font-semibold text-red-600">
                  Config ID manquant : renseigne NEXT_PUBLIC_WHATSAPP_CONFIG_ID dans .env.local.
                </p>
              )}
              {esError && (
                <p className="mt-2 text-xs font-semibold text-red-600">{esError}</p>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => void saveConnectionRequest('draft')}
                disabled={saving}
                className="btn-primary px-6 text-sm"
              >
                {saving ? 'Sauvegarde...' : 'Sauvegarder ce numero'}
              </button>
              <button
                onClick={() => void saveConnectionRequest('awaiting_verification')}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
              >
                J ai termine le parcours Meta
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => void saveConnectionRequest('migration_required')}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-6 py-3 text-sm font-bold text-red-600 transition hover:-translate-y-0.5 hover:border-red-300 hover:bg-red-100"
              >
                Meta parle de numero deja utilise
                <AlertTriangle className="h-4 w-4" />
              </button>
              <button
                onClick={() => void saveConnectionRequest('connected')}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-wa-border bg-wa-soft px-6 py-3 text-sm font-bold text-wa-dark transition hover:-translate-y-0.5"
              >
                Mon numero est bien connecte
                <CheckCircle2 className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black text-amber-800">Important</p>
                <p className="mt-1 text-xs leading-6 text-amber-700">
                  Si rien n arrive dans Commandes, le numero n est pas encore totalement valide cote Meta.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-black text-slate-900">Ce que le client final voit</p>
                  <p className="mt-1 text-xs leading-6 text-slate-600">
                    Rien de nouveau a installer. Le client continue d ecrire sur WhatsApp comme d habitude.
                  </p>
                </div>
              </div>

            <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-black text-slate-900">Si Meta bloque</p>
              <p className="mt-2 text-xs leading-6 text-slate-600">
                Ce n est pas bloquant pour vendre. Le commercant peut deja coller ses messages dans Commandes, creer ses ventes, suivre les paiements et garder son historique client.
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <a
                  href="https://business.facebook.com/wa/manage/phone-numbers/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  WhatsApp Manager
                  <ExternalLink className="h-4 w-4" />
                </a>
                <a
                  href={META_SETUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-bold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-300"
                >
                  App Meta
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            {(saved || saveError || loadError) && (
              <div className="mt-4 space-y-2">
                {saved && (
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Connexion WhatsApp mise a jour pour cette boutique.
                  </div>
                )}
                {(saveError || loadError) && (
                  <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {saveError || loadError}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <div className="space-y-5">
          <section className="premium-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Etat actuel</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Ou en est votre numero ?</h2>

            <div className="mt-4 space-y-3">
              {[
                { label: 'Numero saisi', value: activeAccount?.requestedPhoneNumber || requestedPhoneNumber || 'Non renseigne' },
                { label: 'Numero connecte', value: activeAccount?.displayPhoneNumber || 'Pas encore confirme par Meta' },
                { label: 'Phone Number ID', value: activeAccount?.phoneNumberId || 'Attribue apres connexion Meta', mono: true },
                { label: 'WABA ID', value: activeAccount?.wabaId || 'Attribue apres connexion Meta', mono: true },
              ].map((row) => (
                <div key={row.label} className="rounded-2xl border border-app-border bg-slate-50 p-3.5">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">{row.label}</p>
                  <p className={`text-xs font-semibold text-slate-800 break-all ${row.mono ? 'font-mono' : ''}`}>{row.value}</p>
                </div>
              ))}
            </div>

            {isPending && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                <Clock3 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-black">Connexion en cours</p>
                  <p className="mt-1 text-xs leading-6">
                    Terminez la coexistence dans Meta, puis revenez ici. Des que le numero est relie, les messages pourront remonter dans Commandes.
                  </p>
                </div>
              </div>
            )}

            {needsMigration && (
              <div className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-black">Migration requise</p>
                  <p className="mt-1 text-xs leading-6">
                    Meta a signale que ce numero est deja utilise sur WhatsApp. Dans ton cas, cela veut surtout dire que la coexistence avec l app WhatsApp Business doit etre finalisee proprement dans Meta avant de continuer.
                  </p>
                </div>
              </div>
            )}
          </section>

          <section className="premium-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Ce que l app fera ensuite</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Du message a l action</h2>
            <div className="mt-4 grid gap-3">
              {[
                { icon: MessageCircle, title: 'Messages entrants', copy: 'Chaque message remonte dans Commandes au bon commercant.' },
                { icon: UserRound, title: 'Client reconnu', copy: 'Le numero est rattache a la bonne fiche client.' },
                { icon: Wallet, title: 'Commande brouillon', copy: 'Si le signal est clair, l app prepare une commande.' },
                { icon: Store, title: 'Suivi propre', copy: 'Statut, paiement et historique restent visibles au meme endroit.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-app-border bg-slate-50 p-4">
                  <item.icon className="mb-2.5 h-4 w-4 text-wa-dark" />
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="premium-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Securite business</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Aucun cout sortant cache</h2>

            <div className="mt-4 rounded-2xl border border-wa-border bg-wa-soft p-4">
              <p className="text-sm font-black text-wa-dark">Niveau de risque : {safety.risk}</p>
              <p className="mt-1.5 text-xs leading-6 text-wa-dark/70">
                Les messages automatiques restent bloques. L app aide a recevoir et organiser, elle n envoie rien seule.
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { icon: Lock, title: 'Aucun envoi automatique', copy: 'Pas de bot ni de relance cachee.' },
                { icon: ShieldCheck, title: 'Validation humaine obligatoire', copy: 'L IA suggere, le commercant decide.' },
                { icon: Sparkles, title: 'Plus simple pour le marchand', copy: 'On organise les messages sans changer sa facon de vendre.' },
              ].map((item) => (
                <div key={item.title} className="rounded-2xl border border-app-border bg-slate-50 p-4">
                  <item.icon className="mb-2.5 h-4 w-4 text-wa-dark" />
                  <p className="text-sm font-black text-slate-900">{item.title}</p>
                  <p className="mt-1 text-xs leading-6 text-slate-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </section>

          <details className="premium-card p-5">
            <summary className="cursor-pointer list-none">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Technique</p>
              <h2 className="mt-1 text-lg font-black text-slate-950">Voir le diagnostic Meta</h2>
              <p className="mt-1 text-xs leading-6 text-slate-500">Utile seulement si la connexion bloque.</p>
            </summary>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ['Tentative lancee', esDebug.startedAt ? 'Oui' : 'Non'],
                ['Popup demandee', esDebug.popupAttempted ? 'Oui' : 'Non'],
                ['Code OAuth recu', esDebug.authCodeReceived ? 'Oui' : 'Non'],
                ['Evenement WhatsApp recu', esDebug.waEventReceived ? 'Oui' : 'Non'],
                ['Nom evenement', esDebug.waEventName || '-'],
                ['Statut Meta', esDebug.lastStatus || '-'],
                ['Derniere erreur', esDebug.lastError || '-'],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-app-border bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 break-all font-semibold text-slate-800">{value}</p>
                </div>
              ))}
              {esDebug.lastPayload && (
                <div className="rounded-2xl border border-app-border bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dernier payload Meta</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
                    {esDebug.lastPayload}
                  </pre>
                </div>
              )}
            </div>
          </details>

          <section className="hidden premium-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Diagnostic Meta</p>
            <h2 className="mt-1 text-lg font-black text-slate-950">Ou la connexion bloque</h2>
            <div className="mt-4 space-y-3 text-sm">
              {[
                ['Tentative lancee', esDebug.startedAt ? 'Oui' : 'Non'],
                ['Popup demandee', esDebug.popupAttempted ? 'Oui' : 'Non'],
                ['Code OAuth recu', esDebug.authCodeReceived ? 'Oui' : 'Non'],
                ['Evenement WhatsApp recu', esDebug.waEventReceived ? 'Oui' : 'Non'],
                ['Nom evenement', esDebug.waEventName || '-'],
                ['Statut Meta', esDebug.lastStatus || '-'],
                ['Derniere erreur', esDebug.lastError || '-'],
              ].map(([label, value]) => (
                <div key={String(label)} className="rounded-2xl border border-app-border bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</p>
                  <p className="mt-1 break-all font-semibold text-slate-800">{value}</p>
                </div>
              ))}
              {esDebug.lastPayload && (
                <div className="rounded-2xl border border-app-border bg-slate-50 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Dernier payload Meta</p>
                  <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs leading-6 text-slate-700">
                    {esDebug.lastPayload}
                  </pre>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
