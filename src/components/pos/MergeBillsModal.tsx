import React, { useState, useEffect } from 'react';
import { Barber, Bill, CartItem, PaymentMethod, StoreSettings } from '../../types';
import { 
  X, 
  Layers, 
  Check, 
  Sparkles, 
  Users, 
  Scissors, 
  QrCode, 
  Banknote, 
  Split, 
  CreditCard, 
  AlertCircle, 
  ArrowRight,
  Info,
  Calendar,
  CheckCircle2,
  Trash2
} from 'lucide-react';
import { formatCurrency, formatThaiDate } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface MergeBillsModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyBills: Bill[];
  initialSelectedBillIds?: string[];
  barbers: Barber[];
  onConfirmMerge: (mergedBill: Bill, billIdsToDelete: string[]) => void;
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

  // Merged bill configuration state
  const [mergedCustomerName, setMergedCustomerName] = useState<string>('');
  const [mergedPaymentMethod, setMergedPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  const [mergedSplitCash, setMergedSplitCash] = useState<number>(0);
  const [mergedNotes, setMergedNotes] = useState<string>('');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [mergedItems, setMergedItems] = useState<CartItem[]>([]);

  // Selected bills objects
  const selectedBills = validBills.filter((b) => selectedBillIds.includes(b.id));

  // Sync / Auto-generate merged bill details when selection changes
  useEffect(() => {
    if (selectedBills.length >= 2) {
      // 1. Auto-generate customer name
      const names = selectedBills
        .map((b) => b.memberName || 'ลูกค้าทั่วไป')
        .filter((name, idx, arr) => arr.indexOf(name) === idx);
      
      const combinedName = names.length === 1 
        ? `${names[0]} (รวม ${selectedBills.length} รายการ)` 
        : `${names.join(' + ')} (รวม ${selectedBills.length} คน)`;
      
      setMergedCustomerName(combinedName);

      // 2. Default payment method (prefer TRANSFER if any is TRANSFER, else primary)
      const hasTransfer = selectedBills.some((b) => b.paymentMethod === 'TRANSFER' || b.paymentMethod === 'PROMPTPAY');
      const preferredMethod: PaymentMethod = hasTransfer ? 'TRANSFER' : selectedBills[0]?.paymentMethod || 'TRANSFER';
      setMergedPaymentMethod(preferredMethod);

      // 3. Auto-generate notes
      const billNumbers = selectedBills.map((b) => b.billNumber).join(', ');
      setMergedNotes(`[รวมบิลจาก ${billNumbers}]`);
      setPaymentReference(selectedBills.find(b => b.paymentReference)?.paymentReference || 'โอนรวม 1 สลิป');

      // 4. Generate merged line items
      const itemsList: CartItem[] = selectedBills.flatMap((bill) => 
        (bill.items || []).map((item, idx) => ({
          ...item,
          id: `merged-${bill.id}-${item.id || idx}`,
        }))
      );
      setMergedItems(itemsList);
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

  const handleUpdateItemBarber = (index: number, newBarberId: string) => {
    const barber = barbers.find((b) => b.id === newBarberId);
    if (!barber) return;
    setMergedItems((prev) =>
      prev.map((item, idx) =>
        idx === index
          ? { ...item, barberId: barber.id, barberName: barber.nickname || barber.name }
          : item
      )
    );
  };

  const handleRemoveMergedItem = (index: number) => {
    if (mergedItems.length <= 1) {
      alert('บิลต้องมีรายการบริการอย่างน้อย 1 รายการ');
      return;
    }
    setMergedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Calculations for merged bill
  const rawSubtotal = mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalDiscounts = selectedBills.reduce((sum, b) => sum + (b.discountTotal || 0), 0);
  const totalPointsDiscount = selectedBills.reduce((sum, b) => sum + (b.pointsDiscount || 0), 0);
  const totalPointsRedeemed = selectedBills.reduce((sum, b) => sum + (b.pointsRedeemed || 0), 0);
  const totalTips = selectedBills.reduce((sum, b) => sum + (b.tipAmount || 0), 0);
  const mergedGrandTotal = Math.max(0, rawSubtotal - totalDiscounts) + totalTips;

  // Primary bill timestamp
  const primaryBill = selectedBills[0] || validBills[0];

  // Confirm Merge Handler
  const handleExecuteMerge = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBills.length < 2) return;

    // Pick a primary bill to retain ID and billNumber (or generate combined)
    const baseBill = selectedBills[0];

    const mergedBill: Bill = {
      ...baseBill,
      id: baseBill.id,
      billNumber: baseBill.billNumber,
      date: baseBill.date || new Date().toISOString(),
      customerType: selectedBills.some((b) => b.customerType === 'MEMBER') ? 'MEMBER' : 'GUEST',
      memberName: mergedCustomerName.trim() || undefined,
      memberId: selectedBills.find((b) => b.memberId)?.memberId,
      memberPhone: selectedBills.find((b) => b.memberPhone)?.memberPhone,
      items: mergedItems,
      subtotal: rawSubtotal,
      discountTotal: totalDiscounts,
      pointsDiscount: totalPointsDiscount,
      pointsRedeemed: totalPointsRedeemed > 0 ? totalPointsRedeemed : undefined,
      pointsEarned: selectedBills.reduce((sum, b) => sum + (b.pointsEarned || 0), 0),
      tipAmount: totalTips,
      tipBarberId: selectedBills.find((b) => b.tipBarberId)?.tipBarberId,
      grandTotal: mergedGrandTotal,
      paymentMethod: mergedPaymentMethod,
      cashReceived: mergedPaymentMethod === 'CASH' ? mergedGrandTotal : undefined,
      cashChange: 0,
      splitCashAmount: mergedPaymentMethod === 'SPLIT' ? mergedSplitCash : undefined,
      splitTransferAmount: mergedPaymentMethod === 'SPLIT' ? Math.max(0, mergedGrandTotal - mergedSplitCash) : undefined,
      paymentReference: paymentReference.trim() || undefined,
      status: 'COMPLETED',
      isMerged: true,
      originalBills: selectedBills,
      notes: mergedNotes.trim() || undefined,
    };

    // The other bills to delete from state/firestore
    const billIdsToDelete = selectedBills.slice(1).map((b) => b.id);

    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#D4A373', '#CCD5AE', '#E9EDC9', '#FAEDCD', '#DDA15E'],
      });
    } catch {
      // ignore
    }

    onConfirmMerge(mergedBill, billIdsToDelete);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-stone-900">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-1.5">
                <span>รวมบิลรายการในวันเดียวกัน (Merge Bills)</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  เช่น โอนจ่ายรวม 1 สลิป
                </span>
              </h3>
              <p className="text-xs text-stone-500">
                รวมหลายบิลที่ชำระเงินร่วมกันเข้าเป็น 1 บิล โดยระบบยังคงคิดค่าคอมมิชชั่นให้ช่างแต่ละคนครบถ้วน
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
                เมื่อบันทึกบิลในระบบแล้ว ท่านสามารถใช้คำสั่งนี้เพื่อเลือกรวม 2 บิลขึ้นไปเข้าด้วยกันได้ทันที
              </p>
            </div>
          ) : (
            <form id="merge-bills-form" onSubmit={handleExecuteMerge} className="space-y-5">
              
              {/* STEP 1: Select Bills to Merge */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-stone-800 flex items-center gap-1.5">
                    <span>1. เลือกบิลที่ต้องการรวมเข้าด้วยกัน</span>
                    <span className="text-stone-400 font-normal">
                      (เลือกแล้ว {selectedBillIds.length} จาก {validBills.length} บิล)
                    </span>
                  </h4>

                  <span className="text-[11px] text-amber-900 font-bold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                    * ติ๊กเลือกอย่างน้อย 2 บิล
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-1">
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
                            ? 'bg-[#FAF6F0] border-amber-500 ring-2 ring-amber-400/40 shadow-xs'
                            : 'bg-stone-50/80 border-stone-200 hover:bg-stone-100/90 text-stone-700'
                        }`}
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono font-black text-stone-900 text-xs">
                              {bill.billNumber}
                            </span>
                            <span className="text-[10px] text-stone-400">
                              ({timeStr} น.)
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY'
                                ? 'bg-cyan-100 text-cyan-800'
                                : bill.paymentMethod === 'CASH'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-purple-100 text-purple-800'
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
                              ? 'bg-amber-500 border-amber-600 text-white shadow-2xs' 
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

              {/* STEP 2: Merged Bill Configuration Preview (Shown when >=2 bills selected) */}
              {selectedBills.length >= 2 ? (
                <div className="bg-stone-50 border border-stone-200 rounded-3xl p-4 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200/80">
                    <h4 className="font-black text-stone-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>2. ตรวจสอบและตั้งค่าบิลรวมใหม่ (Merged Bill Summary)</span>
                    </h4>
                    <span className="text-[11px] font-mono font-bold text-amber-900 bg-amber-100/70 px-2.5 py-0.5 rounded-full">
                      รวม {selectedBills.length} บิล
                    </span>
                  </div>

                  {/* Customer Name Input */}
                  <div className="space-y-1">
                    <label className="block font-bold text-stone-700">
                      ชื่อลูกค้าที่จะแสดงบนบิลรวม:
                    </label>
                    <input
                      type="text"
                      required
                      value={mergedCustomerName}
                      onChange={(e) => setMergedCustomerName(e.target.value)}
                      placeholder="กรุณากรอกชื่อลูกค้า"
                      className="w-full bg-white border border-stone-300 focus:border-amber-500 rounded-xl px-3.5 py-2 font-bold text-stone-900 focus:outline-none"
                    />
                  </div>

                  {/* Line Items Breakdown per Barber */}
                  <div className="space-y-1.5">
                    <label className="block font-bold text-stone-700 flex items-center justify-between">
                      <span>รายการบริการทั้งหมดในบิลรวม ({mergedItems.length} รายการ):</span>
                      <span className="text-[10px] text-stone-400 font-normal">
                        * สามารถเปลี่ยนช่างประจำรายการ หรือปรับลบรายการได้
                      </span>
                    </label>

                    <div className="bg-white border border-stone-200 rounded-2xl p-2.5 divide-y divide-stone-100 max-h-48 overflow-y-auto space-y-1">
                      {mergedItems.map((item, idx) => (
                        <div key={idx} className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="w-5 h-5 rounded-md bg-stone-100 text-stone-600 text-[10px] font-black flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-black text-stone-900 block truncate">{item.name}</span>
                              <span className="text-[10px] text-stone-500 font-mono">
                                ฿{item.price} × {item.quantity} = {formatCurrency(item.price * item.quantity)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {/* Barber Selector */}
                            <select
                              value={item.barberId}
                              onChange={(e) => handleUpdateItemBarber(idx, e.target.value)}
                              className="bg-amber-50/70 border border-amber-300 text-amber-950 font-bold rounded-lg px-2 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-amber-400"
                            >
                              {barbers.filter(b => b.isActive).map((b) => (
                                <option key={b.id} value={b.id}>
                                  ช่าง{b.nickname || b.name}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => handleRemoveMergedItem(idx)}
                              className="text-stone-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded-md transition cursor-pointer"
                              title="ลบรายการนี้ออกจากบิลรวม"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="block font-bold text-stone-700">
                      วิธีชำระเงินของบิลรวม:
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

                    {/* Transfer Note */}
                    <div className="pt-1">
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                        placeholder="หมายเหตุการโอน เช่น โอนรวม 1 สลิป, บัญชีกสิกร (ไม่บังคับ)"
                        className="w-full bg-white border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Grand Total Bar */}
                  <div className="bg-gradient-to-r from-amber-100/90 via-stone-100 to-amber-50 border border-amber-300/80 rounded-2xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold text-stone-600 uppercase tracking-wider block">
                        ยอดรวมสุทธิของบิลใหม่ (Grand Total)
                      </span>
                      <span className="text-2xl font-black text-stone-900 font-mono">
                        {formatCurrency(mergedGrandTotal)}
                      </span>
                    </div>

                    <div className="text-right text-[11px] text-stone-500 space-y-0.5">
                      <div>ค่าบริการรวม: <strong className="text-stone-800 font-mono">{formatCurrency(rawSubtotal)}</strong></div>
                      {totalTips > 0 && <div>ทิปรวม: <strong className="text-pink-600 font-mono">+{formatCurrency(totalTips)}</strong></div>}
                      {totalDiscounts > 0 && <div>ส่วนลดรวม: <strong className="text-emerald-700 font-mono">-{formatCurrency(totalDiscounts)}</strong></div>}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl text-center text-amber-900">
                  👈 กรุณาเลือกบิลจากรายการด้านบนอย่างน้อย 2 บิล เพื่อทำการรวมบิล
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
                ? 'bg-stone-900 hover:bg-stone-800 active:scale-95 text-amber-300'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>
              {selectedBills.length >= 2
                ? `ยืนยันรวม ${selectedBills.length} บิลเป็นบิลเดียว (${formatCurrency(mergedGrandTotal)})`
                : 'เลือกอย่างน้อย 2 บิลเพื่อดำเนินการ'}
            </span>
          </button>
        </div>

      </div>
    </div>
  );
};
