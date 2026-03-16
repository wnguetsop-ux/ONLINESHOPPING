// components/WhatsAppMessageImprover.tsx
// Composant modal pour améliorer un message WhatsApp avec l'IA
// Usage : <WhatsAppMessageImprover message="..." onSend={(msg) => openWhatsApp(phone, msg)} onClose={() => setShow(false)} />

'use client';
import { useState } from 'react';
import { Sparkles, X, Send, Copy, Check, Loader2 } from 'lucide-react';
import { improveWhatsAppMessage, MessageStyle } from '@/lib/ai-messages';

interface Props {
  originalMessage: string;
  customerName?: string;
  shopName?: string;
  amount?: string;
  onSend: (message: string) => void;
  onClose: () => void;
  primaryColor?: string;
}

const STYLES: { key: MessageStyle; label: string; emoji: string; desc: string }[] = [
  { key: 'professionnel', label: 'Professionnel', emoji: '👔', desc: 'Formel et poli' },
  { key: 'chaleureux',    label: 'Chaleureux',    emoji: '😊', desc: 'Amical et naturel' },
  { key: 'court',         label: 'Court',         emoji: '⚡', desc: 'L\'essentiel seulement' },
  { key: 'commercial',    label: 'Commercial',    emoji: '🎯', desc: 'Accrocheur et percutant' },
];

export default function WhatsAppMessageImprover({ originalMessage, customerName, shopName, amount, onSend, onClose, primaryColor = '#ec4899' }: Props) {
  const [selectedStyle, setSelectedStyle] = useState<MessageStyle>('chaleureux');
  const [improved, setImproved] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [editedMessage, setEditedMessage] = useState('');

  const displayMessage = editedMessage || improved || originalMessage;

  async function handleImprove() {
    setLoading(true); setError(''); setImproved(''); setEditedMessage('');
    try {
      const result = await improveWhatsAppMessage(originalMessage, selectedStyle, { customerName, shopName, amount });
      setImproved(result);
    } catch {
      setError('Erreur IA — utilise le message original.');
    }
    setLoading(false);
  }

  function handleCopy() {
    navigator.clipboard.writeText(displayMessage);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-[70] p-0 sm:p-4 backdrop-blur-sm">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-2xl overflow-hidden"
        style={{ animation: 'slideUp 0.3s ease forwards' }}>
        <style>{`@keyframes slideUp{from{transform:translateY(100%);opacity:0}to{transform:translateY(0);opacity:1}}`}</style>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}15` }}>
              <Sparkles className="w-4 h-4" style={{ color: primaryColor }} />
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm">Améliorer avec l'IA</p>
              <p className="text-xs text-gray-400">Choisissez un style</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Styles */}
          <div className="grid grid-cols-2 gap-2">
            {STYLES.map(s => (
              <button key={s.key} onClick={() => setSelectedStyle(s.key)}
                className={`flex items-center gap-2 p-3 rounded-2xl border-2 transition-all text-left ${selectedStyle === s.key ? 'border-transparent text-white' : 'border-gray-100 text-gray-700 hover:border-gray-200'}`}
                style={selectedStyle === s.key ? { backgroundColor: primaryColor } : {}}>
                <span className="text-lg">{s.emoji}</span>
                <div>
                  <p className="text-xs font-black">{s.label}</p>
                  <p className={`text-[10px] ${selectedStyle === s.key ? 'text-white/70' : 'text-gray-400'}`}>{s.desc}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Bouton améliorer */}
          <button onClick={handleImprove} disabled={loading}
            className="w-full py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-all hover:opacity-90"
            style={{ backgroundColor: primaryColor }}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? 'Génération en cours...' : improved ? 'Régénérer' : 'Améliorer le message'}
          </button>

          {error && <p className="text-xs text-red-500 text-center bg-red-50 py-2 rounded-xl">{error}</p>}

          {/* Message résultat */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {improved ? '✨ Message amélioré' : 'Message original'}
              </p>
              {displayMessage && (
                <button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  {copied ? <><Check className="w-3 h-3 text-green-500" />Copié</> : <><Copy className="w-3 h-3" />Copier</>}
                </button>
              )}
            </div>
            <textarea
              value={editedMessage || improved || originalMessage}
              onChange={e => setEditedMessage(e.target.value)}
              rows={5}
              className="w-full border border-gray-200 rounded-2xl p-3 text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': primaryColor } as any}
              placeholder="Le message apparaîtra ici..."
            />
            <p className="text-[10px] text-gray-400 text-center">Vous pouvez modifier le message avant d'envoyer</p>
          </div>

          {/* CTA final */}
          <button
            onClick={() => onSend(displayMessage)}
            className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-3 hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#25D366,#128C7E)' }}>
            <Send className="w-5 h-5" />
            Envoyer sur WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}