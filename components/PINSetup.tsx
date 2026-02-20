'use client';
import { useState } from 'react';
import { Shield, X, Check, Delete, ChevronRight } from 'lucide-react';
import { PINManager } from '@/lib/pin';

interface PINSetupProps {
  onDone: () => void;   // after setup or skip
  primaryColor?: string;
}

export default function PINSetup({ onDone, primaryColor = '#ec4899' }: PINSetupProps) {
  const [step, setStep] = useState<'intro' | 'create' | 'confirm' | 'success'>('intro');
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [firstPin, setFirstPin] = useState('');

  const MAX = 6;
  const current = step === 'confirm' ? confirm : pin;
  const setCurrent = step === 'confirm' ? setConfirm : setPin;

  function handleDigit(d: string) {
    if (current.length >= MAX) return;
    const next = current + d;
    setCurrent(next);
    setError('');

    if (next.length === MAX) {
      if (step === 'create') {
        setFirstPin(next);
        setTimeout(() => { setStep('confirm'); setConfirm(''); }, 300);
      } else if (step === 'confirm') {
        if (next === firstPin) {
          PINManager.setPin(next).then(() => {
            setStep('success');
            setTimeout(onDone, 1500);
          });
        } else {
          setError('Les codes ne correspondent pas. Réessayez.');
          setConfirm('');
          setTimeout(() => setConfirm(''), 100);
        }
      }
    }
  }

  function handleDel() {
    setCurrent(prev => prev.slice(0, -1));
    setError('');
  }

  const KEYS = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="relative p-6 text-center" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${primaryColor}05)` }}>
          <button onClick={onDone} className="absolute top-4 right-4 p-2 hover:bg-black/5 rounded-xl">
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {step === 'success' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="font-bold text-xl text-gray-800">PIN activé !</p>
              <p className="text-sm text-gray-500">Accès rapide configuré avec succès</p>
            </div>
          ) : step === 'intro' ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                <Shield className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <p className="font-bold text-xl text-gray-800">Accès rapide par PIN</p>
              <p className="text-sm text-gray-500 max-w-xs">
                Créez un code PIN à {MAX} chiffres pour vous reconnecter rapidement sans saisir votre email et mot de passe.
              </p>
            </div>
          ) : (
            <div>
              <div className="w-12 h-12 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: `${primaryColor}20` }}>
                <Shield className="w-6 h-6" style={{ color: primaryColor }} />
              </div>
              <p className="font-semibold text-gray-800">
                {step === 'create' ? `Créez votre PIN (${MAX} chiffres)` : 'Confirmez votre PIN'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {step === 'create' ? 'Choisissez un code secret facile à mémoriser' : 'Saisissez à nouveau le même code'}
              </p>
            </div>
          )}
        </div>

        {step === 'intro' && (
          <div className="p-6 space-y-3">
            <button onClick={() => setStep('create')}
              className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
              style={{ backgroundColor: primaryColor }}>
              <Shield className="w-5 h-5" />
              Créer mon PIN
              <ChevronRight className="w-4 h-4" />
            </button>
            <button onClick={onDone}
              className="w-full py-3 rounded-2xl bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 transition-colors">
              Ignorer pour l'instant
            </button>
          </div>
        )}

        {(step === 'create' || step === 'confirm') && (
          <div className="p-6">
            {/* PIN dots */}
            <div className="flex justify-center gap-3 mb-6">
              {Array.from({ length: MAX }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full transition-all duration-200 ${i < current.length ? 'scale-100' : 'scale-75 bg-gray-200'}`}
                  style={i < current.length ? { backgroundColor: primaryColor } : {}} />
              ))}
            </div>

            {error && (
              <p className="text-xs text-red-500 text-center mb-4 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
            )}

            {/* Numpad */}
            <div className="grid grid-cols-3 gap-3">
              {KEYS.map((k, i) => k === '' ? (
                <div key={i} />
              ) : k === 'del' ? (
                <button key={i} onClick={handleDel}
                  className="h-14 flex items-center justify-center rounded-2xl bg-gray-100 hover:bg-gray-200 active:scale-95 transition-all">
                  <Delete className="w-5 h-5 text-gray-600" />
                </button>
              ) : (
                <button key={k} onClick={() => handleDigit(k)}
                  className="h-14 text-xl font-semibold rounded-2xl bg-gray-50 hover:bg-gray-100 active:scale-95 transition-all text-gray-800"
                  style={current.includes(k) ? {} : {}}>
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}