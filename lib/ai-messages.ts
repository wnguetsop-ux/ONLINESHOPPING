// lib/ai-messages.ts
// Amélioration IA des messages WhatsApp — module indépendant

export type MessageStyle = 'professionnel' | 'chaleureux' | 'court' | 'commercial';

export interface ImproveMessageResult {
  message: string;
  style: MessageStyle;
}

const STYLE_INSTRUCTIONS: Record<MessageStyle, string> = {
  professionnel: 'Reformule ce message WhatsApp de manière professionnelle et polie. Garde-le court (max 3 lignes). Pas de markdown.',
  chaleureux:    'Reformule ce message WhatsApp de manière chaleureuse et amicale, comme un ami commerçant. Court et naturel. Pas de markdown.',
  court:         'Reformule ce message WhatsApp de manière très courte (1-2 lignes max). Garde uniquement l\'essentiel. Pas de markdown.',
  commercial:    'Reformule ce message WhatsApp comme un message commercial accrocheur mais naturel. Court et percutant. Pas de markdown.',
};

export async function improveWhatsAppMessage(
  originalMessage: string,
  style: MessageStyle,
  context?: { customerName?: string; shopName?: string; amount?: string }
): Promise<string> {
  const contextStr = context
    ? `Contexte : vendeur "${context.shopName || 'boutique'}", client "${context.customerName || 'client'}"${context.amount ? `, montant ${context.amount}` : ''}.`
    : '';

  const prompt = `${STYLE_INSTRUCTIONS[style]}

${contextStr}

Message original :
${originalMessage}

Réponds uniquement avec le message reformulé, sans explication, sans guillemets.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error('Erreur API');
  const data = await response.json();
  const text = data.content?.find((b: any) => b.type === 'text')?.text || originalMessage;
  return text.trim();
}