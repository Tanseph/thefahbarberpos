import React, { useState } from 'react';
import { Expense, ExpenseCategory, PaymentMethod, StoreSettings } from '../../types';
import { 
  DollarSign, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  TrendingDown, 
  Wallet,
  Receipt,
  FileText,
  Calendar,
  X,
  CreditCard,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatThaiDate, getTodayDateString, getCurrentPeriodString } from '../../utils/formatters';

interface ExpensesViewProps {
  expenses: Expense[];
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  settings: StoreSettings;
}

const CATEGORY_MAP: Record<ExpenseCategory, { label: string; emoji: string; color: string }> = {
  SUPPLIES: { label: 'น้ำยา/ใบมีด/อุปกรณ์', emoji: '🧴', color: 'bg-cyan-50 text-cyan-800 border-cyan-200' },
  CHEMICALS_EQUIPMENT: { label: 'เคมีภัณฑ์และอุปกรณ์', emoji: '🧪', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  RENT: { label: 'ค่าเช่าร้าน', emoji: '🏢', color: 'bg-rose-50 text-rose-800 border-rose-200' },
  UTILITIES: { label: 'ค่าน้ำ/ค่าไฟ/เน็ต', emoji: '⚡', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  BARBER_ADVANCE: { label: 'เบิกเงินล่วงหน้าช่าง', emoji: '💵', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  SALARY_DRAW: { label: 'เบิกเงินล่วงหน้า/ค่าแรง', emoji: '💼', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  FOOD_WELFARE: { label: 'อาหารและสวัสดิการ', emoji: '🍱', color: 'bg-orange-50 text-orange-800 border-orange-200' },
  MARKETING: { label: 'การตลาด/โฆษณา', emoji: '📢', color: 'bg-pink-50 text-pink-800 border-pink-200' },
  SNACK_DRINK: { label: 'น้ำ/ขนมรับรองลูกค้า', emoji: '☕', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  MAINTENANCE: { label: 'ซ่อมแซม/บำรุงรักษา', emoji: '🔧', color: 'bg-blue-50 text-blue-800 border-blue-200' },
  OTHER: { label: 'ค่าใช้จ่ายเบ็ดเตล็ด', emoji: '📦', color: 'bg-stone-100 text-stone-700 border-stone-200' },
};

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  onSaveExpense,
  onDeleteExpense,
  settings,
}) => {
  const today = getTodayDateString();
  const currentMonth = getCurrentPeriodString();

  // Yesterday date string
  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const yesterday = getYesterdayDateString();

  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'CUSTOM_DATE' | 'MONTH'>('MONTH');
  const [selectedCustomDate, setSelectedCustomDate] = useState<string>(today);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Partial<Expense>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Quick date change helpers
  const handleShiftDate = (days: number) => {
    const current = new Date(selectedCustomDate);
    current.setDate(current.getDate() + days);
    const year = current.getFullYear();
    const month = String(current.getMonth() + 1).padStart(2, '0');
    const day = String(current.getDate()).padStart(2, '0');
    const newDateStr = `${year}-${month}-${day}`;
    setSelectedCustomDate(newDateStr);
    setDateFilter('CUSTOM_DATE');
  };

  // Filter
  const filteredExpenses = expenses.filter((exp) => {
    // Date filter
    if (dateFilter === 'TODAY' && !exp.date.startsWith(today)) return false;
    if (dateFilter === 'YESTERDAY' && !exp.date.startsWith(yesterday)) return false;
    if (dateFilter === 'CUSTOM_DATE' && !exp.date.startsWith(selectedCustomDate)) return false;
    if (dateFilter === 'MONTH' && !exp.date.startsWith(currentMonth)) return false;

    // Category filter
    if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) return false;

    // Search query
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      exp.title.toLowerCase().includes(q) ||
      (exp.paidTo && exp.paidTo.toLowerCase().includes(q)) ||
      (exp.note && exp.note.toLowerCase().includes(q))
    );
  });

  const totalExpenseSum = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const cashExpenseSum = filteredExpenses
    .filter((e) => e.paymentMethod === 'CASH')
    .reduce((s, e) => s + e.amount, 0);
  const transferExpenseSum = filteredExpenses
    .filter((e) => e.paymentMethod !== 'CASH')
    .reduce((s, e) => s + e.amount, 0);

  const handleOpenAdd = () => {
    setEditingExpense({
      title: '',
      category: 'SUPPLIES',
      amount: 0,
      paymentMethod: 'CASH',
      date: getTodayDateString(),
      note: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (exp: Expense) => {
    setEditingExpense({ ...exp });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense.title || !editingExpense.amount) return;

    const saved: Expense = {
      id: editingExpense.id || `exp-${Date.now()}`,
      title: editingExpense.title.trim(),
      category: editingExpense.category || 'OTHER',
      amount: Number(editingExpense.amount) || 0,
      paymentMethod: editingExpense.paymentMethod || 'CASH',
      date: editingExpense.date || getTodayDateString(),
      paidTo: editingExpense.paidTo?.trim() || undefined,
      note: editingExpense.note?.trim() || undefined,
      recordedBy: 'ผู้จัดการร้าน',
      createdAt: editingExpense.createdAt || new Date().toISOString(),
    };

    onSaveExpense(saved);
    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (deletingId) {
      onDeleteExpense(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 border border-rose-200/80 font-black flex items-center justify-center text-xl shadow-xs shrink-0">
            💸
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                บันทึกค่าใช้จ่ายร้าน & เงินสดย่อย (EXPENSES & PETTY CASH)
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              ควบคุมต้นทุน ค่าน้ำยา ค่าเช่า ค่าน้ำค่าไฟ เบิกเงินล่วงหน้าช่าง และเงินสดย่อย
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black shadow-xs transition cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4 text-amber-400 stroke-[3]" />
          <span>+ บันทึกรายจ่ายใหม่</span>
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* 1. Total Expenses */}
        <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 block font-medium">รวมค่าใช้จ่ายที่แสดง</span>
            <span className="text-2xl font-black text-rose-600 font-mono mt-1 block">
              {formatCurrency(totalExpenseSum)}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block">{filteredExpenses.length} รายการ</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* 2. Cash Expenses (Petty Cash) */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-amber-900 block font-bold">จ่ายจากเงินสดในเก๊ะ</span>
            <span className="text-2xl font-black text-amber-950 font-mono mt-1 block">
              {formatCurrency(cashExpenseSum)}
            </span>
            <span className="text-[11px] text-amber-800 font-medium mt-0.5 block">กระทบยอดเงินในเก๊ะ</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* 3. Bank Transfer Expenses */}
        <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-500 block font-medium">จ่ายโอนผ่านบัญชีธนาคาร</span>
            <span className="text-2xl font-black text-cyan-700 font-mono mt-1 block">
              {formatCurrency(transferExpenseSum)}
            </span>
            <span className="text-[11px] text-stone-400 mt-0.5 block">บัญชีร้านค้า</span>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-cyan-50 border border-cyan-200 flex items-center justify-center text-cyan-700">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อรายการ, ผู้รับเงิน, หมายเหตุ..."
              className="w-full bg-stone-50 border border-stone-200 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:outline-none"
            />
          </div>

          {/* Time Scope Toggle */}
          <div className="flex flex-wrap items-center gap-1.5 bg-stone-100 p-1 rounded-xl border border-stone-200">
            <button
              onClick={() => setDateFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                dateFilter === 'TODAY'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              วันนี้
            </button>
            <button
              onClick={() => setDateFilter('YESTERDAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                dateFilter === 'YESTERDAY'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              เมื่อวาน
            </button>
            <button
              onClick={() => setDateFilter('CUSTOM_DATE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                dateFilter === 'CUSTOM_DATE'
                  ? 'bg-amber-500 text-stone-950 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              📅 เลือกดูวันที่...
            </button>
            <button
              onClick={() => setDateFilter('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                dateFilter === 'MONTH'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              เดือนนี้
            </button>
            <button
              onClick={() => setDateFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                dateFilter === 'ALL'
                  ? 'bg-white text-stone-900 shadow-2xs font-black'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              ทั้งหมด
            </button>
          </div>
        </div>

        {/* Date Selector Bar when Custom Date is selected or active */}
        {dateFilter === 'CUSTOM_DATE' && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-amber-50/70 border border-amber-300/80 rounded-2xl p-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="text-sm">🗓️</span>
              <span className="text-xs font-bold text-amber-950">เลือกวันที่ต้องการดูรายจ่าย:</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 shadow-2xs transition cursor-pointer"
                title="วันก่อนหน้า"
              >
                ◀ วันก่อนหน้า
              </button>

              <input
                type="date"
                value={selectedCustomDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedCustomDate(e.target.value);
                    setDateFilter('CUSTOM_DATE');
                  }
                }}
                className="bg-white border-2 border-amber-400 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs font-black text-stone-900 shadow-2xs focus:outline-none"
              />

              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="px-2.5 py-1.5 bg-white hover:bg-stone-100 border border-stone-200 rounded-xl text-xs font-bold text-stone-700 shadow-2xs transition cursor-pointer"
                title="วันถัดไป"
              >
                วันถัดไป ▶
              </button>
            </div>

            <div className="text-xs text-amber-900 font-extrabold">
              กำลังดูรายจ่ายของวันที่: {formatThaiDate(selectedCustomDate)}
            </div>
          </div>
        )}

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-full">
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap border transition cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-stone-900 text-amber-300 border-stone-900'
                : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
            }`}
          >
            ทั้งหมด ({expenses.length})
          </button>

          {(Object.keys(CATEGORY_MAP) as ExpenseCategory[]).map((cat) => {
            const info = CATEGORY_MAP[cat];
            const count = expenses.filter((e) => e.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap border transition cursor-pointer flex items-center gap-1 ${
                  selectedCategory === cat
                    ? 'bg-amber-600 text-white border-amber-600 font-bold'
                    : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <span>{info.emoji}</span>
                <span>{info.label}</span>
                {count > 0 && <span className="text-[10px] opacity-75">({count})</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Expense Table List */}
      <div className="bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-800">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">วันที่</th>
                <th className="p-3.5">หมวดหมู่</th>
                <th className="p-3.5">รายการค่าใช้จ่าย</th>
                <th className="p-3.5">หมายเหตุ</th>
                <th className="p-3.5">ชำระด้วย</th>
                <th className="p-3.5 text-right">จำนวนเงิน</th>
                <th className="p-3.5 pr-5 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-stone-400">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-50 text-amber-600" />
                    <p className="text-xs font-semibold">ไม่พบรายการค่าใช้จ่ายตามเงื่อนไขที่เลือก</p>
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const catInfo = CATEGORY_MAP[exp.category] || CATEGORY_MAP.OTHER;
                  return (
                    <tr key={exp.id} className="hover:bg-amber-50/30 transition">
                      <td className="p-3.5 pl-5 font-mono text-stone-600 whitespace-nowrap">
                        {formatThaiDate(exp.date)}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${catInfo.color}`}>
                          <span>{catInfo.emoji}</span>
                          <span>{catInfo.label}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-stone-900">{exp.title}</td>
                      <td className="p-3.5 text-stone-600">
                        {exp.note ? (
                          <span className="text-stone-700 font-medium block">{exp.note}</span>
                        ) : exp.paidTo ? (
                          <span className="text-stone-500 block">{exp.paidTo}</span>
                        ) : (
                          <span className="text-stone-300">-</span>
                        )}
                      </td>
                      <td className="p-3.5 text-stone-600 whitespace-nowrap">
                        {exp.paymentMethod === 'CASH' && '💵 เงินสด (ในเก๊ะ)'}
                        {exp.paymentMethod === 'TRANSFER' && '🏦 โอนเงิน'}
                        {exp.paymentMethod === 'PROMPTPAY' && '📱 พร้อมเพย์'}
                        {exp.paymentMethod === 'CREDIT_CARD' && '💳 บัตรเครดิต'}
                      </td>
                      <td className="p-3.5 text-right font-black text-rose-600 font-mono text-sm whitespace-nowrap">
                        -{formatCurrency(exp.amount)}
                      </td>
                      <td className="p-3.5 pr-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(exp)}
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 transition cursor-pointer"
                            title="แก้ไข"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(exp.id)}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 transition cursor-pointer"
                            title="ลบ"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative text-stone-900 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-black text-stone-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-rose-600" />
                <span>{editingExpense.id ? 'แก้ไขบันทึกค่าใช้จ่าย' : 'บันทึกค่าใช้จ่ายใหม่'}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-full cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  ชื่อรายการ / ค่าอะไร <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingExpense.title || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, title: e.target.value })}
                  placeholder="เช่น ซื้อน้ำยาฟอกสีผม, ค่าไฟประจำเดือน..."
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">หมวดหมู่</label>
                  <select
                    value={editingExpense.category || 'SUPPLIES'}
                    onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as ExpenseCategory })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none cursor-pointer"
                  >
                    {(Object.keys(CATEGORY_MAP) as ExpenseCategory[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_MAP[cat].emoji} {CATEGORY_MAP[cat].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    จำนวนเงิน (บาท) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={editingExpense.amount || ''}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="0.00"
                    className="w-full bg-stone-50 border border-stone-300 focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-rose-600 font-bold font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">วันที่ทำรายการ</label>
                  <input
                    type="date"
                    required
                    value={editingExpense.date || getTodayDateString()}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs text-stone-900 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">ช่องทางจ่ายเงิน</label>
                  <select
                    value={editingExpense.paymentMethod || 'CASH'}
                    onChange={(e) => setEditingExpense({ ...editingExpense, paymentMethod: e.target.value as PaymentMethod })}
                    className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none cursor-pointer"
                  >
                    <option value="CASH">💵 เงินสด (เงินสดในเก๊ะ)</option>
                    <option value="TRANSFER">🏦 โอนเงินผ่านบัญชีร้าน</option>
                    <option value="PROMPTPAY">📱 พร้อมเพย์</option>
                    <option value="CREDIT_CARD">💳 บัตรเครดิต</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  value={editingExpense.note || ''}
                  onChange={(e) => setEditingExpense({ ...editingExpense, note: e.target.value })}
                  placeholder="เช่น มีใบเสร็จแนบ, สั่งซื้อรอบต้นเดือน..."
                  className="w-full bg-stone-50 border border-stone-300 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 text-xs font-black shadow-md cursor-pointer"
                >
                  บันทึกรายจ่าย
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">ยืนยันการลบรายการรายจ่าย?</h3>
              <p className="text-xs text-stone-500 mt-1">
                การลบรายการนี้จะไม่สามารถกู้คืนได้ คุณแน่ใจหรือไม่?
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
