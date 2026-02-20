'use client';
import { useState, useEffect } from 'react';
import { Shield, Delete, X, LogOut } from 'lucide-react';
import { PINManager } from '@/lib/pin';

interface PINUnlockProps {
  shopName?: string;
  onUnlocked: () => void;
  onSignOut: () => void;
  primaryColor?: string;
}

export default function PINUnlock({ shopName, onUnlocked, onSignOut, primaryColor = '#ec4899' }: PINUnlockProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const MAX = 6;

  async function handleDigit(d: string) {
    if (pin.length >= MAX) return;
    const next = pin + d;
    setPin(next);
    setError('');

    if (next.length === MAX) {
      const ok = await PINManager.verifyPin(next);
      if (ok) {
        onUnlocked();
      } else {
        setShake(true);
        setError('Code incorrect');
        setTimeout(() => { setShake(false); setPin(''); setError(''); }, 800);
      }
    }
  }

  function handleDel() { setPin(prev => prev.slice(0, -1)); setError(''); }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${primaryColor}dd, ${primaryColor}99)` }}>
      <div className="w-full max-w-sm px-6">

        {/* Logo / Shop */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/20 rounded-3xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <Shield className="w-10 h-10 text-white" />
          </div>
          {shopName && <p className="text-white/70 text-sm">Boutique</p>}
          <p className="text-white font-bold text-2xl">{shopName || 'ShopMaster'}</p>
          <p className="text-white/60 text-sm mt-1">Entrez votre PIN pour continuer</p>
        </div>

        {/* PIN dots */}
        <div className={`flex justify-center gap-4 mb-6 ${shake ? 'animate-bounce' : ''}`}>
          {Array.from({ length: MAX }).map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 border-white/60 transition-all ${i < pin.length ? 'bg-white scale-100' : 'bg-transparent scale-75'}`} />
          ))}
        </div>

        {error && (
          <p className="text-white text-center text-sm mb-4 bg-white/20 rounded-xl py-2">{error}</p>
        )}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {KEYS.map((k, i) => k === '' ? (
            <div key={i} />
          ) : k === 'del' ? (
            <button key={i} onClick={handleDel}
              className="h-16 flex items-center justify-center rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all backdrop-blur-sm">
              <Delete className="w-6 h-6 text-white" />
            </button>
          ) : (
            <button key={k} onClick={() => handleDigit(k)}
              className="h-16 text-2xl font-bold rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white backdrop-blur-sm">
              {k}
            </button>
          ))}
        </div>

        {/* Sign out option */}
        <button onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2 py-3 text-white/60 hover:text-white text-sm transition-colors">
          <LogOut className="w-4 h-4" />
          Se connecter avec un autre compte
        </button>
      </div>
    </div>
  );
}