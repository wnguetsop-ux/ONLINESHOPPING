// lib/ai-messages.ts
// Amélioration des messages WhatsApp via /api/improve-message (OpenAI côté serveur)

export type MessageStyle = 'professionnel' | 'chaleureux' | 'court' | 'commercial';

export async function improveWhatsAppMessage(
  originalMessage: string,
  style: MessageStyle,
  context?: { customerName?: string; shopName?: string; amount?: string }
): Promise<string> {
  const res = await fetch('/api/improve-message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message:      originalMessage,
      style,
      customerName: context?.customerName || '',
      shopName:     context?.shopName     || '',
      amount:       context?.amount       || '',
    }),
  });

  if (!res.ok) throw new Error('Erreur serveur improve-message');
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data.improved || originalMessage;
}