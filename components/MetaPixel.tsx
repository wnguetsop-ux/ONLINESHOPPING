'use client';
/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  META PIXEL — TRACKING COMPLET                                   ║
 * ║  Pixel ID : 1805294393481637                                     ║
 * ║                                                                  ║
 * ║  Events trackés :                                                ║
 * ║  • PageView        — automatique dans layout.tsx                 ║
 * ║  • ViewContent     — scroll à 60% de la page                     ║
 * ║  • Lead            — clic sur le bouton "S'inscrire"             ║
 * ║  • CompleteRegistration — après création de compte               ║
 * ║  • CartAbandon     — a commencé formulaire et reparti            ║
 * ║  • FbAdClick       — visiteur détecté venant d'une pub FB        ║
 * ║                                                                  ║
 * ║  Usage : <MetaPixelEvents /> dans app/page.tsx (landing)         ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// ── Typage fbq ──────────────────────────────────────────────────────────────
declare global {
  interface Window {
    fbq?: (event: string, name: string, params?: Record<string, any>) => void;
  }
}

// ── Helper fire & forget ─────────────────────────────────────────────────────
function fbTrack(eventName: string, params?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', eventName, params);
    }
  } catch { /* silently fail */ }
}

function fbCustom(eventName: string, params?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('trackCustom', eventName, params);
    }
  } catch { /* silently fail */ }
}

// ── Sauvegarder le fbclid dans sessionStorage ────────────────────────────────
function saveFbclid(fbclid: string | null) {
  if (!fbclid) return;
  try {
    sessionStorage.setItem('fb_fbclid', fbclid);
    sessionStorage.setItem('fb_click_time', new Date().toISOString());
    // Fire custom event : visiteur confirmé venant d'une pub Facebook
    fbCustom('FbAdClick', {
      fbclid: fbclid.slice(0, 20),
      landing_page: window.location.pathname,
    });
  } catch { }
}

// ════════════════════════════════════════════════════════════════════════════
// COMPOSANT PRINCIPAL — à placer dans app/page.tsx (landing page)
// ════════════════════════════════════════════════════════════════════════════
export default function MetaPixelEvents() {
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const scrollFired   = useRef(false);
  const formTouched   = useRef(false);
  const formCompleted = useRef(false);

  // ── 1. FBCLID — détecter visiteur venant d'une pub Facebook ───────────────
  useEffect(() => {
    const fbclid = searchParams.get('fbclid');
    if (fbclid) {
      saveFbclid(fbclid);
    }
  }, [searchParams]);

  // ── 2. SCROLL TRACKING — ViewContent à 60% ────────────────────────────────
  useEffect(() => {
    scrollFired.current = false; // reset sur changement de page

    function handleScroll() {
      if (scrollFired.current) return;
      const docH      = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPct = docH > 0 ? (window.scrollY / docH) * 100 : 0;

      if (scrollPct >= 60) {
        scrollFired.current = true;
        fbTrack('ViewContent', {
          content_name: document.title,
          content_type: 'landing_page',
          content_ids:  [pathname],
        });
        // Retirer le listener après le premier fire
        window.removeEventListener('scroll', handleScroll);
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  // ── 3. ABANDON DE FORMULAIRE / PANIER ────────────────────────────────────
  // Détecte quand l'utilisateur a touché le formulaire d'inscription puis est parti
  useEffect(() => {
    function onFormInput() {
      formTouched.current = true;
    }

    function onVisibilityChange() {
      if (document.visibilityState === 'hidden' && formTouched.current && !formCompleted.current) {
        // L'utilisateur quitte la page après avoir touché le formulaire = abandon
        fbCustom('CartAbandon', {
          content_name: 'Formulaire inscription abandonné',
          page: pathname,
          fbclid: sessionStorage.getItem('fb_fbclid') || undefined,
        });
      }
    }

    // Écouter les inputs dans les formulaires
    document.addEventListener('input', onFormInput);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      document.removeEventListener('input', onFormInput);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [pathname]);

  return null; // Composant invisible
}

// ════════════════════════════════════════════════════════════════════════════
// FONCTIONS UTILITAIRES — à appeler depuis tes pages/composants
// ════════════════════════════════════════════════════════════════════════════

/**
 * À appeler quand l'utilisateur clique sur "S'inscrire" / "Commencer"
 * Exemple : onClick={() => { trackLeadClick(); router.push('/register'); }}
 */
export function trackLeadClick() {
  fbTrack('Lead', {
    content_name: 'Clic bouton inscription Mastershop',
    content_category: 'signup',
    currency: 'XOF',
    value: 0,
  });
}

/**
 * À appeler après la création de compte réussie (page /register useEffect)
 */
export function trackRegistrationComplete(plan = 'FREE') {
  fbTrack('CompleteRegistration', {
    content_name: 'Compte Mastershop créé',
    currency: 'XOF',
    value: plan === 'STARTER' ? 1500 : plan === 'PRO' ? 2500 : 0,
    status: true,
  });
}

/**
 * À appeler quand un utilisateur souscrit à un plan payant
 */
export function trackPurchase(planName: string, price: number) {
  fbTrack('Purchase', {
    content_name: `Abonnement Mastershop ${planName}`,
    content_type: 'subscription',
    currency: 'XOF',
    value: price,
  });
}

/**
 * À appeler sur la page de démo quand l'utilisateur commence à l'utiliser
 */
export function trackDemoStart() {
  fbCustom('DemoStart', {
    content_name: 'Démo interactive démarrée',
  });
}