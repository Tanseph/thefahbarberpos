import React, { useState, useEffect } from 'react';
import { 
  Barber, 
  Bill, 
  CartItem, 
  CashDrawerSummary, 
  Member, 
  PackageTemplate, 
  PaymentMethod, 
  ServiceItem, 
  StoreSettings 
} from '../../types';
import { MemberSearchModal } from './MemberSearchModal';
import { QuickAddMemberModal } from './QuickAddMemberModal';
import { ReceiptModal } from './ReceiptModal';
import { DailyBillsDrawer } from './DailyBillsDrawer';
import { generateBillNumber, getTodayDateString, formatCurrency, formatThaiDate } from '../../utils/formatters';
import { generatePromptPayQRDataUrl } from '../../utils/promptpay';
import { getPackageColorConfig } from '../../utils/packageColors';
import { 
  Scissors, 
  FlaskConical, 
  Heart, 
  ShoppingBag, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  UserCheck, 
  Receipt, 
  RotateCcw, 
  Banknote, 
  QrCode, 
  Sparkles,
  ChevronDown,
  User,
  Check,
  Split,
  CreditCard,
  X,
  Printer
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface POSViewProps {
  services: ServiceItem[];
  packageTemplates: PackageTemplate[];
  barbers: Barber[];
  members: Member[];
  onSaveMember: (member: Member) => void;
  bills: Bill[];
  onAddBill: (bill: Bill) => void;
  onUpdateBill?: (bill: Bill) => void;
  onDeleteBill?: (billId: string) => void;
  onUnmergeBill?: (mergedBill: Bill) => void;
  onVoidBill: (billId: string, reason: string) => void;
  settings: StoreSettings;
  cashDrawer: CashDrawerSummary;
  onUpdateCashDrawer: (drawer: CashDrawerSummary) => void;
  activeStaffId: string;
  onUpdateServicesStock?: (serviceId: string, deltaStock: number) => void;
}

interface ProductLineItem {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  quantity: number;
  stock?: number;
}

export const POSView: React.FC<POSViewProps> = ({
  services,
  packageTemplates,
  barbers,
  members,
  onSaveMember,
  bills,
  onAddBill,
  onUpdateBill,
  onDeleteBill,
  onUnmergeBill,
  onVoidBill,
  settings,
  cashDrawer,
  onUpdateCashDrawer,
  activeStaffId,
  onUpdateServicesStock,
}) => {
  // 1. Barber Selection (Active barbers only)
  const activeBarbers = barbers.filter(b => b.isActive);
  const [selectedBarberId, setSelectedBarberId] = useState<string>(activeStaffId || (activeBarbers[0]?.id ?? ''));

  // 2. Real-time Clock and Date/Time settings (Real-time vs Backdating)
  const [isRealTimeMode, setIsRealTimeMode] = useState<boolean>(true);
  const [billDateTime, setBillDateTime] = useState<string>(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [currentLiveTime, setCurrentLiveTime] = useState<Date>(new Date());

  // Real-time ticking effect
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentLiveTime(now);
      if (isRealTimeMode) {
        const tzOffset = now.getTimezoneOffset() * 60000;
        setBillDateTime(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isRealTimeMode]);

  // 3. Numeric Fields (Empty by default per user request)
  // ✂️ Haircut fee (string state to allow clean empty input)
  const [haircutFeeInput, setHaircutFeeInput] = useState<string>('');

  // 🧪 Chemical service fee (string state to allow clean empty input)
  const [chemicalFeeInput, setChemicalFeeInput] = useState<string>('');

  // 💖 Tip amount (string state to allow clean empty input)
  const [tipAmountInput, setTipAmountInput] = useState<string>('');

  // 4. Product Dropdown Line Items
  const productOptions = services.filter(s => s.isActive && s.category === 'PRODUCT');
  const [productLines, setProductLines] = useState<ProductLineItem[]>([]);

  // 5. Customer Name & Member & Discounts
  const [customerNameInput, setCustomerNameInput] = useState<string>('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [pointsRedeemed, setPointsRedeemed] = useState<number>(0);
  const [billDiscount, setBillDiscount] = useState<number>(0);
  const [isAutoDeductMemberBalance, setIsAutoDeductMemberBalance] = useState<boolean>(true);

  // 6. Payment Method: 'TRANSFER' | 'CASH' | 'SPLIT' | 'MEMBER'
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER');
  
  // Cash details
  const [cashReceivedInput, setCashReceivedInput] = useState<string>('');
  
  // Split details (จ่ายทั้งสดและโอนในบิลเดียว)
  const [splitCashInput, setSplitCashInput] = useState<string>('');
  
  // Transfer / Notes details
  const [paymentReference, setPaymentReference] = useState<string>('');

  // 7. Modals & Notifications
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState<boolean>(false);
  const [quickAddInitialPhone, setQuickAddInitialPhone] = useState<string>('');
  const [isDailyBillsOpen, setIsDailyBillsOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [activeReceiptBill, setActiveReceiptBill] = useState<Bill | null>(null);

  // Cute success notification banner
  const [successToast, setSuccessToast] = useState<{
    show: boolean;
    billNumber: string;
    grandTotal: number;
    barberName: string;
    savedBill?: Bill;
  } | null>(null);

  // Parse numeric values
  const haircutFee = parseFloat(haircutFeeInput) || 0;
  const chemicalFee = parseFloat(chemicalFeeInput) || 0;
  const tipAmount = parseFloat(tipAmountInput) || 0;

  // Current selected barber object
  const currentBarber = activeBarbers.find(b => b.id === selectedBarberId) || activeBarbers[0];

  // Calculate Product Total
  const productsSubtotal = productLines.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Calculate Subtotal (Haircut + Chemical + Products)
  const servicesSubtotal = haircutFee + chemicalFee;
  const rawSubtotal = servicesSubtotal + productsSubtotal;

  // Member Tier Discount
  let tierDiscountAmount = 0;
  if (selectedMember && rawSubtotal > 0) {
    if (selectedMember.tier === 'PLATINUM') tierDiscountAmount = Math.round(rawSubtotal * 0.10);
    else if (selectedMember.tier === 'VIP_GOLD') tierDiscountAmount = Math.round(rawSubtotal * 0.05);
  }

  // Points Discount
  const pointsDiscountValue = (pointsRedeemed || 0) * (settings.pointDiscountValue || 1);
  const totalDiscounts = tierDiscountAmount + billDiscount + pointsDiscountValue;
  const taxableAmount = Math.max(0, rawSubtotal - totalDiscounts);
  const subtotalBeforeMemberDeduction = taxableAmount + tipAmount;

  // Member Balance Auto-Deduction Calculation
  const memberAvailableBalance = selectedMember?.balance || 0;
  const shouldDeductMemberBalance = Boolean(
    selectedMember && 
    memberAvailableBalance > 0 && 
    (isAutoDeductMemberBalance || paymentMethod === 'MEMBER')
  );
  const memberDeductedAmount = shouldDeductMemberBalance
    ? Math.min(memberAvailableBalance, subtotalBeforeMemberDeduction)
    : 0;

  // Grand Total to pay (after deducting member balance)
  const grandTotal = Math.max(0, subtotalBeforeMemberDeduction - memberDeductedAmount);

  // Cash Calculation
  const parsedCashReceived = parseFloat(cashReceivedInput) || 0;
  const effectiveCashReceived = cashReceivedInput === '' ? grandTotal : parsedCashReceived;
  const cashChange = paymentMethod === 'CASH' && grandTotal > 0 ? Math.max(0, effectiveCashReceived - grandTotal) : 0;
  const isCashInsufficient = paymentMethod === 'CASH' && grandTotal > 0 && cashReceivedInput !== '' && parsedCashReceived < grandTotal;

  // Split Calculation (สด + โอน)
  const parsedSplitCash = parseFloat(splitCashInput) || 0;
  const splitTransferAmount = Math.max(0, grandTotal - parsedSplitCash);

  // Add Product Line Handler
  const handleAddProductLine = (productId?: string) => {
    if (productOptions.length === 0) {
      alert('ยังไม่มีสินค้าในระบบ กรุณาเพิ่มสินค้าที่เมนูตั้งค่า');
      return;
    }
    const prodToUse = productId 
      ? productOptions.find(p => p.id === productId) 
      : productOptions[0];

    if (!prodToUse) return;

    // Check if product already exists in line items
    const existingIndex = productLines.findIndex(l => l.serviceId === prodToUse.id);
    if (existingIndex >= 0) {
      setProductLines(prev => prev.map((item, idx) => 
        idx === existingIndex ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setProductLines(prev => [
        ...prev,
        {
          id: `prod-line-${Date.now()}-${Math.random()}`,
          serviceId: prodToUse.id,
          name: prodToUse.name,
          price: prodToUse.price,
          quantity: 1,
          stock: prodToUse.stock,
        }
      ]);
    }
  };

  // Change Product in Line
  const handleChangeProductInLine = (lineId: string, newServiceId: string) => {
    const prod = productOptions.find(p => p.id === newServiceId);
    if (!prod) return;
    setProductLines(prev => prev.map(item => 
      item.id === lineId 
        ? { ...item, serviceId: prod.id, name: prod.name, price: prod.price, stock: prod.stock }
        : item
    ));
  };

  // Update Product Line Quantity
  const handleUpdateProductQuantity = (lineId: string, delta: number) => {
    setProductLines(prev => prev.map(item => {
      if (item.id === lineId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  // Remove Product Line
  const handleRemoveProductLine = (lineId: string) => {
    setProductLines(prev => prev.filter(item => item.id !== lineId));
  };

  // Quick Reset Form
  const handleResetForm = () => {
    setHaircutFeeInput('');
    setChemicalFeeInput('');
    setTipAmountInput('');
    setProductLines([]);
    setCustomerNameInput('');
    setSelectedMember(null);
    setPointsRedeemed(0);
    setBillDiscount(0);
    setIsAutoDeductMemberBalance(true);
    setPaymentReference('');
    setCashReceivedInput('');
    setSplitCashInput('');
    setIsRealTimeMode(true);
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setBillDateTime(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  // Quick Backdate Date Helpers
  const handleSetTodayRealtime = () => {
    setIsRealTimeMode(true);
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    setBillDateTime(new Date(now.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  const handleSetYesterday = () => {
    setIsRealTimeMode(false);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(14, 0, 0, 0);
    const tzOffset = yesterday.getTimezoneOffset() * 60000;
    setBillDateTime(new Date(yesterday.getTime() - tzOffset).toISOString().slice(0, 16));
  };

  // Save Bill Handler (NO POPUP MODAL per user request)
  const handleSaveBill = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (grandTotal <= 0 && rawSubtotal <= 0) {
      alert('กรุณากรอกราคาค่าตัดผม ค่าเคมี หรือเลือกสินค้าก่อนบันทึก');
      return;
    }
    if (paymentMethod === 'CASH' && isCashInsufficient) {
      alert('ยอดเงินสดที่รับมาน้อยกว่ายอดรวม กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    const barberToUse = currentBarber || activeBarbers[0];

    // Construct Cart Items
    const finalCartItems: CartItem[] = [];

    // 1. Haircut item if > 0
    if (haircutFee > 0) {
      finalCartItems.push({
        id: `item-hc-${Date.now()}`,
        serviceId: 'srv-haircut-custom',
        name: 'ค่าตัดผม',
        category: 'HAIRCUT',
        price: haircutFee,
        quantity: 1,
        discount: 0,
        barberId: barberToUse?.id || '',
        barberName: barberToUse?.nickname || 'ช่างประจำร้าน',
      });
    }

    // 2. Chemical item if > 0
    if (chemicalFee > 0) {
      finalCartItems.push({
        id: `item-chem-${Date.now()}`,
        serviceId: 'srv-chem-custom',
        name: 'ค่าบริการเคมี',
        category: 'CHEMICAL',
        price: chemicalFee,
        quantity: 1,
        discount: 0,
        barberId: barberToUse?.id || '',
        barberName: barberToUse?.nickname || 'ช่างประจำร้าน',
      });
    }

    // 3. Product items
    productLines.forEach((pLine) => {
      finalCartItems.push({
        id: `item-prod-${pLine.id}`,
        serviceId: pLine.serviceId,
        name: pLine.name,
        category: 'PRODUCT',
        price: pLine.price,
        quantity: pLine.quantity,
        discount: 0,
        barberId: barberToUse?.id || '',
        barberName: barberToUse?.nickname || 'ช่างประจำร้าน',
      });
    });

    // Timestamp
    let finalTimestamp = new Date().toISOString();
    if (!isRealTimeMode && billDateTime) {
      try {
        const parsedDate = new Date(billDateTime);
        if (!isNaN(parsedDate.getTime())) {
          finalTimestamp = parsedDate.toISOString();
        }
      } catch (err) {
        console.error('Date parse error, fallback to now', err);
      }
    }

    // Points calculation
    const pointsToEarn =
      settings.enablePoints && selectedMember && taxableAmount > 0
        ? Math.floor(taxableAmount / (settings.bahtPerPoint || 100))
        : 0;

    // Split cash and transfer values
    const finalSplitCash = paymentMethod === 'SPLIT' ? parsedSplitCash : undefined;
    const finalSplitTransfer = paymentMethod === 'SPLIT' ? splitTransferAmount : undefined;

    // Construct new Bill
    const finalCustomerName = selectedMember 
      ? `${selectedMember.name}${selectedMember.nickname ? ` (${selectedMember.nickname})` : ''}`
      : customerNameInput.trim() || undefined;

    const newBill: Bill = {
      id: `bill-${Date.now()}`,
      billNumber: generateBillNumber(),
      date: finalTimestamp,
      customerType: selectedMember ? 'MEMBER' : 'GUEST',
      memberId: selectedMember?.id,
      memberName: finalCustomerName,
      memberPhone: selectedMember?.phone,
      items: finalCartItems,
      subtotal: rawSubtotal,
      discountTotal: totalDiscounts,
      pointsDiscount: pointsDiscountValue,
      pointsRedeemed: pointsRedeemed > 0 ? pointsRedeemed : undefined,
      pointsEarned: pointsToEarn,
      tipAmount: tipAmount > 0 ? tipAmount : 0,
      tipBarberId: tipAmount > 0 ? barberToUse?.id : undefined,
      memberDeductedAmount: memberDeductedAmount > 0 ? memberDeductedAmount : undefined,
      memberBalanceBefore: selectedMember ? (selectedMember.balance || 0) : undefined,
      memberBalanceAfter: selectedMember ? Math.max(0, (selectedMember.balance || 0) - memberDeductedAmount) : undefined,
      grandTotal,
      paymentMethod,
      cashReceived: paymentMethod === 'CASH' ? grandTotal : undefined,
      cashChange: 0,
      splitCashAmount: finalSplitCash,
      splitTransferAmount: finalSplitTransfer,
      paymentReference: paymentReference.trim() || undefined,
      status: 'COMPLETED',
      createdBy: barberToUse?.nickname || 'ช่างประจำร้าน',
      notes: !isRealTimeMode ? `[บันทึกย้อนหลัง: ${formatThaiDate(finalTimestamp, true)}]` : undefined,
    };

    // Cute celebration confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#D4A373', '#CCD5AE', '#E9EDC9', '#FAEDCD', '#DDA15E'],
      });
    } catch {
      // ignore
    }

    // 1. Add Bill to App State
    onAddBill(newBill);

    // 2. Update Member stats & points & deduct balance if linked
    if (selectedMember) {
      const updatedMember: Member = {
        ...selectedMember,
        balance: Math.max(0, (selectedMember.balance || 0) - memberDeductedAmount),
        points: Math.max(0, (selectedMember.points || 0) - pointsRedeemed + pointsToEarn),
        totalSpent: (selectedMember.totalSpent || 0) + (rawSubtotal - totalDiscounts),
        visitCount: (selectedMember.visitCount || 0) + 1,
        updatedAt: new Date().toISOString(),
      };
      onSaveMember(updatedMember);
    }

    // 3. Deduct product inventory stock
    if (onUpdateServicesStock && productLines.length > 0) {
      productLines.forEach((pLine) => {
        onUpdateServicesStock(pLine.serviceId, -pLine.quantity);
      });
    }

    // 4. Update Cash Drawer if cash or split payment
    if (paymentMethod === 'CASH' || paymentMethod === 'SPLIT') {
      const cashPortion = paymentMethod === 'CASH' ? grandTotal : parsedSplitCash;
      if (cashPortion > 0) {
        const currentCashSales = cashDrawer.cashSales || 0;
        const updatedDrawer: CashDrawerSummary = {
          ...cashDrawer,
          cashSales: currentCashSales + cashPortion,
          expectedBalance: (cashDrawer.expectedBalance || 0) + cashPortion,
        };
        onUpdateCashDrawer(updatedDrawer);
      }
    }

    // 5. Show Cute Success Toast Banner (NO POPUP MODAL)
    setSuccessToast({
      show: true,
      billNumber: newBill.billNumber,
      grandTotal: newBill.grandTotal,
      barberName: barberToUse?.nickname || 'ช่างประจำร้าน',
      savedBill: newBill,
    });

    // Auto hide success toast after 6 seconds
    setTimeout(() => {
      setSuccessToast(prev => prev?.billNumber === newBill.billNumber ? null : prev);
    }, 6000);

    // 6. Reset Form immediately for next customer
    handleResetForm();
  };

  // Today bills stats
  const todayDateStr = getTodayDateString();
  const todayBills = bills.filter(b => b.date.startsWith(todayDateStr));
  const todayCompletedBills = todayBills.filter(b => b.status === 'COMPLETED');
  const todaySalesSum = todayCompletedBills.reduce((sum, b) => sum + b.grandTotal, 0);

  return (
    <div className="space-y-4 max-w-5xl mx-auto pb-12">
      {/* ======================================================== */}
      {/* CUTE SUCCESS TOAST BANNER (Shows when bill is saved)      */}
      {/* ======================================================== */}
      {successToast && (
        <div className="animate-pop-in bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300/80 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-3 text-emerald-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shadow-xs">
              ✓
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-emerald-900">
                  ✨ บันทึกบิลสำเร็จเรียบร้อย!
                </span>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-200/60 text-emerald-800">
                  #{successToast.billNumber}
                </span>
              </div>
              <p className="text-xs text-emerald-700 mt-0.5">
                ช่าง{successToast.barberName} • ยอดรวม <strong>{formatCurrency(successToast.grandTotal)}</strong> • พร้อมรับลูกค้าท่านต่อไป
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {successToast.savedBill && (
              <button
                type="button"
                onClick={() => {
                  setActiveReceiptBill(successToast.savedBill || null);
                  setIsReceiptModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-200 text-emerald-800 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>พิมพ์สลิปย้อนหลัง</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setSuccessToast(null)}
              className="p-1.5 rounded-lg hover:bg-emerald-200/50 text-emerald-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. TOP BAR & QUICK STATS                                 */}
      {/* ======================================================== */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-stone-200/80 rounded-2xl px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FAF6F0] border border-[#E8E2D5] flex items-center justify-center text-sm">
            💈
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-stone-800 tracking-tight flex items-center gap-2">
              <span>บันทึกบิลหน้าร้าน</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h1>
            <p className="text-[11px] text-stone-400">
              เลือกช่าง กรอกราคา และบันทึกบิลได้สะดวกรวดเร็ว
            </p>
          </div>
        </div>

        {/* Live Clock & History Shortcut */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-600">
            <Clock className="w-3.5 h-3.5 text-stone-400" />
            <span className="font-mono font-medium">
              {currentLiveTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>

          <div className="px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200/60 text-xs text-stone-600">
            <span>บิลวันนี้: </span>
            <strong className="text-stone-900 font-extrabold">{todayCompletedBills.length}</strong>
            <span className="text-stone-300 mx-1.5">|</span>
            <strong className="text-emerald-700 font-extrabold">{formatCurrency(todaySalesSum)}</strong>
          </div>

          <button
            type="button"
            onClick={() => setIsDailyBillsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 border border-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
          >
            <Receipt className="w-3.5 h-3.5 text-stone-500" />
            <span>ประวัติบิล</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MAIN POS FORM CONTAINER                                  */}
      {/* ======================================================== */}
      <form onSubmit={handleSaveBill} className="space-y-4">
        
        {/* SECTION 1: BARBER SELECTOR BUTTONS (ปุ่มเลือกช่าง) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <span>✂️</span>
              <span>1. เลือกช่างผู้ให้บริการ</span>
            </h2>
            <span className="text-xs text-stone-500">
              ช่างที่เลือก: <strong className="text-stone-800 font-extrabold">ช่าง{currentBarber?.nickname || '-'}</strong>
            </span>
          </div>

          {/* Barber Buttons Row - Clean & Minimal Korean Style */}
          {activeBarbers.length === 0 ? (
            <div className="p-4 bg-amber-50/60 border border-dashed border-amber-300/80 rounded-2xl text-center space-y-1">
              <p className="text-xs font-bold text-amber-900">💈 ยังไม่มีรายชื่อช่างในระบบ</p>
              <p className="text-[11px] text-stone-500">กรุณาไปที่เมนู <strong className="text-stone-700 font-semibold">"ตั้งค่าระบบ"</strong> เพื่อเพิ่มรายชื่อช่างประจำร้าน</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {activeBarbers.map((barber) => {
                const isSelected = selectedBarberId === barber.id;
                return (
                  <button
                    key={barber.id}
                    type="button"
                    onClick={() => setSelectedBarberId(barber.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all border cursor-pointer active:scale-95 text-center relative ${
                      isSelected
                        ? 'bg-[#FAF6F0] border-amber-500/80 shadow-xs ring-2 ring-amber-400/40'
                        : 'bg-stone-50/70 hover:bg-stone-100/90 border-stone-200 text-stone-700'
                    }`}
                  >
                    {/* Selected check badge */}
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] shadow-2xs">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}

                    {/* Avatar Icon */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm mb-1.5 overflow-hidden transition-transform ${
                        isSelected
                          ? 'bg-amber-100 text-amber-900 border border-amber-300 scale-105'
                          : 'bg-stone-200 text-stone-600 border border-stone-300/60'
                      }`}
                    >
                      {barber.avatar ? (
                        <img src={barber.avatar} alt={barber.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <span>{barber.nickname.slice(0, 2)}</span>
                      )}
                    </div>

                    <span className={`text-sm font-extrabold block truncate max-w-full tracking-tight ${isSelected ? 'text-stone-900' : 'text-stone-700'}`}>
                      ช่าง{barber.nickname}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* SECTION 2: CUSTOMER & MEMBER ATTACHMENT (กรอกชื่อลูกค้า & สมาชิก) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-stone-400" />
              <span>2. ข้อมูลลูกค้า & สมาชิก (Customer)</span>
            </h2>
            <span className="text-[11px] text-stone-400">
              {selectedMember ? 'ผูกบัญชีสมาชิกแล้ว' : 'ลูกค้าทั่วไป (Walk-in)'}
            </span>
          </div>

          {/* Customer Input & Member Search Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-8 lg:col-span-9 space-y-1">
              <label className="text-xs font-bold text-stone-700 block">
                ชื่อลูกค้า / ชื่อเล่น:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={selectedMember ? `${selectedMember.name}${selectedMember.nickname ? ` (${selectedMember.nickname})` : ''}` : customerNameInput}
                  onChange={(e) => {
                    if (!selectedMember) {
                      setCustomerNameInput(e.target.value);
                    }
                  }}
                  readOnly={!!selectedMember}
                  placeholder="กรุณากรอกชื่อลูกค้า"
                  className={`w-full border rounded-xl px-3.5 py-2 text-xs font-bold text-stone-900 focus:outline-none transition-all ${
                    selectedMember
                      ? 'bg-amber-50/80 border-amber-300 text-amber-950 cursor-default pr-24'
                      : 'bg-white border-stone-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 shadow-2xs'
                  }`}
                />
                {selectedMember && (
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black bg-stone-900 text-amber-300 px-2 py-0.5 rounded-md">
                    ⭐ {selectedMember.packageLevel || 'Silver'}
                  </span>
                )}
              </div>
            </div>

            <div className="sm:col-span-4 lg:col-span-3">
              {selectedMember ? (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMember(null);
                    setPointsRedeemed(0);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="ยกเลิกผูกสมาชิก"
                >
                  <span>✕ ยกเลิกผูกสมาชิก</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(true)}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs"
                  title="ค้นหาสมาชิก หรือค้นเบอร์โทร"
                >
                  <UserCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>ค้นหาสมาชิก</span>
                </button>
              )}
            </div>
          </div>

          {selectedMember ? (
            <div className="bg-gradient-to-r from-amber-50/90 via-stone-50 to-amber-50/50 border border-amber-300 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-stone-950 font-black text-sm flex items-center justify-center shadow-xs shrink-0">
                    {selectedMember.nickname?.slice(0, 2) || selectedMember.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-black text-stone-900">{selectedMember.name}</span>
                      {selectedMember.nickname && (
                        <span className="text-xs font-extrabold text-amber-900">({selectedMember.nickname})</span>
                      )}
                      <span className="text-[10px] font-black uppercase bg-stone-900 text-amber-300 px-2 py-0.5 rounded-full">
                        ⭐ {selectedMember.packageLevel || 'Silver'}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-600 flex items-center gap-3 mt-0.5">
                      <span>เบอร์: <strong className="text-stone-800 font-mono">{selectedMember.phone}</strong></span>
                      <span>•</span>
                      <span>แต้ม: <strong className="text-amber-800">{selectedMember.points || 0} pts</strong></span>
                    </div>
                  </div>
                </div>

                {/* Balance Display Pill */}
                <div className="bg-white px-3 py-1.5 rounded-xl border border-amber-300 text-right shadow-2xs">
                  <span className="text-[10px] text-stone-500 font-bold block">💰 ยอดเงินคงเหลือในบัญชี:</span>
                  <strong className="text-sm font-black text-emerald-700 font-mono">
                    {formatCurrency(memberAvailableBalance)}
                  </strong>
                </div>
              </div>

              {/* Automatic Balance Deduction Feature */}
              {memberAvailableBalance > 0 ? (
                <div className="bg-white/95 rounded-xl p-2.5 border border-amber-200/80 flex flex-wrap items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={isAutoDeductMemberBalance}
                      onChange={(e) => setIsAutoDeductMemberBalance(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-400 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-stone-800 flex items-center gap-1">
                      <span>หักยอดเงินคงเหลือสมาชิกอัตโนมัติ</span>
                      {isAutoDeductMemberBalance && (
                        <span className="text-emerald-700 font-black">
                          (-{formatCurrency(memberDeductedAmount)})
                        </span>
                      )}
                    </span>
                  </label>

                  {isAutoDeductMemberBalance && (
                    <span className="text-[11px] text-stone-500">
                      คงเหลือหลังบิลนี้: <strong className="text-stone-800 font-mono">{formatCurrency(Math.max(0, memberAvailableBalance - memberDeductedAmount))}</strong>
                    </span>
                  )}
                </div>
              ) : (
                <div className="text-[11px] text-amber-800 bg-amber-100/60 px-3 py-1.5 rounded-xl">
                  ℹ️ ลูกค้าท่านนี้ยังไม่มียอดเงินคงเหลือในแพ็กเกจ (สามารถเติมแพ็กเกจได้ที่เมนู "ระบบสมาชิก")
                </div>
              )}

              {tierDiscountAmount > 0 && (
                <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold inline-block">
                  🎁 ส่วนลดสมาชิกระดับ {selectedMember.tier === 'PLATINUM' ? '10%' : '5%'}: -{formatCurrency(tierDiscountAmount)}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-stone-50/60 px-3.5 py-2 rounded-xl border border-stone-200/50 flex items-center justify-between text-xs text-stone-400">
              <span>สถานะ: ลูกค้าทั่วไป (Walk-in)</span>
              <span className="text-[11px] text-stone-400">คลิกเพื่อค้นหาสมาชิกและหักยอดอัตโนมัติ</span>
            </div>
          )}
        </div>

        {/* SECTION 3: NUMERIC SERVICE FEES (ค่าตัดผม, ค่าเคมี, ค่าทิป) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
            <span>💰</span>
            <span>3. กรอกราคาค่าบริการ & ค่าทิป</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 3.1 ช่องกรอกราคาค่าตัดผม */}
            <div className="bg-stone-50/70 border border-stone-200/70 hover:border-amber-300 rounded-2xl p-3.5 space-y-1.5 transition">
              <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Scissors className="w-3.5 h-3.5 text-stone-500" />
                  <span>ค่าตัดผม</span>
                </span>
                <span className="text-[10px] text-stone-400">บาท (฿)</span>
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                  ฿
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={haircutFeeInput}
                  onChange={(e) => setHaircutFeeInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 rounded-xl pl-7 pr-3 py-2 text-base font-extrabold text-stone-800 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* 3.2 ช่องกรอกราคาค่าเคมี */}
            <div className="bg-stone-50/70 border border-stone-200/70 hover:border-cyan-300 rounded-2xl p-3.5 space-y-1.5 transition">
              <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FlaskConical className="w-3.5 h-3.5 text-cyan-600" />
                  <span>ค่าเคมี</span>
                </span>
                <span className="text-[10px] text-stone-400">บาท (฿)</span>
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                  ฿
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={chemicalFeeInput}
                  onChange={(e) => setChemicalFeeInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-stone-200 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 rounded-xl pl-7 pr-3 py-2 text-base font-extrabold text-stone-800 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* 3.3 ช่องกรอกราคาค่าทิป */}
            <div className="bg-stone-50/70 border border-stone-200/70 hover:border-pink-300 rounded-2xl p-3.5 space-y-1.5 transition">
              <label className="text-xs font-bold text-stone-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-pink-500" />
                  <span>ค่าทิปช่าง</span>
                </span>
                <span className="text-[10px] text-stone-400">บาท (฿)</span>
              </label>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                  ฿
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={tipAmountInput}
                  onChange={(e) => setTipAmountInput(e.target.value)}
                  placeholder="0"
                  className="w-full bg-white border border-stone-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100 rounded-xl pl-7 pr-3 py-2 text-base font-extrabold text-stone-800 focus:outline-none font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 4: PRODUCT DROPDOWN & QUANTITY (เลือกสินค้าหน้าร้าน) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5 text-stone-400" />
                <span>4. เลือกสินค้าหน้าร้าน (ดรอปดาวน์)</span>
              </h2>
              <p className="text-[11px] text-stone-400">
                เลือกสินค้าจากเมนูดรอปดาวน์ ระบุจำนวน และคำนวณราคารวมอัตโนมัติ
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleAddProductLine()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>+ เพิ่มรายการสินค้า</span>
            </button>
          </div>

          {/* Product Line Items */}
          {productLines.length === 0 ? (
            <div className="bg-stone-50/60 border border-dashed border-stone-200 rounded-xl p-5 text-center space-y-1.5">
              <ShoppingBag className="w-6 h-6 text-stone-300 mx-auto" />
              <p className="text-xs text-stone-500">ยังไม่มีสินค้าในบิลนี้</p>
              <p className="text-[11px] text-stone-400">
                หากลูกค้าซื้อแว็กซ์ โพเมด หรือแชมพู กดปุ่ม "+ เพิ่มรายการสินค้า" ด้านบนเพื่อเลือกสินค้า
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {productLines.map((line, index) => {
                const lineTotal = line.price * line.quantity;
                return (
                  <div
                    key={line.id}
                    className="bg-stone-50/80 border border-stone-200/80 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-amber-300 transition"
                  >
                    {/* Index & Wide Dropdown Selector */}
                    <div className="flex-1 w-full flex items-center gap-2">
                      <span className="w-5 h-5 rounded-lg bg-stone-200 text-stone-600 text-[11px] font-bold flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>

                      {/* Wide Dropdown Menu for Clear Product Selection */}
                      <div className="flex-1 relative">
                        <select
                          value={line.serviceId}
                          onChange={(e) => handleChangeProductInLine(line.id, e.target.value)}
                          className="w-full bg-white border border-stone-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 rounded-xl px-3 py-2 text-xs font-bold text-stone-800 focus:outline-none cursor-pointer appearance-none pr-8 shadow-2xs"
                        >
                          {productOptions.map((prod) => (
                            <option key={prod.id} value={prod.id}>
                              {prod.name} — ราคา ฿{prod.price.toLocaleString()} (คงเหลือ: {prod.stock ?? 0} ชิ้น)
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-4 h-4 text-stone-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    {/* Quantity Stepper & Price & Subtotal */}
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto border-t md:border-t-0 pt-2 md:pt-0 border-stone-200/50">
                      {/* Quantity stepper */}
                      <div className="flex items-center gap-1 bg-white border border-stone-200 rounded-xl p-1 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateProductQuantity(line.id, -1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center transition cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={line.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10) || 1;
                            setProductLines(prev => prev.map(item => 
                              item.id === line.id ? { ...item, quantity: Math.max(1, val) } : item
                            ));
                          }}
                          className="w-10 text-center bg-transparent text-xs font-bold text-stone-800 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateProductQuantity(line.id, 1)}
                          className="w-6 h-6 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold flex items-center justify-center transition cursor-pointer"
                        >
                          +
                        </button>
                        <span className="text-[10px] text-stone-400 pr-1">ชิ้น</span>
                      </div>

                      {/* Product line total */}
                      <div className="text-right min-w-[90px]">
                        <span className="text-[10px] text-stone-400 block">
                          @{formatCurrency(line.price)}
                        </span>
                        <strong className="text-xs font-bold text-stone-900 font-mono">
                          {formatCurrency(lineTotal)}
                        </strong>
                      </div>

                      {/* Delete button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveProductLine(line.id)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                        title="ลบรายการนี้"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Total Product Summary Row */}
              <div className="flex justify-between items-center bg-stone-50 px-3.5 py-2 rounded-xl border border-stone-200/60 text-xs">
                <span className="text-stone-500">
                  รวมสินค้า ({productLines.reduce((s, p) => s + p.quantity, 0)} ชิ้น):
                </span>
                <strong className="text-stone-900 font-extrabold">
                  {formatCurrency(productsSubtotal)}
                </strong>
              </div>
            </div>
          )}
        </div>

        {/* SECTION 5: DATE & TIME / REALTIME VS BACKDATING (วันที่และเวลาที่บันทึกบิล) */}
        <div className="bg-white border border-stone-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-stone-400" />
              <span>5. วันที่และเวลาที่บันทึกบิล (Date & Time)</span>
            </h2>

            {/* Mode switch: Live vs Custom */}
            <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200/60">
              <button
                type="button"
                onClick={handleSetTodayRealtime}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  isRealTimeMode
                    ? 'bg-white text-stone-800 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>⚡ เรียลไทม์ (เวลาจริง)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsRealTimeMode(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                  !isRealTimeMode
                    ? 'bg-white text-stone-800 shadow-2xs'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                <Calendar className="w-3 h-3 text-amber-600" />
                <span>📅 ลงย้อนหลัง</span>
              </button>
            </div>
          </div>

          {/* Date Picker row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-stone-50/70 p-3 rounded-xl border border-stone-200/60">
            <div className="sm:col-span-6 md:col-span-5">
              <input
                type="datetime-local"
                value={billDateTime}
                onChange={(e) => {
                  setBillDateTime(e.target.value);
                  setIsRealTimeMode(false);
                }}
                className={`w-full bg-white border rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-stone-800 focus:outline-none ${
                  isRealTimeMode ? 'border-emerald-300' : 'border-amber-300'
                }`}
              />
            </div>

            <div className="sm:col-span-6 md:col-span-7 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleSetTodayRealtime}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium transition cursor-pointer shadow-2xs"
              >
                ⚡ ตอนนี้
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 text-xs font-medium transition cursor-pointer shadow-2xs"
              >
                📅 เมื่อวานนี้
              </button>
              <span className="text-[11px] text-stone-400 italic ml-auto">
                {isRealTimeMode ? '🟢 บันทึกเวลาปัจจุบัน' : '🟡 บันทึกตามวันเวลาที่เลือก'}
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 6: PAYMENT METHOD, GRAND TOTAL & SUBMIT (วิธีชำระเงิน & ยอดเงินรวม & ปุ่มบันทึก) */}
        <div className="bg-white border-2 border-stone-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wide text-stone-800 flex items-center gap-1.5">
              <span>🧾</span>
              <span>6. วิธีชำระเงิน & สรุปราคารวม</span>
            </h2>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-stone-400 hover:text-stone-700 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>ล้างข้อมูล</span>
            </button>
          </div>

          {/* Breakdown calculation */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <span className="text-stone-400 block text-[11px]">ค่าตัดผม:</span>
              <strong className="text-stone-800 font-bold">{formatCurrency(haircutFee)}</strong>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <span className="text-stone-400 block text-[11px]">ค่าเคมี:</span>
              <strong className="text-stone-800 font-bold">{formatCurrency(chemicalFee)}</strong>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <span className="text-stone-400 block text-[11px]">ค่าสินค้า:</span>
              <strong className="text-stone-800 font-bold">{formatCurrency(productsSubtotal)}</strong>
            </div>
            <div className="bg-stone-50 p-2.5 rounded-xl border border-stone-200/60">
              <span className="text-stone-400 block text-[11px]">ค่าทิปช่าง:</span>
              <strong className="text-pink-600 font-bold">{formatCurrency(tipAmount)}</strong>
            </div>
          </div>

          {/* PAYMENT METHOD SELECTION (เงินสด / เงินโอน / สลับ / Member) */}
          <div className="space-y-2.5 pt-1">
            <label className="text-xs font-bold text-stone-600 block">
              เลือกวิธีชำระเงิน:
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Option 1: เงินโอน (TRANSFER) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-2 ring-blue-200 shadow-2xs'
                    : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <QrCode className="w-5 h-5 mb-1 text-blue-600" />
                <span className="text-xs font-bold">📱 เงินโอน</span>
              </button>

              {/* Option 2: เงินสด (CASH) */}
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === 'CASH'
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-200 shadow-2xs'
                    : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <Banknote className="w-5 h-5 mb-1 text-emerald-600" />
                <span className="text-xs font-bold">💵 เงินสด</span>
              </button>

              {/* Option 3: สลับ (SPLIT: สด + โอน ในบิลเดียว) */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('SPLIT');
                  if (!splitCashInput && grandTotal > 0) {
                    setSplitCashInput(String(Math.floor(grandTotal / 2)));
                  }
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === 'SPLIT'
                    ? 'bg-purple-50 border-purple-400 text-purple-950 font-bold ring-2 ring-purple-200 shadow-2xs'
                    : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <Split className="w-5 h-5 mb-1 text-purple-600" />
                <span className="text-xs font-bold">🔄 สลับ (สด+โอน)</span>
              </button>

              {/* Option 4: Member (สมาชิก) */}
              <button
                type="button"
                onClick={() => {
                  setPaymentMethod('MEMBER');
                  if (!selectedMember) setIsMemberModalOpen(true);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                  paymentMethod === 'MEMBER'
                    ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-2 ring-amber-200 shadow-2xs'
                    : 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 text-stone-700'
                }`}
              >
                <CreditCard className="w-5 h-5 mb-1 text-amber-600" />
                <span className="text-xs font-bold">🧸 Member</span>
              </button>
            </div>
          </div>

          {/* ======================================================== */}
          {/* PAYMENT METHOD DETAILS ACCORDING TO SELECTION            */}
          {/* ======================================================== */}

          {/* 1. TRANSFER PAYMENT DETAILS */}
          {paymentMethod === 'TRANSFER' && (
            <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ชำระโดยการโอนเงิน (สแกน PromptPay / สลิปโอนเงิน)</span>
                </span>
                <span className="text-xs font-black text-emerald-900 font-mono">
                  ยอดโอน: {formatCurrency(grandTotal)}
                </span>
              </div>

              <div>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="หมายเหตุ / สลิปโอน เช่น โอนรวม 2 คน, โอนจาก ธ.กสิกร (ไม่บังคับ)"
                  className="w-full bg-white border border-emerald-200 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-stone-800 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* 2. SPLIT PAYMENT DETAILS (สด + โอน ในบิลเดียว) */}
          {paymentMethod === 'SPLIT' && (
            <div className="bg-purple-50/60 border border-purple-200 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                  <Split className="w-3.5 h-3.5 text-purple-600" />
                  <span>จ่ายทั้งเงินสดและเงินโอน (สลับจ่ายในบิลเดียว)</span>
                </span>
                <span className="text-xs font-bold text-purple-900">
                  รวม: {formatCurrency(grandTotal)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Cash Portion */}
                <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">
                    💵 ส่วนที่ 1: จ่ายเป็นเงินสด (บาท)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-purple-600">
                      ฿
                    </span>
                    <input
                      type="number"
                      min="0"
                      max={grandTotal}
                      step="1"
                      value={splitCashInput}
                      onChange={(e) => setSplitCashInput(e.target.value)}
                      placeholder="0"
                      className="w-full bg-stone-50 border border-purple-200 focus:border-purple-500 rounded-lg pl-7 pr-3 py-1.5 text-sm font-bold text-stone-900 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                {/* Transfer Portion (Calculated Automatically) */}
                <div className="bg-white p-3 rounded-xl border border-purple-200 space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">
                    📱 ส่วนที่ 2: ส่วนที่เหลือโอนเงิน (บาท)
                  </label>
                  <div className="bg-stone-50 border border-purple-100 rounded-lg px-3 py-2 text-sm font-extrabold text-purple-900 font-mono flex items-center justify-between">
                    <span>{formatCurrency(splitTransferAmount)}</span>
                    <span className="text-[10px] text-purple-600 font-normal">คำนวณให้อัตโนมัติ</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. MEMBER PAYMENT DETAILS */}
          {paymentMethod === 'MEMBER' && (
            <div className="bg-amber-50/80 border border-amber-300 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>ชำระผ่านยอดเงินสมาชิก (Member Balance Wallet)</span>
                </span>
                {!selectedMember && (
                  <button
                    type="button"
                    onClick={() => setIsMemberModalOpen(true)}
                    className="text-xs font-bold text-amber-800 underline cursor-pointer"
                  >
                    คลิกเลือกสมาชิก
                  </button>
                )}
              </div>

              {selectedMember ? (
                <div className="bg-white p-3.5 rounded-xl border border-amber-200 text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">ชื่อสมาชิก:</span>
                    <strong className="text-stone-900">{selectedMember.name} {selectedMember.nickname ? `(${selectedMember.nickname})` : ''}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">ยอดคงเหลือก่อนหัก:</span>
                    <strong className="text-stone-800 font-mono">{formatCurrency(memberAvailableBalance)}</strong>
                  </div>
                  <div className="flex justify-between text-emerald-800 font-bold">
                    <span>หักยอดเงินในบิลนี้:</span>
                    <span className="font-mono">-{formatCurrency(memberDeductedAmount)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-stone-100 text-stone-900 font-black">
                    <span>ยอดคงเหลือสุทธิหลังบิลนี้:</span>
                    <span className="font-mono text-emerald-700">{formatCurrency(Math.max(0, memberAvailableBalance - memberDeductedAmount))}</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-800">
                  กรุณาเลือกสมาชิกเพื่อใช้สิทธิ์และหักยอดเงินคงเหลือสมาชิกอัตโนมัติ
                </p>
              )}
            </div>
          )}

          {/* Grand Total Display Box */}
          <div className="bg-gradient-to-br from-[#FAF8F5] via-stone-50 to-[#F7F4EE] border border-[#E6DFD3] rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
            <div>
              <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                ยอดสุทธิที่ต้องชำระ (NET TO PAY)
              </span>
              <div className="text-3xl sm:text-4xl font-black text-stone-900 font-mono tracking-tight mt-0.5 flex items-baseline gap-2">
                <span>{formatCurrency(grandTotal)}</span>
                {memberDeductedAmount > 0 && (
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-lg font-sans">
                    🧸 หักยอดสมาชิก -{formatCurrency(memberDeductedAmount)}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right space-y-1">
              {memberDeductedAmount > 0 && grandTotal === 0 && (
                <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 block shadow-2xs">
                  ✅ ชำระครบถ้วนด้วยยอดสมาชิก (0฿)
                </span>
              )}
              {totalDiscounts > 0 && (
                <div>
                  <span className="text-[11px] text-stone-500 mr-1.5">ส่วนลด:</span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    -{formatCurrency(totalDiscounts)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SAVE BILL BUTTON (NO POPUP MODAL - Instant Confirmation Toast) */}
          <div className="pt-2">
            <button
              id="pos-submit-bill-button"
              type="submit"
              disabled={grandTotal <= 0 && rawSubtotal <= 0}
              className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98 shadow-sm ${
                grandTotal > 0 || rawSubtotal > 0
                  ? 'brand-btn-primary hover:opacity-95 text-white hover:shadow-md'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
              style={
                grandTotal > 0 || rawSubtotal > 0
                  ? {
                      backgroundColor: 'var(--btn-primary-bg)',
                      color: 'var(--btn-primary-text)',
                      boxShadow: 'var(--btn-primary-shadow)',
                    }
                  : {}
              }
            >
              <Sparkles className="w-5 h-5" />
              <span>บันทึกบิลนี้ ({formatCurrency(grandTotal)})</span>
            </button>
          </div>
        </div>
      </form>

      {/* ======================================================== */}
      {/* MODALS & DRAWERS                                         */}
      {/* ======================================================== */}

      {/* Member Search Modal */}
      <MemberSearchModal
        isOpen={isMemberModalOpen}
        onClose={() => setIsMemberModalOpen(false)}
        members={members}
        onSelectMember={(member) => {
          setSelectedMember(member);
          setIsMemberModalOpen(false);
        }}
        onOpenQuickAdd={(phone) => {
          setQuickAddInitialPhone(phone);
          setIsQuickAddOpen(true);
        }}
      />

      {/* Quick Add Member Modal */}
      <QuickAddMemberModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSaveMember={(newMem) => {
          onSaveMember(newMem);
          setSelectedMember(newMem);
          setIsQuickAddOpen(false);
          setIsMemberModalOpen(false);
        }}
        initialPhone={quickAddInitialPhone}
      />

      {/* Daily Bills History Drawer */}
      <DailyBillsDrawer
        isOpen={isDailyBillsOpen}
        onClose={() => setIsDailyBillsOpen(false)}
        bills={bills}
        barbers={barbers}
        onVoidBill={onVoidBill}
        onUpdateBill={onUpdateBill}
        onDeleteBill={onDeleteBill}
        onUnmergeBill={onUnmergeBill}
        onSelectBillForReceipt={(bill) => {
          setActiveReceiptBill(bill);
          setIsReceiptModalOpen(true);
        }}
        settings={settings}
      />

      {/* Receipt Modal (Only opened when user explicitly clicks to view/print from History or Toast) */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptBill(null);
        }}
        bill={activeReceiptBill}
        settings={settings}
      />
    </div>
  );
};
