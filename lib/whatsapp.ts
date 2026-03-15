// lib/whatsapp.ts
// Couche WhatsApp — Phase 1 (liens wa.me)
// Prête pour API Meta officielle en Phase 2 sans refonte

import { addCommLog } from './firestore';

// ─── TYPES ────────────────────────────────────────────────────────────────────

export type WhatsAppMessageType =
  | 'contact'
  | 'confirm_order'
  | 'payment_reminder'
  | 'order_ready'
  | 'send_receipt';

export interface WhatsAppPayload {
  shopId: string;
  customerPhone: string;
  customerName: string;
  orderId?: string;
  orderRef?: string;
  total?: number;
  reste?: number;
  currency?: string;
  shopName?: string;
}

// ─── TEMPLATES ────────────────────────────────────────────────────────────────

const TEMPLATES: Record<WhatsAppMessageType, string> = {
  contact:
    'Bonjour {{nom}}, je vous contacte depuis {{boutique}}. Comment puis-je vous aider ?',

  confirm_order:
    'Bonjour {{nom}} 👋\n\nVotre commande *#{{reference}}* a bien été confirmée ✅\n\n💰 Total : *{{total}}*\n\nMerci pour votre confiance ! 🙏\n— {{boutique}}',

  payment_reminder:
    'Bonjour {{nom}} 👋\n\nNous vous rappelons qu\'il reste *{{reste}}* à régler pour votre commande *#{{reference}}*.\n\nMerci de procéder au paiement dès que possible 🙏\n— {{boutique}}',

  order_ready:
    'Bonjour {{nom}} 👋\n\nVotre commande *#{{reference}}* est prête ! 🎉\n\nVous pouvez venir la récupérer.\n\n— {{boutique}}',

  send_receipt:
    'Bonjour {{nom}} 👋\n\nVoici le résumé de votre commande *#{{reference}}* :\n\n💰 Total payé : *{{total}}*\n✅ Statut : Payée\n\nMerci pour votre confiance ! 🛍️\n— {{boutique}}',
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

// Remplace les variables {{nom}}, {{reference}}, etc. dans un template
export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

// Formate un numéro de téléphone pour wa.me (supprime espaces, +, tirets)
export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[\s\+\-\(\)]/g, '');
}

// Génère le lien wa.me avec message encodé
export function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = formatPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

// Formate un montant avec devise
function formatAmount(amount: number, currency = 'XAF'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

// ─── ACTION PRINCIPALE ────────────────────────────────────────────────────────

// Ouvre WhatsApp + enregistre le log automatiquement
export async function sendWhatsApp(
  type: WhatsAppMessageType,
  payload: WhatsAppPayload
): Promise<void> {
  const {
    shopId, customerPhone, customerName,
    orderId, orderRef, total, reste,
    currency = 'XAF', shopName = 'la boutique',
  } = payload;

  // Remplir le template
  const vars: Record<string, string> = {
    nom:       customerName,
    reference: orderRef   ?? '',
    total:     total      ? formatAmount(total, currency) : '',
    reste:     reste      ? formatAmount(reste, currency) : '',
    boutique:  shopName,
  };

  const message = fillTemplate(TEMPLATES[type], vars);
  const link    = buildWhatsAppLink(customerPhone, message);

  // Ouvrir WhatsApp
  window.open(link, '_blank');

  // Enregistrer le log (fire & forget — ne bloque pas l'UI)
  try {
    await addCommLog({
      shopId,
      orderId:      orderId      ?? null,
      customerName,
      customerPhone,
      type,
      message,
      status:    'opened',
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[WhatsApp] Log non enregistré :', e);
  }
}

// ─── TEMPLATES CUSTOM ─────────────────────────────────────────────────────────

// Permet d'envoyer un message libre (hors templates)
export async function sendCustomWhatsApp(
  phone: string,
  message: string,
  logData: Omit<Parameters<typeof addCommLog>[0], 'message' | 'type' | 'status' | 'createdAt'>
): Promise<void> {
  const link = buildWhatsAppLink(phone, message);
  window.open(link, '_blank');

  try {
    await addCommLog({
      ...logData,
      type:      'contact',
      message,
      status:    'opened',
      createdAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[WhatsApp] Log non enregistré :', e);
  }
}