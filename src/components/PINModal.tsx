import React, { useState, useEffect } from 'react';
import { Lock, Unlock, X, Delete, ShieldAlert } from 'lucide-react';

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
  correctPin = '1234',
  title = '🔒 ยืนยันรหัส PIN ผู้ดูแลร้าน',
  subtitle = 'กรุณากรอกรหัส PIN เพื่อเข้าถึงหน้าตั้งค่าระบบ (รหัสเริ่มต้น: 1234)'
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  const effectivePin = correctPin || '1234';
  const targetLength = effectivePin.length;

  const handleDigit = (digit: string) => {
    if (pin.length >= 6) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin === effectivePin) {
      setTimeout(() => {
        setPin('');
        onSuccess();
      }, 150);
    } else if (newPin.length >= targetLength) {
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

  // Keyboard events listener (0-9, Backspace, Escape)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin, effectivePin, targetLength]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const dotSlots = Array.from({ length: Math.max(4, targetLength) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[#1A1A1A] border border-[#A17000]/40 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative text-[#F5EEDC]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-[#A17000]/15 border border-[#A17000]/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-[0_0_20px_rgba(217,119,6,0.25)]">
            {error ? <Lock className="w-7 h-7 text-rose-400 animate-bounce" /> : <Unlock className="w-7 h-7" />}
          </div>
          <h3 className="text-lg font-black text-white tracking-wide">{title}</h3>
          <p className="text-xs text-[#F5EEDC]/70 mt-1.5 leading-relaxed">{subtitle}</p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex justify-center items-center gap-3 mb-6">
          {dotSlots.map((_, idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? 'bg-rose-500 scale-110 shadow-rose-500/50 shadow-lg'
                    : isFilled
                    ? 'bg-amber-400 scale-125 shadow-[0_0_12px_rgba(251,191,36,0.9)]'
                    : 'bg-[#282828] border border-white/10'
                }`}
              />
            );
          })}
        </div>

        {error ? (
          <p className="text-center text-rose-400 text-xs mb-4 font-bold flex items-center justify-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            <span>รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง</span>
          </p>
        ) : (
          <p className="text-center text-stone-400 text-[11px] mb-4">
            กดปุ่มตัวเลขบนหน้าจอ หรือพิมพ์จากแป้นพิมพ์ได้ทันที
          </p>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-3 max-w-[260px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="w-16 h-16 rounded-2xl bg-[#0F0F0F] hover:bg-amber-500/20 active:bg-amber-500 text-white active:text-black text-2xl font-bold border border-white/5 hover:border-amber-500/50 transition-all flex items-center justify-center shadow-md active:scale-95 cursor-pointer mx-auto"
            >
              {digit}
            </button>
          ))}

          <button
            type="button"
            onClick={handleClear}
            className="w-16 h-16 rounded-2xl bg-[#0F0F0F]/60 hover:bg-[#252525] text-stone-400 hover:text-white text-xs font-bold border border-white/5 flex items-center justify-center active:scale-95 cursor-pointer mx-auto"
          >
            ล้าง
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="w-16 h-16 rounded-2xl bg-[#0F0F0F] hover:bg-amber-500/20 active:bg-amber-500 text-white active:text-black text-2xl font-bold border border-white/5 hover:border-amber-500/50 transition-all flex items-center justify-center shadow-md active:scale-95 cursor-pointer mx-auto"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            className="w-16 h-16 rounded-2xl bg-[#0F0F0F]/60 hover:bg-[#252525] text-stone-300 hover:text-white border border-white/5 flex items-center justify-center active:scale-95 cursor-pointer mx-auto"
            title="ลบตัวเลข"
          >
            <Delete className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
