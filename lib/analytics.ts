/**
 * trackVisit — enregistre une visite de page dans Firestore
 * Appelé depuis les pages publiques (shop page, landing)
 * Données collectées : page, shopSlug, referrer, device, country (via IP approximatif)
 */

import { addDoc, collection } from 'firebase/firestore';
import { db } from './firebase';

export type PageType =
  | 'landing'       // page d'accueil ShopMaster
  | 'shop'          // boutique d'un shop
  | 'product'       // page produit
  | 'checkout'      // étape checkout
  | 'order_success' // commande passée
  | 'register'      // inscription
  | 'login';        // connexion

interface TrackPayload {
  page: PageType;
  shopSlug?: string;
  shopId?: string;
  productId?: string;
  sessionId?: string;
  referrer?: string;
  device?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

function getDevice(): string {
  if (typeof window === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|iphone|android|blackberry|mini|windows\sce|palm/i.test(ua)) return 'mobile';
  return 'desktop';
}

function getSessionId(): string {
  if (typeof sessionStorage === 'undefined') return 'ssr';
  let sid = sessionStorage.getItem('sm_session');
  if (!sid) {
    sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem('sm_session', sid);
  }
  return sid;
}

function getUtmParams() {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource:   params.get('utm_source')   || undefined,
    utmMedium:   params.get('utm_medium')   || undefined,
    utmCampaign: params.get('utm_campaign') || undefined,
  };
}

export async function trackVisit(payload: TrackPayload): Promise<void> {
  try {
    const utm = getUtmParams();
    const event = {
      ...payload,
      ...utm,
      sessionId:  payload.sessionId  || getSessionId(),
      device:     payload.device     || getDevice(),
      referrer:   payload.referrer   || (typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct'),
      url:        typeof window !== 'undefined' ? window.location.pathname : undefined,
      createdAt:  new Date().toISOString(),
      // Date helpers for easy querying
      dateStr:    new Date().toISOString().slice(0, 10), // YYYY-MM-DD
      hourStr:    new Date().toISOString().slice(0, 13), // YYYY-MM-DDTHH
    };
    // Fire and forget — don't block page render
    await addDoc(collection(db, 'traffic_events'), event);
  } catch {
    // Silently fail — tracking should never break the app
  }
}