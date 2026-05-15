import {
  addDoc,
  collection,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  doc,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Customer,
  InternalNote,
  MerchantWhatsappAccount,
  Subscription,
  WhatsappMessage,
  WhatsappThread,
} from './types';

export async function getMerchantWhatsappAccounts(merchantId: string): Promise<MerchantWhatsappAccount[]> {
  const snapshot = await getDocs(query(collection(db, 'merchant_whatsapp_accounts'), where('merchantId', '==', merchantId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() } as MerchantWhatsappAccount));
}

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export async function upsertMerchantWhatsappAccount(
  merchantId: string,
  data: Partial<MerchantWhatsappAccount>
): Promise<string> {
  const existing = await getMerchantWhatsappAccounts(merchantId);
  const now = new Date().toISOString();

  if (existing[0]?.id) {
    await updateDoc(doc(db, 'merchant_whatsapp_accounts', existing[0].id), {
      ...omitUndefined(data as Record<string, unknown>),
      updatedAt: now,
    });
    return existing[0].id;
  }

  const ref = await addDoc(collection(db, 'merchant_whatsapp_accounts'), {
    merchantId,
    status: 'pending',
    incomingEnabled: true,
    outgoingEnabled: false,
    automaticOutgoingEnabled: false,
    createdAt: now,
    updatedAt: now,
    ...omitUndefined(data as Record<string, unknown>),
  });

  return ref.id;
}

export async function getMerchantSubscription(merchantId: string): Promise<Subscription | null> {
  const snapshot = await getDocs(query(collection(db, 'subscriptions'), where('merchantId', '==', merchantId)));
  if (snapshot.empty) return null;
  const item = snapshot.docs[0];
  return { id: item.id, ...item.data() } as Subscription;
}

export async function getWhatsappThreads(merchantId: string): Promise<WhatsappThread[]> {
  const snapshot = await getDocs(query(collection(db, 'whatsapp_threads'), where('merchantId', '==', merchantId)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() } as WhatsappThread))
    .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
}

export async function getWhatsappMessages(threadId: string): Promise<WhatsappMessage[]> {
  const snapshot = await getDocs(query(collection(db, 'whatsapp_messages'), where('threadId', '==', threadId)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() } as WhatsappMessage))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getInternalNotes(threadId: string): Promise<InternalNote[]> {
  const snapshot = await getDocs(query(collection(db, 'internal_notes'), where('threadId', '==', threadId)));
  return snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() } as InternalNote))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function getCustomerProfileById(customerId: string): Promise<Customer | null> {
  const snapshot = await getDoc(doc(db, 'customers', customerId));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() } as Customer;
}

export async function addThreadInternalNote(note: Omit<InternalNote, 'id' | 'createdAt'>): Promise<string> {
  const ref = await addDoc(collection(db, 'internal_notes'), {
    ...note,
    createdAt: new Date().toISOString(),
  });
  return ref.id;
}

export async function markThreadAsProcessed(threadId: string): Promise<void> {
  await updateDoc(doc(db, 'whatsapp_threads', threadId), {
    unreadCount: 0,
    status: 'processed',
    updatedAt: new Date().toISOString(),
  });
}
