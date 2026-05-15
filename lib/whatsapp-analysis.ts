import {
  ExtractedOrderSignal,
  MessageAnalysisResult,
  MessageIntentCategory,
  SuggestedAction,
} from './types';

const ORDER_KEYWORDS = [
  'commande',
  'prix',
  'disponible',
  'livraison',
  'bonjour je veux',
  'je veux',
  'je prends',
  'combien',
  'reserver',
  'envoyer',
  'stock',
  'taille',
  'couleur',
  'quantite',
  'mettre de cote',
  'garder pour moi',
];

const PAYMENT_PROOF_KEYWORDS = [
  'recu',
  'preuve de paiement',
  'capture',
  'j ai paye',
  'jai paye',
  'virement',
  'transaction',
  'mobile money',
  'om',
  'momo',
];

const DELIVERY_KEYWORDS = [
  'adresse',
  'quartier',
  'livraison',
  'envoyez',
  'ou se trouve',
  'ou est ma commande',
  'suivi',
  'prete',
  'pret',
];

const SUPPORT_KEYWORDS = ['probleme', 'souci', 'bug', 'retour', 'annuler', 'remboursement'];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function containsOrderKeywords(text: string): boolean {
  const normalized = normalizeText(text);
  return ORDER_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function detectKnownProductMention(text: string, knownProducts: string[] = []): string[] {
  const normalized = normalizeText(text);
  return knownProducts.filter((product) => {
    const productLabel = normalizeText(product);
    return productLabel.length >= 3 && normalized.includes(productLabel);
  });
}

export function detectQuantity(text: string): number[] {
  const normalized = normalizeText(text);
  const matches = normalized.match(/\b\d+\b/g) || [];
  return matches
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0 && value <= 999);
}

export function detectAddressSignal(text: string): boolean {
  const normalized = normalizeText(text);
  return DELIVERY_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function detectPaymentProofSignal(text: string): boolean {
  const normalized = normalizeText(text);
  return PAYMENT_PROOF_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

function extractOrderSignals(text: string, matchedProducts: string[], quantities: number[]): ExtractedOrderSignal[] {
  if (matchedProducts.length === 0) {
    return [];
  }

  return matchedProducts.map((productName, index) => ({
    productName,
    quantity: quantities[index] || quantities[0] || 1,
  }));
}

function classifyMessageIntent(
  text: string,
  matchedProducts: string[],
  paymentProofSignal: boolean,
  addressSignal: boolean
): MessageIntentCategory {
  const normalized = normalizeText(text);
  const hasOrderSignals = matchedProducts.length > 0 || containsOrderKeywords(text);
  const hasExplicitOrderVerb = /je veux|je prends|reserve|reserver|mettre de cote|garder pour moi|envoyer/.test(normalized);
  const hasExplicitProductQuestion = /combien|prix|disponible|stock|taille|couleur/.test(normalized);

  if (paymentProofSignal) {
    return 'payment_proof';
  }

  if (SUPPORT_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return 'support_issue';
  }

  if (hasOrderSignals) {
    if (hasExplicitOrderVerb) {
      return 'new_order_request';
    }

    if (hasExplicitProductQuestion) {
      return 'product_question';
    }
  }

  if (addressSignal && /commande|livraison|ou est|suivi/.test(normalized)) {
    return 'delivery_question';
  }

  if (/commande|suivi|prete|pret|livree|livre/.test(normalized)) {
    return 'order_followup';
  }

  return 'unknown';
}

function computeConfidenceScore(
  category: MessageIntentCategory,
  signals: {
    hasKeywords: boolean;
    matchedProducts: string[];
    addressSignal: boolean;
    paymentProofSignal: boolean;
    quantities: number[];
  }
): number {
  let score = 0.2;

  if (signals.hasKeywords) score += 0.2;
  if (signals.matchedProducts.length > 0) score += 0.25;
  if (signals.quantities.length > 0) score += 0.1;
  if (signals.addressSignal) score += 0.1;
  if (signals.paymentProofSignal) score += 0.25;

  if (category === 'new_order_request') score += 0.15;
  if (category === 'payment_proof') score += 0.2;
  if (category === 'unknown') score -= 0.15;

  return Math.max(0.05, Math.min(0.98, Number(score.toFixed(2))));
}

export function suggestNextAction(
  category: MessageIntentCategory,
  confidenceScore: number
): SuggestedAction {
  if (category === 'payment_proof') {
    return 'request_payment_confirmation';
  }

  if (category === 'new_order_request' && confidenceScore >= 0.72) {
    return 'create_draft_order';
  }

  if (category === 'product_question' && confidenceScore >= 0.55) {
    return 'ask_for_details';
  }

  if (category === 'order_followup' || category === 'delivery_question') {
    return 'link_existing_order';
  }

  if (confidenceScore < 0.45) {
    return 'store_only';
  }

  return 'review_manually';
}

export function analyzeIncomingMessage(text: string, knownProducts: string[] = []): MessageAnalysisResult {
  const hasKeywords = containsOrderKeywords(text);
  const matchedProducts = detectKnownProductMention(text, knownProducts);
  const quantitySignals = detectQuantity(text);
  const addressSignal = detectAddressSignal(text);
  const paymentProofSignal = detectPaymentProofSignal(text);
  const category = classifyMessageIntent(text, matchedProducts, paymentProofSignal, addressSignal);
  const confidenceScore = computeConfidenceScore(category, {
    hasKeywords,
    matchedProducts,
    addressSignal,
    paymentProofSignal,
    quantities: quantitySignals,
  });
  const suggestedAction = suggestNextAction(category, confidenceScore);
  const extractedOrderSignals = extractOrderSignals(text, matchedProducts, quantitySignals);

  const explanation: string[] = [];
  if (hasKeywords) explanation.push('Mots-clés de commande détectés');
  if (matchedProducts.length > 0) explanation.push(`Produit(s) reconnu(s): ${matchedProducts.join(', ')}`);
  if (quantitySignals.length > 0) explanation.push(`Quantité(s) détectée(s): ${quantitySignals.join(', ')}`);
  if (addressSignal) explanation.push('Signal d adresse ou livraison repéré');
  if (paymentProofSignal) explanation.push('Signal de preuve de paiement repéré');
  if (explanation.length === 0) explanation.push('Aucun signal fort, stockage prudent conseillé');

  return {
    category,
    confidenceScore,
    suggestedAction,
    containsOrderKeywords: hasKeywords,
    addressSignal,
    paymentProofSignal,
    quantitySignals,
    matchedProducts,
    extractedOrderSignals,
    explanation,
  };
}

export function inferCustomerNameFromText(text: string): string | undefined {
  const firstLine = text.split('\n').map((line) => line.trim()).find(Boolean);
  if (!firstLine) return undefined;

  const match = firstLine.match(/^(bonjour|bsr|salut|hello)?\s*([A-Za-z][A-Za-z\s'-]{2,40})$/i);
  if (match?.[2]) {
    return match[2].trim();
  }

  return undefined;
}
