import React, { useState } from 'react';
import { Mail, Store, ArrowRight, ShieldCheck, Sparkles, Building2, Check, X, LogIn } from 'lucide-react';
import { storage } from '../utils/storage';

interface LoginModalProps {
  isOpen: boolean;
  currentEmail: string;
  onLogin: (email: string) => void;
  onClose?: () => void;
  canClose?: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  currentEmail,
  onLogin,
  onClose,
  canClose = false,
}) => {
  const [emailInput, setEmailInput] = useState(currentEmail || '');
  const [errorMsg, setErrorMsg] = useState('');
  const savedAccounts = storage.getSavedAccounts();

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) {
      setErrorMsg('กรุณากรอกอีเมลของร้าน');
      return;
    }
    // Basic email format check
    if (!trimmed.includes('@') || !trimmed.includes('.')) {
      setErrorMsg('กรุณากรอกรูปแบบอีเมลให้ถูกต้อง เช่น yourshop@gmail.com');
      return;
    }

    setErrorMsg('');
    onLogin(trimmed);
  };

  const handleSelectSaved = (saved: string) => {
    setEmailInput(saved);
    onLogin(saved);
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
                placeholder="กรุณาระบุ Email ของท่าน (เช่น thefahbarber@gmail.com)"
                className="w-full pl-10 pr-4 py-3 bg-stone-50 border border-stone-200 rounded-2xl text-sm font-semibold text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500 transition"
                autoFocus
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
            className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 active:scale-98 text-white rounded-2xl font-black text-sm transition-all shadow-md shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            เข้าสู่ระบบร้านนี้
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Saved Accounts Switcher */}
        {savedAccounts.length > 0 && (
          <div className="mt-6 pt-5 border-t border-stone-100 space-y-2.5">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-bold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-stone-400" />
                ร้านที่เคยเข้าสู่ระบบในเครื่องนี้:
              </span>
            </div>
            <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
              {savedAccounts.map((acc) => {
                const isCurrent = acc === currentEmail;
                return (
                  <button
                    key={acc}
                    type="button"
                    onClick={() => handleSelectSaved(acc)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition text-left cursor-pointer ${
                      isCurrent
                        ? 'bg-amber-50/70 border-amber-300 text-amber-900 shadow-2xs'
                        : 'bg-stone-50 hover:bg-stone-100 border-stone-200/80 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-base">🏪</span>
                      <span className="truncate">{acc}</span>
                    </div>
                    {isCurrent ? (
                      <span className="flex items-center gap-1 text-[11px] font-black text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md shrink-0">
                        <Check className="w-3 h-3" /> ร้านปัจจุบัน
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 shrink-0 hover:text-stone-700">
                        สลับมาร้านนี้ →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-4 pt-3 text-center">
          <p className="text-[11px] text-stone-400 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            ระบบคลาวด์ Realtime ซิงค์ข้อมูลข้ามเครื่องอัตโนมัติตามอีเมลร้าน
          </p>
        </div>
      </div>
    </div>
  );
};
