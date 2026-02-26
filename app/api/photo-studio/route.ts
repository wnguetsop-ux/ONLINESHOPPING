import { NextRequest, NextResponse } from 'next/server';

// ==============================================================================
// STUDIO PHOTO IA - Suppression fond réelle via Remove.bg
//
// Pipeline :
//  1. Vérifier + consommer 1 crédit boutique (Firebase REST)
//  2. Remove.bg API → retire le fond proprement
//  3. Retourne PNG transparent base64
//
// Ajouter dans .env.local : REMOVEBG_API_KEY=votre_cle
// Gratuit : 50 images/mois — https://www.remove.bg/api
// ==============================================================================

async function consumeCredit(shopId: string): Promise<{ ok: boolean; remaining: number }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
  const base      = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  const readRes = await fetch(`${base}/shops/${shopId}?key=${apiKey}`);
  if (!readRes.ok) return { ok: false, remaining: 0 };
  const docData = await readRes.json();

  const credits = parseInt(
    docData.fields?.photoCredits?.integerValue ??
    docData.fields?.photoCredits?.doubleValue ?? '0'
  );
  if (credits <= 0) return { ok: false, remaining: 0 };

  const used = parseInt(docData.fields?.photoCreditsUsed?.integerValue ?? '0');

  const patchRes = await fetch(
    `${base}/shops/${shopId}?key=${apiKey}` +
    `&updateMask.fieldPaths=photoCredits&updateMask.fieldPaths=photoCreditsUsed&updateMask.fieldPaths=updatedAt`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: {
        photoCredits:     { integerValue: String(credits - 1) },
        photoCreditsUsed: { integerValue: String(used + 1) },
        updatedAt:        { stringValue: new Date().toISOString() },
      }}),
    }
  );
  if (!patchRes.ok) return { ok: false, remaining: credits };
  return { ok: true, remaining: credits - 1 };
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { base64, shopId } = await req.json();
    if (!base64) return NextResponse.json({ error: 'Image manquante' }, { status: 400 });

    // 1. Vérifier crédits
    if (shopId) {
      const credit = await consumeCredit(shopId);
      if (!credit.ok) {
        return NextResponse.json(
          { error: 'Crédits insuffisants', code: 'NO_CREDITS', remaining: 0 },
          { status: 402 }
        );
      }
    }

    // 2. Remove.bg — suppression fond
    const removebgKey = process.env.REMOVEBG_API_KEY || '';
    if (!removebgKey || removebgKey.includes('VOTRE_CLE')) {
      return NextResponse.json({ error: 'REMOVEBG_API_KEY non configurée' }, { status: 500 });
    }

    const binaryStr = atob(base64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i);
    const blob = new Blob([bytes], { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('image_file', blob, 'product.jpg');
    formData.append('size', 'regular');
    formData.append('format', 'png');
    formData.append('type', 'product');

    const res = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': removebgKey },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Remove.bg ${res.status}: ${errText.slice(0, 200)}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const resultBytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < resultBytes.length; i++) binary += String.fromCharCode(resultBytes[i]);
    const pngBase64 = btoa(binary);

    return NextResponse.json({
      success: true,
      processedImage: `data:image/png;base64,${pngBase64}`,
      processingMs: Date.now() - t0,
    });

  } catch (err: any) {
    console.error('[PhotoStudio]', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}