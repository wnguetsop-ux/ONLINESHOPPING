import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface CallbackState {
  returnTo?: string;
  phoneNumberId?: string;
  wabaId?: string;
  requestedPhoneNumber?: string;
}

function decodeState(state: string | null): CallbackState {
  if (!state) return {};
  try {
    const raw = Buffer.from(state, 'base64url').toString('utf8');
    return JSON.parse(raw) as CallbackState;
  } catch {
    return {};
  }
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const state = decodeState(search.get('state'));
  const returnTo = state.returnTo || '/admin/whatsapp';

  const target = new URL(returnTo, req.nextUrl.origin);
  const code = search.get('code');
  const error = search.get('error') || search.get('error_message');
  const errorReason = search.get('error_reason');

  if (code) {
    target.searchParams.set('wa_code', code);
  }
  if (state.phoneNumberId) {
    target.searchParams.set('wa_phone_number_id', state.phoneNumberId);
  }
  if (state.wabaId) {
    target.searchParams.set('wa_waba_id', state.wabaId);
  }
  if (state.requestedPhoneNumber) {
    target.searchParams.set('wa_requested_number', state.requestedPhoneNumber);
  }
  if (error) {
    target.searchParams.set('wa_error', error);
  }
  if (errorReason) {
    target.searchParams.set('wa_error_reason', errorReason);
  }

  return NextResponse.redirect(target);
}
