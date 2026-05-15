import { addCommLog } from './firestore';

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
  amountPaid?: number;
  reste?: number;
  currency?: string;
  shopName?: string;
  templates?: Partial<Record<WhatsAppMessageType, string>>;
}

const TEMPLATE_STORAGE_KEY = 'sm_wa_templates';

const TEMPLATES: Record<WhatsAppMessageType, string> = {
  contact: 'Bonjour {{nom}}, ici {{boutique}}. Je reviens vers vous au sujet de votre demande.',
  confirm_order:
    'Bonjour {{nom}},\n\nVotre commande *#{{reference}}* est bien confirmee.\nTotal : *{{total}}*\n{{ligne_paiement}}\n\nMerci.\n{{boutique}}',
  payment_reminder:
    'Bonjour {{nom}},\n\nPetit rappel pour la commande *#{{reference}}*.\nReste a payer : *{{reste}}*\n{{ligne_total}}\n\nMerci.\n{{boutique}}',
  order_ready:
    'Bonjour {{nom}},\n\nVotre commande *#{{reference}}* est prete.\nVous pouvez passer la recuperer.\n\n{{boutique}}',
  send_receipt:
    'Bonjour {{nom}},\n\nVoici le recapitulatif de la commande *#{{reference}}*.\nTotal : *{{total}}*\nVerse : *{{verse}}*\nReste : *{{reste}}*\n\n{{boutique}}',
};

export function fillTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export function formatPhoneForWhatsApp(phone: string): string {
  return phone.replace(/[\s\+\-\(\)]/g, '');
}

export function buildWhatsAppLink(phone: string, message: string): string {
  const cleaned = formatPhoneForWhatsApp(phone);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleaned}?text=${encoded}`;
}

function formatAmount(amount: number, currency = 'XAF'): string {
  return `${amount.toLocaleString('fr-FR')} ${currency}`;
}

function loadLocalTemplates(): Partial<Record<WhatsAppMessageType, string>> {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.localStorage.getItem(TEMPLATE_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<WhatsAppMessageType, string>>) : {};
  } catch {
    return {};
  }
}

function normalizeMessageForWhatsApp(message: string): string {
  return message
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
}

export async function sendWhatsApp(
  type: WhatsAppMessageType,
  payload: WhatsAppPayload
): Promise<void> {
  const {
    shopId,
    customerPhone,
    customerName,
    orderId,
    orderRef,
    total,
    amountPaid,
    reste,
    currency = 'XAF',
    shopName = 'la boutique',
    templates,
  } = payload;

  const vars: Record<string, string> = {
    nom: customerName,
    reference: orderRef ?? '',
    total: typeof total === 'number' ? formatAmount(total, currency) : '',
    verse: typeof amountPaid === 'number' ? formatAmount(amountPaid, currency) : formatAmount(0, currency),
    reste: typeof reste === 'number' ? formatAmount(reste, currency) : formatAmount(0, currency),
    ligne_total: typeof total === 'number' ? `Montant commande : *${formatAmount(total, currency)}*` : '',
    ligne_paiement:
      typeof reste === 'number' && reste > 0
        ? `Reste a payer : *${formatAmount(reste, currency)}*`
        : 'Paiement enregistre : commande soldee.',
    boutique: shopName,
  };

  const selectedTemplate = templates?.[type] || loadLocalTemplates()[type] || TEMPLATES[type];
  const message = normalizeMessageForWhatsApp(fillTemplate(selectedTemplate, vars));
  const link = buildWhatsAppLink(customerPhone, message);

  window.open(link, '_blank');

  try {
    await addCommLog({
      shopId,
      orderId: orderId ?? null,
      customerName,
      customerPhone,
      type,
      message,
      status: 'opened',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[WhatsApp] Log non enregistre :', error);
  }
}

export async function sendCustomWhatsApp(
  phone: string,
  message: string,
  logData: Omit<Parameters<typeof addCommLog>[0], 'message' | 'type' | 'status' | 'createdAt'>
): Promise<void> {
  const cleanMessage = normalizeMessageForWhatsApp(message);
  const link = buildWhatsAppLink(phone, cleanMessage);
  window.open(link, '_blank');

  try {
    await addCommLog({
      ...logData,
      type: 'contact',
      message: cleanMessage,
      status: 'opened',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.warn('[WhatsApp] Log non enregistre :', error);
  }
}
