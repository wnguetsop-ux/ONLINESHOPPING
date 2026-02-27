import { NextRequest, NextResponse } from 'next/server';

// Proxy images Firebase Storage → contourne CORS pour le canvas
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'url requis' }, { status: 400 });
  if (!url.includes('firebasestorage.googleapis.com')) {
    return NextResponse.json({ error: 'URL non autorisée' }, { status: 403 });
  }
  try {
    const res = await fetch(url);
    if (!res.ok) return NextResponse.json({ error: 'Image introuvable' }, { status: 404 });
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}