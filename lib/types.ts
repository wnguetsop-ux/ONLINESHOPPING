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
  features: string[];
  featureFlags: Record<PlanFeatureKey, boolean>;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  FREE: {
    id: 'FREE',
    code: 'FREE',
    name: 'Gratuit',
    price: 0,
    priceXaf: 0,
    billingCycle: 'monthly',
    annualPriceXaf: null,
    badge: '8 commandes pour essayer',
    color: '#64748b',
    maxProducts: 20,
    maxOrdersPerMonth: 8,
    maxWhatsappAccounts: 0,
    maxStaff: 1,
    features: [
      'Jusqu a 8 commandes par mois',
      'Creation manuelle de commandes',
      'Historique client simple',
      'Interface mobile-first',
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
  STARTER: {
    id: 'STARTER',
    code: 'STARTER',
    name: 'Starter',
    price: 3000,
    priceXaf: 3000,
    billingCycle: 'monthly',
    annualPriceXaf: null,
    color: '#2563eb',
    maxProducts: 120,
    maxOrdersPerMonth: -1,
    maxWhatsappAccounts: 1,
    maxStaff: 1,
    features: [
      '1 numero WhatsApp connecte',
      'Reception des messages dans l app',
      'Inbox simple et conversations',
      'Creation manuelle de commandes',
      'Historique client simple',
    ],
    featureFlags: {
      manualOrders: true,
      incomingWhatsappInbox: true,
      conversationManagement: true,
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
  STANDARD: {
    id: 'STANDARD',
    code: 'STANDARD',
    name: 'Standard',
    price: 5000,
    priceXaf: 5000,
    billingCycle: 'monthly',
    annualPriceXaf: null,
    badge: 'Le plus populaire',
    isPopular: true,
    color: '#ea580c',
    maxProducts: 400,
    maxOrdersPerMonth: -1,
    maxWhatsappAccounts: 1,
    maxStaff: 2,
    features: [
      'Tout Starter',
      'Detection automatique des messages de commande',
      'Creation de commande brouillon',
      'Statuts de commande',
      'Recherche et filtres',
      'Notifications internes',
      'Fiche client enrichie',
    ],
    featureFlags: {
      manualOrders: true,
      incomingWhatsappInbox: true,
      conversationManagement: true,
      simpleCustomerHistory: true,
      orderIntentDetection: true,
      draftOrders: true,
      orderStatuses: true,
      searchAndFilters: true,
      internalNotifications: true,
      enrichedCustomerProfile: true,
      multiStaff: false,
      statsAndReports: false,
      controlledOutboundReady: false,
    },
  },
  PRO: {
    id: 'PRO',
    code: 'PRO',
    name: 'Pro',
    price: 10000,
    priceXaf: 10000,
    billingCycle: 'monthly',
    annualPriceXaf: null,
    color: '#7c3aed',
    maxProducts: -1,
    maxOrdersPerMonth: -1,
    maxWhatsappAccounts: 3,
    maxStaff: 10,
    features: [
      'Tout Standard',
      'Acces multi-staff',
      'Statistiques',
      'Rapports',
      'Support prioritaire',
      'Structure prete pour reponses sortantes controlees',
    ],
    featureFlags: {
      manualOrders: true,
      incomingWhatsappInbox: true,
      conversationManagement: true,
      simpleCustomerHistory: true,
      orderIntentDetection: true,
      draftOrders: true,
      orderStatuses: true,
      searchAndFilters: true,
      internalNotifications: true,
      enrichedCustomerProfile: true,
      multiStaff: true,
      statsAndReports: true,
      controlledOutboundReady: true,
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
