import { NextRequest, NextResponse } from 'next/server';

// ══════════════════════════════════════════════════════════════════════
// ANALYSE IA — Gemini (gratuit) + GPT-4o mini (fallback)
// Chaque appel est logué dans Firestore → collection 'api_logs'
// Visible dans SuperAdmin → onglet "🔍 Logs API"
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

// ── Log vers Firestore via REST (pas besoin Firebase Admin SDK) ───────────
async function writeLog(entry: Record<string, any>) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!projectId || !apiKey) return;

    const doc = {
      ...entry,
      createdAt: new Date().toISOString(),
      dateStr:   new Date().toISOString().slice(0, 10),
    };

    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(doc)) {
      if (typeof v === 'string')  fields[k] = { stringValue: v };
      if (typeof v === 'number')  fields[k] = { integerValue: String(v) };
      if (typeof v === 'boolean') fields[k] = { booleanValue: v };
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/api_logs?key=${apiKey}`;
    // fire & forget — ne bloque pas la réponse
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    }).catch(() => {});
  } catch { /* ne jamais bloquer l'API pour un log */ }
}

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
    throw new Error(`Gemini ${model} HTTP${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const candidate = data?.candidates?.[0];
  if (!candidate)                              throw new Error('Gemini: no candidates');
  if (candidate.finishReason === 'SAFETY')     throw new Error('Gemini: safety block');
  const text: string = candidate?.content?.parts?.[0]?.text || '';
  if (!text)                                   throw new Error('Gemini: empty text');
  return text;
}

// ── OpenAI GPT-4o mini ─────────────────────────────────────────────────────
async function callOpenAI(apiKey: string, base64: string, mediaType: string) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model:       'gpt-4o-mini',
      max_tokens:  512,
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
    throw new Error(`OpenAI HTTP${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenAI: empty response');
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
  const startMs = Date.now();

  // Contexte de base pour le log
  const logCtx = {
    endpoint:    'analyze-product',
    userAgent:   (req.headers.get('user-agent') || '').slice(0, 120),
    origin:      req.headers.get('origin') || req.headers.get('referer') || 'unknown',
    imageKb:     0,
    provider:    '',
    status:      '',
    durationMs:  0,
    productName: '',
    category:    '',
    error:       '',
  };

  try {
    const body = await req.json().catch(() => ({}));
    const { base64, mediaType = 'image/jpeg' } = body;

    if (!base64) {
      writeLog({ ...logCtx, status: 'error_no_image', durationMs: Date.now() - startMs });
      return NextResponse.json({ error: 'No image' }, { status: 400 });
    }

    logCtx.imageKb = Math.round(base64.length * 0.75 / 1024);

    const geminiKey = process.env.GEMINI_API_KEY || '';
    const openaiKey = process.env.OPENAI_API_KEY || '';
    const errors: string[] = [];

    // ── 1. Gemini 1.5 Flash ──────────────────────────────────────────────
    if (geminiKey && !geminiKey.includes('VOTRE_CLE')) {
      for (const model of ['gemini-1.5-flash', 'gemini-1.5-flash-8b']) {
        try {
          const text   = await callGemini(geminiKey, base64, mediaType, model);
          const result = parseAIResponse(text);
          const dur    = Date.now() - startMs;
          writeLog({ ...logCtx, provider: `gemini-${model}`, status: 'success', durationMs: dur, productName: result.name, category: result.category });
          return NextResponse.json({ ...result, _source: `gemini-${model}` });
        } catch (e: any) {
          const msg = String(e.message || e);
          errors.push(`[${model}] ${msg}`);
          console.warn(`[AI] Gemini ${model} failed:`, msg);
        }
      }
    } else {
      errors.push('[gemini] clé non configurée');
    }

    // ── 2. OpenAI GPT-4o mini ─────────────────────────────────────────────
    if (openaiKey && !openaiKey.includes('VOTRE_CLE')) {
      try {
        const text   = await callOpenAI(openaiKey, base64, mediaType);
        const result = parseAIResponse(text);
        const dur    = Date.now() - startMs;
        writeLog({ ...logCtx, provider: 'openai-gpt4o-mini', status: 'success_fallback', durationMs: dur, productName: result.name, category: result.category, error: errors.join(' | ') });
        return NextResponse.json({ ...result, _source: 'openai-gpt4o-mini' });
      } catch (e: any) {
        const msg = String(e.message || e);
        errors.push(`[openai] ${msg}`);
        console.warn('[AI] OpenAI failed:', msg);
      }
    } else {
      errors.push('[openai] clé non configurée');
    }

    // ── Tout a échoué ─────────────────────────────────────────────────────
    const errorStr = errors.join(' | ');
    console.error('[AI] ALL PROVIDERS FAILED:', errorStr);
    writeLog({ ...logCtx, provider: 'none', status: 'all_failed', durationMs: Date.now() - startMs, error: errorStr });

    return NextResponse.json({
      name: '', description: '', specifications: '', category: '', brand: '', suggestedPrice: '',
      _error: errorStr,
    });

  } catch (err: any) {
    const msg = String(err.message || err);
    writeLog({ ...logCtx, provider: 'none', status: 'fatal_error', durationMs: Date.now() - startMs, error: msg });
    return NextResponse.json({ name: '', description: '', specifications: '', category: '', brand: '', suggestedPrice: '' });
  }
}