export interface OutboundMessageSafetyInput {
  automaticOutgoingEnabled?: boolean;
  userTriggered?: boolean;
  lastInboundAt?: string | null;
  recentOutboundTimestamps?: string[];
}

export interface OutboundMessageSafetyResult {
  allowed: boolean;
  withinCustomerWindow: boolean;
  risk: 'low' | 'medium' | 'high';
  reasons: string[];
}

const MAX_IDENTICAL_MESSAGES_PER_30_SECONDS = 3;

export function isWithinCustomerServiceWindow(lastInboundAt?: string | null): boolean {
  if (!lastInboundAt) return false;
  const diffMs = Date.now() - new Date(lastInboundAt).getTime();
  return diffMs <= 24 * 60 * 60 * 1000;
}

export function checkOutboundRateLimit(recentOutboundTimestamps: string[] = []): boolean {
  const now = Date.now();
  const last30Seconds = recentOutboundTimestamps.filter((timestamp) => {
    return now - new Date(timestamp).getTime() <= 30 * 1000;
  });

  return last30Seconds.length < MAX_IDENTICAL_MESSAGES_PER_30_SECONDS;
}

export function evaluateOutboundMessageSafety(
  input: OutboundMessageSafetyInput
): OutboundMessageSafetyResult {
  const reasons: string[] = [];
  const withinCustomerWindow = isWithinCustomerServiceWindow(input.lastInboundAt);
  const underRateLimit = checkOutboundRateLimit(input.recentOutboundTimestamps);

  if (input.automaticOutgoingEnabled) {
    reasons.push('Les messages automatiques sortants doivent rester desactives par defaut');
  }

  if (!input.userTriggered) {
    reasons.push('Une validation humaine explicite est obligatoire avant tout envoi');
  }

  if (!withinCustomerWindow) {
    reasons.push('La fenetre de service client de 24h n est pas confirmee');
  }

  if (!underRateLimit) {
    reasons.push('Limite anti-spam depassee: maximum 3 envois rapproches');
  }

  return {
    allowed: reasons.length === 0,
    withinCustomerWindow,
    risk: reasons.length === 0 ? 'low' : reasons.length === 1 ? 'medium' : 'high',
    reasons,
  };
}
