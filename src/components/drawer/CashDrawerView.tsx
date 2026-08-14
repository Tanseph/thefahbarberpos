import React, { useState } from 'react';
import { Bill, CashDrawerMovement, CashDrawerSummary, Expense, StoreSettings } from '../../types';
import { 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calculator, 
  Printer, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RotateCcw,
  Wallet,
  Receipt,
  Plus,
  Coins,
  FileText,
  DollarSign,
  TrendingDown,
  Sparkles,
  Calendar,
  X
} from 'lucide-react';
import { formatCurrency, formatThaiDate, getTodayDateString } from '../../utils/formatters';

interface CashDrawerViewProps {
  cashDrawer: CashDrawerSummary;
  onUpdateCashDrawer: (drawer: CashDrawerSummary) => void;
  bills: Bill[];
  expenses: Expense[];
  settings: StoreSettings;
  activeStaffName: string;
}

export const CashDrawerView: React.FC<CashDrawerViewProps> = ({
  cashDrawer,
  onUpdateCashDrawer,
  bills,
  expenses,
  settings,
  activeStaffName,
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'CASH_BILLS' | 'CASH_EXPENSES' | 'MOVEMENTS' | 'DENOM_CALCULATOR'>('OVERVIEW');
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [moveType, setMoveType] = useState<'IN' | 'OUT'>('IN');
  const [moveAmount, setMoveAmount] = useState<number>(0);
  const [moveReason, setMoveReason] = useState<string>('');

  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [newOpeningFloat, setNewOpeningFloat] = useState<number>(3000);
  const [countedCash, setCountedCash] = useState<number>(0);
  const [shiftNote, setShiftNote] = useState<string>('');

  // Physical Cash Counter State
  const [denoms, setDenoms] = useState<{ [denom: number]: number }>({
    1000: 0,
    500: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0,
  });

  const handleDenomChange = (denom: number, count: number) => {
    setDenoms((prev) => ({
      ...prev,
      [denom]: Math.max(0, count || 0),
    }));
  };

  const calculatedTotalDenom = Object.entries(denoms).reduce(
    (total, [d, c]) => total + Number(d) * Number(c),
    0
  );

  const applyDenomToCounted = () => {
    setCountedCash(calculatedTotalDenom);
    setIsCloseShiftModalOpen(true);
  };

  // Real-time cash flow from today's bills and expenses
  const today = getTodayDateString();
  const todayCashBills = bills.filter(
    (b) => b.status === 'COMPLETED' && (b.paymentMethod === 'CASH' || (b.paymentMethod === 'SPLIT' && (b.splitCashAmount || 0) > 0)) && b.date.startsWith(today)
  );
  
  const realCashSales = todayCashBills.reduce((s, b) => {
    if (b.paymentMethod === 'CASH') return s + b.grandTotal;
    if (b.paymentMethod === 'SPLIT') return s + (b.splitCashAmount || 0);
    return s;
  }, 0);

  const todayCashExpenses = expenses.filter(
    (e) => e.paymentMethod === 'CASH' && e.date.startsWith(today)
  );
  const realCashExpenses = todayCashExpenses.reduce((s, e) => s + e.amount, 0);

  const movements = cashDrawer.movements || [];
  const totalCashIn = movements
    .filter((m) => m.type === 'IN')
    .reduce((s, m) => s + m.amount, 0);

  const totalCashOut = movements
    .filter((m) => m.type === 'OUT')
    .reduce((s, m) => s + m.amount, 0);

  const openingFloat = cashDrawer.openingFloat !== undefined ? cashDrawer.openingFloat : 3000;
  const currentExpectedCash = openingFloat + realCashSales + totalCashIn - realCashExpenses - totalCashOut;

  // Handle Add Cash Movement (In/Out)
  const handleSaveMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (moveAmount <= 0 || !moveReason.trim()) return;

    const newMovement: CashDrawerMovement = {
      id: `mov-${Date.now()}`,
      type: moveType,
      amount: moveAmount,
      reason: moveReason.trim(),
      timestamp: new Date().toISOString(),
      performedBy: activeStaffName,
    };

    const updated: CashDrawerSummary = {
      ...cashDrawer,
      cashSales: realCashSales,
      cashExpenses: realCashExpenses,
      cashInTotal: totalCashIn + (moveType === 'IN' ? moveAmount : 0),
      cashOutTotal: totalCashOut + (moveType === 'OUT' ? moveAmount : 0),
      expectedBalance: currentExpectedCash + (moveType === 'IN' ? moveAmount : -moveAmount),
      movements: [...movements, newMovement],
    };

    onUpdateCashDrawer(updated);
    setIsMoveModalOpen(false);
    setMoveAmount(0);
    setMoveReason('');
  };

  // Handle Close Shift
  const handleConfirmCloseShift = () => {
    const diff = countedCash - currentExpectedCash;
    const updated: CashDrawerSummary = {
      ...cashDrawer,
      cashSales: realCashSales,
      cashExpenses: realCashExpenses,
      cashInTotal: totalCashIn,
      cashOutTotal: totalCashOut,
      expectedBalance: currentExpectedCash,
      actualCounted: countedCash,
      difference: diff,
      status: 'CLOSED',
      closingNotes: shiftNote,
      closedAt: new Date().toISOString(),
      closedBy: activeStaffName,
    };

    onUpdateCashDrawer(updated);
    setIsCloseShiftModalOpen(false);
  };

  // Handle Reopen / New Shift
  const handleConfirmOpenShift = () => {
    const updated: CashDrawerSummary = {
      date: getTodayDateString(),
      openingFloat: newOpeningFloat,
      cashSales: 0,
      cashInTotal: 0,
      cashOutTotal: 0,
      cashExpenses: 0,
      expectedBalance: newOpeningFloat,
      status: 'OPEN',
      openedAt: new Date().toISOString(),
      openedBy: activeStaffName,
      movements: [],
    };
    onUpdateCashDrawer(updated);
    setIsOpenShiftModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Header */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 font-black flex items-center justify-center text-xl shadow-xs shrink-0">
            💵
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                ระบบจัดการเงินในเก๊ะ & ปิดกะ (CASH DRAWER & SHIFT)
              </h2>
              {cashDrawer.status === 'CLOSED' ? (
                <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> กะปิดแล้ว
                </span>
              ) : (
                <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> กะเปิดอยู่ (Live)
                </span>
              )}
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              ตรวจนับเงินสด ตรวจสอบรายการบิลขายเงินสด รายจ่ายเงินสด และรายงานปิดกะประจำวัน ({formatThaiDate(today)})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => {
              setMoveType('IN');
              setIsMoveModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold transition cursor-pointer active:scale-95"
          >
            <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
            <span>+ เอาเงินเข้า</span>
          </button>

          <button
            onClick={() => {
              setMoveType('OUT');
              setIsMoveModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-900 text-xs font-bold transition cursor-pointer active:scale-95"
          >
            <ArrowUpRight className="w-4 h-4 text-rose-700" />
            <span>- เบิกเงินออก</span>
          </button>

          {cashDrawer.status === 'CLOSED' ? (
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs transition cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
              <span>เปิดกะใหม่ / เปิดลิ้นชัก</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setCountedCash(currentExpectedCash);
                setIsCloseShiftModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black shadow-xs transition cursor-pointer active:scale-95"
            >
              <Lock className="w-4 h-4 text-amber-400" />
              <span>นับเงินปิดกะ (Z-Report)</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/90 border border-stone-200 rounded-2xl p-1.5 shadow-2xs">
        {[
          { id: 'OVERVIEW', label: '📊 สรุปยอดเงินในเก๊ะ', icon: Wallet },
          { id: 'CASH_BILLS', label: `💵 บิลขายเงินสดวันนี้ (${todayCashBills.length} บิล)`, icon: Receipt },
          { id: 'CASH_EXPENSES', label: `🧾 รายจ่ายเงินสดวันนี้ (${todayCashExpenses.length} รายการ)`, icon: TrendingDown },
          { id: 'MOVEMENTS', label: `🔄 บันทึกเงินเข้า/ออก (${movements.length})`, icon: Clock },
          { id: 'DENOM_CALCULATOR', label: '🧮 เครื่องมือนับเหรียญ & ธนบัตร', icon: Calculator },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                isActive
                  ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80 font-black'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-600' : 'text-stone-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* 6 Key Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {/* 1. Opening Float */}
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] text-stone-500 font-medium block">เงินทอนตั้งต้น (Float)</span>
              <span className="text-lg sm:text-xl font-black text-stone-800 font-mono mt-0.5 block">
                {formatCurrency(openingFloat)}
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">ยอดเปิดกะ</span>
            </div>

            {/* 2. Cash Sales (+) */}
            <div className="bg-emerald-50/50 border border-emerald-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] text-emerald-800 font-medium block">ยอดขายเงินสด (+)</span>
              <span className="text-lg sm:text-xl font-black text-emerald-700 font-mono mt-0.5 block">
                +{formatCurrency(realCashSales)}
              </span>
              <span className="text-[10px] text-emerald-600 mt-1 block">{todayCashBills.length} บิล</span>
            </div>

            {/* 3. Cash In (+) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] text-stone-500 font-medium block">เงินเข้าพิเศษ (+)</span>
              <span className="text-lg sm:text-xl font-black text-cyan-700 font-mono mt-0.5 block">
                +{formatCurrency(totalCashIn)}
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">เติมเงินทอน/อื่นๆ</span>
            </div>

            {/* 4. Cash Expenses (-) */}
            <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] text-rose-800 font-medium block">รายจ่ายเงินสด (-)</span>
              <span className="text-lg sm:text-xl font-black text-rose-600 font-mono mt-0.5 block">
                -{formatCurrency(realCashExpenses)}
              </span>
              <span className="text-[10px] text-rose-600 mt-1 block">{todayCashExpenses.length} รายการ</span>
            </div>

            {/* 5. Cash Out (-) */}
            <div className="bg-white border border-stone-200 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] text-stone-500 font-medium block">เบิกออกพิเศษ (-)</span>
              <span className="text-lg sm:text-xl font-black text-rose-600 font-mono mt-0.5 block">
                -{formatCurrency(totalCashOut)}
              </span>
              <span className="text-[10px] text-stone-400 mt-1 block">นำส่งเข้าบัญชี/อื่นๆ</span>
            </div>

            {/* 6. Expected Cash Balance */}
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-xs">
              <span className="text-[11px] text-amber-950 font-bold block">เงินสดที่ควรมีในเก๊ะ</span>
              <span className="text-xl sm:text-2xl font-black text-amber-900 font-mono mt-0.5 block">
                {formatCurrency(currentExpectedCash)}
              </span>
              <span className="text-[10px] text-amber-800 font-semibold mt-1 block">Expected in Drawer</span>
            </div>
          </div>

          {/* Detailed Calculations & Quick Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Col: Formula Breakdown */}
            <div className="lg:col-span-7 bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5 border-b border-stone-100 pb-3">
                <Calculator className="w-4 h-4 text-amber-600" /> การคำนวณเงินสดในเก๊ะตามหลักการบัญชี
              </h3>

              <div className="space-y-2.5 text-xs font-sans">
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-stone-50 border border-stone-200/60">
                  <span className="text-stone-600">1. เงินทอนตั้งต้น (Opening Float):</span>
                  <strong className="font-mono text-stone-900">{formatCurrency(openingFloat)}</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200/60">
                  <span className="text-emerald-900">2. บวก ยอดขายเงินสดวันนี้ ({todayCashBills.length} บิล):</span>
                  <strong className="font-mono text-emerald-700">+{formatCurrency(realCashSales)}</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-cyan-50/60 border border-cyan-200/60">
                  <span className="text-cyan-900">3. บวก นำเงินสดเข้าเพิ่ม (Cash In):</span>
                  <strong className="font-mono text-cyan-700">+{formatCurrency(totalCashIn)}</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/60">
                  <span className="text-rose-900">4. หัก รายจ่ายเงินสดย่อย ({todayCashExpenses.length} รายการ):</span>
                  <strong className="font-mono text-rose-700">-{formatCurrency(realCashExpenses)}</strong>
                </div>
                <div className="flex justify-between items-center p-2.5 rounded-xl bg-rose-50/60 border border-rose-200/60">
                  <span className="text-rose-900">5. หัก เบิกเงินสดออก/นำส่ง (Cash Out):</span>
                  <strong className="font-mono text-rose-700">-{formatCurrency(totalCashOut)}</strong>
                </div>
                <div className="flex justify-between items-center p-3.5 rounded-2xl bg-amber-100/70 border border-amber-300 text-sm">
                  <span className="font-extrabold text-amber-950">รวมเงินสดที่ต้องมีในลิ้นชัก ณ ขณะนี้:</span>
                  <strong className="font-black text-amber-950 font-mono text-base">{formatCurrency(currentExpectedCash)}</strong>
                </div>
              </div>
            </div>

            {/* Right Col: Shift Status / Z-Report Preview */}
            <div className="lg:col-span-5 bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-1.5 border-b border-stone-100 pb-3">
                  <FileText className="w-4 h-4 text-amber-600" /> สถานะกะปัจจุบัน (Shift Summary)
                </h3>

                <div className="space-y-3 mt-3 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>วันที่บันทึก:</span>
                    <strong className="text-stone-900">{formatThaiDate(today)}</strong>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>ผู้รับผิดชอบกะ:</span>
                    <strong className="text-stone-900">{activeStaffName}</strong>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>สถานะลิ้นชัก:</span>
                    <strong className={cashDrawer.status === 'OPEN' ? 'text-emerald-700' : 'text-rose-700'}>
                      {cashDrawer.status === 'OPEN' ? '🟢 เปิดให้บริการปกติ' : '🔴 ปิดกะแล้ว'}
                    </strong>
                  </div>

                  {cashDrawer.status === 'CLOSED' && (
                    <div className="mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-stone-500">เงินที่นับได้จริง:</span>
                        <strong className="font-mono text-stone-900">{formatCurrency(cashDrawer.actualCounted || 0)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">ผลต่าง (Diff):</span>
                        <strong className={`font-mono ${(cashDrawer.difference || 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                          {(cashDrawer.difference || 0) > 0 ? '+' : ''}{formatCurrency(cashDrawer.difference || 0)}
                        </strong>
                      </div>
                      {cashDrawer.closingNotes && (
                        <div className="pt-2 text-[11px] text-stone-500 border-t border-stone-200">
                          หมายเหตุ: {cashDrawer.closingNotes}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => setActiveTab('DENOM_CALCULATOR')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs shadow-xs transition cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  <span>เปิดเครื่องมือนับธนบัตรและเหรียญ</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs border border-stone-200 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>พิมพ์รายงานเก๊ะเงินสด</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: CASH BILLS (รายการบิลเงินสดวันนี้) */}
      {activeTab === 'CASH_BILLS' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-600" />
                รายการบิลที่รับชำระเป็นเงินสดวันนี้ ({formatThaiDate(today)})
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                รวมทั้งหมด {todayCashBills.length} บิล | ยอดเงินสดรวม: <strong className="text-emerald-700 font-mono">{formatCurrency(realCashSales)}</strong>
              </p>
            </div>
          </div>

          {todayCashBills.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Receipt className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-semibold">ยังไม่มีบิลที่ชำระเป็นเงินสดในวันนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3">เลขที่บิล</th>
                    <th className="p-3">เวลา</th>
                    <th className="p-3">ลูกค้า</th>
                    <th className="p-3">ช่างผู้ดูแล</th>
                    <th className="p-3">รายการบริการ/สินค้า</th>
                    <th className="p-3 text-right">ยอดชำระเงินสด</th>
                    <th className="p-3 text-right">รับมา</th>
                    <th className="p-3 text-right">เงินทอน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {todayCashBills.map((b) => {
                    const cashAmount = b.paymentMethod === 'CASH' ? b.grandTotal : (b.splitCashAmount || 0);
                    return (
                      <tr key={b.id} className="hover:bg-amber-50/30 transition">
                        <td className="p-3 font-mono font-bold text-amber-900">{b.billNumber}</td>
                        <td className="p-3 text-stone-500 font-mono">{b.date.slice(11, 16)} น.</td>
                        <td className="p-3 font-semibold text-stone-800">{b.memberName || 'ลูกค้าทั่วไป'}</td>
                        <td className="p-3 text-stone-700">
                          {b.createdBy || 'ช่างประจำ'}
                        </td>
                        <td className="p-3 text-stone-600 max-w-xs truncate">
                          {b.items.map((it) => it.name).join(', ')}
                        </td>
                        <td className="p-3 text-right font-black text-emerald-700 font-mono">
                          {formatCurrency(cashAmount)}
                        </td>
                        <td className="p-3 text-right text-stone-600 font-mono">
                          {b.cashReceived ? formatCurrency(b.cashReceived) : '-'}
                        </td>
                        <td className="p-3 text-right text-stone-600 font-mono">
                          {b.cashChange ? formatCurrency(b.cashChange) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-stone-50 font-bold border-t border-stone-200">
                  <tr>
                    <td colSpan={5} className="p-3 text-stone-700">รวมยอดเงินสดเข้าเก๊ะจากบิลขาย</td>
                    <td className="p-3 text-right font-black text-emerald-700 font-mono text-sm">
                      {formatCurrency(realCashSales)}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: CASH EXPENSES (รายการเบิกจ่ายเงินสดวันนี้) */}
      {activeTab === 'CASH_EXPENSES' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-600" />
                รายการเบิกจ่ายเงินสดย่อยออกจากเก๊ะวันนี้ ({formatThaiDate(today)})
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                รวมทั้งหมด {todayCashExpenses.length} รายการ | ยอดเงินสดย่อยจ่ายออก: <strong className="text-rose-600 font-mono">{formatCurrency(realCashExpenses)}</strong>
              </p>
            </div>
          </div>

          {todayCashExpenses.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <TrendingDown className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-semibold">ไม่มีรายการเบิกจ่ายเงินสดในวันนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3">เวลา/วันที่</th>
                    <th className="p-3">รายการค่าใช้จ่าย</th>
                    <th className="p-3">หมวดหมู่</th>
                    <th className="p-3">ผู้เบิก/ผู้รับเงิน</th>
                    <th className="p-3">หมายเหตุ/ใบเสร็จ</th>
                    <th className="p-3 text-right">จำนวนเงินจ่ายออก</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {todayCashExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-rose-50/30 transition">
                      <td className="p-3 font-mono text-stone-500">
                        {exp.date} {exp.createdAt ? exp.createdAt.slice(11, 16) : ''}
                      </td>
                      <td className="p-3 font-bold text-stone-900">{exp.title}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-medium text-[10px]">
                          {exp.category}
                        </span>
                      </td>
                      <td className="p-3 text-stone-700">{exp.payer || exp.paidTo || '-'}</td>
                      <td className="p-3 text-stone-500 truncate max-w-xs">{exp.receiptNote || exp.note || '-'}</td>
                      <td className="p-3 text-right font-black text-rose-600 font-mono">
                        -{formatCurrency(exp.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-50 font-bold border-t border-stone-200">
                  <tr>
                    <td colSpan={5} className="p-3 text-stone-700">รวมยอดเงินสดย่อยจ่ายออกจากเก๊ะ</td>
                    <td className="p-3 text-right font-black text-rose-600 font-mono text-sm">
                      -{formatCurrency(realCashExpenses)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: MOVEMENTS (เงินเข้า/ออกพิเศษ) */}
      {activeTab === 'MOVEMENTS' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                ประวัติการเอาเงินเข้า / เบิกเงินออกพิเศษ (Drawer Movements)
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                บันทึกการเติมเงินทอน, นำส่งเงินสด, หรือเคลื่อนย้ายเงินสดพิเศษ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setMoveType('IN');
                  setIsMoveModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
              >
                + บันทึกเงินเข้า
              </button>
              <button
                onClick={() => {
                  setMoveType('OUT');
                  setIsMoveModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer"
              >
                - บันทึกเบิกออก
              </button>
            </div>
          </div>

          {movements.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Clock className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="text-xs font-semibold">ยังไม่มีรายการเงินเข้า/ออกพิเศษในวันนี้</p>
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200 rounded-2xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200">
                  <tr>
                    <th className="p-3">เวลา</th>
                    <th className="p-3">ประเภท</th>
                    <th className="p-3">เหตุผล / คำอธิบาย</th>
                    <th className="p-3">ผู้ทำรายการ</th>
                    <th className="p-3 text-right">จำนวนเงิน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {movements.map((mov) => (
                    <tr key={mov.id} className="hover:bg-amber-50/30 transition">
                      <td className="p-3 font-mono text-stone-500">{mov.timestamp.slice(11, 16)} น.</td>
                      <td className="p-3 font-bold">
                        {mov.type === 'IN' ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black">
                            📥 เอาเงินเข้า (+ In)
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-black">
                            📤 เบิกเงินออก (- Out)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-stone-800 font-medium">{mov.reason}</td>
                      <td className="p-3 text-stone-600">{mov.performedBy}</td>
                      <td className={`p-3 text-right font-black font-mono ${mov.type === 'IN' ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {mov.type === 'IN' ? '+' : '-'}{formatCurrency(mov.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: DENOMINATION CALCULATOR (เครื่องมือนับธนบัตรและเหรียญ) */}
      {activeTab === 'DENOM_CALCULATOR' && (
        <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
            <div>
              <h3 className="text-xs sm:text-sm font-black text-stone-900 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-amber-600" />
                เครื่องมือช่วยนับธนบัตรและเหรียญในเก๊ะ (Cash Denominations Counter)
              </h3>
              <p className="text-[11px] text-stone-500 mt-0.5">
                กรอกจำนวนใบ/เหรียญ ระบบจะรวมยอดเงินสดให้อัตโนมัติ เพื่อนำไปเปรียบเทียบกับยอดที่ระบบคำนวณ
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setDenoms({
                    1000: 0,
                    500: 0,
                    100: 0,
                    50: 0,
                    20: 0,
                    10: 0,
                    5: 0,
                    2: 0,
                    1: 0,
                  })
                }
                className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
              >
                ล้างค่านับใหม่ (Reset)
              </button>

              <button
                onClick={applyDenomToCounted}
                className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-stone-950 font-black text-xs shadow-xs transition cursor-pointer"
              >
                ใช้นับเงินปิดกะ ➡️
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Inputs Grid */}
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { denom: 1000, label: 'ธนบัตร 1,000 บาท', color: 'bg-stone-100 text-stone-900 border-stone-300' },
                { denom: 500, label: 'ธนบัตร 500 บาท', color: 'bg-purple-50 text-purple-900 border-purple-200' },
                { denom: 100, label: 'ธนบัตร 100 บาท', color: 'bg-rose-50 text-rose-900 border-rose-200' },
                { denom: 50, label: 'ธนบัตร 50 บาท', color: 'bg-blue-50 text-blue-900 border-blue-200' },
                { denom: 20, label: 'ธนบัตร 20 บาท', color: 'bg-emerald-50 text-emerald-900 border-emerald-200' },
                { denom: 10, label: 'เหรียญ 10 บาท', color: 'bg-amber-50 text-amber-900 border-amber-200' },
                { denom: 5, label: 'เหรียญ 5 บาท', color: 'bg-stone-100 text-stone-900 border-stone-200' },
                { denom: 2, label: 'เหรียญ 2 บาท', color: 'bg-stone-100 text-stone-900 border-stone-200' },
                { denom: 1, label: 'เหรียญ 1 บาท', color: 'bg-stone-100 text-stone-900 border-stone-200' },
              ].map(({ denom, label, color }) => {
                const count = denoms[denom] || 0;
                const subtotal = denom * count;
                return (
                  <div
                    key={denom}
                    className={`p-3 rounded-2xl border ${color} flex items-center justify-between gap-2`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{label}</span>
                      <span className="text-[11px] font-mono opacity-70">
                        {count > 0 ? `= ${formatCurrency(subtotal)}` : '0 บาท'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={count === 0 ? '' : count}
                        placeholder="0"
                        onChange={(e) => handleDenomChange(denom, parseInt(e.target.value, 10) || 0)}
                        className="w-20 bg-white border border-stone-300 rounded-xl px-2.5 py-1.5 text-right font-mono font-bold text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <span className="text-xs font-medium text-stone-500">{denom >= 20 ? 'ใบ' : 'เหรียญ'}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Summary Card */}
            <div className="lg:col-span-4 bg-amber-50/70 border border-amber-300/80 rounded-3xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-950 mb-3 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-600" /> ยอดนับสดรวม (Live Counted)
                </h4>

                <div className="p-4 bg-white rounded-2xl border border-amber-200 text-center space-y-1">
                  <span className="text-xs font-bold text-stone-500">ยอดเงินสดที่นับได้ทั้งหมด:</span>
                  <div className="text-3xl font-black text-amber-950 font-mono">
                    {formatCurrency(calculatedTotalDenom)}
                  </div>
                </div>

                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-600">
                    <span>ยอดที่ระบบคาดหมาย:</span>
                    <strong className="font-mono text-stone-900">{formatCurrency(currentExpectedCash)}</strong>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>ผลต่าง (นับได้ - ระบบ):</span>
                    <strong
                      className={`font-mono text-sm font-black ${
                        calculatedTotalDenom - currentExpectedCash === 0
                          ? 'text-emerald-700'
                          : calculatedTotalDenom - currentExpectedCash > 0
                          ? 'text-cyan-700'
                          : 'text-rose-600'
                      }`}
                    >
                      {calculatedTotalDenom - currentExpectedCash > 0 ? '+' : ''}
                      {formatCurrency(calculatedTotalDenom - currentExpectedCash)}
                    </strong>
                  </div>
                </div>
              </div>

              <button
                onClick={applyDenomToCounted}
                className="w-full py-3 rounded-2xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-black text-xs shadow-md transition cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>นำยอดนี้ไปปิดกะ (Z-Report)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: เอาเงินเข้า / เบิกเงินออก (Movement Modal) */}
      {isMoveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                {moveType === 'IN' ? (
                  <>
                    <ArrowDownLeft className="w-5 h-5 text-emerald-600" />
                    <span>บันทึกนำเงินสดเข้าเก๊ะ (+ Cash In)</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-rose-600" />
                    <span>บันทึกเบิกเงินสดออกจากเก๊ะ (- Cash Out)</span>
                  </>
                )}
              </h3>
              <button
                onClick={() => setIsMoveModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMovement} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  จำนวนเงิน (บาท) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  autoFocus
                  value={moveAmount === 0 ? '' : moveAmount}
                  onChange={(e) => setMoveAmount(Number(e.target.value))}
                  placeholder="เช่น 1000"
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-base font-bold font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  เหตุผล / วัตถุประสงค์ *
                </label>
                <input
                  type="text"
                  required
                  value={moveReason}
                  onChange={(e) => setMoveReason(e.target.value)}
                  placeholder={moveType === 'IN' ? 'เช่น เติมเงินทอนช่วงเช้า' : 'เช่น นำส่งยอดขายเงินสดเข้าบัญชี'}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsMoveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-xs font-black text-white shadow-xs transition cursor-pointer ${
                    moveType === 'IN' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  ยืนยันบันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: นับเงินปิดกะ (Close Shift Modal) */}
      {isCloseShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <span>ยืนยันนับเงินปิดกะ (End-of-Day Z-Report)</span>
              </h3>
              <button
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>เงินสดที่ระบบคาดหมาย:</span>
                  <strong className="font-mono text-stone-900 text-sm">{formatCurrency(currentExpectedCash)}</strong>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ยอดเงินสดที่นับได้จริงในเก๊ะ (บาท) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={countedCash}
                  onChange={(e) => setCountedCash(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-lg font-black font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="p-3 rounded-xl border flex justify-between items-center text-xs font-bold bg-amber-50 border-amber-200">
                <span>ผลต่างเงินสด (Difference):</span>
                <span
                  className={`font-mono text-sm font-black ${
                    countedCash - currentExpectedCash === 0
                      ? 'text-emerald-700'
                      : countedCash - currentExpectedCash > 0
                      ? 'text-cyan-700'
                      : 'text-rose-600'
                  }`}
                >
                  {countedCash - currentExpectedCash > 0 ? '+' : ''}
                  {formatCurrency(countedCash - currentExpectedCash)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  หมายเหตุปิดกะ (ถ้ามี)
                </label>
                <textarea
                  value={shiftNote}
                  onChange={(e) => setShiftNote(e.target.value)}
                  placeholder="เช่น เงินครบถูกต้อง ส่งมอบกะให้ผู้จัดการเรียบร้อย"
                  rows={2}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsCloseShiftModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmCloseShift}
                className="px-5 py-2 rounded-xl text-xs font-black bg-stone-900 hover:bg-stone-800 text-amber-300 shadow-md transition cursor-pointer"
              >
                ยืนยันปิดกะ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: เปิดกะใหม่ (Open Shift Modal) */}
      {isOpenShiftModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-amber-600" />
                <span>เปิดกะใหม่ / ลิ้นชักเงินสด</span>
              </h3>
              <button
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  เงินทอนตั้งต้น (Opening Float) (บาท) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={newOpeningFloat}
                  onChange={(e) => setNewOpeningFloat(Number(e.target.value))}
                  className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-lg font-black font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setIsOpenShiftModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleConfirmOpenShift}
                className="px-5 py-2 rounded-xl text-xs font-black bg-amber-600 hover:bg-amber-700 text-white shadow-md transition cursor-pointer"
              >
                ยืนยันเปิดกะ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
