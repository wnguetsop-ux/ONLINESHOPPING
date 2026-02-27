import { NextRequest, NextResponse } from 'next/server';

// ==============================================================================
// STUDIO PHOTO IA - Suppression fond via Remove.bg
// Les crédits sont gérés côté client dans products/page.tsx
// ==============================================================================

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { base64 } = await req.json();
    if (!base64) return NextResponse.json({ error: 'Image manquante' }, { status: 400 });

    const removebgKey = process.env.REMOVEBG_API_KEY || '';
    if (!removebgKey) {
      return NextResponse.json({ error: 'REMOVEBG_API_KEY non configurée' }, { status: 500 });
    }

    // Convertit base64 → blob
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