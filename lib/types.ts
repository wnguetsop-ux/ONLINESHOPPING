// ============== SHOP (Boutique) ==============
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
  currency: 'XAF' | 'XOF' | 'GNF' | 'MGA' | 'MRO' | 'EUR' | 'USD' | 'CDF' | 'BIF' | 'RWF';
  deliveryFee: number;
  freeDeliveryAbove?: number;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  mobileMoneyNumber?: string;
  mobileMoneyName?: string;
  planId: 'FREE' | 'STARTER' | 'PRO';
  planExpiry?: string;
  ordersThisMonth: number;
  lastOrderReset: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ============== ADMIN (Propriétaire boutique) ==============
export interface Admin {
  uid: string;
  email: string;
  name: string;
  phone?: string;
  shopId: string;
  shopSlug: string;
  createdAt: string;
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
  isActive: boolean;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// ============== CATEGORY ==============
export interface Category {
  id?: string;
  shopId: string;
  name: string;
  description?: string;
  color: string;
}

// ============== ORDER ==============
export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  costPrice: number;
  total: number;
}

export interface Order {
  id?: string;
  shopId: string;
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
  paymentMethod: 'MOBILE_MONEY' | 'CASH_ON_DELIVERY';
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'DELIVERED' | 'CANCELLED';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ============== SUBSCRIPTION PLANS ==============
export const PLANS = {
  FREE: {
    id: 'FREE' as const,
    name: 'Gratuit',
    price: 0,
    maxProducts: 20,
    maxOrdersPerMonth: 20,
    features: ['20 produits max', '20 commandes/mois', 'Support email'],
    color: '#6b7280'
  },
  STARTER: {
    id: 'STARTER' as const,
    name: 'Starter',
    price: 1000,
    maxProducts: 50,
    maxOrdersPerMonth: 100,
    features: ['50 produits max', '100 commandes/mois', 'Support prioritaire'],
    color: '#3b82f6'
  },
  PRO: {
    id: 'PRO' as const,
    name: 'Pro',
    price: 2500,
    maxProducts: -1,
    maxOrdersPerMonth: -1,
    features: ['Produits illimités', 'Commandes illimitées', 'Support 24/7'],
    color: '#8b5cf6'
  }
};

export type PlanId = keyof typeof PLANS;

// ─── WHATSAPP / COMMUNICATION ─────────────────────────────────────────────────

export type CommLogType =
  | 'contact'
  | 'confirm_order'
  | 'payment_reminder'
  | 'order_ready'
  | 'send_receipt';

export interface CommLog {
  id?:           string;
  shopId:        string;
  orderId:       string | null;
  customerName:  string;
  customerPhone: string;
  type:          CommLogType;
  message:       string;
  status:        'opened' | 'delivered' | 'failed';
  createdAt:     string;
}