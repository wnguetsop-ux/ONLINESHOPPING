import { NextRequest, NextResponse } from 'next/server';

// ══════════════════════════════════════════════════════════════════════════════
// STRIPE WEBHOOK — Activation automatique des crédits Studio Photo IA
//
// Flow complet :
//   1. Client paie sur Stripe (Payment Link)
//   2. Stripe envoie POST /api/stripe-webhook avec signature
//   3. On vérifie la signature (sécurité — personne ne peut tricher)
//   4. On lit le shopId dans les metadata du paiement
//   5. On ajoute les crédits dans Firestore automatiquement
//   6. Client voit ses crédits sans aucune intervention manuelle
//
// Pour configurer :
//   → dashboard.stripe.com → Developers → Webhooks → Add endpoint
//   → URL : https://mastershoppro.com/api/stripe-webhook
//   → Events : checkout.session.completed
//   → Copier le "Signing secret" → STRIPE_WEBHOOK_SECRET dans .env.local
// ══════════════════════════════════════════════════════════════════════════════

// Crédits attribués par Payment Link Stripe
const CREDITS_BY_LINK: Record<string, number> = {
  'https://buy.stripe.com/6oUbITeEl3ia1UM1DmaVa05': 50,   // Pack 50
  'https://buy.stripe.com/dRmdR12VD6um56Y4PyaVa04': 200,  // Pack 200
};

// Fallback par price ID (plus robuste — configure dans Stripe Dashboard)
const CREDITS_BY_PRICE: Record<string, number> = {
  // Prix Stripe IDs — à remplir après avoir créé les produits dans Stripe
  // Ex: 'price_1ABC...': 50,
  // Ex: 'price_1XYZ...': 200,
};

// ── Vérification signature Stripe (HMAC SHA-256) ────────────────────────────
async function verifyStripeSignature(
  payload: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  try {
    const parts = sigHeader.split(',');
    const timestamp = parts.find(p => p.startsWith('t='))?.split('=')[1];
    const signature = parts.find(p => p.startsWith('v1='))?.split('=')[1];
    if (!timestamp || !signature) return false;

    // Rejeter les webhooks de plus de 5 minutes (protection replay attack)
    const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
    if (age > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signedPayload));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return expected === signature;
  } catch {
    return false;
  }
}

// ── Ajouter crédits via Firestore REST (pas besoin Firebase Admin SDK) ───────
async function addCreditsFirestore(shopId: string, credits: number, sessionId: string): Promise<boolean> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
  const base      = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

  // 1. Vérifier si ce paiement a déjà été traité (idempotence)
  const logRef = `${base}/stripe_payments/${sessionId}?key=${apiKey}`;
  const existing = await fetch(logRef);
  if (existing.ok) {
    console.log(`[Webhook] Paiement ${sessionId} déjà traité — skip`);
    return true; // déjà traité, pas d'erreur
  }

  // 2. Lire crédits actuels de la boutique
  const shopRes = await fetch(`${base}/shops/${shopId}?key=${apiKey}`);
  if (!shopRes.ok) {
    console.error(`[Webhook] Boutique ${shopId} introuvable`);
    return false;
  }
  const shopDoc = await shopRes.json();
  const currentCredits = parseInt(
    shopDoc.fields?.photoCredits?.integerValue ??
    shopDoc.fields?.photoCredits?.doubleValue ?? '0'
  );

  // 3. Mettre à jour les crédits
  const patchRes = await fetch(
    `${base}/shops/${shopId}?key=${apiKey}` +
    `&updateMask.fieldPaths=photoCredits&updateMask.fieldPaths=updatedAt`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          photoCredits: { integerValue: String(currentCredits + credits) },
          updatedAt:    { stringValue: new Date().toISOString() },
        }
      }),
    }
  );
  if (!patchRes.ok) return false;

  // 4. Logger ce paiement (idempotence future)
  await fetch(`${base}/stripe_payments?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fields: {
        sessionId:    { stringValue: sessionId },
        shopId:       { stringValue: shopId },
        credits:      { integerValue: String(credits) },
        processedAt:  { stringValue: new Date().toISOString() },
      }
    }),
  });

  console.log(`[Webhook] ✅ ${credits} crédits ajoutés à la boutique ${shopId}`);
  return true;
}

// ── Notifier le commerçant par WhatsApp (optionnel — via CallMeBot ou Twilio) ─
// Désactivé par défaut — décommenter si tu configures CallMeBot
// async function notifyWhatsApp(phone: string, credits: number) { ... }

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const payload   = await req.text();
  const sigHeader = req.headers.get('stripe-signature') || '';
  const secret    = process.env.STRIPE_WEBHOOK_SECRET || '';

  // ── Vérification signature ──────────────────────────────────────────────
  if (secret) {
    const valid = await verifyStripeSignature(payload, sigHeader, secret);
    if (!valid) {
      console.error('[Webhook] Signature Stripe invalide');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } else {
    // En développement sans secret configuré — on log un avertissement
    console.warn('[Webhook] ⚠️ STRIPE_WEBHOOK_SECRET non configuré — vérification désactivée');
  }

  let event: any;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[Webhook] Événement reçu: ${event.type}`);

  // ── On traite uniquement checkout.session.completed ──────────────────────
  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data?.object;
  if (!session) return NextResponse.json({ error: 'No session' }, { status: 400 });

  const sessionId   = session.id as string;
  const paymentStatus = session.payment_status as string;

  // Ne traiter que les paiements confirmés
  if (paymentStatus !== 'paid') {
    console.log(`[Webhook] Paiement non confirmé (status: ${paymentStatus})`);
    return NextResponse.json({ received: true });
  }

  // ── Récupérer shopId et crédits ──────────────────────────────────────────

  // Méthode 1 : metadata Stripe (le plus fiable)
  // Pour ça, dans ton Payment Link Stripe → Metadata → ajouter : shopId = {SHOP_ID}
  // Mais comme c'est un Payment Link fixe, on utilise les autres méthodes

  const shopId = session.metadata?.shopId
    || session.client_reference_id  // si tu passes l'ID dans l'URL (?client_reference_id=xxx)
    || null;

  // Méthode 2 : champ personnalisé "Nom de votre boutique" (saisi par le client)
  const shopNameField = session.custom_fields?.find((f: any) => f.key === 'nom_de_votre_boutique');
  const shopNameFromField = shopNameField?.text?.value || '';

  // Méthode 3 : déterminer les crédits via le Payment Link URL
  const paymentLinkUrl = session.payment_link
    ? `https://buy.stripe.com/${session.payment_link}`
    : null;
  const creditsFromLink = paymentLinkUrl ? CREDITS_BY_LINK[paymentLinkUrl] : null;

  // Méthode 4 : déterminer via price ID (le plus robuste)
  const lineItems = session.line_items?.data || [];
  const priceId   = lineItems[0]?.price?.id || '';
  const creditsFromPrice = CREDITS_BY_PRICE[priceId] || null;

  // Déterminer le nombre de crédits (priorité : price ID > payment link > défaut)
  const credits = creditsFromPrice || creditsFromLink || 50; // défaut 50 si non trouvé

  // ── Logs pour debug ──────────────────────────────────────────────────────
  console.log('[Webhook] Session:', {
    sessionId,
    shopId,
    shopNameFromField,
    paymentLinkUrl,
    credits,
    amount: session.amount_total,
    currency: session.currency,
    email: session.customer_details?.email,
  });

  // ── Si on a le shopId → activer automatiquement ──────────────────────────
  if (shopId) {
    const ok = await addCreditsFirestore(shopId, credits, sessionId);
    if (!ok) {
      return NextResponse.json({ error: 'Failed to add credits' }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      shopId,
      credits,
      message: `${credits} crédits ajoutés automatiquement`,
    });
  }

  // ── Pas de shopId → logger pour activation manuelle ─────────────────────
  // Le commerçant a payé mais n'a pas passé son shopId
  // → On sauvegarde pour activation manuelle depuis SuperAdmin
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
  const apiKey    = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
  await fetch(
    `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/pending_credits?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          sessionId:   { stringValue: sessionId },
          shopName:    { stringValue: shopNameFromField },
          credits:     { integerValue: String(credits) },
          amount:      { integerValue: String(session.amount_total || 0) },
          currency:    { stringValue: session.currency || 'eur' },
          email:       { stringValue: session.customer_details?.email || '' },
          status:      { stringValue: 'PENDING_MANUAL' },
          createdAt:   { stringValue: new Date().toISOString() },
        }
      }),
    }
  ).catch(() => {});

  console.log(`[Webhook] ⏳ Paiement enregistré en attente d'activation manuelle — boutique: "${shopNameFromField}"`);
  return NextResponse.json({
    received: true,
    status: 'pending_manual',
    message: `Paiement reçu — activation manuelle requise pour "${shopNameFromField}"`,
  });
}

// GET pour tester que le webhook est accessible
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/stripe-webhook',
    info: 'Stripe webhook pour Studio Photo IA — Mastershop',
  });
}