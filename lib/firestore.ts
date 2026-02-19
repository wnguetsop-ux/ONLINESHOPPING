import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, setDoc, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { Shop, Admin, Product, Category, Order, OrderItem, PLANS, PlanId } from './types';

// ============== SHOP ==============

export async function createShop(data: Omit<Shop, 'id' | 'createdAt' | 'ordersThisMonth' | 'lastOrderReset' | 'isActive'>): Promise<string> {
  // Vérifier si le slug existe déjà
  const existing = await getShopBySlug(data.slug);
  if (existing) {
    throw new Error('Ce nom de boutique est déjà pris. Choisissez un autre nom.');
  }
  
  const shop: Omit<Shop, 'id'> = {
    ...data,
    ordersThisMonth: 0,
    lastOrderReset: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  
  const docRef = await addDoc(collection(db, 'shops'), shop);
  return docRef.id;
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const q = query(collection(db, 'shops'), where('slug', '==', slug.toLowerCase()));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Shop;
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  const docSnap = await getDoc(doc(db, 'shops', shopId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Shop;
}

export async function getShopByOwnerId(ownerId: string): Promise<Shop | null> {
  const q = query(collection(db, 'shops'), where('ownerId', '==', ownerId));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Shop;
}

export async function updateShop(shopId: string, data: Partial<Shop>): Promise<void> {
  await updateDoc(doc(db, 'shops', shopId), { ...data, updatedAt: new Date().toISOString() });
}

export async function checkSlugAvailable(slug: string): Promise<boolean> {
  const shop = await getShopBySlug(slug);
  return shop === null;
}

// ============== ADMIN ==============

export async function createAdmin(data: Admin): Promise<void> {
  await setDoc(doc(db, 'admins', data.uid), data);
}

export async function getAdmin(uid: string): Promise<Admin | null> {
  const docSnap = await getDoc(doc(db, 'admins', uid));
  if (!docSnap.exists()) return null;
  return docSnap.data() as Admin;
}

// ============== PRODUCTS ==============

export async function createProduct(shopId: string, data: Omit<Product, 'id' | 'shopId' | 'createdAt'>): Promise<string> {
  const product = {
    ...data,
    shopId,
    createdAt: new Date().toISOString(),
  };
  const docRef = await addDoc(collection(db, 'products'), product);
  return docRef.id;
}

export async function getProducts(shopId: string, onlyActive: boolean = false): Promise<Product[]> {
  const q = query(collection(db, 'products'), where('shopId', '==', shopId));
  const snapshot = await getDocs(q);
  let products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
  
  if (onlyActive) {
    products = products.filter(p => p.isActive && p.stock > 0);
  }
  
  return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getProduct(productId: string): Promise<Product | null> {
  const docSnap = await getDoc(doc(db, 'products', productId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Product;
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, 'products', productId), { ...data, updatedAt: new Date().toISOString() });
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

// ============== CATEGORIES ==============

export async function createCategory(shopId: string, data: Omit<Category, 'id' | 'shopId'>): Promise<string> {
  const docRef = await addDoc(collection(db, 'categories'), { ...data, shopId });
  return docRef.id;
}

export async function getCategories(shopId: string): Promise<Category[]> {
  const q = query(collection(db, 'categories'), where('shopId', '==', shopId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', categoryId));
}

// ============== ORDERS ==============

function generateOrderNumber(): string {
  const d = new Date();
  return `CMD-${d.getFullYear().toString().slice(-2)}${(d.getMonth()+1).toString().padStart(2,'0')}${d.getDate().toString().padStart(2,'0')}-${Math.random().toString(36).substring(2,6).toUpperCase()}`;
}

export async function createOrder(shopId: string, data: {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress?: string;
  customerQuartier?: string;
  items: Omit<OrderItem, 'total'>[];
  paymentMethod: Order['paymentMethod'];
  deliveryMethod: Order['deliveryMethod'];
  deliveryFee: number;
  notes?: string;
}): Promise<string> {

  // ── Check order limit before creating ──
  const shopForLimit = await getShopById(shopId);
  if (shopForLimit) {
    const plan = PLANS[shopForLimit.planId || 'FREE'];
    if (plan.maxOrdersPerMonth !== -1) {
      const now = new Date();
      const lastReset = new Date(shopForLimit.lastOrderReset);
      const isNewMonth = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
      const ordersThisMonth = isNewMonth ? 0 : shopForLimit.ordersThisMonth;
      if (ordersThisMonth >= plan.maxOrdersPerMonth) {
        throw new Error(`LIMIT_REACHED: Limite de ${plan.maxOrdersPerMonth} commandes/mois atteinte. Passez au plan supérieur dans Admin > Abonnement.`);
      }
    }
  }
  const orderItems: OrderItem[] = data.items.map(item => ({ 
    ...item, 
    total: item.quantity * item.unitPrice 
  }));
  
  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + data.deliveryFee;
  const profit = orderItems.reduce((sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity, 0);

  const order: Omit<Order, 'id'> = {
    shopId,
    orderNumber: generateOrderNumber(),
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    ...(data.customerEmail    ? { customerEmail:    data.customerEmail }    : {}),
    ...(data.customerAddress  ? { customerAddress:  data.customerAddress }  : {}),
    ...(data.customerQuartier ? { customerQuartier: data.customerQuartier } : {}),
    ...(data.notes            ? { notes:            data.notes }            : {}),
    items: orderItems,
    subtotal,
    deliveryFee: data.deliveryFee,
    total,
    profit,
    paymentMethod: data.paymentMethod,
    deliveryMethod: data.deliveryMethod,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
  };

  const docRef = await addDoc(collection(db, 'orders'), order);

  // Update stock
  for (const item of data.items) {
    const product = await getProduct(item.productId);
    if (product && product.stock >= item.quantity) {
      await updateProduct(item.productId, { stock: product.stock - item.quantity });
    }
  }

  // Increment shop order count
  const shop = await getShopById(shopId);
  if (shop) {
    const now = new Date();
    const lastReset = new Date(shop.lastOrderReset);
    const isNewMonth = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
    
    if (isNewMonth) {
      await updateShop(shopId, { ordersThisMonth: 1, lastOrderReset: now.toISOString() });
    } else {
      await updateShop(shopId, { ordersThisMonth: (shop.ordersThisMonth || 0) + 1 });
    }
  }

  return docRef.id;
}

export async function getOrders(shopId: string, status?: Order['status']): Promise<Order[]> {
  const q = query(collection(db, 'orders'), where('shopId', '==', shopId));
  const snapshot = await getDocs(q);
  let orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
  
  if (status) {
    orders = orders.filter(o => o.status === status);
  }
  
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const docSnap = await getDoc(doc(db, 'orders', orderId));
  if (!docSnap.exists()) return null;
  return { id: docSnap.id, ...docSnap.data() } as Order;
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  await updateDoc(doc(db, 'orders', orderId), { status, updatedAt: new Date().toISOString() });
}

// ============== DASHBOARD STATS ==============

export async function getDashboardStats(shopId: string) {
  const [products, orders] = await Promise.all([
    getProducts(shopId),
    getOrders(shopId)
  ]);
  
  const activeProducts = products.filter(p => p.isActive);
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  
  const today = new Date(); today.setHours(0,0,0,0);
  const todayOrders = orders.filter(o => new Date(o.createdAt) >= today);
  
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthOrders = orders.filter(o => new Date(o.createdAt) >= thisMonth);

  return {
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    totalStock: products.reduce((s, p) => s + p.stock, 0),
    stockValue: products.reduce((s, p) => s + p.stock * p.costPrice, 0),
    lowStockProducts: products.filter(p => p.stock <= (p.minStock || 5)).slice(0, 5),
    
    pendingOrders: pendingOrders.length,
    
    todayOrders: todayOrders.length,
    todayRevenue: todayOrders.reduce((s, o) => s + o.total, 0),
    todayProfit: todayOrders.reduce((s, o) => s + o.profit, 0),
    
    monthOrders: monthOrders.length,
    monthRevenue: monthOrders.reduce((s, o) => s + o.total, 0),
    monthProfit: monthOrders.reduce((s, o) => s + o.profit, 0),
    
    totalOrders: deliveredOrders.length,
    totalRevenue: deliveredOrders.reduce((s, o) => s + o.total, 0),
    totalProfit: deliveredOrders.reduce((s, o) => s + o.profit, 0),
    
    recentOrders: orders.slice(0, 5),
  };
}

// ============== SUBSCRIPTION LIMITS ==============

export async function checkShopLimits(shopId: string): Promise<{
  canAddProduct: boolean;
  canCreateOrder: boolean;
  productsCount: number;
  ordersThisMonth: number;
  plan: typeof PLANS.FREE;
}> {
  const shop = await getShopById(shopId);
  if (!shop) throw new Error('Boutique non trouvée');
  
  const products = await getProducts(shopId);
  const plan = PLANS[shop.planId || 'FREE'];
  
  // Check if month reset needed
  const now = new Date();
  const lastReset = new Date(shop.lastOrderReset);
  const isNewMonth = lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
  const ordersThisMonth = isNewMonth ? 0 : shop.ordersThisMonth;
  
  const canAddProduct = plan.maxProducts === -1 || products.length < plan.maxProducts;
  const canCreateOrder = plan.maxOrdersPerMonth === -1 || ordersThisMonth < plan.maxOrdersPerMonth;
  
  return {
    canAddProduct,
    canCreateOrder,
    productsCount: products.length,
    ordersThisMonth,
    plan
  };
}