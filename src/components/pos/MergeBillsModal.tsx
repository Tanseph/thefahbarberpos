import React, { useState, useEffect } from 'react';
import { Barber, Bill, PaymentMethod, StoreSettings } from '../../types';
import { 
  X, 
  Layers, 
  Check, 
  Users, 
  Scissors, 
  QrCode, 
  Banknote, 
  Split, 
  CreditCard, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  Sparkles
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface MergeBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyBills: Bill[];
  initialSelectedBillIds?: string[];
  barbers: Barber[];
  onConfirmMerge: (updatedBills: Bill[]) => void;
  settings?: StoreSettings;
}

export const MergeBillsModal: React.FC<MergeBillsModalProps> = ({
  isOpen,
  onClose,
  dailyBills,
  initialSelectedBillIds = [],
  barbers,
  onConfirmMerge,
  settings,
}) => {
  // Only completed/active bills can be merged
  const validBills = dailyBills.filter((b) => b.status !== 'VOIDED');

  // Selected bill IDs to merge
  const [selectedBillIds, setSelectedBillIds] = useState<string[]>(() => {
    if (initialSelectedBillIds.length > 0) {
      return initialSelectedBillIds;
    }
    return validBills.slice(0, 2).map((b) => b.id);
  });

  // Merged payment configuration
  const [mergedPaymentMethod, setMergedPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  const [paymentReference, setPaymentReference] = useState<string>('');

  // Selected bills objects
  const selectedBills = validBills.filter((b) => selectedBillIds.includes(b.id));

  // Sync / Auto-generate reference when selection changes
  useEffect(() => {
    if (selectedBills.length >= 2) {
      // 1. Default payment method (prefer TRANSFER if any is TRANSFER)
      const hasTransfer = selectedBills.some((b) => b.paymentMethod === 'TRANSFER' || b.paymentMethod === 'PROMPTPAY');
      const preferredMethod: PaymentMethod = hasTransfer ? 'TRANSFER' : selectedBills[0]?.paymentMethod || 'TRANSFER';
      setMergedPaymentMethod(preferredMethod);

      // 2. Default reference note
      const billNumbers = selectedBills.map((b) => `#${b.billNumber}`).join(', ');
      setPaymentReference(`โอนรวม 1 สลิป (${billNumbers})`);
    }
  }, [selectedBillIds.join(',')]);

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleBillSelection = (billId: string) => {
    setSelectedBillIds((prev) => {
      if (prev.includes(billId)) {
        return prev.filter((id) => id !== billId);
      } else {
        return [...prev, billId];
      }
    });
  };

  const totalPaymentAmount = selectedBills.reduce((sum, b) => sum + (b.grandTotal || 0), 0);

  // Confirm Merge Handler (Keeps every bill separate with its own items, sets merge group link)
  const handleExecuteMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBills.length < 2) return;

    const mergeGroupId = `merge-${Date.now()}`;
    const allBillNumbers = selectedBills.map((b) => b.billNumber);

    const updatedBills: Bill[] = selectedBills.map((bill) => {
      const otherNumbers = allBillNumbers.filter((n) => n !== bill.billNumber);
      return {
        ...bill,
        isMerged: true,
        mergedGroupId: mergeGroupId,
        mergedWithBillNumbers: otherNumbers,
        paymentMethod: mergedPaymentMethod,
        paymentReference: paymentReference.trim() || `โอนรวม (${allBillNumbers.map(n => `#${n}`).join(', ')})`,
      };
    });

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#8B5CF6', '#A78BFA', '#C4B5FD', '#F59E0B', '#10B981'],
      });
    } catch {
      // ignore
    }

    onConfirmMerge(updatedBills);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-900">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                <span>รวมจ่ายบิลหลายรายการ (Merge / Pay Together)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-900">
                  โอนรวม 1 สลิป
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                ผูกสถานะบิลที่ชำระเงินร่วมกัน โดยแต่ละบิลจะ<strong>คงรายการบริการ ยอดเงิน และชื่อช่างแยกกันตามปกติ</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body with Scroll */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1 text-xs">
          
          {validBills.length < 2 ? (
            <div className="p-8 text-center bg-stone-50 border border-dashed border-stone-200 rounded-2xl space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-bold text-stone-700">ต้องมีรายการบิลในวันนี้อย่างน้อย 2 บิลขึ้นไป</p>
              <p className="text-[11px] text-stone-400">
                เมื่อมีบิลในระบบแล้ว สามารถเลือก 2 บิลขึ้นไปเพื่อผูกสถานะรวมชำระเงินเข้าด้วยกันได้ทันที
              </p>
            </div>
          ) : (
            <form id="merge-bills-form" onSubmit={handleExecuteMerge} className="space-y-5">
              
              {/* STEP 1: Select Bills to Merge */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-stone-800 flex items-center gap-1.5">
                    <span>1. เลือกบิลที่ชำระเงินร่วมกัน</span>
                    <span className="text-stone-400 font-normal">
                      (เลือกแล้ว {selectedBillIds.length} จาก {validBills.length} บิล)
                    </span>
                  </h4>

                  <span className="text-[11px] text-purple-900 font-bold bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                    * ติ๊กเลือกอย่างน้อย 2 บิล
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-1">
                  {validBills.map((bill) => {
                    const isSelected = selectedBillIds.includes(bill.id);
                    const barberNames = Array.from(new Set(bill.items.map((i) => i.barberName))).join(', ');
                    const timeStr = bill.date 
                      ? new Date(bill.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                      : '-';

                    return (
                      <div
                        key={bill.id}
                        onClick={() => handleToggleBillSelection(bill.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-2.5 ${
                          isSelected
                            ? 'bg-purple-50/70 border-purple-500 ring-2 ring-purple-400/40 shadow-xs'
                            : 'bg-stone-50/80 border-stone-200 hover:bg-stone-100/90 text-stone-700'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-stone-900 text-xs">
                              #{bill.billNumber}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              ({timeStr} น.)
                            </span>
                            {bill.isMerged && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-200 text-purple-900">
                                🔗 รวมอยู่แล้ว
                              </span>
                            )}
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY'
                                ? 'bg-cyan-100 text-cyan-800'
                                : bill.paymentMethod === 'CASH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-stone-100 text-stone-800'
                            }`}>
                              {bill.paymentMethod === 'TRANSFER' ? 'โอนเงิน' : bill.paymentMethod === 'CASH' ? 'เงินสด' : bill.paymentMethod}
                            </span>
                          </div>

                          <div className="text-xs font-black text-stone-800 truncate">
                            👤 {bill.memberName || 'ลูกค้าทั่วไป (Walk-in)'}
                          </div>

                          <div className="text-[11px] text-stone-500 truncate">
                            ✂️ ช่าง: <strong className="text-stone-700 font-bold">{barberNames || '-'}</strong>
                          </div>

                          <div className="text-[11px] text-stone-500 truncate">
                            {bill.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end justify-between h-full space-y-2">
                          <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition ${
                            isSelected 
                              ? 'bg-purple-600 border-purple-700 text-white shadow-2xs' 
                              : 'bg-white border-stone-300'
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <span className="font-mono font-black text-sm text-stone-900">
                            {formatCurrency(bill.grandTotal)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Summary of Selected Bills & Payment Method */}
              {selectedBills.length >= 2 ? (
                <div className="bg-stone-50 border border-stone-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                    <h4 className="font-black text-stone-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <span>2. สรุปรายการบิลที่จะรวมจ่าย ({selectedBills.length} บิล)</span>
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-purple-900 bg-purple-100 px-2.5 py-0.5 rounded-full">
                      ทุกรายการคงอยู่แยกบิลตามเดิม
                    </span>
                  </div>

                  {/* List of Bills being linked */}
                  <div className="bg-white border border-stone-200 rounded-2xl p-3 divide-y divide-stone-100 max-h-40 overflow-y-auto space-y-1.5">
                    {selectedBills.map((bill, idx) => (
                      <div key={bill.id} className="pt-1.5 first:pt-0 flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-purple-100 text-purple-800 text-[10px] font-black flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div>
                            <span className="font-mono font-black text-stone-900">#{bill.billNumber}</span>
                            <span className="text-stone-600 ml-1.5 font-bold">({bill.memberName || 'ลูกค้าทั่วไป'})</span>
                            <span className="text-[11px] text-stone-400 ml-1">
                              • {bill.items.map(i => i.name).join(', ')}
                            </span>
                          </div>
                        </div>
                        <span className="font-mono font-black text-stone-900 shrink-0">
                          {formatCurrency(bill.grandTotal)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block font-bold text-stone-700">
                      วิธีชำระเงินร่วมกัน:
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setMergedPaymentMethod('TRANSFER')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          mergedPaymentMethod === 'TRANSFER'
                            ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-bold ring-2 ring-cyan-200'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-cyan-600" />
                        <span>📱 โอนเงิน / QR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMergedPaymentMethod('CASH')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          mergedPaymentMethod === 'CASH'
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-200'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Banknote className="w-4 h-4 text-emerald-600" />
                        <span>💵 เงินสด</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMergedPaymentMethod('SPLIT')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          mergedPaymentMethod === 'SPLIT'
                            ? 'bg-purple-50 border-purple-500 text-purple-950 font-bold ring-2 ring-purple-200'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <Split className="w-4 h-4 text-purple-600" />
                        <span>🔄 สลับ (สด+โอน)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setMergedPaymentMethod('MEMBER')}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          mergedPaymentMethod === 'MEMBER'
                            ? 'bg-amber-50 border-amber-500 text-amber-950 font-bold ring-2 ring-amber-200'
                            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <span>🧸 ยอดสมาชิก</span>
                      </button>
                    </div>

                    {/* Reference note */}
                    <div className="pt-1">
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="หมายเหตุการโอน เช่น โอนรวม 1 สลิป, บัญชีกสิกร (ไม่บังคับ)"
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  {/* Grand Total Bar */}
                  <div className="bg-gradient-to-r from-purple-100 via-indigo-50 to-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider block">
                        ยอดชำระเงินรวมทั้งหมด ({selectedBills.length} บิล)
                      </span>
                      <span className="text-2xl font-black text-purple-950 font-mono">
                        {formatCurrency(totalPaymentAmount)}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-purple-800 space-y-0.5">
                      <div>บิลที่ผูกรวม: <strong>{selectedBills.map(b => `#${b.billNumber}`).join(', ')}</strong></div>
                      <div className="text-purple-600 font-medium">* บันทึกสถานะรวมจ่ายให้ทุกบิลอัตโนมัติ</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl text-center text-purple-900">
                  👈 กรุณาเลือกบิลจากรายการด้านบนอย่างน้อย 2 บิล เพื่อทำการรวมจ่าย
                </div>
              )}
            </form>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 active:scale-95 text-stone-700 text-xs font-bold transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="submit"
            form="merge-bills-form"
            disabled={selectedBills.length < 2}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-xs cursor-pointer ${
              selectedBills.length >= 2
                ? 'bg-purple-600 hover:bg-purple-700 active:scale-95 text-white shadow-md shadow-purple-600/20'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Layers className="w-4 h-4 text-purple-200" />
            <span>
              {selectedBills.length >= 2
                ? `ยืนยันรวมจ่าย ${selectedBills.length} บิล (${formatCurrency(totalPaymentAmount)})`
                : 'เลือกอย่างน้อย 2 บิลเพื่อดำเนินการ'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
