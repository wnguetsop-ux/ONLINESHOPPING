import { NextRequest, NextResponse } from 'next/server';

// ══════════════════════════════════════════════════════════════════════
// ANALYSE IA DE PRODUITS — Gemini (gratuit) + ChatGPT (fallback)
// 
// Variables .env.local:
//   GEMINI_API_KEY=AIzaSy...      (gratuit: aistudio.google.com/app/apikey)
//   OPENAI_API_KEY=sk-...         (payant, ~$0.001/image: platform.openai.com)
//
// Priorité: Gemini 1.5 Flash → Gemini 1.5 Flash 8B → GPT-4o mini → erreur
// ══════════════════════════════════════════════════════════════════════

const PROMPT = `Tu es un expert e-commerce spécialisé en Afrique francophone.
Analyse la photo de ce produit et réponds UNIQUEMENT avec ce JSON (aucun texte avant/après, pas de backticks) :
{
  "name": "nom commercial précis en français",
  "description": "description de vente courte et attrayante en français (1-2 phrases)",
  "specifications": "Couleur: xxx\\nMatière: xxx\\nDimensions: xxx\\nPoids: xxx",
  "category": "Vêtements|Chaussures|Électronique|Téléphones|Beauté|Alimentation|Maison|Sport|Accessoires|Autre",
  "brand": "marque visible ou vide",
  "suggestedPrice": "prix suggéré en FCFA si estimable, sinon vide"
}`;

// ── Gemini ─────────────────────────────────────────────────────────────────
async function callGemini(apiKey: string, base64: string, mediaType: string, model: string) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [
        { inline_data: { mime_type: mediaType, data: base64 } },
        { text: PROMPT }
      ]}],
      generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH',       threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini ${model} ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const candidate = data?.candidates?.[0];
  if (!candidate) throw new Error('No candidates');
  if (candidate.finishReason === 'SAFETY') throw new Error('Safety block');
  const text: string = candidate?.content?.parts?.[0]?.text || '';
  if (!text) throw new Error('Empty response');
  return text;
}

// ── OpenAI GPT-4o mini ─────────────────────────────────────────────────────
async function callOpenAI(apiKey: string, base64: string, mediaType: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      temperature: 0.1,
      messages: [{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}`, detail: 'low' } },
          { type: 'text', text: PROMPT }
        ]
      }]
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body.slice(0, 200)}`);
  }
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('Empty OpenAI response');
  return text;
}

// ── JSON parser ────────────────────────────────────────────────────────────
function parseAIResponse(text: string) {
  let parsed: Record<string, string> = {};
  try {
    const clean = text.replace(/```json\s*|```\s*/gi, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) parsed = JSON.parse(match[0]);
  } catch {
    for (const field of ['name','description','specifications','category','brand','suggestedPrice']) {
      const m = text.match(new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
      if (m) parsed[field] = m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
    }
  }
  return {
    name:           parsed.name           || '',
    description:    parsed.description    || '',
    specifications: parsed.specifications || '',
    category:       parsed.category       || '',
    brand:          parsed.brand          || '',
    suggestedPrice: parsed.suggestedPrice || '',
  };
}

// ── Main handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { base64, mediaType = 'image/jpeg' } = await req.json();
    if (!base64) return NextResponse.json({ error: 'No image' }, { status: 400 });

    const geminiKey = process.env.GEMINI_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY || '';

    const errors: string[] = [];

    // 1️⃣ Gemini 1.5 Flash (gratuit)
    if (geminiKey && !geminiKey.includes('VOTRE_CLE')) {
      for (const model of ['gemini-1.5-flash', 'gemini-1.5-flash-8b']) {
        try {
          console.log(`[AI] Trying Gemini ${model}...`);
          const text = await callGemini(geminiKey, base64, mediaType, model);
          const result = parseAIResponse(text);
          console.log(`[AI] ✅ Gemini ${model} success:`, result.name);
          return NextResponse.json({ ...result, _source: `gemini-${model}` });
        } catch (e: any) {
          const msg = e.message || String(e);
          errors.push(`Gemini ${model}: ${msg}`);
          console.warn(`[AI] Gemini ${model} failed:`, msg);
        }
      }
    } else {
      errors.push('Gemini: clé API non configurée');
    }

    // 2️⃣ OpenAI GPT-4o mini (fallback)
    if (openaiKey && !openaiKey.includes('VOTRE_CLE')) {
      try {
        console.log('[AI] Trying OpenAI GPT-4o mini...');
        const text = await callOpenAI(openaiKey, base64, mediaType);
        const result = parseAIResponse(text);
        console.log('[AI] ✅ OpenAI success:', result.name);
        return NextResponse.json({ ...result, _source: 'openai-gpt4o-mini' });
      } catch (e: any) {
        const msg = e.message || String(e);
        errors.push(`OpenAI: ${msg}`);
        console.warn('[AI] OpenAI failed:', msg);
      }
    } else {
      errors.push('OpenAI: clé API non configurée');
    }

    // Toutes les IA ont échoué
    console.error('[AI] ❌ All providers failed:', errors);
    return NextResponse.json({
      name: '', description: '', specifications: '', category: '', brand: '', suggestedPrice: '',
      _error: errors.join(' | '),
    });

  } catch (err: any) {
    console.error('[analyze-product] Fatal error:', err);
    return NextResponse.json({ name: '', description: '', specifications: '', category: '', brand: '', suggestedPrice: '' });
  }
}