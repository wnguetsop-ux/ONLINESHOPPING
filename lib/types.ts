// ============== SHOP (Boutique) ==============
export interface Shop {
  id?: string;
  slug: string;              // URL unique: "boutique-marie"
  ownerId: string;           // UID Firebase de l'admin
  
  // Informations boutique
  name: string;
  description?: string;
  slogan?: string;
  logo?: string;
  
  // Apparence
  primaryColor: string;
  
  // Contact
  whatsapp: string;
  phone?: string;
  email?: string;
  
  // Localisation
  address?: string;
  city?: string;
  country: string;
  pickupAddress?: string;
  
  // Configuration
  currency: 'XAF' | 'EUR' | 'USD';
  deliveryFee: number;
  freeDeliveryAbove?: number;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  
  // Paiement
  mobileMoneyNumber?: string;
  mobileMoneyName?: string;
  
  // Abonnement
  planId: 'FREE' | 'STARTER' | 'PRO';
  planExpiry?: string;
  ordersThisMonth: number;
  lastOrderReset: string;
  
  // Statut
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
  shopId: string;            // ID de sa boutique
  shopSlug: string;          // Slug de sa boutique
  createdAt: string;
}

// ============== PRODUCT ==============
export interface Product {
  id?: string;
  shopId: string;            // ID de la boutique
  name: string;
  description?: string;
  specifications?: string;
  category: string;
  brand?: string;
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
  shopId: string;            // ID de la boutique
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
  shopId: string;            // ID de la boutique
  orderNumber: string;
  
  // Client
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerQuartier?: string;
  
  // Commande
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  profit: number;
  
  // Méthodes
  paymentMethod: 'MOBILE_MONEY' | 'CASH_ON_DELIVERY';
  deliveryMethod: 'DELIVERY' | 'PICKUP';
  
  // Statut
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