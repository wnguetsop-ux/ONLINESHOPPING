import { FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdminDb } from './firebase-admin';
import { analyzeIncomingMessage, inferCustomerNameFromText } from '../whatsapp-analysis';
import { normalizeIncomingMessages } from '../whatsapp-normalize';
import {
  Customer,
  MerchantWhatsappAccount,
  MessageAnalysisResult,
  RawWebhookEvent,
  WhatsappMessage,
  WhatsappThread,
  Order,
  Product,
} from '../types';

function sanitizeId(value: string): string {
  return value.replace(/[^A-Za-z0-9_-]/g, '_');
}

function customerDocId(merchantId: string, phone: string): string {
  return `${sanitizeId(merchantId)}__${sanitizeId(phone)}`;
}

function threadDocId(merchantId: string, customerId: string): string {
  return `${sanitizeId(merchantId)}__${sanitizeId(customerId)}`;
}

function messageDocId(merchantId: string, waMessageId?: string): string {
  return waMessageId ? `${sanitizeId(merchantId)}__${sanitizeId(waMessageId)}` : `${sanitizeId(merchantId)}__${Date.now()}`;
}

function generateOrderNumber(): string {
  const now = new Date();
  return `WAC-${now.getFullYear().toString().slice(-2)}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

async function detectMerchantFromPayload(rawPayload: any): Promise<MerchantWhatsappAccount | null> {
  const db = getFirebaseAdminDb();
  const phoneNumberId =
    rawPayload?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id ||
    rawPayload?.entry?.[0]?.changes?.[0]?.value?.statuses?.[0]?.recipient_id;

  if (!phoneNumberId) {
    return null;
  }

  const snapshot = await db
    .collection('merchant_whatsapp_accounts')
    .where('phoneNumberId', '==', String(phoneNumberId))
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const document = snapshot.docs[0];
    return { id: document.id, ...document.data() } as MerchantWhatsappAccount;
  }

  // Fallback: env vars for the platform owner's default WhatsApp account
  // (before Embedded Signup is completed for a merchant)
  const envPhoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const envMerchantId = process.env.WHATSAPP_DEFAULT_MERCHANT_ID;
  if (envPhoneNumberId && envMerchantId && String(phoneNumberId) === envPhoneNumberId) {
    return {
      merchantId: envMerchantId,
      phoneNumberId: envPhoneNumberId,
      wabaId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
      automaticOutgoingEnabled: false,
    } as MerchantWhatsappAccount;
  }

  return null;
}

async function saveRawWebhookEvent(payload: unknown, merchantId?: string | null): Promise<string> {
  const db = getFirebaseAdminDb();
  const ref = await db.collection('raw_webhook_events').add({
    merchantId: merchantId || null,
    payload,
    receivedAt: new Date().toISOString(),
    processed: false,
    processingError: null,
  } satisfies RawWebhookEvent);
  return ref.id;
}

async function extractOrCreateCustomer(merchantId: string, phone: string, fallbackName?: string): Promise<Customer> {
  const db = getFirebaseAdminDb();
  const id = customerDocId(merchantId, phone);
  const ref = db.collection('customers').doc(id);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    const current = snapshot.data() as Customer;
    const nextName = current.name || fallbackName;
    await ref.set(
      {
        ...current,
        name: nextName,
        lastMessageAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
    return { id, ...current, name: nextName, lastMessageAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
  }

  const customer: Customer = {
    merchantId,
    phone,
    name: fallbackName,
    tags: [],
    lastMessageAt: new Date().toISOString(),
    totalOrders: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await ref.set(customer);
  return { id, ...customer };
}

async function upsertThread(
  merchantId: string,
  customerId: string,
  lastMessage: string,
  category: MessageAnalysisResult['category'],
  confidenceScore: number,
  suggestedAction: MessageAnalysisResult['suggestedAction']
): Promise<WhatsappThread> {
  const db = getFirebaseAdminDb();
  const id = threadDocId(merchantId, customerId);
  const ref = db.collection('whatsapp_threads').doc(id);
  const snapshot = await ref.get();
  const now = new Date().toISOString();

  const base: Partial<WhatsappThread> = {
    merchantId,
    customerId,
    lastMessage,
    lastDirection: 'incoming',
    lastMessageAt: now,
    lastCategory: category,
    lastConfidenceScore: confidenceScore,
    suggestedAction,
    updatedAt: now,
  };

  if (snapshot.exists) {
    const current = snapshot.data() as WhatsappThread;
    const nextUnread = (current.unreadCount || 0) + 1;
    await ref.set(
      {
        ...base,
        unreadCount: nextUnread,
        status: confidenceScore >= 0.72 ? 'needs_attention' : current.status || 'open',
      },
      { merge: true }
    );
    return {
      id,
      ...current,
      ...base,
      unreadCount: nextUnread,
      status: confidenceScore >= 0.72 ? 'needs_attention' : current.status || 'open',
    } as WhatsappThread;
  }

  const thread: WhatsappThread = {
    merchantId,
    customerId,
    linkedOrderId: null,
    lastMessage,
    lastDirection: 'incoming',
    unreadCount: 1,
    lastMessageAt: now,
    status: confidenceScore >= 0.72 ? 'needs_attention' : 'open',
    lastCategory: category,
    lastConfidenceScore: confidenceScore,
    suggestedAction,
    createdAt: now,
    updatedAt: now,
  };
  await ref.set(thread);
  return { id, ...thread };
}

async function getKnownProducts(merchantId: string): Promise<Product[]> {
  const db = getFirebaseAdminDb();
  const snapshot = await db.collection('products').where('shopId', '==', merchantId).get();
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as Product));
}

async function createDraftOrderIfNeeded(params: {
  merchantId: string;
  customer: Customer;
  thread: WhatsappThread;
  analysis: MessageAnalysisResult;
  messageText: string;
  products: Product[];
}): Promise<string | null> {
  const { merchantId, customer, thread, analysis, messageText, products } = params;

  if (analysis.suggestedAction !== 'create_draft_order' || analysis.confidenceScore < 0.72) {
    return null;
  }

  if (thread.linkedOrderId) {
    return thread.linkedOrderId;
  }

  const db = getFirebaseAdminDb();
  const productMap = new Map(products.map((product) => [product.name.toLowerCase(), product]));
  const items = analysis.extractedOrderSignals
    .map((signal) => {
      const matched = productMap.get(signal.productName.toLowerCase());
      if (!matched) {
        return {
          productId: `unmatched-${sanitizeId(signal.productName)}`,
          productName: signal.productName,
          quantity: signal.quantity,
          unitPrice: 0,
          costPrice: 0,
          total: 0,
        };
      }

      return {
        productId: matched.id || `product-${sanitizeId(signal.productName)}`,
        productName: matched.name,
        quantity: signal.quantity,
        unitPrice: matched.sellingPrice || 0,
        costPrice: matched.costPrice || 0,
        total: (matched.sellingPrice || 0) * signal.quantity,
      };
    })
    .filter(Boolean);

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const order: Omit<Order, 'id'> = {
    shopId: merchantId,
    merchantId,
    customerId: customer.id,
    linkedThreadId: thread.id,
    source: 'whatsapp_incoming',
    orderNumber: generateOrderNumber(),
    customerName: customer.name || 'Client WhatsApp',
    customerPhone: customer.phone,
    items,
    subtotal,
    deliveryFee: 0,
    total: subtotal,
    profit: items.reduce((sum, item) => sum + (item.unitPrice - item.costPrice) * item.quantity, 0),
    amountPaid: 0,
    balanceDue: subtotal,
    paymentStatus: 'UNPAID',
    paymentMethod: 'MOBILE_MONEY',
    deliveryMethod: 'DELIVERY',
    status: 'PENDING',
    workflowStatus: 'pending_review',
    notes: messageText,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const orderRef = await db.collection('orders').add(order);
  await db.collection('whatsapp_threads').doc(thread.id).set(
    {
      linkedOrderId: orderRef.id,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
  return orderRef.id;
}

async function saveIncomingMessage(
  merchantId: string,
  customerId: string,
  threadId: string,
  normalizedMessage: { type: string; text?: string; media?: any; rawPayload: unknown; waMessageId?: string; createdAt: string },
  analysis: MessageAnalysisResult,
  orderId?: string | null
): Promise<string> {
  const db = getFirebaseAdminDb();
  const id = messageDocId(merchantId, normalizedMessage.waMessageId);
  const ref = db.collection('whatsapp_messages').doc(id);
  const snapshot = await ref.get();

  if (snapshot.exists) {
    return id;
  }

  const message: Omit<WhatsappMessage, 'id'> = {
    merchantId,
    customerId,
    threadId,
    orderId: orderId || null,
    type: normalizedMessage.type as WhatsappMessage['type'],
    direction: 'incoming',
    category: analysis.category,
    confidenceScore: analysis.confidenceScore,
    suggestedAction: analysis.suggestedAction,
    rawPayload: normalizedMessage.rawPayload,
    createdAt: normalizedMessage.createdAt,
    ...(normalizedMessage.waMessageId ? { waMessageId: normalizedMessage.waMessageId } : {}),
    ...(normalizedMessage.text ? { text: normalizedMessage.text } : {}),
    ...(normalizedMessage.media ? { media: normalizedMessage.media } : {}),
  };

  await ref.set(message);
  return id;
}

async function finalizeWebhookEvent(eventId: string, payload: Partial<RawWebhookEvent>): Promise<void> {
  const db = getFirebaseAdminDb();
  await db.collection('raw_webhook_events').doc(eventId).set(payload, { merge: true });
}

export async function processIncomingWhatsAppWebhook(rawPayload: unknown) {
  const account = await detectMerchantFromPayload(rawPayload);
  const merchantId = account?.merchantId || null;
  const rawEventId = await saveRawWebhookEvent(rawPayload, merchantId);

  try {
    if (!account?.merchantId) {
      await finalizeWebhookEvent(rawEventId, {
        processed: false,
        processingError: 'merchant_not_found',
      });
      return { ok: false, reason: 'merchant_not_found' as const };
    }

    const products = await getKnownProducts(account.merchantId);
    const normalizedMessages = normalizeIncomingMessages(rawPayload, account.merchantId);

    for (const normalizedMessage of normalizedMessages) {
      const fallbackName =
        (normalizedMessage.rawPayload as any)?.contactProfileName ||
        inferCustomerNameFromText(normalizedMessage.text || '');
      const customer = await extractOrCreateCustomer(account.merchantId, normalizedMessage.customerPhone, fallbackName);
      const analysis = analyzeIncomingMessage(
        normalizedMessage.text || normalizedMessage.media?.caption || normalizedMessage.type,
        products.map((product) => product.name)
      );
      const thread = await upsertThread(
        account.merchantId,
        customer.id || customerDocId(account.merchantId, normalizedMessage.customerPhone),
        normalizedMessage.text || normalizedMessage.media?.caption || normalizedMessage.type,
        analysis.category,
        analysis.confidenceScore,
        analysis.suggestedAction
      );
      const orderId = await createDraftOrderIfNeeded({
        merchantId: account.merchantId,
        customer,
        thread,
        analysis,
        messageText: normalizedMessage.text || normalizedMessage.media?.caption || '',
        products,
      });

      await saveIncomingMessage(
        account.merchantId,
        customer.id || customerDocId(account.merchantId, normalizedMessage.customerPhone),
        thread.id || threadDocId(account.merchantId, customer.id || customerDocId(account.merchantId, normalizedMessage.customerPhone)),
        normalizedMessage,
        analysis,
        orderId
      );
    }

    await finalizeWebhookEvent(rawEventId, {
      merchantId: account.merchantId,
      processed: true,
      processingError: null,
    });

    return { ok: true, merchantId: account.merchantId, processedMessages: normalizedMessages.length };
  } catch (error) {
    await finalizeWebhookEvent(rawEventId, {
      processed: false,
      processingError: error instanceof Error ? error.message : 'unknown_error',
    });
    throw error;
  }
}

export async function upsertUnreadCounter(threadId: string): Promise<void> {
  const db = getFirebaseAdminDb();
  await db.collection('whatsapp_threads').doc(threadId).set(
    {
      unreadCount: FieldValue.increment(1),
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}
