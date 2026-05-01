'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, MessageCircle, Copy, Check, ExternalLink, X } from 'lucide-react';

interface ShareSuccessModalProps {
  productId: string;
  productName: string;
  priceText: string;
  shopName: string;
  primaryColor?: string;
  onClose: () => void;
  onAddAnother?: () => void;
}

export default function ShareSuccessModal({
  productId,
  productName,
  priceText,
  shopName,
  primaryColor = '#ec4899',
  onClose,
  onAddAnother,
}: ShareSuccessModalProps) {
  const [copied, setCopied] = useState(false);
  const [productUrl, setProductUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setProductUrl(`${window.location.origin}/p/${productId}`);
    }
  }, [productId]);

  const waMessage = `🆕 Nouveau dans ma boutique !\n\n*${productName}* — ${priceText}\n\n${productUrl}`;
  const waLink = `https://wa.me/?text=${encodeURIComponent(waMessage)}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      prompt('Copiez ce lien :', productUrl);
    }
  }

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: productName, text: `${productName} — ${shopName}`, url: productUrl });
      } catch {
        /* user cancelled */
      }
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Produit publié !</h3>
              <p className="text-xs text-gray-500">Partage le lien pour vendre</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1 font-semibold">Aperçu du message</p>
            <p className="text-sm text-gray-800 whitespace-pre-line leading-relaxed">{waMessage}</p>
          </div>

          <div className="flex items-center gap-2 mb-4 bg-white border border-gray-200 rounded-xl p-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold">Lien</p>
              <p className="text-xs text-gray-700 truncate">{productUrl}</p>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              className="flex-shrink-0 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700 flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  Copié
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copier
                </>
              )}
            </button>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full font-bold py-3.5 rounded-xl text-white text-base shadow-md active:scale-[0.98] transition mb-2"
            style={{ background: '#25D366' }}
          >
            <MessageCircle className="w-5 h-5" />
            Partager sur WhatsApp
          </a>

          {typeof navigator !== 'undefined' && typeof window !== 'undefined' && (window as any).navigator?.share && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="flex items-center justify-center gap-2 w-full font-semibold py-3 rounded-xl border-2 mb-2 text-sm"
              style={{ borderColor: primaryColor, color: primaryColor }}
            >
              Plus d&apos;options de partage
            </button>
          )}

          <a
            href={`/p/${productId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full text-sm text-gray-600 hover:text-gray-900 py-2"
          >
            <ExternalLink className="w-4 h-4" />
            Voir la fiche publique
          </a>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-gray-700"
          >
            Terminé
          </button>
          {onAddAnother && (
            <button
              type="button"
              onClick={onAddAnother}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: primaryColor }}
            >
              Ajouter un autre
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
