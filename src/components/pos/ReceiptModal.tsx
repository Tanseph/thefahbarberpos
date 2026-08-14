import React, { useState } from 'react';
import { Bill, Member, StoreSettings } from '../../types';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Copy, 
  CheckCheck
} from 'lucide-react';
import { formatCurrency, formatThaiDate } from '../../utils/formatters';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  settings: StoreSettings;
  member?: Member | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  bill,
  settings,
  member,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !bill) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySummary = () => {
    const text = `💈 ${settings.storeName || 'BARBERSHOP'}
🧾 ใบเสร็จเลขที่: ${bill.billNumber}
📅 วันที่: ${formatThaiDate(bill.date, true)}
👤 ลูกค้า: ${bill.memberName || 'ลูกค้าทั่วไป (Walk-in)'}
✂️ รายการ:
${bill.items.map(i => `- ${i.name} (x${i.quantity}) ช่าง${i.barberName}: ${i.isPackageRedemption ? 'ตัดคอร์ส (0฿)' : formatCurrency(i.price * i.quantity)}`).join('\n')}
${bill.discountTotal > 0 ? `🎁 ส่วนลดรวม: -${formatCurrency(bill.discountTotal)}\n` : ''}${bill.tipAmount > 0 ? `💖 ทิปช่าง: +${formatCurrency(bill.tipAmount)}\n` : ''}💰 ยอดสุทธิ: ${formatCurrency(bill.grandTotal)}
💳 ชำระด้วย: ${bill.paymentMethod === 'CASH' ? `เงินสด (รับ ${formatCurrency(bill.cashReceived || bill.grandTotal)} ทอน ${formatCurrency(bill.cashChange || 0)})` : bill.paymentMethod === 'SPLIT' ? `สลับ (เงินสด ฿${bill.splitCashAmount || 0} + โอน ฿${bill.splitTransferAmount || 0})` : bill.paymentMethod}
✨ แต้มสะสมที่ได้รับ: +${bill.pointsEarned} แต้ม
${settings.receiptFooterMessage}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-5 shadow-2xl relative text-stone-800 max-h-[95vh] flex flex-col justify-between">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-stone-900 text-sm">ใบเสร็จรับเงิน (Receipt)</h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1.5 rounded-full hover:bg-stone-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Slip Preview Box */}
        <div className="my-3 flex-1 overflow-y-auto max-h-[60vh] pr-1">
          <div
            id="printable-receipt"
            className="bg-[#FFFDF9] text-black font-mono text-[11px] p-5 rounded-2xl shadow-xs border border-stone-200 mx-auto max-w-[320px] space-y-2.5"
          >
            {/* Slip Header */}
            <div className="text-center space-y-0.5 border-b border-dashed border-stone-300 pb-2.5">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.storeName}
                  className="w-10 h-10 rounded-full object-cover border border-stone-300 mx-auto mb-1 shadow-xs"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-stone-900 text-white font-black flex items-center justify-center text-sm mx-auto mb-1">
                  💈
                </div>
              )}
              <h2 className="font-extrabold text-xs uppercase text-stone-900 tracking-wide">
                {settings.storeName || 'BARBERSHOP'}
              </h2>
              {settings.storeSlogan && <p className="text-[10px] text-stone-500">{settings.storeSlogan}</p>}
              {settings.address && <p className="text-[9px] text-stone-500">{settings.address}</p>}
              {settings.phone && <p className="text-[9px] text-stone-500">โทร: {settings.phone}</p>}
              {settings.taxId && (
                <p className="text-[9px] text-stone-500">เลขประจำตัวผู้เสียภาษี: {settings.taxId}</p>
              )}
            </div>

            {/* Bill Info */}
            <div className="text-[10px] text-stone-600 space-y-0.5 border-b border-dashed border-stone-300 pb-2">
              <div className="flex justify-between">
                <span>เลขที่บิล:</span>
                <span className="font-bold text-stone-900">{bill.billNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>วันที่/เวลา:</span>
                <span>{formatThaiDate(bill.date, true)}</span>
              </div>
              <div className="flex justify-between">
                <span>ลูกค้า:</span>
                <span className="font-bold text-stone-900">
                  {bill.memberName ? `${bill.memberName}${member?.nickname ? ` (${member.nickname})` : ''}` : 'ลูกค้าทั่วไป'}
                  {member?.packageLevel && (
                    <span className="ml-1 text-[9px] px-1.5 py-0.2 rounded bg-stone-900 text-amber-300 font-bold">
                      {member.packageLevel}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span>ผู้ทำรายการ:</span>
                <span>{bill.createdBy}</span>
              </div>
            </div>

            {/* Item List */}
            <div className="space-y-1.5 border-b border-dashed border-stone-300 pb-2.5">
              {bill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-[10px]">
                  <div className="flex-1 pr-2">
                    <p className="font-bold text-stone-900 leading-tight">
                      {item.name} x{item.quantity}
                    </p>
                    <p className="text-[9px] text-stone-500">
                      ช่าง: {item.barberName}
                    </p>
                  </div>
                  <span className="font-bold text-stone-900 shrink-0">
                    {item.isPackageRedemption ? '0฿ (ตัดคอร์ส)' : formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="space-y-1 text-[10px] text-stone-700 border-b border-dashed border-stone-300 pb-2">
              <div className="flex justify-between">
                <span>ยอดรวมสินค้า/บริการ:</span>
                <span>{formatCurrency(bill.subtotal)}</span>
              </div>

              {bill.discountTotal > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>ส่วนลดรวม:</span>
                  <span>-{formatCurrency(bill.discountTotal)}</span>
                </div>
              )}

              {bill.tipAmount > 0 && (
                <div className="flex justify-between text-pink-600 font-semibold">
                  <span>ทิปช่าง:</span>
                  <span>+{formatCurrency(bill.tipAmount)}</span>
                </div>
              )}

              {bill.memberDeductedAmount && bill.memberDeductedAmount > 0 && (
                <div className="flex justify-between text-emerald-800 font-bold">
                  <span>หักยอดเงินคงเหลือสมาชิก:</span>
                  <span>-{formatCurrency(bill.memberDeductedAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-black text-stone-900 pt-1 border-t border-stone-300">
                <span>ยอดชำระสุทธิ:</span>
                <span className="text-sm font-extrabold">{formatCurrency(bill.grandTotal)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="text-[10px] text-stone-600 space-y-0.5 border-b border-dashed border-stone-300 pb-2">
              <div className="flex justify-between">
                <span>ชำระด้วย:</span>
                <span className="font-bold text-stone-900">
                  {bill.paymentMethod === 'CASH'
                    ? 'เงินสด'
                    : bill.paymentMethod === 'SPLIT'
                    ? 'สลับ (เงินสด + เงินโอน)'
                    : bill.paymentMethod === 'TRANSFER'
                    ? 'เงินโอน (PromptPay)'
                    : bill.paymentMethod === 'MEMBER'
                    ? 'ยอดเงินสมาชิก (Member Wallet)'
                    : 'บัตรเครดิต'}
                </span>
              </div>

              {bill.memberBalanceAfter !== undefined && (
                <div className="flex justify-between text-amber-900 font-bold">
                  <span>ยอดเงินคงเหลือในบัญชี:</span>
                  <span>{formatCurrency(bill.memberBalanceAfter)}</span>
                </div>
              )}

              {bill.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between">
                    <span>รับเงินสดมา:</span>
                    <span>{formatCurrency(bill.cashReceived || bill.grandTotal)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-stone-900">
                    <span>เงินทอน:</span>
                    <span>{formatCurrency(bill.cashChange || 0)}</span>
                  </div>
                </>
              )}

              {bill.paymentMethod === 'SPLIT' && (
                <>
                  <div className="flex justify-between text-stone-800 font-medium">
                    <span>💵 เงินสด:</span>
                    <span>{formatCurrency(bill.splitCashAmount || 0)}</span>
                  </div>
                  <div className="flex justify-between text-stone-800 font-medium">
                    <span>📱 เงินโอน:</span>
                    <span>{formatCurrency(bill.splitTransferAmount || 0)}</span>
                  </div>
                </>
              )}

              {bill.paymentReference && (
                <div className="flex justify-between text-[9px]">
                  <span>เลขอ้างอิง:</span>
                  <span>{bill.paymentReference}</span>
                </div>
              )}
            </div>

            {/* Loyalty Points Section */}
            {settings.enablePoints && bill.customerType === 'MEMBER' && (
              <div className="bg-amber-50 p-2 rounded-lg text-[10px] text-stone-800 space-y-0.5 border border-amber-200">
                <div className="flex justify-between font-bold text-amber-800">
                  <span>✨ แต้มสะสมบิลนี้:</span>
                  <span>+{bill.pointsEarned} แต้ม</span>
                </div>
                {member && (
                  <div className="flex justify-between text-[9px] text-stone-600">
                    <span>แต้มสะสมคงเหลือรวม:</span>
                    <span className="font-semibold">{member.points} แต้ม</span>
                  </div>
                )}
              </div>
            )}

            {/* Footer Message */}
            <div className="text-center pt-2 space-y-1">
              <p className="text-[9px] text-stone-600 font-medium">
                {settings.receiptFooterMessage}
              </p>
              <p className="text-[8px] text-stone-400">--- THANK YOU ---</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={handleCopySummary}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <CheckCheck className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอกข้อความ'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            <span>พิมพ์ใบเสร็จ (Print)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
