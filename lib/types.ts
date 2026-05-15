export type CurrencyCode =
  | 'XAF'
  | 'XOF'
  | 'GNF'
  | 'MGA'
  | 'MRO'
  | 'EUR'
  | 'USD'
  | 'CDF'
  | 'BIF'
  | 'RWF';

export type PlanId = 'FREE' | 'STARTER' | 'STANDARD' | 'PRO';
export type BillingCycle = 'monthly' | 'yearly';

export type PlanFeatureKey =
  | 'manualOrders'
  | 'incomingWhatsappInbox'
  | 'conversationManagement'
  | 'simpleCustomerHistory'
  | 'orderIntentDetection'
  | 'draftOrders'
  | 'orderStatuses'
  | 'searchAndFilters'
  | 'internalNotifications'
  | 'enrichedCustomerProfile'
  | 'multiStaff'
  | 'statsAndReports'
  | 'controlledOutboundReady';

export interface PlanDefinition {
  id: PlanId;
  code: PlanId;
  name: string;
  price: number;
  priceXaf: number;
  billingCycle: BillingCycle;
  annualPriceXaf?: number | null;
  badge?: string;
  isPopular?: boolean;
  color: string;
  maxProducts: number;
  maxOrdersPerMonth: number;
  maxWhatsappAccounts: number;
  maxStaff: number;
  aiCreditsIncluded: number;
  features: string[];
  featureFlags: Record<PlanFeatureKey, boolean>;
}

// ─── CRÉDIT IA — coûts par action ────────────────────────────────────────────
// Ces valeurs pilotent la déduction côté client ET la documentation.
export const AI_CREDIT_COSTS = {
  analysePhoto:   1,   // Gemini/GPT analyse la photo → remplit la fiche
  photoProIA:     3,   // OpenAI génère une photo produit professionnelle
  brochureIA:     1,   // IA génère le texte + canvas de la brochure
  quickSell:      3,   // analysePhoto + brochureIA en 1 flow express
} as const;

export const PLANS: Record<PlanId, PlanDefinition> = {
  // ── Compte de base — gratuit, 5 crédits offerts à l'inscription ───────────
  FREE: {
    id: 'FREE',
    code: 'FREE',
    name: 'Gratuit',
    price: 0,
    priceXaf: 0,
    billingCycle: 'monthly',
    annualPriceXaf: null,
    badge: '5 crédits IA offerts',
    color: '#64748b',
    maxProducts: -1,           // produits illimités
    maxOrdersPerMonth: -1,     // commandes illimitées
    maxWhatsappAccounts: 0,
    maxStaff: 1,
    aiCreditsIncluded: 5,      // crédits offerts à l'inscription (non renouvelables)
    features: [
      '5 crédits IA offerts',
      'Produits & commandes illimités',
      'Boutique en ligne publique',
      'Brochures texte de base',
      'Support email',
    ],
    featureFlags: {
      manualOrders: true,
      incomingWhatsappInbox: false,
      conversationManagement: false,
      simpleCustomerHistory: true,
      orderIntentDetection: false,
      draftOrders: false,
      orderStatuses: false,
      searchAndFilters: false,
      internalNotifications: false,
      enrichedCustomerProfile: false,
      multiStaff: false,
      statsAndReports: false,
      controlledOutboundReady: false,
    },
  },

  // ── Pack 50 crédits — 1 500 FCFA ─────────────────────────────────────────
  STARTER: {
    id: 'STARTER',
    code: 'STARTER',
    name: 'Pack 50',
    price: 1500,
    priceXaf: 1500,
    billingCycle: 'monthly',
    annualPriceXaf: null,
    color: '#2563eb',
    maxProducts: -1,
    maxOrdersPerMonth: -1,
    maxWhatsappAccounts: 0,
    maxStaff: 1,
    aiCreditsIncluded: 50,
    features: [
      '50 crédits IA',
      '30 FCFA / crédit',
      'Fiches produit IA (×50)',
      'Photos pro OpenAI (×25)',
      'Brochures IA (×50)',
    ],
    featureFlags: {
      manualOrders: true,
      incomingWhatsappInbox: false,
      conversationManagement: false,
      simpleCustomerHistory: true,
      orderIntentDetection: false,
      draftOrders: false,
      orderStatuses: false,
      searchAndFilters: false,
      internalNotifications: false,
      enrichedCustomerProfile: false,
      multiStaff: false,
      statsAndReports: false,
      controlledOutboundReady: false,
    },
  },

  // ── Pack 200 crédits — 5 000 FCFA — le plus populaire ────────────────────
  STANDARD: {
    id: 'STANDARD',
    code: 'STANDARD',
    name: 'Pack 200',
    price: 5000,
    priceXaf: 5000,
    billingCycle: 'monthly',
    annualPriceXaf: null,
    badge: 'Meilleur rapport',
    isPopular: true,
    color: '#1FB955',
    maxProducts: -1,
    maxOrdersPerMonth: -1,
    maxWhatsappAccounts: 0,
    maxStaff: 1,
    aiCreditsIncluded: 200,
    features: [
      '200 crédits IA',
      '25 FCFA / crédit',
      'Fiches produit IA (×200)',
      'Photos pro OpenAI (×100)',
      'Brochures IA (×200)',
    ],
    featureFlags: {
      manualOrders: true,
      incomingWhatsappInbox: false,
      conversationManagement: false,
      simpleCustomerHistory: true,
      orderIntentDetection: false,
      draftOrders: false,
      orderStatuses: false,
      searchAndFilters: false,
      internalNotifications: false,
      enrichedCustomerProfile: false,
      multiStaff: false,
      statsAndReports: false,
      controlledOutboundReady: false,
    },
  },

  // ── Pack 500 crédits — 10 000 FCFA ───────────────────────────────────────
  PRO: {
    id: 'PRO',
    code: 'PRO',
    name: 'Pack 500',
    price: 10000,
    priceXaf: 10000,
    billingCycle: 'monthly',
    annualPriceXaf: null,
    color: '#7c3aed',
    maxProducts: -1,
    maxOrdersPerMonth: -1,
    maxWhatsappAccounts: 0,
    maxStaff: 1,
    aiCreditsIncluded: 500,
    features: [
      '500 crédits IA',
      '20 FCFA / crédit',
      'Fiches produit IA (×500)',
      'Photos pro OpenAI (×250)',
      'Brochures IA (×500)',
    ],
    featureFlags: {
      manualOrders: true,
      incomingWhatsappInbox: false,
      conversationManagement: false,
      simpleCustomerHistory: true,
      orderIntentDetection: false,
      draftOrders: false,
      orderStatuses: false,
      searchAndFilters: false,
      internalNotifications: false,
      enrichedCustomerProfile: false,
      multiStaff: false,
      statsAndReports: false,
      controlledOutboundReady: false,
    },
  },
};

export const LEGACY_PLAN_ARCHIVE = [
  {
    code: 'FREE_V1',
    name: 'Free 2025',
    replacedBy: 'FREE' as PlanId,
    isArchived: true,
  },
  {
    code: 'STARTER_V1',
    name: 'Starter 2025',
    replacedBy: 'STANDARD' as PlanId,
    isArchived: true,
  },
  {
    code: 'PRO_V1',
    name: 'Pro 2025',
    replacedBy: 'PRO' as PlanId,
    isArchived: true,
  },
];

export function hasPlanFeature(planId: PlanId | undefined, feature: PlanFeatureKey): boolean {
  const effectivePlan = PLANS[planId || 'FREE'] || PLANS.FREE;
  return effectivePlan.featureFlags[feature];
}

export function getPlanDefinition(planId: PlanId | undefined): PlanDefinition {
  return PLANS[planId || 'FREE'] || PLANS.FREE;
}

// ============== SHOP / MERCHANT ==============

export interface Shop {
  id?: string;
  slug: string;
  ownerId: string;
  name: string;
  description?: string;
  slogan?: string;
  logo?: string;
  primaryColor: string;
  whatsapp: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  country: string;
  pickupAddress?: string;
  currency: CurrencyCode;
  deliveryFee: number;
  freeDeliveryAbove?: number;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  mobileMoneyNumber?: string;
  mobileMoneyName?: string;
  whatsappTemplates?: Partial<Record<CommLogType, string>>;
  planId: PlanId;
  planExpiry?: string;
  ordersThisMonth: number;
  lastOrderReset: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface Merchant {
  id?: string;
  shopId: string;
  businessName: string;
  ownerId: string;
  country: string;
  currency: CurrencyCode;
  activePlanId: PlanId;
  createdAt: string;
  updatedAt?: string;
}

export interface Subscription {
  id?: string;
  merchantId: string;
  planId: PlanId;
  status: 'trialing' | 'active' | 'past_due' | 'cancelled' | 'paused';
  startedAt: string;
  endsAt?: string | null;
  paymentProvider?: 'stripe' | 'manual_mobile_money' | 'unknown';
  externalReference?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Admin {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  shopId: string;
  shopSlug: string;
  createdAt: string;
}

export interface StaffMember {
  id?: string;
  merchantId: string;
  userId: string;
  name: string;
  email?: string;
  role: 'owner' | 'manager' | 'agent';
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ============== PRODUCT ==============

export interface Product {
  id?: string;
  shopId: string;
  name: string;
  description?: string;
  specifications?: string;
  category: string;
  brand?: string;
  sku?: string;
  barcode?: string;
  costPrice: number;
  sellingPrice: number;
  stock: number;
  minStock?: number;
  unit?: string;
  weight?: string;
  imageUrl?: string;
  images?: string[];
  isActive: boolean;
  isFeatured?: boolean;
  createdAt: string;
  brochureImageUrl?: string;
  updatedAt?: string;
}

export interface Category {
  id?: string;
  shopId: string;
  name: string;
  description?: string;
  color: string;
}

// ============== ORDERS ==============

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export type LegacyOrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED';
export type OrderWorkflowStatus =
  | 'pending_review'
  | 'awaiting_confirmation'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'cancelled'
  | 'issue';

export interface Order {
  id?: string;
  shopId: string;
  merchantId?: string;
  customerId?: string;
  linkedThreadId?: string;
  source?: 'manual' | 'storefront' | 'whatsapp_incoming' | 'whatsapp_manual_capture';
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerQuartier?: string;
  customerWhatsapp?: string;
  lastContactAt?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  profit: number;
  amountPaid: number;
  balanceDue: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  paymentMethod: 'MOBILE_MONEY' | 'CASH_ON_DELIVERY';
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  status: LegacyOrderStatus;
  workflowStatus?: OrderWorkflowStatus;
  notes?: string;
  createdAt: string;
  paymentUpdatedAt?: string;
  updatedAt?: string;
}

// ============== WHATSAPP / INBOX ==============

export interface MerchantWhatsappAccount {
  id?: string;
  merchantId: string;
  wabaId?: string;
  phoneNumberId?: string;
  businessAccountId?: string;
  displayPhoneNumber?: string;
  requestedPhoneNumber?: string;
  metaBusinessEmail?: string;
  setupStep?: 'draft' | 'meta_signup' | 'migration_required' | 'awaiting_verification' | 'connected';
  status: 'not_connected' | 'pending' | 'connected' | 'error';
  connectedAt?: string;
  webhookVerifiedAt?: string;
  incomingEnabled: boolean;
  outgoingEnabled: boolean;
  automaticOutgoingEnabled: boolean;
  // Token Meta chiffre (AES-256-GCM via lib/server/whatsapp-crypto).
  // Absent = on retombe sur WHATSAPP_ACCESS_TOKEN (token system user global).
  accessTokenCipher?: {
    ciphertext: string;
    iv: string;
    tag: string;
    version: 1;
  };
  // PIN 6 chiffres utilise lors du POST /{phone_number_id}/register.
  // Non expose au marchand, simplement stocke pour re-registration eventuelle.
  registrationPin?: string;
  registeredAt?: string;
  lastError?: {
    code: string;
    message: string;
    at: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface Customer {
  id?: string;
  merchantId: string;
  phone: string;
  name?: string;
  tags?: string[];
  lastMessageAt?: string;
  totalOrders?: number;
  createdAt: string;
  updatedAt?: string;
}

export type MessageType = 'text' | 'image' | 'document' | 'audio' | 'interactive' | 'order' | 'status' | 'unknown';
export type MessageIntentCategory =
  | 'new_order_request'
  | 'product_question'
  | 'payment_proof'
  | 'delivery_question'
  | 'order_followup'
  | 'support_issue'
  | 'unknown';
export type SuggestedAction =
  | 'create_draft_order'
  | 'link_existing_order'
  | 'request_payment_confirmation'
  | 'ask_for_details'
  | 'review_manually'
  | 'store_only';

export interface NormalizedIncomingMessage {
  merchantId: string;
  customerPhone: string;
  waMessageId?: string;
  type: MessageType;
  text?: string;
  media?: {
    id?: string;
    mimeType?: string;
    url?: string;
    caption?: string;
  };
  interactive?: {
    kind?: string;
    title?: string;
    value?: string;
  };
  rawPayload: unknown;
  createdAt: string;
}

export interface ExtractedOrderSignal {
  productName: string;
  quantity: number;
}

export interface MessageAnalysisResult {
  category: MessageIntentCategory;
  confidenceScore: number;
  suggestedAction: SuggestedAction;
  containsOrderKeywords: boolean;
  addressSignal: boolean;
  paymentProofSignal: boolean;
  quantitySignals: number[];
  matchedProducts: string[];
  extractedOrderSignals: ExtractedOrderSignal[];
  explanation: string[];
}

export interface WhatsappThread {
  id?: string;
  merchantId: string;
  customerId: string;
  linkedOrderId?: string | null;
  lastMessage: string;
  lastDirection: 'incoming' | 'outgoing';
  unreadCount: number;
  lastMessageAt: string;
  status: 'open' | 'processed' | 'needs_attention';
  lastCategory?: MessageIntentCategory;
  lastConfidenceScore?: number;
  suggestedAction?: SuggestedAction;
  createdAt: string;
  updatedAt?: string;
}

export interface WhatsappMessage {
  id?: string;
  merchantId: string;
  customerId: string;
  threadId: string;
  orderId?: string | null;
  waMessageId?: string;
  type: MessageType;
  text?: string;
  media?: {
    id?: string;
    mimeType?: string;
    url?: string;
    caption?: string;
  };
  direction: 'incoming' | 'outgoing';
  category: MessageIntentCategory;
  confidenceScore: number;
  suggestedAction: SuggestedAction;
  rawPayload?: unknown;
  createdAt: string;
}

export interface RawWebhookEvent {
  id?: string;
  merchantId?: string | null;
  payload: unknown;
  receivedAt: string;
  processed: boolean;
  processingError?: string | null;
}

export interface InternalNote {
  id?: string;
  merchantId: string;
  customerId?: string;
  orderId?: string;
  threadId?: string;
  authorId: string;
  content: string;
  createdAt: string;
}

// ============== COMMUNICATION LOGS ==============

export type CommLogType =
  | 'contact'
  | 'confirm_order'
  | 'payment_reminder'
  | 'order_ready'
  | 'send_receipt';

export interface CommLog {
  id?: string;
  shopId: string;
  orderId: string | null;
  customerName: string;
  customerPhone: string;
  type: CommLogType;
  message: string;
  status: 'opened' | 'delivered' | 'failed';
  createdAt: string;
}
