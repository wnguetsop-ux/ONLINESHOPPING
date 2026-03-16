import { NextRequest, NextResponse } from 'next/server';

// ══════════════════════════════════════════════════════════════════════
// IMPROVE WHATSAPP MESSAGE — OpenAI GPT-4o mini
// Route : /api/improve-message
// ══════════════════════════════════════════════════════════════════════

const STYLE_PROMPTS: Record<string, string> = {
  professionnel: 'Reformule ce message WhatsApp de manière professionnelle et polie. Maximum 3 lignes. Pas de markdown, pas de guillemets.',
  chaleureux:    'Reformule ce message WhatsApp de manière chaleureuse et amicale, comme un commerçant proche de ses clients. Court et naturel. Pas de markdown.',
  court:         'Reformule ce message WhatsApp en version très courte (1-2 lignes maximum). Garde uniquement l\'essentiel. Pas de markdown.',
  commercial:    'Reformule ce message WhatsApp comme un message commercial accrocheur mais naturel et court. Pas de markdown.',
};

export async function POST(req: NextRequest) {
  try {
    const { message, style = 'chaleureux', customerName, shopName, amount } = await req.json();

    if (!message) return NextResponse.json({ error: 'No message' }, { status: 400 });

    const openaiKey = process.env.OPENAI_API_KEY || '';
    if (!openaiKey || openaiKey.includes('VOTRE_CLE')) {
      return NextResponse.json({ error: 'OpenAI key not configured' }, { status: 500 });
    }

    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.chaleureux;
    const contextLine = [
      shopName    ? `Boutique : "${shopName}"` : '',
      customerName? `Client : "${customerName}"` : '',
      amount      ? `Montant : ${amount}` : '',
    ].filter(Boolean).join(', ');

    const fullPrompt = `${stylePrompt}

${contextLine ? `Contexte : ${contextLine}\n` : ''}Message original :
${message}

Réponds UNIQUEMENT avec le message reformulé. Aucun texte avant ou après.`;

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        max_tokens:  200,
        temperature: 0.7,
        messages: [{ role: 'user', content: fullPrompt }],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: `OpenAI error: ${err.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    const improved = data?.choices?.[0]?.message?.content?.trim() || message;

    return NextResponse.json({ improved });

  } catch (err: any) {
    console.error('[improve-message]', err);
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}