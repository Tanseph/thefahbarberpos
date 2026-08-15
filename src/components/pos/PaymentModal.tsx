import React, { useState, useEffect } from 'react';
import { PaymentMethod, StoreSettings } from '../../types';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  Landmark, 
  Check, 
  Copy,
  CheckCheck
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { generatePromptPayQRDataUrl } from '../../utils/promptpay';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  settings: StoreSettings;
  onConfirmPayment: (paymentData: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    cashChange?: number;
    paymentReference?: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  settings,
  onConfirmPayment,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('TRANSFER');
  const [cashReceived, setCashReceived] = useState<number>(grandTotal);
  const [reference, setReference] = useState<string>('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Generate QR Code when PromptPay is selected
  useEffect(() => {
    if (method === 'PROMPTPAY' && settings.promptPayId) {
      generatePromptPayQRDataUrl(settings.promptPayId, grandTotal)
        .then(setQrDataUrl)
        .catch(console.error);
    }
  }, [method, settings.promptPayId, grandTotal]);

  useEffect(() => {
    if (isOpen) {
      setCashReceived(grandTotal);
      setReference('');
      setIsProcessing(false);
    }
  }, [isOpen, grandTotal]);

  if (!isOpen) return null;

  const cashChange = Math.max(0, cashReceived - grandTotal);
  const isCashInsufficient = method === 'CASH' && cashReceived < grandTotal;

  const quickCashButtons = [
    { label: 'ยอดพอดี', value: grandTotal },
    { label: '100฿', value: 100 },
    { label: '300฿', value: 300 },
    { label: '500฿', value: 500 },
    { label: '1,000฿', value: 1000 },
    { label: '2,000฿', value: 2000 },
  ].filter(b => b.value >= grandTotal || b.label === 'ยอดพอดี');

  const handleCopyPromptPay = () => {
    navigator.clipboard.writeText(settings.promptPayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = () => {
    if (isCashInsufficient) return;
    setIsProcessing(true);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#A17000', '#F5EEDC', '#ffffff', '#222222'],
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      onConfirmPayment({
        paymentMethod: method,
        cashReceived: method === 'CASH' ? cashReceived : grandTotal,
        cashChange: method === 'CASH' ? cashChange : 0,
        paymentReference: reference.trim() || undefined,
      });
      setIsProcessing(false);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-[#1A1A1A] border border-[#A17000]/30 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative text-[#F5EEDC] max-h-[95vh] flex flex-col justify-between">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-white p-2 rounded-full hover:bg-white/5 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="text-center mb-4">
            <span className="text-[11px] font-bold text-[#A17000] uppercase tracking-widest block mb-1">
              ขั้นตอนการชำระเงิน (CHECKOUT)
            </span>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {formatCurrency(grandTotal)}
            </h3>
          </div>

          {/* Payment Method Selector Tabs */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {[
              { id: 'TRANSFER' as PaymentMethod, label: 'โอนเงิน', icon: <Landmark className="w-4 h-4" />, emoji: '📱' },
              { id: 'CASH' as PaymentMethod, label: 'เงินสด', icon: <Banknote className="w-4 h-4" />, emoji: '💵' },
              { id: 'PROMPTPAY' as PaymentMethod, label: 'พร้อมเพย์', icon: <QrCode className="w-4 h-4" />, emoji: '📱' },
              { id: 'CREDIT_CARD' as PaymentMethod, label: 'บัตรเครดิต', icon: <CreditCard className="w-4 h-4" />, emoji: '💳' },
            ].map((tab) => {
              const isSelected = method === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setMethod(tab.id)}
                  className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#A17000] text-black border-[#A17000] font-extrabold shadow-lg shadow-[#A17000]/20'
                      : 'bg-[#0F0F0F] border-white/5 text-[#F5EEDC]/70 hover:bg-[#252525] hover:text-white'
                  }`}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <span className="text-[11px] font-bold">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Payment Detail Section */}
        <div className="my-2 min-h-[220px] flex flex-col justify-center">
          {/* TAB 1: CASH */}
          {method === 'CASH' && (
            <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#F5EEDC]/60 mb-1 flex items-center justify-between">
                  <span>รับเงินสดจากลูกค้า (บาท):</span>
                  <span className="text-[#A17000] font-bold">ยอดที่ต้องจ่าย: {formatCurrency(grandTotal)}</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A17000] font-bold text-lg">฿</span>
                  <input
                    type="number"
                    min="0"
                    autoFocus
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#1A1A1A] border border-white/10 focus:border-[#A17000] text-[#A17000] text-2xl font-black rounded-xl pl-9 pr-4 py-2.5 focus:outline-none text-right shadow-inner"
                  />
                </div>
              </div>

              {/* Quick Bill Cash Buttons */}
              <div className="flex flex-wrap gap-1.5">
                {quickCashButtons.map((btn) => (
                  <button
                    key={btn.label}
                    type="button"
                    onClick={() => setCashReceived(btn.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      cashReceived === btn.value
                        ? 'bg-[#A17000] text-black border-[#A17000]'
                        : 'bg-[#222] border-white/5 text-[#F5EEDC]/80 hover:bg-[#333]'
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>

              {/* Cash Change Result */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#1A1A1A] border border-white/5">
                <span className="text-xs text-[#F5EEDC]/60">เงินทอนลูกค้า:</span>
                <span
                  className={`text-xl font-black ${
                    isCashInsufficient ? 'text-rose-400' : 'text-green-400'
                  }`}
                >
                  {isCashInsufficient
                    ? `เงินสดไม่พอขาดอีก ${formatCurrency(grandTotal - cashReceived)}`
                    : formatCurrency(cashChange)}
                </span>
              </div>
            </div>
          )}

          {/* TAB 2: PROMPTPAY */}
          {method === 'PROMPTPAY' && (
            <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-4 text-center space-y-3">
              {qrDataUrl ? (
                <div className="inline-block p-3 bg-white rounded-2xl shadow-xl">
                  <img
                    src={qrDataUrl}
                    alt="PromptPay QR Code"
                    className="w-44 h-44 mx-auto object-contain"
                  />
                  <div className="text-stone-900 text-xs font-extrabold mt-1">
                    <span>สแกนจ่าย </span>
                    <span className="text-[#A17000]">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-xs text-stone-400">กำลังสร้าง QR Code...</div>
              )}

              <div className="flex items-center justify-center gap-2 text-xs text-[#F5EEDC]/60">
                <span>พร้อมเพย์: <strong className="text-white">{settings.promptPayId || 'ยังไม่ได้ตั้งค่า'}</strong></span>
                {settings.promptPayId && (
                  <button
                    onClick={handleCopyPromptPay}
                    className="p-1 hover:bg-white/5 rounded-md text-[#A17000] transition cursor-pointer"
                    title="คัดลอกเลขพร้อมเพย์"
                  >
                    {copied ? <CheckCheck className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TRANSFER */}
          {method === 'TRANSFER' && (
            <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="bg-[#1A1A1A] p-3 rounded-xl border border-white/5 space-y-1 text-xs">
                <span className="text-[#F5EEDC]/50 block">บัญชีรับโอนของร้าน:</span>
                <p className="text-white font-bold text-sm">{settings.promptPayName || 'บัญชีร้าน THE LUXE BARBER'}</p>
                <p className="text-[#A17000] font-mono font-bold">{settings.promptPayId}</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5EEDC]/60 mb-1">
                  หมายเลขอ้างอิงสลิปโอน / เลขทำรายการ (ไม่บังคับ):
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="เช่น 20260813-14902..."
                  className="w-full bg-[#1A1A1A] border border-white/10 focus:border-[#A17000] rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* TAB 4: CREDIT CARD */}
          {method === 'CREDIT_CARD' && (
            <div className="bg-[#0F0F0F] border border-white/5 rounded-2xl p-4 space-y-3">
              <div className="text-center py-2">
                <CreditCard className="w-10 h-10 text-[#A17000] mx-auto mb-2" />
                <h4 className="text-sm font-bold text-white">รูดบัตรผ่านเครื่อง EDC</h4>
                <p className="text-xs text-[#F5EEDC]/60 mt-0.5">เสียบบัตรเครดิต/เดบิตที่เครื่องรูดบัตรหน้าร้าน</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#F5EEDC]/60 mb-1">
                  เลขบัตร 4 หลักสุดท้าย หรือ เลข Approval Code:
                </label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="เช่น บัตร KBank ลงท้าย 4892..."
                  className="w-full bg-[#1A1A1A] border border-white/10 focus:border-[#A17000] rounded-xl px-3 py-2 text-xs text-white placeholder-stone-600 focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-2xl border border-white/10 text-stone-300 hover:bg-white/5 text-xs font-bold transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            disabled={isCashInsufficient || isProcessing}
            onClick={handleConfirm}
            className={`flex-2 py-3 rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-xl transition-all cursor-pointer ${
              isCashInsufficient || isProcessing
                ? 'bg-[#2A2A2A] text-stone-600 cursor-not-allowed'
                : 'bg-white text-black hover:bg-[#F5EEDC] active:scale-98 shadow-[0_0_20px_rgba(255,255,255,0.2)]'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isProcessing ? 'กำลังบันทึก...' : 'ยืนยันรับชำระเงินและออกใบเสร็จ'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
