'use client';

import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';

interface ShareButtonProps {
  url: string;
  title: string;
  className?: string;
}

export default function ShareButton({ url, title, className = '' }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled — fall through to copy menu
      }
    }
    setOpen(v => !v);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  const waLink = `https://wa.me/?text=${encodeURIComponent(`${title}\n${url}`)}`;

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={handleNativeShare}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition"
      >
        <Share2 size={16} />
        Partager ce produit
      </button>

      {open && (
        <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 max-w-xs">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-sm text-gray-800"
          >
            <MessageCircle size={18} className="text-green-600" />
            Partager sur WhatsApp
          </a>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 text-sm text-gray-800 text-left border-t border-gray-100"
          >
            {copied ? (
              <>
                <Check size={18} className="text-green-600" />
                Lien copié !
              </>
            ) : (
              <>
                <Copy size={18} className="text-gray-500" />
                Copier le lien
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
