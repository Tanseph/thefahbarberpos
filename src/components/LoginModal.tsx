import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, ShieldCheck, X, LogIn, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LoginModalProps {
  isOpen: boolean;
  currentEmail: string;
  onLogin: (email: string) => void;
  onClose?: () => void;
  canClose?: boolean;
}

// Sound synthesizer for button click feedback (audio effect)
const playButtonSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell chime tone 1 (Primary)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.3);

    // Harmonic overtone 2 (Crisp spark)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1046.5, now + 0.04); // C6
    gain2.gain.setValueAtTime(0.18, now + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc2.start(now + 0.04);
    osc2.stop(now + 0.32);

    // Vibration tactile feedback on supported mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 30, 20]);
    }
  } catch {
    // AudioContext blocked or not supported, fail gracefully
  }
};

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentEmail,
  onLogin,
  onClose,
  canClose = false,
}) => {
  const [emailInput, setEmailInput] = useState(currentEmail || '');
  const [errorMsg, setErrorMsg] = useState('');
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    setEmailInput(currentEmail || '');
    setErrorMsg('');
    setIsPressed(false);
  }, [currentEmail, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPressed) return;

    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) {
      setErrorMsg('กรุณากรอกอีเมลของร้าน');
      return;
    }
    // Basic email format check
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMsg('กรุณากรอกรูปแบบอีเมลให้ถูกต้อง');
      return;
    }

    setErrorMsg('');

    // 1. Play sound effect
    playButtonSound();

    // 2. Trigger visual press effects & particle burst
    setIsPressed(true);
    try {
      confetti({
        particleCount: 35,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#f59e0b', '#10b981', '#fbbf24', '#d97706', '#3b82f6'],
      });
    } catch {
      // ignore
    }

    // 3. Complete login transition after visual feedback
    setTimeout(() => {
      onLogin(trimmed);
    }, 320);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div 
        className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-stone-900 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background accent glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-200/40 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-emerald-200/40 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button if allow close */}
        {canClose && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-xs text-amber-600">
            💈
          </div>
          <h2 className="text-lg font-black text-stone-900 tracking-tight">
            เข้าสู่ระบบร้าน / แยกบัญชีสาขา
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
            ระบุอีเมลของร้านเพื่อเข้าสู่ระบบ ข้อมูลแต่ละอีเมลจะถูกแยกขาดจากกัน 100% ไม่ปะปนกัน
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-stone-700">
              กรุณาระบุ Email ของท่าน
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={emailInput}
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="กรุณาระบุ Email ของท่าน"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                autoFocus
                disabled={isPressed}
              />
            </div>
            {errorMsg && (
              <p className="text-rose-500 text-xs font-semibold px-1 animate-in fade-in">
                ⚠️ {errorMsg}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isPressed}
            className={`relative w-full py-3.5 px-4 rounded-2xl font-black text-sm transition-all duration-200 shadow-md flex items-center justify-center gap-2 cursor-pointer overflow-hidden ${
              isPressed
                ? 'bg-emerald-600 text-white scale-98 shadow-emerald-600/30 ring-4 ring-emerald-400/40'
                : 'bg-amber-600 hover:bg-amber-700 active:scale-95 text-white shadow-amber-600/25 hover:shadow-lg hover:shadow-amber-600/35 ring-0 active:ring-4 active:ring-amber-300'
            }`}
          >
            {/* Pulsing ring animation when clicked */}
            {isPressed && (
              <span className="absolute inset-0 rounded-2xl bg-white/30 animate-ping pointer-events-none" />
            )}

            {isPressed ? (
              <span className="flex items-center gap-2 text-white animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-5 h-5 text-white animate-bounce" />
                <span>เข้าสู่ระบบสำเร็จ! กำลังโหลด...</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                <span>เข้าสู่ระบบร้านนี้</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </span>
            )}
          </button>
        </form>

        {/* Info Footer */}
        <div className="mt-5 pt-3 text-center border-t border-stone-100">
          <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ระบบคลาวด์ Realtime ซิงค์ข้อมูลข้ามเครื่องอัตโนมัติตามอีเมลร้าน
          </p>
        </div>
      </div>
    </div>
  );
};
