import React, { useState, useEffect } from 'react';
import { Barber, Bill, CartItem, PaymentMethod } from '../../types';
import { 
  X, 
  Save, 
  AlertCircle, 
  Scissors, 
  Wallet, 
  CreditCard, 
  QrCode, 
  Split, 
  User, 
  HeartHandshake, 
  Calendar, 
  Clock, 
  Receipt,
  Plus,
  Trash2,
  CheckCircle2,
  Layers,
  RotateCcw
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

interface EditBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  bill: Bill | null;
  barbers: Barber[];
  onSaveBill: (updatedBill: Bill) => void;
  onUnmergeBill?: (mergedBill: Bill) => void;
}

export const EditBillModal: React.FC<EditBillModalProps> = ({
  isOpen,
  onClose,
  bill,
  barbers,
  onSaveBill,
  onUnmergeBill,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(bill?.paymentMethod || 'CASH');
  const [splitCash, setSplitCash] = useState<number>(bill?.splitCashAmount || 0);
  const [splitTransfer, setSplitTransfer] = useState<number>(bill?.splitTransferAmount || 0);
  
  const [memberName, setMemberName] = useState<string>(bill?.memberName || '');
  const [memberPhone, setMemberPhone] = useState<string>(bill?.memberPhone || '');
  
  const [items, setItems] = useState<CartItem[]>(() => bill?.items ? JSON.parse(JSON.stringify(bill.items)) : []);
  const [tipAmount, setTipAmount] = useState<number>(bill?.tipAmount || 0);
  const [tipBarberId, setTipBarberId] = useState<string>(bill?.tipBarberId || (bill?.items?.[0]?.barberId || ''));
  
  const [billDate, setBillDate] = useState<string>(bill?.date ? bill.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
  const [notes, setNotes] = useState<string>(bill?.notes || '');

  // Sync state when bill changes
  useEffect(() => {
    if (bill) {
      setPaymentMethod(bill.paymentMethod || 'CASH');
      setSplitCash(bill.splitCashAmount || 0);
      setSplitTransfer(bill.splitTransferAmount || 0);
      setMemberName(bill.memberName || '');
      setMemberPhone(bill.memberPhone || '');
      setItems(JSON.parse(JSON.stringify(bill.items || [])));
      setTipAmount(bill.tipAmount || 0);
      setTipBarberId(bill.tipBarberId || (bill.items?.[0]?.barberId || ''));
      setBillDate(bill.date ? bill.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
      setNotes(bill.notes || '');
    }
  }, [bill]);

  // Calculate dynamic totals
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemsDiscount = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  const pointsDiscount = bill?.pointsDiscount || 0;
  const totalDiscount = itemsDiscount + pointsDiscount;
  const grandTotal = Math.max(0, itemsSubtotal - totalDiscount) + tipAmount;

  // Auto-balance split payment amounts if total changes or method switched
  useEffect(() => {
    if (paymentMethod === 'SPLIT') {
      if (splitCash + splitTransfer !== grandTotal) {
        // default split 50/50 or adjust transfer
        const half = Math.round(grandTotal / 2);
        setSplitCash(half);
        setSplitTransfer(grandTotal - half);
      }
    }
  }, [paymentMethod, grandTotal]);

  const handleItemChange = (index: number, field: keyof CartItem, value: any) => {
    setItems((prev) => {
      const copy = [...prev];
      if (field === 'barberId') {
        const selectedB = barbers.find((b) => b.id === value);
        copy[index] = {
          ...copy[index],
          barberId: value,
          barberName: selectedB ? selectedB.nickname : copy[index].barberName,
        };
      } else {
        copy[index] = {
          ...copy[index],
          [field]: value,
        };
      }
      return copy;
    });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) {
      alert('บิลต้องมีรายการบริการหรือสินค้าอย่างน้อย 1 รายการ');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!bill) return;
    if (paymentMethod === 'SPLIT' && (splitCash + splitTransfer !== grandTotal)) {
      alert(`ยอดเงินสด (${formatCurrency(splitCash)}) + เงินโอน (${formatCurrency(splitTransfer)}) รวมกันต้องเท่ากับยอดสุทธิ (${formatCurrency(grandTotal)})`);
      return;
    }

    const updatedBill: Bill = {
      ...bill,
      date: billDate.length === 16 ? `${billDate}:00` : billDate,
      memberName: memberName.trim() || 'ลูกค้าทั่วไป (Walk-in)',
      memberPhone: memberPhone.trim(),
      items,
      subtotal: itemsSubtotal,
      discountTotal: totalDiscount,
      tipAmount,
      tipBarberId: tipAmount > 0 ? tipBarberId : undefined,
      grandTotal,
      paymentMethod,
      splitCashAmount: paymentMethod === 'SPLIT' ? splitCash : undefined,
      splitTransferAmount: paymentMethod === 'SPLIT' ? splitTransfer : undefined,
      cashReceived: paymentMethod === 'CASH' ? grandTotal : bill.cashReceived,
      notes: notes.trim(),
    };

    onSaveBill(updatedBill);
    onClose();
  };

  if (!isOpen || !bill) return null;

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white border border-stone-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col justify-between shadow-2xl text-stone-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 bg-stone-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white font-black flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-stone-900">
                  แก้ไขข้อมูลบิล #{bill.billNumber}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  bill.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {bill.status === 'COMPLETED' ? 'บิลสมบูรณ์' : 'ยกเลิกแล้ว'}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                ปรับแก้วิธีชำระเงิน, สลับช่าง, แก้ไขทิป หรือข้อมูลลูกค้า
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-2 rounded-full hover:bg-stone-200/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Merged Bill Alert & Quick Unmerge */}
          {(bill.isMerged || (bill.originalBills && bill.originalBills.length > 0)) && (
            <div className="bg-gradient-to-r from-purple-50 via-purple-50/80 to-purple-100/50 border border-purple-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-950">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-600 text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <span>🔗 บิลนี้เป็นบิลรวม (Merged Bill)</span>
                    <span className="text-[10px] bg-purple-200 text-purple-900 px-1.5 py-0.2 rounded font-bold">
                      {bill.originalBills?.length ? `${bill.originalBills.length} บิล` : 'รวมรายการ'}
                    </span>
                  </h4>
                  <p className="text-[11px] text-purple-700">
                    {bill.originalBills && bill.originalBills.length > 0
                      ? `รวมจากบิล: ${bill.originalBills.map((b) => `#${b.billNumber}`).join(', ')}`
                      : 'สามารถปรับแก้รายการช่าง/ราคา หรือกดยกเลิกรวมบิลเพื่อแยกกลับเป็นบิลเดิมได้'}
                  </p>
                </div>
              </div>

              {onUnmergeBill && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`ต้องการยกเลิกรวมบิล #${bill.billNumber} และแยกกลับเป็นบิลเดิมทั้งหมดใช่หรือไม่?`)) {
                      onUnmergeBill(bill);
                      onClose();
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>↩️ แยกบิลกลับ (ยกเลิกรวม)</span>
                </button>
              )}
            </div>
          )}

          {/* 1. PAYMENT METHOD SWITCHER (Main Requirement) */}
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-700" />
                วิธีชำระเงิน (สลับได้ทันที หากบันทึกผิด):
              </label>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
                เลือกวิธีที่ถูกต้อง
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black transition cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-300'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-emerald-50 hover:border-emerald-300'
                }`}
              >
                <Wallet className="w-4 h-4" />
                <span>💵 เงินสด (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black transition cursor-pointer ${
                  paymentMethod === 'TRANSFER' || paymentMethod === 'PROMPTPAY'
                    ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs ring-2 ring-cyan-300'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-cyan-50 hover:border-cyan-300'
                }`}
              >
                <QrCode className="w-4 h-4" />
                <span>📱 โอนเงิน / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('SPLIT')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black transition cursor-pointer ${
                  paymentMethod === 'SPLIT'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs ring-2 ring-purple-300'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-purple-50 hover:border-purple-300'
                }`}
              >
                <Split className="w-4 h-4" />
                <span>🔄 แบ่งจ่าย (สด+โอน)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CREDIT_CARD')}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-black transition cursor-pointer ${
                  paymentMethod === 'CREDIT_CARD'
                    ? 'bg-stone-800 text-white border-stone-800 shadow-xs ring-2 ring-stone-400'
                    : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>💳 บัตรเครดิต</span>
              </button>
            </div>

            {/* If SPLIT method is selected, show split inputs */}
            {paymentMethod === 'SPLIT' && (
              <div className="mt-3 p-3 bg-white rounded-xl border border-purple-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-emerald-800 block mb-1">
                    ยอดเงินสด (Cash Amount):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={splitCash}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setSplitCash(val);
                        setSplitTransfer(Math.max(0, grandTotal - val));
                      }}
                      className="w-full bg-emerald-50/50 border border-emerald-300 rounded-xl px-3 py-1.5 text-xs font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">฿</span>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-cyan-800 block mb-1">
                    ยอดเงินโอน (Transfer Amount):
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      value={splitTransfer}
                      onChange={(e) => {
                        const val = Math.max(0, parseFloat(e.target.value) || 0);
                        setSplitTransfer(val);
                        setSplitCash(Math.max(0, grandTotal - val));
                      }}
                      className="w-full bg-cyan-50/50 border border-cyan-300 rounded-xl px-3 py-1.5 text-xs font-black text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">฿</span>
                  </div>
                </div>

                <div className="col-span-full flex justify-between text-[11px] font-bold text-stone-600 pt-1 border-t border-stone-100">
                  <span>รวมแบ่งจ่าย: {formatCurrency(splitCash + splitTransfer)}</span>
                  <span className={splitCash + splitTransfer === grandTotal ? 'text-emerald-600' : 'text-rose-600'}>
                    ยอดสุทธิต้องการ: {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 2. CUSTOMER & DATE INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                ชื่อลูกค้า:
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="กรุณากรอกชื่อลูกค้า"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                เบอร์โทรศัพท์:
              </label>
              <input
                type="text"
                value={memberPhone}
                onChange={(e) => setMemberPhone(e.target.value)}
                placeholder="08X-XXX-XXXX"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-400 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                วันและเวลาที่ทำรายการ:
              </label>
              <input
                type="datetime-local"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white"
              />
            </div>
          </div>

          {/* 3. ITEMS & BARBERS LIST */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-amber-600" /> รายการบริการ / สินค้า & ช่างผู้ให้บริการ:
              </label>
              <span className="text-[11px] text-stone-500">เปลี่ยนช่างผู้รับงานได้</span>
            </div>

            <div className="border border-stone-200 rounded-2xl divide-y divide-stone-200 overflow-hidden">
              {items.map((item, idx) => (
                <div key={item.id || idx} className="p-3 bg-stone-50/50 hover:bg-stone-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="font-bold text-xs text-stone-900 bg-transparent border-b border-transparent focus:border-amber-400 focus:outline-none w-full"
                    />
                    <span className="text-[10px] text-stone-500 block">
                      หมวดหมู่: {item.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Barber selection */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-stone-500">ช่าง:</span>
                      <select
                        value={item.barberId}
                        onChange={(e) => handleItemChange(idx, 'barberId', e.target.value)}
                        className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-amber-900 focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {barbers.map((b) => (
                          <option key={b.id} value={b.id}>
                            ช่าง{b.nickname}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-stone-500">จำนวน:</span>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-12 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-bold text-center focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-stone-500">ราคา:</span>
                      <input
                        type="number"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleItemChange(idx, 'price', Math.max(0, parseFloat(e.target.value) || 0))}
                        className="w-20 bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-black text-right text-stone-900 focus:outline-none focus:border-amber-400"
                      />
                      <span className="text-[11px] text-stone-400">฿</span>
                    </div>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="ลบรายการ"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 4. TIP ADJUSTMENT */}
          <div className="bg-pink-50/60 border border-pink-200 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-pink-600" />
              <div>
                <span className="text-xs font-bold text-pink-950 block">ทิปช่าง (Tip)</span>
                <span className="text-[10px] text-pink-700">ทิปจะถูกรวมและแจกแจงให้ช่างผู้ได้รับ</span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <select
                value={tipBarberId}
                onChange={(e) => setTipBarberId(e.target.value)}
                className="bg-white border border-pink-300 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 focus:outline-none focus:border-pink-500 cursor-pointer"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    ให้ช่าง{b.nickname}
                  </option>
                ))}
              </select>

              <div className="relative w-28">
                <input
                  type="number"
                  min="0"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-white border border-pink-300 rounded-xl px-3 py-1.5 text-xs font-black text-right text-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">฿</span>
              </div>
            </div>
          </div>

          {/* 5. NOTES */}
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">
              หมายเหตุเพิ่มเติม:
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="บันทึกหมายเหตุการแก้ไข หรือความต้องการของลูกค้า..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-400 focus:bg-white"
            />
          </div>
        </div>

        {/* Footer Summary & Save */}
        <div className="p-4 sm:p-5 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-bold block">ยอดสุทธิหลังแก้ไข</span>
              <strong className="text-xl font-black text-amber-950 font-mono">
                {formatCurrency(grandTotal)}
              </strong>
            </div>
            {totalDiscount > 0 && (
              <span className="text-[10px] text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-bold">
                ส่วนลด -{formatCurrency(totalDiscount)}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-bold hover:bg-stone-100 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
