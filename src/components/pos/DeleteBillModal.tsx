import React from 'react';
import { Bill } from '../../types';
import { AlertTriangle, Trash2, X, Clock, Receipt, User, Wallet } from 'lucide-react';
import { formatCurrency, formatThaiDate } from '../../utils/formatters';

interface DeleteBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  onConfirmDelete: (billId: string) => void;
}

export const DeleteBillModal: React.FC<DeleteBillModalProps> = ({
  isOpen,
  onClose,
  bill,
  onConfirmDelete,
}) => {
  if (!isOpen || !bill) return null;

  const handleDelete = () => {
    onConfirmDelete(bill.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-80 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white border border-rose-200 rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-stone-800 animate-in zoom-in-95">
        {/* Header with Danger Warning */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center text-xl shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-stone-900">
                ยืนยันการลบรายการบิล
              </h3>
              <button
                onClick={onClose}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              คุณต้องการลบข้อมูลบิลนี้ออกจากระบบใช่หรือไม่?
            </p>
          </div>
        </div>

        {/* Bill Summary Card */}
        <div className="bg-rose-50/40 border border-rose-100 rounded-2xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-rose-200/60 font-mono">
            <span className="font-bold text-stone-900 flex items-center gap-1.5 font-sans">
              <Receipt className="w-3.5 h-3.5 text-stone-500" />
              เลขที่บิล: <strong className="text-stone-900 font-mono">#{bill.billNumber}</strong>
            </span>
            <span className="font-black text-rose-700 text-sm">
              {formatCurrency(bill.grandTotal)}
            </span>
          </div>

          <div className="space-y-1 text-stone-600 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-stone-400" /> ลูกค้า:
              </span>
              <span className="font-bold text-stone-800">{bill.memberName || 'ลูกค้าทั่วไป (Walk-in)'}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-400" /> วันที่-เวลา:
              </span>
              <span className="font-mono text-stone-700">{formatThaiDate(bill.date, true)}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Wallet className="w-3 h-3 text-stone-400" /> วิธีชำระ:
              </span>
              <span className="font-bold text-stone-800">
                {bill.paymentMethod === 'CASH' ? '💵 เงินสด' : bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY' ? '📱 โอนเงิน/QR' : bill.paymentMethod === 'SPLIT' ? '🔄 สลับ' : bill.paymentMethod}
              </span>
            </div>

            <div className="pt-1.5 border-t border-rose-100 text-stone-500">
              <span className="font-medium">รายการ: </span>
              <span>{bill.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}</span>
            </div>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-[11px] text-amber-900 flex items-start gap-2">
          <span className="text-sm">⚠️</span>
          <span>
            <strong>หมายเหตุ:</strong> การลบบิลจะนำยอดเงินออกจากสถิติรายวันและรายเดือนโดยสมบูรณ์ หากต้องการเพียงยกเลิกโดยเก็บประวัติ แนะนำให้ใช้ปุ่ม "ยกเลิกบิล (Void)" แทน
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-bold hover:bg-stone-100 transition cursor-pointer"
          >
            ยกเลิก / ไม่ลบ
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยืนยันลบบิลนี้</span>
          </button>
        </div>
      </div>
    </div>
  );
};
