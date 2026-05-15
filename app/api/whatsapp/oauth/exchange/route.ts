import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { getFirebaseAdminApp, getFirebaseAdminDb, isFirebaseAdminReady } from '@/lib/server/firebase-admin';
import {
  exchangeCodeForToken,
  subscribeWabaToApp,
  registerPhoneNumber,
  GraphError,
} from '@/lib/server/whatsapp-cloud';
import {
  encryptToken,
  isEncryptionConfigured,
  generateWhatsappPin,
} from '@/lib/server/whatsapp-crypto';
import { getMerchantIdentityForOwner } from '@/lib/server/merchant-identity';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Appele par le front apres le callback Embedded Signup (event WA_EMBEDDED_SIGNUP
// + code retourne par FB.login). On echange le code, souscrit la WABA au
// webhook, enregistre le numero, et persiste un compte chiffre.

interface Body {
  code: string;
  wabaId: string;
  phoneNumberId: string;
  businessAccountId?: string;
  displayPhoneNumber?: string;
  redirectUri?: string;
}

export async function POST(req: NextRequest) {
  if (!isFirebaseAdminReady()) {
    return NextResponse.json({ error: 'Firebase Admin not configured' }, { status: 503 });
  }
  if (!isEncryptionConfigured()) {
    return NextResponse.json({ error: 'Token encryption key missing' }, { status: 503 });
  }

  const authHeader = req.headers.get('authorization') || '';
  const idToken = authHeader.replace(/^Bearer\s+/i, '').trim();
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

  const { code, wabaId, phoneNumberId, businessAccountId, displayPhoneNumber, redirectUri } = body;
  if (!code || !wabaId || !phoneNumberId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  // MasterShopPro stores business data by shop id. The Firebase uid remains
  // the owner id, but WhatsApp routing must use the same merchant id as orders.
  const { merchantId } = await getMerchantIdentityForOwner(uid);

  const db = getFirebaseAdminDb();
  const now = new Date().toISOString();

  try {
    const tokenResult = await exchangeCodeForToken(code, redirectUri);
    const accessToken = tokenResult.access_token;

    await subscribeWabaToApp(wabaId, accessToken);

    const pin = generateWhatsappPin();
    try {
      await registerPhoneNumber({ phoneNumberId, pin, accessToken });
    } catch (e) {
      if (e instanceof GraphError && e.classify() === 'number_in_use_other_cloud') {
        await persistAccount(db, merchantId, {
          wabaId,
          phoneNumberId,
          businessAccountId,
          displayPhoneNumber,
          accessTokenCipher: encryptToken(accessToken),
          registrationPin: pin,
          status: 'error',
          setupStep: 'migration_required',
          lastError: { code: 'number_in_use_other_cloud', message: e.body.slice(0, 400), at: now },
          updatedAt: now,
        });
        return NextResponse.json(
          { ok: false, setupStep: 'migration_required', reason: 'number_in_use_other_cloud' },
          { status: 409 }
        );
      }
      throw e;
    }

    await persistAccount(db, merchantId, {
      wabaId,
      phoneNumberId,
      businessAccountId,
      displayPhoneNumber,
      accessTokenCipher: encryptToken(accessToken),
      registrationPin: pin,
      status: 'connected',
      setupStep: 'connected',
      incomingEnabled: true,
      outgoingEnabled: true,
      automaticOutgoingEnabled: false,
      connectedAt: now,
      registeredAt: now,
      lastError: undefined,
      updatedAt: now,
    });

    return NextResponse.json({ ok: true, setupStep: 'connected', phoneNumberId });
  } catch (e) {
    const classify = e instanceof GraphError ? e.classify() : 'unknown';
    const message = e instanceof Error ? e.message : String(e);
    console.error('[wa-oauth-exchange]', classify, message);

    await persistAccount(db, merchantId, {
      wabaId,
      phoneNumberId,
      businessAccountId,
      displayPhoneNumber,
      status: 'error',
      setupStep: classify === 'business_not_verified' ? 'awaiting_verification' : 'meta_signup',
      lastError: { code: classify, message: message.slice(0, 400), at: now },
      updatedAt: now,
    }).catch((persistErr) => {
      console.error('[wa-oauth-exchange] persist error after failure', persistErr);
    });

    const status = e instanceof GraphError ? e.status : 500;
    return NextResponse.json({ ok: false, reason: classify, message: message.slice(0, 300) }, { status });
  }
}

async function persistAccount(
  db: FirebaseFirestore.Firestore,
  merchantId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const col = db.collection('merchant_whatsapp_accounts');
  const existing = await col.where('merchantId', '==', merchantId).limit(1).get();
  const now = new Date().toISOString();

  const clean = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));

  if (!existing.empty) {
    await col.doc(existing.docs[0].id).set(clean, { merge: true });
    return;
  }
  await col.add({
    merchantId,
    incomingEnabled: true,
    outgoingEnabled: false,
    automaticOutgoingEnabled: false,
    createdAt: now,
    ...clean,
  });
}
