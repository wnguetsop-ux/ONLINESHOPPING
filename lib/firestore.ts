import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Admin,
  Category,
  CommLog,
  Merchant,
  Order,
  OrderItem,
  PlanDefinition,
  PLANS,
  Product,
  Shop,
  Subscription,
} from './types';
import { getPaymentSnapshot, normalizeOrderPayment, sanitizeMoney } from './order-payment';

function getPlan(planId: Shop['planId'] | undefined): PlanDefinition {
  return PLANS[planId || 'FREE'] || PLANS.FREE;
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function generateOrderNumber(): string {
  const now = new Date();
  return `CMD-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

// ============== SHOP ==============

export async function createShop(
  data: Omit<Shop, 'id' | 'createdAt' | 'ordersThisMonth' | 'lastOrderReset' | 'isActive'>
): Promise<string> {
  const existing = await getShopBySlug(data.slug);
  if (existing) {
    throw new Error('Ce nom de boutique est deja pris. Choisissez un autre nom.');
  }

  const now = new Date().toISOString();
  const shop: Omit<Shop, 'id'> = {
    ...data,
    ordersThisMonth: 0,
    lastOrderReset: now,
    isActive: true,
    createdAt: now,
    ...(!(data as any).aiCredits ? { aiCredits: 2 } : {}), // 2 crédits offerts FREE
  };

  const docRef = await addDoc(collection(db, 'shops'), shop);

  const merchant: Merchant = {
    shopId: docRef.id,
    businessName: data.name,
    ownerId: data.ownerId,
    country: data.country,
    currency: data.currency,
    activePlanId: data.planId,
    createdAt: now,
    updatedAt: now,
  };

  const subscription: Subscription = {
    merchantId: docRef.id,
    planId: data.planId,
    status: 'active',
    startedAt: now,
    endsAt: null,
    paymentProvider: 'unknown',
    createdAt: now,
    updatedAt: now,
  };

  await Promise.all([
    setDoc(doc(db, 'merchants', docRef.id), merchant),
    setDoc(doc(db, 'subscriptions', docRef.id), subscription),
  ]);

  return docRef.id;
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  const snapshot = await getDocs(query(collection(db, 'shops'), where('slug', '==', slug.toLowerCase())));
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() } as Shop;
}

export async function getShopById(shopId: string): Promise<Shop | null> {
  const snapshot = await getDoc(doc(db, 'shops', shopId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Shop;
}

export async function getShopByOwnerId(ownerId: string): Promise<Shop | null> {
  const snapshot = await getDocs(query(collection(db, 'shops'), where('ownerId', '==', ownerId)));
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() } as Shop;
}

export async function updateShop(shopId: string, data: Partial<Shop>): Promise<void> {
  const now = new Date().toISOString();

  await updateDoc(
    doc(db, 'shops', shopId),
    omitUndefined({
      ...data,
      updatedAt: now,
    })
  );

  await setDoc(
    doc(db, 'merchants', shopId),
    omitUndefined({
      businessName: data.name,
      country: data.country,
      currency: data.currency,
      activePlanId: data.planId,
      updatedAt: now,
    }),
    { merge: true }
  );
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
  const snapshot = await getDoc(doc(db, 'admins', uid));
  if (!snapshot.exists()) return null;
  return snapshot.data() as Admin;
}

// ============== PRODUCTS ==============

export async function createProduct(
  shopId: string,
  data: Omit<Product, 'id' | 'shopId' | 'createdAt'>
): Promise<string> {
  // Vérification serveur des limites du plan
  const limits = await checkShopLimits(shopId);
  if (!limits.canAddProduct) {
    const max = limits.plan.maxProducts;
    throw new Error(`LIMIT_REACHED: Limite de ${max} produits atteinte pour le plan ${limits.plan.name}. Passez au plan supérieur pour continuer.`);
  }
  const ref = await addDoc(collection(db, 'products'), {
    ...data,
    shopId,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function getProducts(shopId: string, onlyActive = false): Promise<Product[]> {
  const snapshot = await getDocs(query(collection(db, 'products'), where('shopId', '==', shopId)));
  let products = snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Product));
  if (onlyActive) {
    products = products.filter((product) => product.isActive && product.stock > 0);
  }
  return products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getProduct(productId: string): Promise<Product | null> {
  const snapshot = await getDoc(doc(db, 'products', productId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Product;
}

export async function updateProduct(productId: string, data: Partial<Product>): Promise<void> {
  await updateDoc(doc(db, 'products', productId), {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProduct(productId: string): Promise<void> {
  await deleteDoc(doc(db, 'products', productId));
}

// ============== CATEGORIES ==============

export async function createCategory(shopId: string, data: Omit<Category, 'id' | 'shopId'>): Promise<string> {
  const ref = await addDoc(collection(db, 'categories'), { ...data, shopId });
  return ref.id;
}

export async function getCategories(shopId: string): Promise<Category[]> {
  const snapshot = await getDocs(query(collection(db, 'categories'), where('shopId', '==', shopId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Category));
}

export async function deleteCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, 'categories', categoryId));
}

// ============== ORDERS ==============

export async function createOrder(
  shopId: string,
  data: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    customerQuartier?: string;
    items: Omit<OrderItem, 'total'>[];
    paymentMethod: Order['paymentMethod'];
    deliveryMethod: Order['deliveryMethod'];
    deliveryFee: number;
    amountPaid?: number;
    notes?: string;
    source?: Order['source'];
    workflowStatus?: Order['workflowStatus'];
  }
): Promise<string> {
  const shop = await getShopById(shopId);

  if (shop) {
    const plan = getPlan(shop.planId);
    const now = new Date();
    const lastReset = new Date(shop.lastOrderReset);
    const isNewMonth =
      lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
    const ordersThisMonth = isNewMonth ? 0 : shop.ordersThisMonth;

    if (plan.maxOrdersPerMonth !== -1 && ordersThisMonth >= plan.maxOrdersPerMonth) {
      throw new Error(
        `LIMIT_REACHED: Limite de ${plan.maxOrdersPerMonth} commandes/mois atteinte. Passez au plan superieur dans Admin > Abonnement.`
      );
    }
  }

  const orderItems: OrderItem[] = data.items.map((item) => ({
    ...item,
    total: item.quantity * item.unitPrice,
  }));

  const subtotal = orderItems.reduce((sum, item) => sum + item.total, 0);
  const total = subtotal + data.deliveryFee;
  const profit = orderItems.reduce(
    (sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity,
    0
  );
  const paymentSnapshot = getPaymentSnapshot(total, sanitizeMoney(data.amountPaid));
  const now = new Date().toISOString();

  const order: Omit<Order, 'id'> = {
    shopId,
    merchantId: shopId,
    source: data.source || 'manual',
    orderNumber: generateOrderNumber(),
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    ...(data.customerEmail ? { customerEmail: data.customerEmail } : {}),
    ...(data.customerAddress ? { customerAddress: data.customerAddress } : {}),
    ...(data.customerQuartier ? { customerQuartier: data.customerQuartier } : {}),
    ...(data.notes ? { notes: data.notes } : {}),
    items: orderItems,
    subtotal,
    deliveryFee: data.deliveryFee,
    total,
    profit,
    amountPaid: paymentSnapshot.amountPaid,
    balanceDue: paymentSnapshot.balanceDue,
    paymentStatus: paymentSnapshot.paymentStatus,
    paymentMethod: data.paymentMethod,
    deliveryMethod: data.deliveryMethod,
    status: 'PENDING',
    workflowStatus: data.workflowStatus || 'pending_review',
    createdAt: now,
    paymentUpdatedAt: now,
    updatedAt: now,
  };

  const ref = await addDoc(collection(db, 'orders'), order);

  for (const item of data.items) {
    const product = await getProduct(item.productId);
    if (product && product.stock >= item.quantity) {
      await updateProduct(item.productId, { stock: product.stock - item.quantity });
    }
  }

  if (shop) {
    const dateNow = new Date();
    const lastReset = new Date(shop.lastOrderReset);
    const isNewMonth =
      lastReset.getMonth() !== dateNow.getMonth() || lastReset.getFullYear() !== dateNow.getFullYear();
    if (isNewMonth) {
      await updateShop(shopId, { ordersThisMonth: 1, lastOrderReset: dateNow.toISOString() });
    } else {
      await updateShop(shopId, { ordersThisMonth: (shop.ordersThisMonth || 0) + 1 });
    }
  }

  return ref.id;
}

export async function getOrders(shopId: string, status?: Order['status']): Promise<Order[]> {
  const snapshot = await getDocs(query(collection(db, 'orders'), where('shopId', '==', shopId)));
  let orders = snapshot.docs.map((item) => normalizeOrderPayment({ id: item.id, ...item.data() } as Order));
  if (status) {
    orders = orders.filter((order) => order.status === status);
  }
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const snapshot = await getDoc(doc(db, 'orders', orderId));
  if (!snapshot.exists()) return null;
  return normalizeOrderPayment({ id: snapshot.id, ...snapshot.data() } as Order);
}

export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
  const workflowStatusMap: Record<Order['status'], Order['workflowStatus']> = {
    PENDING: 'pending_review',
    CONFIRMED: 'confirmed',
    PROCESSING: 'preparing',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  };

  await updateDoc(doc(db, 'orders', orderId), {
    status,
    workflowStatus: workflowStatusMap[status],
    updatedAt: new Date().toISOString(),
  });
}

export async function updateOrderPayment(orderId: string, amountPaid: number): Promise<void> {
  const existing = await getOrder(orderId);
  if (!existing) throw new Error('Commande introuvable');

  const snapshot = getPaymentSnapshot(existing.total, amountPaid, existing.paymentStatus, existing.status);

  await updateDoc(doc(db, 'orders', orderId), {
    amountPaid: snapshot.amountPaid,
    balanceDue: snapshot.balanceDue,
    paymentStatus: snapshot.paymentStatus,
    paymentUpdatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

// ============== DASHBOARD STATS ==============

export async function getDashboardStats(shopId: string) {
  const [products, orders] = await Promise.all([getProducts(shopId), getOrders(shopId)]);
  const activeProducts = products.filter((product) => product.isActive);
  const deliveredOrders = orders.filter((order) => order.status === 'DELIVERED');
  const pendingOrders = orders.filter((order) => order.status === 'PENDING');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOrders = orders.filter((order) => new Date(order.createdAt) >= today);
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const monthOrders = orders.filter((order) => new Date(order.createdAt) >= thisMonth);

  return {
    totalProducts: products.length,
    activeProducts: activeProducts.length,
    totalStock: products.reduce((sum, product) => sum + product.stock, 0),
    stockValue: products.reduce((sum, product) => sum + product.stock * product.costPrice, 0),
    lowStockProducts: products.filter((product) => product.stock <= (product.minStock || 5)).slice(0, 5),
    pendingOrders: pendingOrders.length,
    todayOrders: todayOrders.length,
    todayRevenue: todayOrders.reduce((sum, order) => sum + order.total, 0),
    todayProfit: todayOrders.reduce((sum, order) => sum + order.profit, 0),
    monthOrders: monthOrders.length,
    monthRevenue: monthOrders.reduce((sum, order) => sum + order.total, 0),
    monthProfit: monthOrders.reduce((sum, order) => sum + order.profit, 0),
    totalOrders: deliveredOrders.length,
    totalRevenue: deliveredOrders.reduce((sum, order) => sum + order.total, 0),
    totalProfit: deliveredOrders.reduce((sum, order) => sum + order.profit, 0),
    recentOrders: orders.slice(0, 5),
  };
}

// ============== SUBSCRIPTION LIMITS ==============

export async function checkShopLimits(shopId: string): Promise<{
  canAddProduct: boolean;
  canCreateOrder: boolean;
  productsCount: number;
  ordersThisMonth: number;
  plan: PlanDefinition;
}> {
  const shop = await getShopById(shopId);
  if (!shop) throw new Error('Boutique non trouvee');

  const products = await getProducts(shopId);
  const plan = getPlan(shop.planId);
  const now = new Date();
  const lastReset = new Date(shop.lastOrderReset);
  const isNewMonth =
    lastReset.getMonth() !== now.getMonth() || lastReset.getFullYear() !== now.getFullYear();
  const ordersThisMonth = isNewMonth ? 0 : shop.ordersThisMonth;

  const canAddProduct = plan.maxProducts === -1 || products.length < plan.maxProducts;
  const canCreateOrder = plan.maxOrdersPerMonth === -1 || ordersThisMonth < plan.maxOrdersPerMonth;

  return {
    canAddProduct,
    canCreateOrder,
    productsCount: products.length,
    ordersThisMonth,
    plan,
  };
}

// ============== COMMUNICATION LOGS ==============

export async function addCommLog(log: Omit<CommLog, 'id'>): Promise<string> {
  const ref = await addDoc(collection(db, 'comm_logs'), log);
  return ref.id;
}

export async function getCommLogs(shopId: string, orderId?: string): Promise<CommLog[]> {
  const constraints = [where('shopId', '==', shopId), orderBy('createdAt', 'desc'), limit(50)];
  const commQuery = orderId
    ? query(collection(db, 'comm_logs'), where('shopId', '==', shopId), where('orderId', '==', orderId), orderBy('createdAt', 'desc'), limit(50))
    : query(collection(db, 'comm_logs'), ...constraints);

  const snapshot = await getDocs(commQuery);
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as CommLog));
}
