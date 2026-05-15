import { NextRequest, NextResponse } from 'next/server';
import { getFirebaseAdminDb } from '@/lib/server/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { shopId, credits, transactionRef } = await req.json();
    if (!shopId || !credits) {
      return NextResponse.json({ error: 'shopId et credits requis' }, { status: 400 });
    }

    const db = getFirebaseAdminDb();
    const shopRef = db.collection('shops').doc(shopId);
    const shopSnap = await shopRef.get();

    if (!shopSnap.exists) {
      return NextResponse.json({ error: `Boutique introuvable (id: ${shopId})` }, { status: 404 });
    }

    const data = shopSnap.data() || {};
    const current = Number(data.aiCredits ?? data.photoCredits ?? 0);
    const newTotal = current + Number(credits);

    await shopRef.update({ aiCredits: newTotal, updatedAt: new Date().toISOString() });

    // Logger l'activation
    const ref = transactionRef || `ADMIN-${Date.now()}`;
    await db.collection('pending_mobile_money').add({
      shopId,
      shopName: data.name || '',
      shopSlug: data.slug || '',
      credits: Number(credits),
      transactionNumber: ref,
      previousCredits: current,
      newCredits: newTotal,
      status: 'ACTIVATED',
      createdAt: new Date().toISOString(),
      activatedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, previous: current, new: newTotal });
  } catch (err: any) {
    console.error('[admin-activate]', err);
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
