import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

type ProductBrochureRequest = {
  productName?: string;
  description?: string;
  category?: string;
  brand?: string;
  price?: number;
  currency?: string;
  shopName?: string;
  stock?: number;
};

function getGeminiApiKey() {
  return (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
}

function fallbackBrochure(body: ProductBrochureRequest) {
  const name = body.productName || 'Produit selectionne';
  const price = typeof body.price === 'number' && body.price > 0
    ? `${body.price.toLocaleString('fr-FR')} ${body.currency || 'FCFA'}`
    : 'Prix disponible en boutique';
  const category = body.category || 'selection boutique';
  const shop = body.shopName || 'MasterShopPro';

  return {
    headline: `${name}, pret a commander aujourd'hui`,
    subheadline: `Une ${category.toLowerCase()} presentee clairement, avec prix et disponibilite faciles a comprendre.`,
    badge: body.stock && body.stock > 0 ? 'Disponible maintenant' : 'Disponibilite a confirmer',
    bullets: [
      'Presentation propre pour rassurer le client',
      'Prix clair avant discussion',
      'Commande possible directement sur WhatsApp',
    ],
    cta: `Commander a ${price}`,
    whatsappCaption: `🛍️ *${name}*\n\n💰 Prix : *${price}*\n${body.stock && body.stock > 0 ? '✅ Disponible maintenant' : '⚠️ Stock limité'}\n\n📦 *${shop}* vous présente ce produit !\n👉 Répondez à ce message pour commander`,
  };
}

function parseJson(text: string) {
  const clean = text.replace(/```json\s*|```\s*/gi, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return {
      headline: String(parsed.headline || '').slice(0, 90),
      subheadline: String(parsed.subheadline || '').slice(0, 180),
      badge: String(parsed.badge || '').slice(0, 42),
      bullets: Array.isArray(parsed.bullets)
        ? parsed.bullets.map((b: unknown) => String(b).slice(0, 68)).filter(Boolean).slice(0, 3)
        : [],
      cta: String(parsed.cta || '').slice(0, 55),
      whatsappCaption: String(parsed.whatsappCaption || '').slice(0, 700),
    };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let body: ProductBrochureRequest = {};
  try {
    body = (await req.json().catch(() => ({}))) as ProductBrochureRequest;
    if (!body.productName?.trim()) {
      return NextResponse.json({ error: 'Nom du produit manquant' }, { status: 400 });
    }

    const fallback = fallbackBrochure(body);
    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      return NextResponse.json({ ...fallback, source: 'fallback' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const price = typeof body.price === 'number' && body.price > 0
      ? `${body.price.toLocaleString('fr-FR')} ${body.currency || 'FCFA'}`
      : 'prix non precise';

    const prompt = `Tu es un copywriter e-commerce pour commerçants africains qui vendent sur WhatsApp.
Genere une mini-brochure premium mais simple pour ce produit.
Le texte doit etre court, concret, rassurant et facile a comprendre par un client WhatsApp.
Pas de promesse mensongere, pas de jargon, pas de texte trop long.

Produit: ${body.productName}
Boutique: ${body.shopName || 'MasterShopPro'}
Categorie: ${body.category || 'Non precisee'}
Marque: ${body.brand || 'Non precisee'}
Description actuelle: ${body.description || 'Non precisee'}
Prix: ${price}
Stock: ${typeof body.stock === 'number' ? body.stock : 'Non precise'}

Reponds uniquement en JSON valide:
{
  "headline": "titre vendeur max 10 mots",
  "subheadline": "sous-titre max 22 mots",
  "badge": "badge court",
  "bullets": ["benefice 1 max 8 mots", "benefice 2 max 8 mots", "benefice 3 max 8 mots"],
  "cta": "appel a l'action court avec prix si possible",
  "whatsappCaption": "message de presentation du produit que le MARCHAND envoie a ses clients (pas un message client). Format: emoji nom produit, prix, disponibilite, appel a commander. Max 200 caracteres."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        temperature: 0.35,
        maxOutputTokens: 700,
      },
    });

    const text = response?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .join('\n')
      .trim() || '';
    const parsed = parseJson(text);
    if (!parsed?.headline || !parsed?.whatsappCaption) {
      return NextResponse.json({ ...fallback, source: 'fallback_after_ai' });
    }

    return NextResponse.json({
      ...fallback,
      ...parsed,
      bullets: parsed.bullets.length ? parsed.bullets : fallback.bullets,
      source: 'gemini-2.5-flash',
    });
  } catch {
    return NextResponse.json({
      ...fallbackBrochure(body),
      source: 'fallback_error',
    });
  }
}
