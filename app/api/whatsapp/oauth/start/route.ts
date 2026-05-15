import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function encodeState(value: Record<string, string>): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

export async function GET(req: NextRequest) {
  const appId = process.env.WHATSAPP_APP_ID?.trim();
  const configId = process.env.NEXT_PUBLIC_WHATSAPP_CONFIG_ID?.trim();

  if (!appId || !configId) {
    return NextResponse.json({ error: 'Embedded Signup Meta non configure.' }, { status: 503 });
  }

  const returnTo = req.nextUrl.searchParams.get('returnTo') || '/admin/whatsapp';
  const phoneNumberId = req.nextUrl.searchParams.get('phoneNumberId') || '';
  const wabaId = req.nextUrl.searchParams.get('wabaId') || '';
  const requestedPhoneNumber = req.nextUrl.searchParams.get('requestedPhoneNumber') || '';

  const redirectUri = new URL('/api/whatsapp/oauth/callback', req.nextUrl.origin).toString();
  const url = new URL('https://www.facebook.com/v22.0/dialog/oauth');
  url.searchParams.set('client_id', appId);
  url.searchParams.set('config_id', configId);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('override_default_response_type', 'true');
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set(
    'state',
    encodeState({
      returnTo,
      phoneNumberId,
      wabaId,
      requestedPhoneNumber,
    })
  );
  url.searchParams.set(
    'extras',
    JSON.stringify({
      version: 'v3',
      featureType: 'whatsapp_business_app_onboarding',
      sessionInfoVersion: '3',
      setup: {},
    })
  );

  return NextResponse.redirect(url);
}
