import { createHmac, timingSafeEqual } from 'crypto';

// Client Meta Graph API pour WhatsApp Business Platform. SERVEUR UNIQUEMENT.
// Convention env : WHATSAPP_* (voir CLAUDE.md > Technical Reality).
// Refs :
//   https://developers.facebook.com/docs/whatsapp/embedded-signup/onboarding/
//   https://developers.facebook.com/docs/whatsapp/cloud-api/reference/phone-numbers/register

const GRAPH_VERSION = process.env.WHATSAPP_GRAPH_VERSION || 'v22.0';
const GRAPH = `https://graph.facebook.com/${GRAPH_VERSION}`;

export class GraphError extends Error {
  constructor(public status: number, public body: string, public path: string) {
    super(`[graph ${status}] ${path} -> ${body.slice(0, 400)}`);
  }

  classify():
    | 'number_in_use_other_cloud'
    | 'number_on_personal_whatsapp'
    | 'business_not_verified'
    | 'rate_limited'
    | 'token_invalid'
    | 'unknown' {
    const b = this.body.toLowerCase();
    if (b.includes('already') && b.includes('registered')) return 'number_in_use_other_cloud';
    if (b.includes('not a business') || b.includes('personal whatsapp')) return 'number_on_personal_whatsapp';
    if (b.includes('business') && b.includes('verif')) return 'business_not_verified';
    if (this.status === 429) return 'rate_limited';
    if (this.status === 401 || b.includes('invalid oauth')) return 'token_invalid';
    return 'unknown';
  }
}

async function graphFetch<T>(
  path: string,
  init: RequestInit & { token?: string } = {}
): Promise<T> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${GRAPH}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
  const body = await res.text();
  if (!res.ok) throw new GraphError(res.status, body, path);
  return body ? (JSON.parse(body) as T) : ({} as T);
}

export interface TokenExchangeResult {
  access_token: string;
  token_type?: string;
  expires_in?: number;
}

// Embedded Signup : echange du code court contre un access_token longue duree.
// Le marchand partage ce token avec notre App (nous = Tech Provider).
export async function exchangeCodeForToken(code: string, redirectUri?: string): Promise<TokenExchangeResult> {
  const appId = process.env.WHATSAPP_APP_ID;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appId || !appSecret) throw new Error('WHATSAPP_APP_ID / WHATSAPP_APP_SECRET manquants');
  const params = new URLSearchParams({ client_id: appId, client_secret: appSecret, code });
  if (redirectUri) params.set('redirect_uri', redirectUri);
  const res = await fetch(`${GRAPH}/oauth/access_token?${params.toString()}`, { method: 'GET' });
  const body = await res.text();
  if (!res.ok) throw new GraphError(res.status, body, '/oauth/access_token');
  return JSON.parse(body) as TokenExchangeResult;
}

// Souscrit notre app aux webhooks de la WABA du marchand. Sans ca, aucun
// message entrant ne tombe dans notre webhook.
export async function subscribeWabaToApp(wabaId: string, accessToken: string): Promise<void> {
  await graphFetch(`/${wabaId}/subscribed_apps`, { method: 'POST', token: accessToken });
}

// Obligatoire dans les 14 jours apres Embedded Signup. Le PIN 6 chiffres
// protege contre les re-registrations non-autorisees (Two-Step Verification).
export async function registerPhoneNumber(params: {
  phoneNumberId: string;
  pin: string;
  accessToken: string;
}): Promise<void> {
  const { phoneNumberId, pin, accessToken } = params;
  await graphFetch(`/${phoneNumberId}/register`, {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({ messaging_product: 'whatsapp', pin }),
  });
}

export interface SendMessageResult {
  messaging_product: 'whatsapp';
  contacts: Array<{ input: string; wa_id: string }>;
  messages: Array<{ id: string; message_status?: string }>;
}

export async function sendTextMessage(p: {
  phoneNumberId: string;
  toPhone: string;
  text: string;
  accessToken: string;
  previewUrl?: boolean;
}): Promise<SendMessageResult> {
  return graphFetch<SendMessageResult>(`/${p.phoneNumberId}/messages`, {
    method: 'POST',
    token: p.accessToken,
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: p.toPhone,
      type: 'text',
      text: { body: p.text, preview_url: p.previewUrl ?? false },
    }),
  });
}

// Les messages inities hors fenetre 24h DOIVENT utiliser un template approuve.
export async function sendTemplateMessage(p: {
  phoneNumberId: string;
  toPhone: string;
  templateName: string;
  languageCode: string;
  components?: unknown[];
  accessToken: string;
}): Promise<SendMessageResult> {
  return graphFetch<SendMessageResult>(`/${p.phoneNumberId}/messages`, {
    method: 'POST',
    token: p.accessToken,
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: p.toPhone,
      type: 'template',
      template: {
        name: p.templateName,
        language: { code: p.languageCode },
        ...(p.components ? { components: p.components } : {}),
      },
    }),
  });
}

// Meta signe chaque POST webhook : HMAC-SHA256(app_secret, rawBody).
// Doit etre verifie AVANT toute ingestion.
export function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return false;
  const expected = signatureHeader.startsWith('sha256=') ? signatureHeader.slice(7) : signatureHeader;
  const hmac = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  if (hmac.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}
