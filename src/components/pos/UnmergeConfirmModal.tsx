import React from 'react';
import { Bill } from '../../types';
import { Layers, RotateCcw, X, AlertCircle, CheckCircle2, User, Calendar, DollarSign } from 'lucide-react';
import { formatCurrency, formatThaiDate } from '../../utils/formatters';

interface UnmergeConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  allBills?: Bill[];
  onConfirmUnmerge: (bill: Bill) => void;
}

export const UnmergeConfirmModal: React.FC<UnmergeConfirmModalProps> = ({
  isOpen,
  onClose,
  bill,
  allBills = [],
  onConfirmUnmerge,
}) => {
  if (!isOpen || !bill) return null;

  // Find other bills in the same merge group if any
  const linkedBills = allBills.filter(
    (b) =>
      b.id !== bill.id &&
      ((bill.mergedGroupId && b.mergedGroupId === bill.mergedGroupId) ||
        (bill.mergedWithBillNumbers && bill.mergedWithBillNumbers.includes(b.billNumber)))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col animate-in zoom-in-95">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs shadow-inner">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-base leading-tight">ยืนยันยกเลิกรวมบิล</h3>
              <p className="text-xs text-purple-200 mt-0.5">แยกสถานะบิลกลับเป็นอิสระต่อกัน</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-purple-50/80 border border-purple-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-950 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                <span>บิลที่เลือก:</span>
              </span>
              <span className="font-mono font-black text-purple-950 text-sm bg-purple-200/80 px-2 py-0.5 rounded-md">
                #{bill.billNumber}
              </span>
            </div>

            <div className="text-xs text-stone-600 space-y-1 pt-1 border-t border-purple-200/60">
              <div className="flex justify-between">
                <span>ลูกค้า:</span>
                <span className="font-bold text-stone-800">{bill.memberName || 'ลูกค้าทั่วไป'}</span>
              </div>
              <div className="flex justify-between">
                <span>ยอดเงิน:</span>
                <span className="font-mono font-black text-stone-900">{formatCurrency(bill.grandTotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>รายการบริการ:</span>
                <span className="font-bold text-stone-700">{bill.items.length} รายการ</span>
              </div>
            </div>
          </div>

          {/* Linked Bills in the group */}
          {linkedBills.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-600 block">
                บิลที่รวมอยู่ด้วยกัน ({linkedBills.length} บิลที่จะถูกแยกกลับด้วย):
              </label>
              <div className="bg-stone-50 border border-stone-200 rounded-xl p-2.5 max-h-32 overflow-y-auto divide-y divide-stone-100">
                {linkedBills.map((lb) => (
                  <div key={lb.id} className="py-1.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-stone-800">#{lb.billNumber} ({lb.memberName || 'ลูกค้าทั่วไป'})</span>
                    <span className="font-mono font-bold text-stone-900">{formatCurrency(lb.grandTotal)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Explanation Alert */}
          <div className="flex items-start gap-2.5 text-xs text-stone-600 bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              เมื่อกดยืนยัน ระบบจะ<strong>ปลดสถานะรวมบิล</strong>ของทุกบิลในกลุ่มนี้ออก โดย<strong>รายการบริการ, ยอดเงิน, และชื่อช่างของแต่ละบิลจะยังคงอยู่ครบถ้วนสมบูรณ์ 100%</strong>
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 font-bold text-xs hover:bg-stone-100 transition cursor-pointer"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmUnmerge(bill);
              onClose();
            }}
            className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white font-black text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-md shadow-purple-600/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span>ยืนยันยกเลิกรวมบิล</span>
          </button>
        </div>
      </div>
    </div>
  );
};
