import { NextRequest, NextResponse } from 'next/server';
import { isFirebaseAdminReady } from '@/lib/server/firebase-admin';
import { processIncomingWhatsAppWebhook } from '@/lib/server/whatsapp-processing';
import { verifyWebhookSignature } from '@/lib/server/whatsapp-cloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge || 'ok', { status: 200 });
  }

  return NextResponse.json({ error: 'Webhook verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const signature = request.headers.get('x-hub-signature-256');
  const enforceSig = Boolean(process.env.WHATSAPP_APP_SECRET);
  if (enforceSig && !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ ok: false, error: 'Invalid signature' }, { status: 401 });
  }

  if (!isFirebaseAdminReady()) {
    return NextResponse.json(
      { ok: false, error: 'Firebase Admin is not configured' },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  try {
    const result = await processIncomingWhatsAppWebhook(body);
    return NextResponse.json(result, { status: result.ok ? 200 : 202 });
  } catch (error) {
    console.error('[whatsapp-webhook]', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown webhook error',
      },
      { status: 500 }
    );
  }
}
