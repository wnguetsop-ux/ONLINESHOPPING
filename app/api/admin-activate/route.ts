import { NextRequest, NextResponse } from 'next/server';

// Route serveur — bypass les règles Firestore client (lecture/écriture via REST API key)
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'stockflow-b6d58';
const API_KEY    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY    || 'AIzaSyALcMJIbHJxe_nX0Ja1zoeOOXNuYv8K2pw';
const BASE       = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

export async function POST(req: NextRequest) {
  try {
    const { shopId, credits, transactionRef } = await req.json();
    if (!shopId || !credits) return NextResponse.json({ error: 'shopId et credits requis' }, { status: 400 });

    // Lire crédits actuels
    const shopRes = await fetch(`${BASE}/shops/${shopId}?key=${API_KEY}`);
    if (!shopRes.ok) {
      const err = await shopRes.text();
      return NextResponse.json({ error: `Boutique introuvable (${shopRes.status})`, detail: err.slice(0, 200) }, { status: 404 });
    }
    const shopDoc = await shopRes.json();
    const current = parseInt(
      shopDoc.fields?.aiCredits?.integerValue ??
      shopDoc.fields?.aiCredits?.doubleValue ??
      shopDoc.fields?.photoCredits?.integerValue ?? '0'
    );

    // Ajouter les crédits
    const patch = await fetch(
      `${BASE}/shops/${shopId}?key=${API_KEY}&updateMask.fieldPaths=aiCredits&updateMask.fieldPaths=updatedAt`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            aiCredits: { integerValue: String(current + credits) },
            updatedAt: { stringValue: new Date().toISOString() },
          },
        }),
      }
    );
    if (!patch.ok) {
      const err = await patch.text();
      return NextResponse.json({ error: `Patch échoué (${patch.status})`, detail: err.slice(0, 200) }, { status: 500 });
    }

    // Logger l'activation
    const ref = transactionRef || `ADMIN-${Date.now()}`;
    await fetch(`${BASE}/pending_mobile_money?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          shopId:            { stringValue: shopId },
          credits:           { integerValue: String(credits) },
          transactionNumber: { stringValue: ref },
          previousCredits:   { integerValue: String(current) },
          newCredits:        { integerValue: String(current + credits) },
          status:            { stringValue: 'ACTIVATED' },
          createdAt:         { stringValue: new Date().toISOString() },
          activatedAt:       { stringValue: new Date().toISOString() },
        },
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, previous: current, new: current + credits });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erreur serveur' }, { status: 500 });
  }
}
