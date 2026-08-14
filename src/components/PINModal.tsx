import React, { useState } from 'react';
import { Lock, Unlock, X, Delete } from 'lucide-react';

interface PINModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
  title?: string;
  subtitle?: string;
}

export const PINModal: React.FC<PINModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
  title = 'กรุณาใส่รหัส PIN',
  subtitle = 'ใส่รหัส PIN 4 หลักเพื่อดำเนินการต่อ'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin === correctPin) {
      setTimeout(() => {
        setPin('');
        onSuccess();
      }, 150);
    } else if (newPin.length === correctPin.length) {
      setError(true);
      setTimeout(() => {
        setPin('');
      }, 600);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[#1A1A1A] border border-[#A17000]/30 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-[#F5EEDC]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#A17000]/10 border border-[#A17000]/30 rounded-2xl flex items-center justify-center mx-auto mb-3 text-[#A17000] shadow-[0_0_15px_rgba(161,112,0,0.15)]">
            {error ? <Lock className="w-7 h-7 text-rose-400 animate-bounce" /> : <Unlock className="w-7 h-7" />}
          </div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wide">{title}</h3>
          <p className="text-xs text-[#F5EEDC]/60 mt-1">{subtitle}</p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 mb-8">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 scale-110 shadow-rose-500/50 shadow-lg'
                    : isFilled
                    ? 'bg-[#A17000] scale-125 shadow-[0_0_10px_rgba(161,112,0,0.8)]'
                    : 'bg-[#252525] border border-white/10'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-center text-rose-400 text-xs mb-4 font-medium animate-shake">
            ❌ รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-16 h-16 rounded-2xl bg-[#0F0F0F] hover:bg-[#A17000]/20 active:bg-[#A17000] text-white active:text-black text-2xl font-bold border border-white/5 hover:border-[#A17000]/50 transition-all flex items-center justify-center shadow-md active:scale-95 cursor-pointer mx-auto"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="w-16 h-16 rounded-2xl bg-[#0F0F0F]/60 hover:bg-[#252525] text-stone-400 text-xs font-semibold border border-white/5 flex items-center justify-center active:scale-95 cursor-pointer mx-auto"
          >
            ล้าง
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-2xl bg-[#0F0F0F] hover:bg-[#A17000]/20 active:bg-[#A17000] text-white active:text-black text-2xl font-bold border border-white/5 hover:border-[#A17000]/50 transition-all flex items-center justify-center shadow-md active:scale-95 cursor-pointer mx-auto"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-2xl bg-[#0F0F0F]/60 hover:bg-[#252525] text-stone-300 border border-white/5 flex items-center justify-center active:scale-95 cursor-pointer mx-auto"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
