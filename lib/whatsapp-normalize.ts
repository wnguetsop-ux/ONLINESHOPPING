import { MessageType, NormalizedIncomingMessage } from './types';

type RawWhatsAppMessage = Record<string, any>;

function getMessageType(message: RawWhatsAppMessage): MessageType {
  if (message.type === 'text') return 'text';
  if (message.type === 'image') return 'image';
  if (message.type === 'document') return 'document';
  if (message.type === 'audio') return 'audio';
  if (message.type === 'interactive') return 'interactive';
  if (message.type === 'order') return 'order';
  return 'unknown';
}

export function parseTextMessage(message: RawWhatsAppMessage): string | undefined {
  return message.text?.body || undefined;
}

export function parseImageMessage(message: RawWhatsAppMessage) {
  return {
    id: message.image?.id,
    mimeType: message.image?.mime_type,
    caption: message.image?.caption,
  };
}

export function parseDocumentMessage(message: RawWhatsAppMessage) {
  return {
    id: message.document?.id,
    mimeType: message.document?.mime_type,
    caption: message.document?.caption,
  };
}

export function parseAudioMessage(message: RawWhatsAppMessage) {
  return {
    id: message.audio?.id,
    mimeType: message.audio?.mime_type,
  };
}

export function parseInteractiveMessage(message: RawWhatsAppMessage) {
  const interactive = message.interactive || {};
  const buttonReply = interactive.button_reply || {};
  const listReply = interactive.list_reply || {};

  return {
    kind: interactive.type,
    title: buttonReply.title || listReply.title,
    value: buttonReply.id || listReply.id || listReply.description,
  };
}

export function parseOrderMessage(message: RawWhatsAppMessage) {
  return {
    text: message.order?.text || 'Commande WhatsApp',
  };
}

export function normalizeIncomingMessages(
  rawPayload: any,
  merchantId: string
): NormalizedIncomingMessage[] {
  const entries = Array.isArray(rawPayload?.entry) ? rawPayload.entry : [];
  const normalized: NormalizedIncomingMessage[] = [];

  for (const entry of entries) {
    const changes = Array.isArray(entry?.changes) ? entry.changes : [];

    for (const change of changes) {
      const value = change?.value || {};
      const messages = Array.isArray(value?.messages) ? value.messages : [];
      const contacts = Array.isArray(value?.contacts) ? value.contacts : [];
      const contactProfileName = contacts[0]?.profile?.name;

      for (const message of messages) {
        const type = getMessageType(message);
        const base: NormalizedIncomingMessage = {
          merchantId,
          customerPhone: message.from,
          waMessageId: message.id,
          type,
          rawPayload: message,
          createdAt: message.timestamp
            ? new Date(Number(message.timestamp) * 1000).toISOString()
            : new Date().toISOString(),
        };

        if (type === 'text') {
          normalized.push({
            ...base,
            text: parseTextMessage(message),
            rawPayload: { ...message, contactProfileName },
          });
          continue;
        }

        if (type === 'image') {
          normalized.push({
            ...base,
            text: message.image?.caption,
            media: parseImageMessage(message),
            rawPayload: { ...message, contactProfileName },
          });
          continue;
        }

        if (type === 'document') {
          normalized.push({
            ...base,
            text: message.document?.caption,
            media: parseDocumentMessage(message),
            rawPayload: { ...message, contactProfileName },
          });
          continue;
        }

        if (type === 'audio') {
          normalized.push({
            ...base,
            media: parseAudioMessage(message),
            rawPayload: { ...message, contactProfileName },
          });
          continue;
        }

        if (type === 'interactive') {
          normalized.push({
            ...base,
            text: message.interactive?.button_reply?.title || message.interactive?.list_reply?.title,
            interactive: parseInteractiveMessage(message),
            rawPayload: { ...message, contactProfileName },
          });
          continue;
        }

        if (type === 'order') {
          normalized.push({
            ...base,
            text: parseOrderMessage(message).text,
            rawPayload: { ...message, contactProfileName },
          });
          continue;
        }

        normalized.push({
          ...base,
          text: message.text?.body || message.type || 'Message WhatsApp non reconnu',
          rawPayload: { ...message, contactProfileName },
        });
      }
    }
  }

  return normalized;
}
