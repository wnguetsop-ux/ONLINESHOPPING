import { createCipheriv, createDecipheriv, randomBytes, randomInt } from 'crypto';

// Chiffrement symetrique AES-256-GCM des access_tokens marchands stockes
// dans Firestore. La cle est dans WHATSAPP_TOKEN_ENCRYPTION_KEY (32 octets,
// base64). Rotation de cle : re-chiffrer tous les comptes puis bumper la cle.

const ALG = 'aes-256-gcm';
const IV_LEN = 12;
const KEY_LEN = 32;

function getKey(): Buffer {
  const raw = process.env.WHATSAPP_TOKEN_ENCRYPTION_KEY;
  if (!raw) throw new Error('WHATSAPP_TOKEN_ENCRYPTION_KEY manquant');
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LEN) {
    throw new Error(`WHATSAPP_TOKEN_ENCRYPTION_KEY doit faire ${KEY_LEN} octets (base64)`);
  }
  return key;
}

export interface EncryptedToken {
  ciphertext: string;
  iv: string;
  tag: string;
  version: 1;
}

export function encryptToken(plaintext: string): EncryptedToken {
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALG, getKey(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    ciphertext: enc.toString('base64'),
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    version: 1,
  };
}

export function decryptToken(payload: EncryptedToken): string {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const enc = Buffer.from(payload.ciphertext, 'base64');
  const decipher = createDecipheriv(ALG, getKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return dec.toString('utf8');
}

export function isEncryptionConfigured(): boolean {
  try {
    getKey();
    return true;
  } catch {
    return false;
  }
}

export function generateWhatsappPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}
