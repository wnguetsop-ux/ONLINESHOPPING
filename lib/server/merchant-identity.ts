import { getFirebaseAdminDb } from './firebase-admin';

export interface MerchantIdentity {
  merchantId: string;
  ownerUid: string;
}

export async function getMerchantIdentityForOwner(ownerUid: string): Promise<MerchantIdentity> {
  const db = getFirebaseAdminDb();
  const snapshot = await db
    .collection('shops')
    .where('ownerId', '==', ownerUid)
    .limit(1)
    .get();

  if (!snapshot.empty) {
    return { merchantId: snapshot.docs[0].id, ownerUid };
  }

  // Safe fallback for older accounts or test data that used uid as merchant id.
  return { merchantId: ownerUid, ownerUid };
}

export async function assertShopOwner(ownerUid: string, shopId: string): Promise<boolean> {
  if (!ownerUid || !shopId) return false;
  if (ownerUid === shopId) return true;

  const db = getFirebaseAdminDb();
  const snapshot = await db.collection('shops').doc(shopId).get();
  if (!snapshot.exists) return false;

  return snapshot.data()?.ownerId === ownerUid;
}
