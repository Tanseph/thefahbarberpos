import React, { useState, useEffect } from 'react';
import { Barber, Bill, CartItem, PaymentMethod } from '../../types';
import { 
  X, 
  Save, 
  Scissors, 
  Wallet, 
  CreditCard, 
  QrCode, 
  Split, 
  User, 
  Calendar, 
  Receipt,
  Plus,
  Trash2,
  Layers,
  RotateCcw,
  ShoppingBag,
  FlaskConical,
  Heart
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { UnmergeConfirmModal } from './UnmergeConfirmModal';

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
  const [isUnmergeModalOpen, setIsUnmergeModalOpen] = useState<boolean>(false);
  
  const [memberName, setMemberName] = useState<string>(bill?.memberName || '');
  
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
      setItems(JSON.parse(JSON.stringify(bill.items || [])));
      setTipAmount(bill.tipAmount || 0);
      setTipBarberId(bill.tipBarberId || (bill.items?.[0]?.barberId || (barbers[0]?.id || '')));
      setBillDate(bill.date ? bill.date.slice(0, 16) : new Date().toISOString().slice(0, 16));
      setNotes(bill.notes || '');
    }
  }, [bill, barbers]);

  // Calculate dynamic totals
  const itemsSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemsDiscount = items.reduce((sum, item) => sum + ((item.discount || 0) * item.quantity), 0);
  const pointsDiscount = bill?.pointsDiscount || 0;
  const totalDiscount = itemsDiscount + pointsDiscount;
  const storeSales = Math.max(0, itemsSubtotal - totalDiscount);
  const grandTotal = storeSales + tipAmount;

  // Categorized item lists for direct numeric inputs (no quantity)
  const haircutItems = items.filter((it) => it.category === 'HAIRCUT');
  const chemicalItem = items.find((it) => it.category === 'CHEMICAL');
  const productItems = items.filter((it) => it.category === 'PRODUCT');
  const otherItems = items.filter((it) => it.category !== 'HAIRCUT' && it.category !== 'CHEMICAL' && it.category !== 'PRODUCT');

  // Auto-balance split payment amounts if total changes or method switched
  useEffect(() => {
    if (paymentMethod === 'SPLIT') {
      if (splitCash + splitTransfer !== grandTotal) {
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
          quantity: 1,
        };
      } else {
        copy[index] = {
          ...copy[index],
          [field]: value,
          quantity: 1,
        };
      }
      return copy;
    });
  };

  const handleChemicalPriceChange = (newPrice: number) => {
    setItems((prev) => {
      const chemIndex = prev.findIndex((it) => it.category === 'CHEMICAL');
      if (chemIndex >= 0) {
        const copy = [...prev];
        copy[chemIndex] = {
          ...copy[chemIndex],
          price: newPrice,
          quantity: 1,
        };
        return copy;
      } else {
        const defaultBarber = barbers.find((b) => b.id === (items[0]?.barberId)) || barbers[0];
        const newChem: CartItem = {
          id: `chem-${Date.now()}`,
          serviceId: 'srv-chem-custom',
          name: 'ค่าเคมี',
          category: 'CHEMICAL',
          price: newPrice,
          quantity: 1,
          discount: 0,
          barberId: defaultBarber?.id || '',
          barberName: defaultBarber?.nickname || '',
        };
        return [...prev, newChem];
      }
    });
  };

  const handleChemicalBarberChange = (barberId: string) => {
    const selectedB = barbers.find((b) => b.id === barberId);
    setItems((prev) => {
      const chemIndex = prev.findIndex((it) => it.category === 'CHEMICAL');
      if (chemIndex >= 0) {
        const copy = [...prev];
        copy[chemIndex] = {
          ...copy[chemIndex],
          barberId,
          barberName: selectedB ? selectedB.nickname : copy[chemIndex].barberName,
          quantity: 1,
        };
        return copy;
      } else {
        const newChem: CartItem = {
          id: `chem-${Date.now()}`,
          serviceId: 'srv-chem-custom',
          name: 'ค่าเคมี',
          category: 'CHEMICAL',
          price: 0,
          quantity: 1,
          discount: 0,
          barberId,
          barberName: selectedB ? selectedB.nickname : '',
        };
        return [...prev, newChem];
      }
    });
  };

  const handleRemoveChemical = () => {
    setItems((prev) => prev.filter((it) => it.category !== 'CHEMICAL'));
  };

  const handleAddProduct = () => {
    const defaultBarber = barbers.find((b) => b.id === (items[0]?.barberId)) || barbers[0];
    const newProd: CartItem = {
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId: `srv-prod-${Date.now()}`,
      name: 'สินค้าหน้าร้าน',
      category: 'PRODUCT',
      price: 0,
      quantity: 1,
      discount: 0,
      barberId: defaultBarber?.id || '',
      barberName: defaultBarber?.nickname || '',
    };
    setItems((prev) => [...prev, newProd]);
  };

  const handleAddHaircut = () => {
    const defaultBarber = barbers.find((b) => b.id === (items[0]?.barberId)) || barbers[0];
    const newHaircut: CartItem = {
      id: `haircut-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serviceId: `srv-haircut-${Date.now()}`,
      name: `ค่าตัดผม (หัวที่ ${haircutItems.length + 1})`,
      category: 'HAIRCUT',
      price: 0,
      quantity: 1,
      discount: 0,
      barberId: defaultBarber?.id || '',
      barberName: defaultBarber?.nickname || '',
    };
    setItems((prev) => [...prev, newHaircut]);
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

    // Keep items that have price > 0, ensuring quantity is 1
    // If all items have price 0, keep at least one item
    const validItems = items.filter((it) => it.price > 0).map((it) => ({ ...it, quantity: 1 }));
    const finalItems = validItems.length > 0 
      ? validItems 
      : items.length > 0 
        ? [{ ...items[0], quantity: 1 }] 
        : [
            {
              id: `item-${Date.now()}`,
              serviceId: 'srv-custom',
              name: 'ค่าบริการ',
              category: 'HAIRCUT' as const,
              price: 0,
              quantity: 1,
              discount: 0,
              barberId: barbers[0]?.id || '',
              barberName: barbers[0]?.nickname || '',
            }
          ];

    const haircutCount = finalItems.filter((i) => i.category === 'HAIRCUT').reduce((sum, i) => sum + i.quantity, 0);

    const updatedBill: Bill = {
      ...bill,
      date: billDate.length === 16 ? `${billDate}:00` : billDate,
      memberName: memberName.trim() || 'ลูกค้าทั่วไป (Walk-in)',
      memberPhone: bill.memberPhone, // Keep existing phone in data record without phone input in UI
      items: finalItems,
      headsCount: haircutCount > 0 ? haircutCount : 1,
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
      <div className="bg-white border border-stone-200 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col justify-between shadow-2xl text-stone-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-stone-200 bg-stone-50/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-stone-950 font-black flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5 stroke-[2.5]" />
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
                แก้ไขรายการบริการ/สินค้า กรอกราคา สลับช่าง หรือปรับยอดชำระ
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
                    <span>🔗 บิลนี้ผูกสถานะรวมจ่าย (Merged Bill)</span>
                  </h4>
                  <p className="text-[11px] text-purple-700">
                    {bill.mergedWithBillNumbers && bill.mergedWithBillNumbers.length > 0
                      ? `รวมจ่ายกับบิล: ${bill.mergedWithBillNumbers.map((n) => `#${n}`).join(', ')}`
                      : bill.originalBills && bill.originalBills.length > 0
                      ? `รวมจากบิล: ${bill.originalBills.map((b) => `#${b.billNumber}`).join(', ')}`
                      : 'ผูกสถานะชำระเงินร่วมกับบิลอื่น'}
                  </p>
                </div>
              </div>

              {onUnmergeBill && (
                <button
                  type="button"
                  onClick={() => setIsUnmergeModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:scale-95 text-white text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>↩️ แยกบิลกลับ (ยกเลิกรวม)</span>
                </button>
              )}
            </div>
          )}

          {/* 1. PAYMENT METHOD SWITCHER */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-amber-700" />
                วิธีชำระเงิน:
              </label>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-lg">
                เลือกวิธีที่ต้องการ
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
                      value={splitCash === 0 ? '' : splitCash}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                        setSplitCash(val);
                        setSplitTransfer(Math.max(0, grandTotal - val));
                      }}
                      placeholder="0"
                      className="w-full bg-white border border-emerald-300 rounded-xl pl-3 pr-7 py-2 text-sm font-medium text-emerald-950 focus:outline-none focus:ring-2 focus:ring-emerald-400 font-sans"
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
                      value={splitTransfer === 0 ? '' : splitTransfer}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0);
                        setSplitTransfer(val);
                        setSplitCash(Math.max(0, grandTotal - val));
                      }}
                      placeholder="0"
                      className="w-full bg-white border border-cyan-300 rounded-xl pl-3 pr-7 py-2 text-sm font-medium text-cyan-950 focus:outline-none focus:ring-2 focus:ring-cyan-400 font-sans"
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

          {/* 2. CUSTOMER & DATE INFO (NO PHONE FIELD) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-stone-400" />
                <span>ชื่อลูกค้า (Customer Name):</span>
              </label>
              <input
                type="text"
                value={memberName}
                onChange={(e) => setMemberName(e.target.value)}
                placeholder="ระบุชื่อลูกค้า เช่น ลูกค้าทั่วไป (Walk-in)"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:border-amber-400 focus:bg-white font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-stone-400" />
                <span>วันและเวลาที่ทำรายการ:</span>
              </label>
              <input
                type="datetime-local"
                value={billDate}
                onChange={(e) => setBillDate(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-xs text-stone-900 font-bold focus:outline-none focus:border-amber-400 focus:bg-white"
              />
            </div>
          </div>

          {/* 3. ITEMS & SERVICES / PRODUCTS PRICING (DIRECT NUMERIC INPUTS - NO QUANTITY) */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                <Scissors className="w-3.5 h-3.5 text-amber-600" /> 
                <span>รายการค่าบริการและสินค้า:</span>
              </label>
              <p className="text-[10px] text-stone-400">
                กรอกตัวเลขราคาได้ทันทีในแต่ละช่อง ไม่ต้องกรอกจำนวน
              </p>
            </div>

            {/* 3.1 งานตัดผม (HAIRCUT) */}
            <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-2.5 sm:p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-amber-900 flex items-center gap-1">
                    <Scissors className="w-3 h-3 text-amber-600" />
                    <span>ค่าตัดผม (Haircut Fee)</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                    ✂️ รวม {haircutItems.length} หัว
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={handleAddHaircut}
                    className="text-[10px] font-medium text-amber-800 hover:text-amber-950 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-amber-300 shadow-2xs hover:bg-amber-50 active:scale-95 transition"
                  >
                    <Plus className="w-3 h-3" />
                    <span>+ เพิ่มหัวตัดผม</span>
                  </button>
                </div>
              </div>

              {haircutItems.length >= 2 && (
                <div className="bg-purple-50/80 border border-purple-200 rounded-lg px-2.5 py-1 text-[10px] text-purple-900 flex items-center gap-1.5">
                  <span>ℹ️</span>
                  <span>
                    บิลนี้นับเป็น <strong>{haircutItems.length} หัวตัดผม</strong> (ช่างแต่ละคนจะได้รับยอดตัดผมและจำนวนหัวตามที่เลือก ยอดรวมโอนจ่ายในบิลเดียว)
                  </span>
                </div>
              )}

              {haircutItems.length === 0 ? (
                <div className="text-[11px] text-stone-400 italic py-1">
                  ไม่มีรายการตัดผมในบิลนี้ (กดปุ่ม + เพิ่มหัวตัดผม เพื่อระบุราคา)
                </div>
              ) : (
                <div className="space-y-1.5">
                  {haircutItems.map((item, idx) => {
                    const itemIdx = items.findIndex((it) => it.id === item.id);
                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 bg-white p-2 rounded-lg border border-amber-200/70 shadow-2xs">
                        <div className="flex items-center gap-1.5 flex-1">
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-200 shrink-0">
                            หัวที่ {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(itemIdx, 'name', e.target.value)}
                            placeholder={`ระบุชื่อ เช่น ค่าตัดผม (คนที่ ${idx + 1})`}
                            className="w-full text-xs font-normal text-stone-800 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-amber-500 focus:outline-none py-0.5"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="space-y-0.5">
                            <select
                              value={item.barberId || ''}
                              onChange={(e) => handleItemChange(itemIdx, 'barberId', e.target.value)}
                              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-normal text-stone-800 focus:outline-none focus:border-amber-500 cursor-pointer shadow-2xs"
                            >
                              {barbers.map((b) => (
                                <option key={b.id} value={b.id}>
                                  ช่าง{b.nickname}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="relative w-28">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.price === 0 ? '' : item.price}
                              onChange={(e) => handleItemChange(itemIdx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full bg-white border border-stone-300 focus:border-amber-500 rounded-lg pl-2.5 pr-6 py-1 text-xs font-medium text-right text-stone-800 focus:outline-none font-sans shadow-2xs"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-normal text-stone-400">฿</span>
                          </div>

                          {haircutItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(itemIdx)}
                              className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3.2 งานเคมี (CHEMICAL) - เอาออกมาเป็นช่องกรอกตัวเลขเลย จำนวนไม่ต้อง */}
            <div className="bg-cyan-50/50 border border-cyan-200/80 rounded-xl p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-950 flex items-center gap-1">
                  <FlaskConical className="w-3 h-3 text-cyan-600" />
                  <span>ค่าเคมี (Chemical Fee: ดัด / ยืด / ทำสี)</span>
                </span>
                {chemicalItem && chemicalItem.price > 0 && (
                  <button
                    type="button"
                    onClick={handleRemoveChemical}
                    className="text-[10px] font-medium text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer bg-white px-1.5 py-0.5 rounded-md border border-rose-200 shadow-2xs hover:bg-rose-50 active:scale-95"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                    <span>ล้างค่าเคมี</span>
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 bg-white p-2 rounded-lg border border-cyan-200/70 shadow-2xs">
                <div className="flex-1">
                  <span className="text-xs font-normal text-stone-700 block">
                    {chemicalItem?.name || 'ค่าเคมี (ดัด / ยืด / สี)'}
                  </span>
                  <span className="text-[9px] text-stone-400">
                    ช่องกรอกตัวเลขค่าเคมีโดยตรง
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="space-y-0.5">
                    <select
                      value={chemicalItem?.barberId || (items[0]?.barberId || (barbers[0]?.id || ''))}
                      onChange={(e) => handleChemicalBarberChange(e.target.value)}
                      className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-normal text-stone-800 focus:outline-none focus:border-cyan-500 cursor-pointer shadow-2xs"
                    >
                      {barbers.map((b) => (
                        <option key={b.id} value={b.id}>
                          ช่าง{b.nickname}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="relative w-28">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={chemicalItem?.price === 0 ? '' : (chemicalItem?.price ?? '')}
                      onChange={(e) => handleChemicalPriceChange(e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full bg-white border border-stone-300 focus:border-cyan-500 rounded-lg pl-2.5 pr-6 py-1 text-xs font-medium text-right text-stone-800 focus:outline-none font-sans shadow-2xs"
                    />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-normal text-stone-400">฿</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3.3 สินค้าหน้าร้าน / เพิ่มสินค้า (PRODUCT) - เอาออกมาเป็นช่องกรอกตัวเลขเลย จำนวนไม่ต้อง */}
            <div className="bg-purple-50/50 border border-purple-200/80 rounded-xl p-2.5 sm:p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-purple-950 flex items-center gap-1">
                  <ShoppingBag className="w-3 h-3 text-purple-600" />
                  <span>สินค้าหน้าร้าน (Retail Products)</span>
                </span>
                <button
                  type="button"
                  onClick={handleAddProduct}
                  className="text-[10px] font-medium text-purple-900 hover:text-purple-950 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded-md border border-purple-300 shadow-2xs hover:bg-purple-50 active:scale-95"
                >
                  <Plus className="w-3 h-3 text-purple-700" />
                  <span>+ เพิ่มสินค้า</span>
                </button>
              </div>

              {productItems.length === 0 ? (
                <div className="text-[11px] text-stone-400 italic py-1 flex items-center justify-between">
                  <span>ยังไม่มีรายการสินค้าในบิลนี้</span>
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="text-purple-700 font-medium hover:underline cursor-pointer text-[10px]"
                  >
                    กดเพื่อเพิ่มสินค้าและกรอกราคา
                  </button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {productItems.map((item) => {
                    const itemIdx = items.findIndex((it) => it.id === item.id);
                    return (
                      <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 bg-white p-2 rounded-lg border border-purple-200/70 shadow-2xs">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(itemIdx, 'name', e.target.value)}
                            placeholder="ระบุชื่อสินค้า เช่น แว็กซ์, เจล, แชมพู"
                            className="w-full text-xs font-normal text-stone-800 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-purple-500 focus:outline-none py-0.5"
                          />
                        </div>

                        <div className="flex items-center gap-1.5">
                          <div className="space-y-0.5">
                            <select
                              value={item.barberId || ''}
                              onChange={(e) => handleItemChange(itemIdx, 'barberId', e.target.value)}
                              className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-normal text-stone-800 focus:outline-none focus:border-purple-500 cursor-pointer shadow-2xs"
                            >
                              {barbers.map((b) => (
                                <option key={b.id} value={b.id}>
                                  ช่าง{b.nickname}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="relative w-28">
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={item.price === 0 ? '' : item.price}
                              onChange={(e) => handleItemChange(itemIdx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                              placeholder="0"
                              className="w-full bg-white border border-stone-300 focus:border-purple-500 rounded-lg pl-2.5 pr-6 py-1 text-xs font-medium text-right text-stone-800 focus:outline-none font-sans shadow-2xs"
                            />
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-normal text-stone-400">฿</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(itemIdx)}
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="ลบสินค้านี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3.4 รายการอื่นๆ (ถ้ามี) */}
            {otherItems.length > 0 && (
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-3.5 space-y-2">
                <span className="text-xs font-black text-stone-800">รายการบริการอื่นๆ:</span>
                {otherItems.map((item) => {
                  const itemIdx = items.findIndex((it) => it.id === item.id);
                  return (
                    <div key={item.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-white p-2.5 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => handleItemChange(itemIdx, 'name', e.target.value)}
                          placeholder="ชื่อรายการ"
                          className="w-full text-xs font-bold text-stone-900 bg-transparent border-b border-transparent hover:border-stone-300 focus:border-stone-500 focus:outline-none py-1"
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={item.barberId || ''}
                          onChange={(e) => handleItemChange(itemIdx, 'barberId', e.target.value)}
                          className="bg-stone-50 border border-stone-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer shadow-2xs"
                        >
                          {barbers.map((b) => (
                            <option key={b.id} value={b.id}>
                              ช่าง{b.nickname}
                            </option>
                          ))}
                        </select>

                        <div className="relative w-32">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.price === 0 ? '' : item.price}
                            onChange={(e) => handleItemChange(itemIdx, 'price', e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)}
                            placeholder="ระบุราคา"
                            className="w-full bg-stone-50 border border-stone-300 focus:border-stone-500 rounded-xl pl-3 pr-7 py-1.5 text-sm font-black text-right text-stone-900 focus:outline-none font-mono shadow-2xs"
                          />
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">฿</span>
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(itemIdx)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="ลบรายการนี้"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. TIP ADJUSTMENT (SEPARATED FROM STORE SALES) */}
          <div className="bg-pink-50/70 border border-pink-200/90 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-pink-500 text-white font-black flex items-center justify-center shadow-xs">
                <Heart className="w-3 h-3 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs font-semibold text-pink-950 block">ค่าทิปช่าง (Barber Tip)</span>
                <span className="text-[10px] text-pink-700 font-normal">
                  * ทิปมอบให้ช่างโดยตรง ไม่รวมกับยอดขายของร้าน
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
              <select
                value={tipBarberId}
                onChange={(e) => setTipBarberId(e.target.value)}
                className="bg-white border border-pink-300 rounded-lg px-2 py-1 text-xs font-normal text-stone-800 focus:outline-none focus:border-pink-500 cursor-pointer shadow-2xs"
              >
                {barbers.map((b) => (
                  <option key={b.id} value={b.id}>
                    มอบให้ช่าง{b.nickname}
                  </option>
                ))}
              </select>

              <div className="relative w-28">
                <input
                  type="number"
                  min="0"
                  value={tipAmount === 0 ? '' : tipAmount}
                  onChange={(e) => setTipAmount(e.target.value === '' ? 0 : Math.max(0, parseFloat(e.target.value) || 0))}
                  placeholder="0"
                  className="w-full bg-white border border-pink-300 rounded-lg pl-2.5 pr-6 py-1 text-xs font-medium text-right text-pink-800 focus:outline-none focus:ring-1 focus:ring-pink-300 font-sans shadow-2xs"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-normal text-stone-400">฿</span>
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
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-bold block">ยอดขายร้าน (ไม่รวมทิป)</span>
              <strong className="text-base font-black text-stone-900 font-mono">
                {formatCurrency(storeSales)}
              </strong>
            </div>

            {tipAmount > 0 && (
              <div>
                <span className="text-[10px] text-pink-600 uppercase font-bold block">ทิปช่าง</span>
                <strong className="text-base font-black text-pink-700 font-mono">
                  +{formatCurrency(tipAmount)}
                </strong>
              </div>
            )}

            <div className="border-l border-stone-300 pl-3">
              <span className="text-[10px] text-amber-800 uppercase font-extrabold block">ยอดรับชำระทั้งหมด</span>
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
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-stone-200 bg-white text-stone-700 text-xs font-bold hover:bg-stone-100 transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>บันทึกการแก้ไข</span>
            </button>
          </div>
        </div>
      </div>

      {/* Unmerge Confirmation Modal */}
      {isUnmergeModalOpen && (
        <UnmergeConfirmModal
          isOpen={isUnmergeModalOpen}
          onClose={() => setIsUnmergeModalOpen(false)}
          bill={bill}
          onConfirmUnmerge={(b) => {
            if (onUnmergeBill) onUnmergeBill(b);
            setIsUnmergeModalOpen(false);
            onClose();
          }}
        />
      )}
    </div>
  );
};
