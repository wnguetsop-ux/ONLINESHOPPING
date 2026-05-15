import { NextRequest, NextResponse } from 'next/server';
import { analyzeIncomingMessage, inferCustomerNameFromText } from '@/lib/whatsapp-analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = typeof body?.text === 'string' ? body.text.trim() : '';
    const knownProducts = Array.isArray(body?.knownProducts)
      ? body.knownProducts.filter((value: unknown): value is string => typeof value === 'string')
      : [];

    if (!text) {
      return NextResponse.json({ error: 'Message client requis' }, { status: 400 });
    }

    const analysis = analyzeIncomingMessage(text, knownProducts);

    return NextResponse.json({
      ok: true,
      customerName: inferCustomerNameFromText(text),
      analysis,
      originalText: text,
    });
  } catch (error) {
    console.error('[whatsapp-analyze-text]', error);
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : 'Analyse impossible',
      },
      { status: 500 }
    );
  }
}
