import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import {
  getFirebaseAdminApp,
  getFirebaseAdminDb,
  isFirebaseAdminReady,
} from '@/lib/server/firebase-admin';
import {
  sendTextMessage,
  sendTemplateMessage,
  GraphError,
} from '@/lib/server/whatsapp-cloud';
import { decryptToken } from '@/lib/server/whatsapp-crypto';
import { evaluateOutboundMessageSafety } from '@/lib/whatsapp-outbound-safety';
import { assertShopOwner } from '@/lib/server/merchant-identity';
import type { MerchantWhatsappAccount, WhatsappThread } from '@/lib/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Envoi WhatsApp Cloud API cote serveur. Exige :
//   - ID token Firebase (le marchand connecte)
//   - ownership du shop
//   - template si > 24h depuis dernier inbound
//   - validation humaine (userTriggered = true)

interface Body {
  shopId: string;
  toPhone: string;
  text?: string;
  template?: { name: string; languageCode: string; components?: unknown[] };
  threadId?: string;
  userTriggered: boolean;
}

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
  }

  const idToken = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  if (!idToken) return NextResponse.json({ error: 'Missing auth' }, { status: 401 });
  let uid: string;
  try {
    uid = (await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken)).uid;
  } catch {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { shopId, toPhone, text, template, threadId, userTriggered } = body;
  if (!shopId || !toPhone || (!text && !template)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }
  const ownsShop = await assertShopOwner(uid, shopId);
  if (!ownsShop) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const db = getFirebaseAdminDb();

  const accountSnap = await db
    .collection('merchant_whatsapp_accounts')
    .where('merchantId', '==', shopId)
    .limit(1)
    .get();

  const account = (accountSnap.empty ? null : { id: accountSnap.docs[0].id, ...accountSnap.docs[0].data() }) as
    | (MerchantWhatsappAccount & { id: string })
    | null;

  const phoneNumberId = account?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!phoneNumberId) {
    return NextResponse.json({ error: 'WhatsApp non connecte' }, { status: 404 });
  }

  // Per-merchant token, fallback au token global si le marchand n a pas encore
  // fini l Embedded Signup (ex: numero de test partage).
  let accessToken: string;
  try {
    accessToken = account?.accessTokenCipher
      ? decryptToken(account.accessTokenCipher)
      : (process.env.WHATSAPP_ACCESS_TOKEN || '');
  } catch (e) {
    console.error('[wa-send] decrypt failed', e);
    return NextResponse.json({ error: 'Token corrompu' }, { status: 500 });
  }
  if (!accessToken) {
    return NextResponse.json({ error: 'Aucun access_token disponible' }, { status: 404 });
  }

  // Garde-fous communs (24h window, rate limit, userTriggered).
  // Les templates sont autorises hors fenetre par design.
  const thread = threadId
    ? ((await db.collection('whatsapp_threads').doc(threadId).get()).data() as WhatsappThread | undefined)
    : undefined;

  // Dernier inbound = dernier message du fil seulement s il venait du client.
  const lastInboundAt =
    thread && thread.lastDirection === 'incoming' ? thread.lastMessageAt : null;

  // Outbounds recents (60s) pour rate limit.
  const recentOutboundSnap = threadId
    ? await db
        .collection('whatsapp_messages')
        .where('threadId', '==', threadId)
        .where('direction', '==', 'outgoing')
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get()
        .catch(() => null)
    : null;
  const recentOutboundTimestamps =
    recentOutboundSnap?.docs.map((d) => (d.data().createdAt as string) || '').filter(Boolean) || [];

  const safety = evaluateOutboundMessageSafety({
    automaticOutgoingEnabled: account?.automaticOutgoingEnabled,
    userTriggered,
    lastInboundAt,
    recentOutboundTimestamps,
  });

  const isTemplate = Boolean(template);
  const windowBlocks = safety.reasons.filter((r) => !r.includes('24h'));
  const mustHaveHumanTrigger = windowBlocks.length > 0;
  if (mustHaveHumanTrigger) {
    return NextResponse.json(
      { error: 'Envoi bloque', reasons: safety.reasons, risk: safety.risk },
      { status: 412 }
    );
  }
  if (!safety.withinCustomerWindow && !isTemplate) {
    return NextResponse.json(
      { error: 'Hors fenetre 24h : un template approuve est requis', reasons: safety.reasons },
      { status: 412 }
    );
  }

  try {
    const result = text
      ? await sendTextMessage({ phoneNumberId, toPhone, text, accessToken })
      : await sendTemplateMessage({
          phoneNumberId,
          toPhone,
          templateName: template!.name,
          languageCode: template!.languageCode,
          components: template!.components,
          accessToken,
        });
    const messageId = result.messages?.[0]?.id;
    return NextResponse.json({ ok: true, messageId });
  } catch (e) {
    if (e instanceof GraphError) {
      return NextResponse.json(
        { error: 'Graph error', code: e.classify(), status: e.status, body: e.body.slice(0, 400) },
        { status: 502 }
      );
    }
    console.error('[wa-send] erreur', e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
