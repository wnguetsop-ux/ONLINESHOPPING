/**
 * usePIN — gestion du code PIN pour accès rapide
 * Le PIN est stocké chiffré dans localStorage.
 * La session PIN dure 8h (configurable).
 */

const PIN_KEY = 'sm_pin_hash';
const PIN_SESSION_KEY = 'sm_pin_session';
const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8h

async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode('shopmaster_salt_' + pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const PINManager = {
  async setPin(pin: string) {
    const hash = await hashPIN(pin);
    localStorage.setItem(PIN_KEY, hash);
    // Start session
    localStorage.setItem(PIN_SESSION_KEY, String(Date.now()));
  },

  async verifyPin(pin: string): Promise<boolean> {
    const stored = localStorage.getItem(PIN_KEY);
    if (!stored) return false;
    const hash = await hashPIN(pin);
    const ok = hash === stored;
    if (ok) localStorage.setItem(PIN_SESSION_KEY, String(Date.now()));
    return ok;
  },

  hasPin(): boolean {
    return !!localStorage.getItem(PIN_KEY);
  },

  removePin() {
    localStorage.removeItem(PIN_KEY);
    localStorage.removeItem(PIN_SESSION_KEY);
  },

  isSessionActive(): boolean {
    const ts = localStorage.getItem(PIN_SESSION_KEY);
    if (!ts) return false;
    return Date.now() - parseInt(ts) < SESSION_DURATION_MS;
  },

  startSession() {
    localStorage.setItem(PIN_SESSION_KEY, String(Date.now()));
  },

  clearSession() {
    localStorage.removeItem(PIN_SESSION_KEY);
  },
};