import React, { useState } from 'react';
import { Barber, Bill, Expense, ServiceItem, StoreSettings } from '../../types';
import { 
  Users, 
  Calendar, 
  Wallet, 
  Download, 
  Printer, 
  Sparkles, 
  Scissors, 
  FlaskConical, 
  ShoppingBag, 
  HeartHandshake, 
  FileSpreadsheet, 
  FileText,
  CreditCard,
  Building2,
  TrendingUp,
  Receipt,
  Sun,
  Eye,
  ArrowRight,
  Filter,
  CheckCircle2,
  PieChart,
  BarChart3,
  Search,
  Edit,
  Trash2,
  Split,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { formatCurrency, formatNumber, formatThaiDate, formatThaiMonthYear, getCurrentPeriodString, getTodayDateString } from '../../utils/formatters';
import { ReceiptModal } from '../pos/ReceiptModal';
import { EditBillModal } from '../pos/EditBillModal';
import { DeleteBillModal } from '../pos/DeleteBillModal';
import { AccountantPDFModal } from './AccountantPDFModal';
import { PaymentMethod } from '../../types';

interface ReportsViewProps {
  bills: Bill[];
  expenses: Expense[];
  barbers: Barber[];
  services: ServiceItem[];
  settings: StoreSettings;
  onUpdateBill?: (bill: Bill) => void;
  onDeleteBill?: (billId: string) => void;
  onVoidBill?: (billId: string, reason: string) => void;
}

type MainReportTab = 'DAILY' | 'MONTHLY' | 'ALL_IN_ONE';

export const ReportsView: React.FC<ReportsViewProps> = ({
  bills,
  expenses,
  barbers,
  services,
  settings,
  onUpdateBill,
  onDeleteBill,
  onVoidBill,
}) => {
  const todayStr = getTodayDateString();
  const currentMonthStr = getCurrentPeriodString();

  // Top-level Navigation Mode: DAILY vs MONTHLY vs ALL_IN_ONE
  const [activeTab, setActiveTab] = useState<MainReportTab>('DAILY');

  // Selected filters
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  const [tableFilter, setTableFilter] = useState<'ALL_DAYS' | 'ACTIVE_DAYS'>('ALL_DAYS');
  const [billSearchQuery, setBillSearchQuery] = useState<string>('');
  const [selectedBillForReceipt, setSelectedBillForReceipt] = useState<Bill | null>(null);

  // Modals for Bill Edit & Delete
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [deletingBill, setDeletingBill] = useState<Bill | null>(null);

  // Accountant PDF Report Modal State
  const [showAccountantPDFModal, setShowAccountantPDFModal] = useState<boolean>(false);
  const [accountantPDFReportType, setAccountantPDFReportType] = useState<'DAILY' | 'MONTHLY'>('DAILY');

  const handleOpenPDFReport = (type: 'DAILY' | 'MONTHLY') => {
    setAccountantPDFReportType(type);
    setShowAccountantPDFModal(true);
  };

  // Quick switch payment method handler
  const handleQuickTogglePaymentMethod = (bill: Bill) => {
    if (!onUpdateBill) return;
    let nextMethod: PaymentMethod = 'CASH';
    if (bill.paymentMethod === 'CASH') {
      nextMethod = 'TRANSFER';
    } else if (bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY') {
      nextMethod = 'SPLIT';
    } else {
      nextMethod = 'CASH';
    }

    const half = Math.round(bill.grandTotal / 2);
    const updated: Bill = {
      ...bill,
      paymentMethod: nextMethod,
      splitCashAmount: nextMethod === 'SPLIT' ? half : undefined,
      splitTransferAmount: nextMethod === 'SPLIT' ? (bill.grandTotal - half) : undefined,
      cashReceived: nextMethod === 'CASH' ? bill.grandTotal : bill.cashReceived,
    };
    onUpdateBill(updated);
  };

  // --- Helper Date Shifts ---
  const handleSetDayOffset = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    setSelectedDate(dateStr);
    setSelectedMonth(`${y}-${m}`);
  };

  const handleSetMonthOffset = (offsetMonths: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - offsetMonths);
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    setSelectedMonth(`${y}-${m}`);
  };

  const handleStepMonth = (direction: -1 | 1) => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 1 + direction, 1);
    const nextY = d.getFullYear();
    const nextM = (d.getMonth() + 1).toString().padStart(2, '0');
    setSelectedMonth(`${nextY}-${nextM}`);
  };

  // --- 1. DAILY CALCULATIONS (for selectedDate) ---
  const dailyBills = bills.filter(
    (b) => b.status === 'COMPLETED' && b.date.startsWith(selectedDate)
  );
  const dailyExpenses = expenses.filter((e) => e.date.startsWith(selectedDate));

  let dailyCash = 0;
  let dailyTransfer = 0;
  let dailyHeads = 0;
  let dailyHaircutSales = 0;
  let dailyChemicalSales = 0;
  let dailyProductSales = 0;
  let dailyTips = 0;

  dailyBills.forEach((b) => {
    // Payment breakdown
    if (b.paymentMethod === 'CASH') {
      dailyCash += b.grandTotal;
    } else if (b.paymentMethod === 'TRANSFER' || b.paymentMethod === 'PROMPTPAY' || b.paymentMethod === 'CREDIT') {
      dailyTransfer += b.grandTotal;
    } else if (b.paymentMethod === 'SPLIT') {
      dailyCash += b.splitCashAmount || 0;
      dailyTransfer += b.splitTransferAmount || 0;
    } else if (b.paymentMethod === 'MEMBER') {
      dailyTransfer += b.grandTotal;
    }

    // Tips
    dailyTips += b.tipAmount || 0;

    // Items
    let hasHaircut = false;
    b.items.forEach((item) => {
      const itemTotal = item.isPackageRedemption ? 0 : item.price * item.quantity;
      if (item.category === 'HAIRCUT') {
        dailyHaircutSales += itemTotal;
        dailyHeads += item.quantity;
        hasHaircut = true;
      } else if (item.category === 'CHEMICAL') {
        dailyChemicalSales += itemTotal;
      } else if (item.category === 'PRODUCT') {
        dailyProductSales += itemTotal;
      }
    });

    if (!hasHaircut && b.items.length > 0) {
      dailyHeads += 1;
    }
  });

  const dailyTotal = dailyCash + dailyTransfer;
  const dailyExpenseTotal = dailyExpenses.reduce((s, e) => s + e.amount, 0);
  const dailyNetProfit = dailyTotal - dailyExpenseTotal;

  // --- 2. MONTHLY CALCULATIONS (for selectedMonth) ---
  const monthlyBills = bills.filter(
    (b) => b.status === 'COMPLETED' && b.date.startsWith(selectedMonth)
  );
  const monthlyExpenses = expenses.filter((e) => e.date.startsWith(selectedMonth));

  let monthlyCash = 0;
  let monthlyTransfer = 0;
  let monthlyHeads = 0;
  let monthlyHaircutSales = 0;
  let monthlyChemicalSales = 0;
  let monthlyProductSales = 0;
  let monthlyTips = 0;

  monthlyBills.forEach((b) => {
    if (b.paymentMethod === 'CASH') {
      monthlyCash += b.grandTotal;
    } else if (b.paymentMethod === 'TRANSFER' || b.paymentMethod === 'PROMPTPAY' || b.paymentMethod === 'CREDIT') {
      monthlyTransfer += b.grandTotal;
    } else if (b.paymentMethod === 'SPLIT') {
      monthlyCash += b.splitCashAmount || 0;
      monthlyTransfer += b.splitTransferAmount || 0;
    } else if (b.paymentMethod === 'MEMBER') {
      monthlyTransfer += b.grandTotal;
    }

    monthlyTips += b.tipAmount || 0;

    let hasHaircut = false;
    b.items.forEach((item) => {
      const itemTotal = item.isPackageRedemption ? 0 : item.price * item.quantity;
      if (item.category === 'HAIRCUT') {
        monthlyHaircutSales += itemTotal;
        monthlyHeads += item.quantity;
        hasHaircut = true;
      } else if (item.category === 'CHEMICAL') {
        monthlyChemicalSales += itemTotal;
      } else if (item.category === 'PRODUCT') {
        monthlyProductSales += itemTotal;
      }
    });

    if (!hasHaircut && b.items.length > 0) {
      monthlyHeads += 1;
    }
  });

  const monthlyTotal = monthlyCash + monthlyTransfer;
  const monthlyExpenseTotal = monthlyExpenses.reduce((s, e) => s + e.amount, 0);
  const monthlyNetProfit = monthlyTotal - monthlyExpenseTotal;

  // --- 3. BARBER CALCULATOR HELPER ---
  const calculateBarberStats = (targetBills: Bill[]) => {
    const stats = barbers.map((barber) => {
      let haircutSales = 0;
      let haircutCount = 0;
      let chemicalSales = 0;
      let chemicalCount = 0;
      let productSales = 0;
      let productCount = 0;
      let tipTotal = 0;

      targetBills.forEach((b) => {
        b.items.forEach((item) => {
          if (item.barberId === barber.id) {
            const itemTotal = item.isPackageRedemption ? 0 : item.price * item.quantity;
            if (item.category === 'HAIRCUT') {
              haircutSales += itemTotal;
              haircutCount += item.quantity;
            } else if (item.category === 'CHEMICAL') {
              chemicalSales += itemTotal;
              chemicalCount += item.quantity;
            } else if (item.category === 'PRODUCT') {
              productSales += itemTotal;
              productCount += item.quantity;
            } else {
              haircutSales += itemTotal;
              haircutCount += item.quantity;
            }
          }
        });

        if (b.tipBarberId === barber.id) {
          tipTotal += b.tipAmount || 0;
        }
      });

      const totalSalesWithoutTip = haircutSales + chemicalSales + productSales;
      const totalGenerated = totalSalesWithoutTip + tipTotal;
      const totalHeads = haircutCount;

      return {
        barber,
        haircutSales,
        haircutCount,
        chemicalSales,
        chemicalCount,
        productSales,
        productCount,
        tipTotal,
        totalSalesWithoutTip,
        totalGenerated,
        totalHeads,
      };
    });

    const totalHaircut = stats.reduce((s, b) => s + b.haircutSales, 0);
    const totalHaircutCount = stats.reduce((s, b) => s + b.haircutCount, 0);
    const totalChemical = stats.reduce((s, b) => s + b.chemicalSales, 0);
    const totalChemicalCount = stats.reduce((s, b) => s + b.chemicalCount, 0);
    const totalProduct = stats.reduce((s, b) => s + b.productSales, 0);
    const totalProductCount = stats.reduce((s, b) => s + b.productCount, 0);
    const totalTips = stats.reduce((s, b) => s + b.tipTotal, 0);
    const grandTotalGenerated = stats.reduce((s, b) => s + b.totalGenerated, 0);

    return {
      stats,
      totalHaircut,
      totalHaircutCount,
      totalChemical,
      totalChemicalCount,
      totalProduct,
      totalProductCount,
      totalTips,
      grandTotalGenerated,
    };
  };

  const dailyBarberData = calculateBarberStats(dailyBills);
  const monthlyBarberData = calculateBarberStats(monthlyBills);

  // --- 4. MONTHLY DAILY LEDGER TABLE (Day 1 to End of Month) ---
  const [yearNum, monthNum] = selectedMonth.split('-').map((v) => parseInt(v, 10));
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  interface DailyLedgerRow {
    dayNum: number;
    dateStr: string;
    dayName: string;
    isWeekend: boolean;
    isToday: boolean;
    heads: number;
    cash: number;
    transfer: number;
    total: number;
    expenses: number;
    net: number;
    billsCount: number;
  }

  const thaiDayNamesShort = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  const monthlyLedger: DailyLedgerRow[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dayStr = d.toString().padStart(2, '0');
    const fullDateStr = `${selectedMonth}-${dayStr}`;
    const dateObj = new Date(yearNum, monthNum - 1, d);
    const dayOfWeek = dateObj.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isToday = fullDateStr === todayStr;

    const dayBills = monthlyBills.filter((b) => b.date.startsWith(fullDateStr));
    const dayExpenses = monthlyExpenses.filter((e) => e.date.startsWith(fullDateStr));

    let dayCash = 0;
    let dayTransfer = 0;
    let dayHeads = 0;

    dayBills.forEach((b) => {
      if (b.paymentMethod === 'CASH') {
        dayCash += b.grandTotal;
      } else if (b.paymentMethod === 'TRANSFER' || b.paymentMethod === 'PROMPTPAY' || b.paymentMethod === 'CREDIT') {
        dayTransfer += b.grandTotal;
      } else if (b.paymentMethod === 'SPLIT') {
        dayCash += b.splitCashAmount || 0;
        dayTransfer += b.splitTransferAmount || 0;
      } else if (b.paymentMethod === 'MEMBER') {
        dayTransfer += b.grandTotal;
      }

      const haircutItemCount = b.items.filter((i) => i.category === 'HAIRCUT').reduce((s, i) => s + i.quantity, 0);
      dayHeads += haircutItemCount > 0 ? haircutItemCount : 1;
    });

    const dayTotal = dayCash + dayTransfer;
    const dayExpenseTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);
    const dayNet = dayTotal - dayExpenseTotal;

    monthlyLedger.push({
      dayNum: d,
      dateStr: fullDateStr,
      dayName: thaiDayNamesShort[dayOfWeek],
      isWeekend,
      isToday,
      heads: dayHeads,
      cash: dayCash,
      transfer: dayTransfer,
      total: dayTotal,
      expenses: dayExpenseTotal,
      net: dayNet,
      billsCount: dayBills.length,
    });
  }

  const displayedLedger = tableFilter === 'ACTIVE_DAYS' 
    ? monthlyLedger.filter((row) => row.billsCount > 0 || row.expenses > 0)
    : monthlyLedger;

  // Filtered daily bills
  const filteredDailyBills = dailyBills.filter((b) => {
    if (!billSearchQuery) return true;
    const q = billSearchQuery.toLowerCase();
    return (
      b.billNumber.toLowerCase().includes(q) ||
      (b.memberName && b.memberName.toLowerCase().includes(q)) ||
      (b.createdBy && b.createdBy.toLowerCase().includes(q)) ||
      b.items.some((i) => i.name.toLowerCase().includes(q) || i.barberName.toLowerCase().includes(q))
    );
  });

  // --- 5. EXPORT CSV FUNCTIONS ---
  const handleExportCSV = (mode: 'DAILY' | 'MONTHLY') => {
    let csv = '\uFEFF';

    if (mode === 'DAILY') {
      csv += `รายงานสรุปบัญชีรายวัน,${settings.storeName}\n`;
      csv += `ประจำวันที่,${formatThaiDate(selectedDate, true)}\n`;
      csv += `วันที่ออกรายงาน,${formatThaiDate(todayStr, true)}\n\n`;

      csv += `สรุปยอดรวมประจำวัน\n`;
      csv += `จำนวนหัวลูกค้า,${dailyHeads},คน\n`;
      csv += `ยอดเงินสด,${dailyCash},บาท\n`;
      csv += `ยอดเงินโอน,${dailyTransfer},บาท\n`;
      csv += `รวมยอดขายประจำวัน,${dailyTotal},บาท\n`;
      csv += `ค่าใช้จ่ายประจำวัน,${dailyExpenseTotal},บาท\n`;
      csv += `กำไรสุทธิประจำวัน,${dailyNetProfit},บาท\n`;
      csv += `จำนวนบิล,${dailyBills.length},บิล\n\n`;

      csv += `ตารางแยกรายได้ช่างประจำวัน (${formatThaiDate(selectedDate)})\n`;
      csv += `ช่าง,จำนวนหัว (คน),ค่าตัดผม (บาท),ค่าเคมี (บาท),ค่าสินค้า (บาท),ค่าทิป (บาท),รวมรายได้สร้างให้ร้าน (บาท)\n`;
      dailyBarberData.stats.forEach((st) => {
        csv += `${st.barber.nickname} (${st.barber.name}),${st.totalHeads},${st.haircutSales},${st.chemicalSales},${st.productSales},${st.tipTotal},${st.totalGenerated}\n`;
      });
      csv += `รวมช่างทุกคน,${dailyBarberData.totalHaircutCount},${dailyBarberData.totalHaircut},${dailyBarberData.totalChemical},${dailyBarberData.totalProduct},${dailyBarberData.totalTips},${dailyBarberData.grandTotalGenerated}\n\n`;

      csv += `รายการบิลประจำวัน\n`;
      csv += `เวลา,เลขบิล,ลูกค้า,ช่าง,รายการ,ช่องทางชำระเงิน,ทิป (บาท),ยอดสุทธิ (บาท)\n`;
      dailyBills.forEach((b) => {
        const timeStr = b.date ? new Date(b.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) : '-';
        const barberNames = Array.from(new Set(b.items.map((i) => i.barberName))).join(', ');
        const itemNames = b.items.map((i) => `${i.name} x${i.quantity}`).join(' | ');
        csv += `${timeStr},${b.billNumber},"${b.memberName || 'Walk-in'}","${barberNames}","${itemNames}",${b.paymentMethod},${b.tipAmount || 0},${b.grandTotal}\n`;
      });
    } else {
      csv += `รายงานสรุปรายได้รายวันสำหรับนักบัญชี,${settings.storeName}\n`;
      csv += `ประจำเดือน,${formatThaiMonthYear(selectedMonth)}\n`;
      csv += `วันที่ออกรายงาน,${formatThaiDate(todayStr, true)}\n\n`;

      csv += `ตารางสรุปรายรับ-รายจ่ายรายวัน (วันที่ 1 ถึง ${daysInMonth} ${formatThaiMonthYear(selectedMonth)})\n`;
      csv += `วันที่,วัน,จำนวนหัว (คน),เงินสด (บาท),เงินโอน (บาท),รวมยอดขายประจำวัน (บาท),ค่าใช้จ่ายร้าน (บาท),กำไรสุทธิประจำวัน (บาท),จำนวนบิล\n`;

      monthlyLedger.forEach((row) => {
        csv += `${row.dayNum},${row.dayName},${row.heads},${row.cash},${row.transfer},${row.total},${row.expenses},${row.net},${row.billsCount}\n`;
      });

      csv += `รวมทั้งเดือน,-,${monthlyHeads},${monthlyCash},${monthlyTransfer},${monthlyTotal},${monthlyExpenseTotal},${monthlyNetProfit},${monthlyBills.length}\n\n`;

      csv += `ตารางแยกรายได้ช่างประจำเดือน (${formatThaiMonthYear(selectedMonth)})\n`;
      csv += `ช่าง,จำนวนหัว (คน),ค่าตัดผม (บาท),ค่าเคมี (บาท),ค่าสินค้า (บาท),ค่าทิป (บาท),รวมรายได้สร้างให้ร้าน (บาท)\n`;

      monthlyBarberData.stats.forEach((st) => {
        csv += `${st.barber.nickname} (${st.barber.name}),${st.totalHeads},${st.haircutSales},${st.chemicalSales},${st.productSales},${st.tipTotal},${st.totalGenerated}\n`;
      });

      csv += `รวมช่างทุกคน,${monthlyBarberData.totalHaircutCount},${monthlyBarberData.totalHaircut},${monthlyBarberData.totalChemical},${monthlyBarberData.totalProduct},${monthlyBarberData.totalTips},${monthlyBarberData.grandTotalGenerated}\n`;
    }

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', mode === 'DAILY' ? `Daily_Report_${selectedDate}.csv` : `Accountant_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 text-stone-800 pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & MAIN VIEW TOGGLE (รายวัน vs รายเดือน vs ภาพรวม) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        {/* Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200/80 font-black flex items-center justify-center text-xl shadow-xs shrink-0">
            📊
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                แดชบอร์ดสรุปข้อมูลบัญชี & รายได้
              </h2>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Accountant Ready
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              แยกมุมมองดูแบบ <strong>รายวัน (Daily)</strong> และ <strong>รายเดือน (Monthly)</strong> ครบถ้วนทุกหมวดหมู่
            </p>
          </div>
        </div>

        {/* PRIMARY VIEW SWITCHER TABS */}
        <div className="flex flex-wrap items-center gap-1.5 bg-stone-100/90 border border-stone-200 rounded-2xl p-1.5 shadow-2xs w-full lg:w-auto justify-center sm:justify-start">
          <button
            onClick={() => setActiveTab('DAILY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'DAILY'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>☀️ สรุปรายวัน (Daily)</span>
          </button>

          <button
            onClick={() => setActiveTab('MONTHLY')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
              activeTab === 'MONTHLY'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>📅 สรุปรายเดือน (Monthly)</span>
          </button>

          <button
            onClick={() => setActiveTab('ALL_IN_ONE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'ALL_IN_ONE'
                ? 'bg-white text-stone-900 shadow-xs border border-stone-200'
                : 'text-stone-500 hover:text-stone-900 hover:bg-stone-200/60'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-amber-600" />
            <span>ภาพรวมเปรียบเทียบ</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: ☀️ DAILY VIEW (โหมดสรุปรายวัน) */}
      {/* ========================================================================= */}
      {activeTab === 'DAILY' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Daily Filter Bar & Quick Selectors */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-3xl p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-amber-950 flex items-center gap-1.5 mr-1">
                <Sun className="w-4 h-4 text-amber-600" /> เลือกวันที่:
              </span>
              
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  if (e.target.value) setSelectedMonth(e.target.value.slice(0, 7));
                }}
                className="bg-white border border-amber-300 text-stone-900 text-xs rounded-xl px-3 py-1.5 font-bold focus:outline-none focus:ring-2 focus:ring-amber-400 shadow-2xs cursor-pointer"
              />

              {/* Quick Pills */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleSetDayOffset(0)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                    selectedDate === todayStr
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'bg-white text-stone-700 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  วันนี้
                </button>
                <button
                  onClick={() => handleSetDayOffset(1)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
                >
                  เมื่อวาน
                </button>
                <button
                  onClick={() => handleSetDayOffset(2)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-white text-stone-700 border border-stone-200 hover:bg-stone-100 transition cursor-pointer"
                >
                  2 วันก่อน
                </button>
              </div>
            </div>

            {/* Daily Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={() => handleOpenPDFReport('DAILY')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                title="เปิดเอกสารรายงานสรุปรายได้-รายจ่ายรายวันสำหรับนักบัญชี (PDF)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>โหลด Report บัญชีรายวัน (PDF)</span>
              </button>
              <button
                onClick={() => handleExportCSV('DAILY')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="p-1.5 bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 rounded-xl transition cursor-pointer"
                title="พิมพ์"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Daily 5 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Heads */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" /> จำนวนหัววันนี้
                </span>
                <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-black">
                  💈
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-stone-900 font-mono">
                  {formatNumber(dailyHeads)} <span className="text-xs font-bold text-stone-500">หัว</span>
                </div>
                <div className="text-[11px] text-stone-400 font-medium mt-0.5">
                  จากทั้งหมด {dailyBills.length} บิล
                </div>
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                เฉลี่ย {dailyBills.length > 0 ? (dailyHeads / dailyBills.length).toFixed(1) : 0} หัว/บิล
              </div>
            </div>

            {/* 2. Cash */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" /> เงินสดวันนี้ (Cash)
                </span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  💵
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {formatCurrency(dailyCash)}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  {dailyTotal > 0 ? Math.round((dailyCash / dailyTotal) * 100) : 0}% ของยอดขายวันนี้
                </div>
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                เงินสดจริงในลิ้นชัก
              </div>
            </div>

            {/* 3. Transfer */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-cyan-600" /> เงินโอนวันนี้ (Transfer)
                </span>
                <span className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-xs font-black">
                  📱
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-cyan-700 font-mono">
                  {formatCurrency(dailyTransfer)}
                </div>
                <div className="text-[11px] text-cyan-800 font-medium mt-0.5">
                  {dailyTotal > 0 ? Math.round((dailyTransfer / dailyTotal) * 100) : 0}% ของยอดขายวันนี้
                </div>
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                PromptPay / สแกนโอน
              </div>
            </div>

            {/* 4. Total Sales */}
            <div className="bg-amber-50/70 border border-amber-300/80 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" /> รวมยอดขายวันนี้
                </span>
                <span className="w-7 h-7 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center text-xs font-black">
                  💰
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-amber-950 font-mono">
                  {formatCurrency(dailyTotal)}
                </div>
                <div className="text-[11px] text-amber-900 font-medium mt-0.5">
                  เงินสด + เงินโอน
                </div>
              </div>
              <div className="text-[10px] text-amber-800 pt-1 border-t border-amber-200/60 font-semibold">
                ทิปช่างวันนี้: {formatCurrency(dailyTips)}
              </div>
            </div>

            {/* 5. Net Profit */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> กำไรสุทธิวันนี้
                </span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  📈
                </span>
              </div>
              <div className="my-2">
                <div className={`text-2xl font-black font-mono ${dailyNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(dailyNetProfit)}
                </div>
                <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                  หักรายจ่าย: -{formatCurrency(dailyExpenseTotal)}
                </div>
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                ยอดสุทธิหลังหักรายจ่าย
              </div>
            </div>
          </div>

          {/* Daily Barber Revenue Breakdown Box */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-black flex items-center justify-center text-lg shadow-2xs">
                  ✂️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">
                    ยอดรายได้ของช่างแต่ละคนประจำวันที่ {formatThaiDate(selectedDate)}
                  </h3>
                  <p className="text-xs text-stone-500">
                    แจกแจงละเอียด: ค่าตัดผม • ค่าเคมี • ค่าสินค้า • ค่าทิป และจำนวนหัวที่ทำได้ในวันนี้
                  </p>
                </div>
              </div>
            </div>

            {/* Barber Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {dailyBarberData.stats.map((st) => {
                const percentOfTotal = dailyBarberData.grandTotalGenerated > 0 
                  ? Math.round((st.totalGenerated / dailyBarberData.grandTotalGenerated) * 100) 
                  : 0;

                return (
                  <div
                    key={st.barber.id}
                    className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3 relative flex flex-col justify-between hover:border-amber-300 transition"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                          style={{ backgroundColor: st.barber.color || '#D97706' }}
                        >
                          {st.barber.nickname.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                            ช่าง{st.barber.nickname}
                            <span className="text-[10px] text-stone-500 font-normal font-mono">({st.barber.name})</span>
                          </h4>
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            {st.totalHeads} หัว ({percentOfTotal}% ของร้าน)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">รวมยอดช่าง</span>
                        <strong className="text-sm font-black text-stone-900 font-mono block">
                          {formatCurrency(st.totalGenerated)}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <Scissors className="w-3.5 h-3.5 text-amber-600" /> ค่าตัดผม ({st.haircutCount} หัว)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.haircutSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <FlaskConical className="w-3.5 h-3.5 text-cyan-600" /> ค่าเคมี ดัด/ยืด/ย้อม ({st.chemicalCount} งาน)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.chemicalSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-600" /> ค่าขายสินค้า ({st.productCount} ชิ้น)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.productSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <HeartHandshake className="w-3.5 h-3.5 text-pink-500" /> ค่าทิป
                        </span>
                        <strong className="text-pink-600 font-bold font-mono text-xs">
                          {formatCurrency(st.tipTotal)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Table for Day */}
            <div className="overflow-x-auto rounded-2xl border border-stone-200 mt-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-stone-100/80 text-stone-700 font-extrabold uppercase text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">ช่างตัดผม</th>
                    <th className="p-3 text-center">จำนวนหัว (Heads)</th>
                    <th className="p-3 text-right">ค่าตัดผม (฿)</th>
                    <th className="p-3 text-right">ค่าเคมี (฿)</th>
                    <th className="p-3 text-right">ค่าขายสินค้า (฿)</th>
                    <th className="p-3 text-right">ค่าทิป (฿)</th>
                    <th className="p-3 text-right bg-amber-50/60 font-black text-amber-900">รวมรายได้ทั้งหมด (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {dailyBarberData.stats.map((st) => (
                    <tr key={st.barber.id} className="hover:bg-stone-50 transition">
                      <td className="p-3 font-bold text-stone-900 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: st.barber.color || '#D97706' }}
                        />
                        <span>ช่าง{st.barber.nickname}</span>
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-stone-800">
                        {formatNumber(st.totalHeads)} หัว
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.haircutSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.chemicalSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.productSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-pink-600 font-semibold">
                        {formatCurrency(st.tipTotal)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-950 bg-amber-50/40">
                        {formatCurrency(st.totalGenerated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-100 font-black text-stone-900 text-xs border-t-2 border-stone-300">
                  <tr>
                    <td className="p-3">รวมช่างทุกคนวันนี้</td>
                    <td className="p-3 text-center font-mono text-amber-900">{formatNumber(dailyBarberData.totalHaircutCount)} หัว</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(dailyBarberData.totalHaircut)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(dailyBarberData.totalChemical)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(dailyBarberData.totalProduct)}</td>
                    <td className="p-3 text-right font-mono text-pink-600">{formatCurrency(dailyBarberData.totalTips)}</td>
                    <td className="p-3 text-right font-mono text-sm text-amber-950 bg-amber-100/70">
                      {formatCurrency(dailyBarberData.grandTotalGenerated)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Daily Bills Breakdown Table */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-extrabold text-stone-900 text-sm">
                  รายการบิลทั้งหมดของวันที่ {formatThaiDate(selectedDate)} ({dailyBills.length} บิล)
                </h3>
              </div>

              {/* Search in Bills */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="ค้นหาเลขบิล, ชื่อลูกค้า, ช่าง..."
                  value={billSearchQuery}
                  onChange={(e) => setBillSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-xl focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {filteredDailyBills.length === 0 ? (
              <div className="text-center py-8 text-stone-400 text-xs">
                ไม่มีรายการบิลในวันที่เลือก
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-stone-200 max-h-[400px] overflow-y-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="sticky top-0 bg-stone-100 text-stone-700 font-extrabold uppercase text-[10px] border-b border-stone-200 z-10 shadow-xs">
                    <tr>
                      <th className="p-2.5">เวลา</th>
                      <th className="p-2.5">เลขที่บิล</th>
                      <th className="p-2.5">ลูกค้า</th>
                      <th className="p-2.5">ช่าง</th>
                      <th className="p-2.5">รายการบริการ / สินค้า</th>
                      <th className="p-2.5 text-center">วิธีชำระเงิน (สลับได้)</th>
                      <th className="p-2.5 text-right">ทิป (฿)</th>
                      <th className="p-2.5 text-right font-black text-amber-950 bg-amber-50/70">ยอดรวมสุทธิ (฿)</th>
                      <th className="p-2.5 text-center">จัดการบิล</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200 bg-white font-mono">
                    {filteredDailyBills.map((bill) => {
                      const timeStr = bill.date 
                        ? new Date(bill.date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })
                        : '-';
                      const barberNames = Array.from(new Set(bill.items.map((i) => i.barberName))).join(', ');

                      return (
                        <tr key={bill.id} className="hover:bg-stone-50 transition">
                          <td className="p-2.5 font-bold text-stone-500 font-sans">{timeStr} น.</td>
                          <td className="p-2.5 font-bold text-stone-900">{bill.billNumber}</td>
                          <td className="p-2.5 font-sans font-medium text-stone-800">
                            {bill.memberName || 'ลูกค้าทั่วไป (Walk-in)'}
                          </td>
                          <td className="p-2.5 font-sans font-bold text-amber-800">
                            {barberNames || '-'}
                          </td>
                          <td className="p-2.5 font-sans text-stone-600 max-w-xs truncate">
                            {bill.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            <button
                              type="button"
                              onClick={() => handleQuickTogglePaymentMethod(bill)}
                              title="คลิกเพื่อสลับวิธีชำระเงินด่วน (เงินสด ⇄ โอน ⇄ แบ่งจ่าย)"
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer hover:scale-105 active:scale-95 shadow-2xs ${
                                bill.paymentMethod === 'CASH'
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                                  : bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY'
                                  ? 'bg-cyan-100 text-cyan-800 border-cyan-200 hover:bg-cyan-200'
                                  : bill.paymentMethod === 'SPLIT'
                                  ? 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200'
                                  : 'bg-stone-100 text-stone-800 border-stone-200 hover:bg-stone-200'
                              }`}
                            >
                              {bill.paymentMethod === 'CASH' ? '💵 เงินสด ⇄' : bill.paymentMethod === 'TRANSFER' || bill.paymentMethod === 'PROMPTPAY' ? '📱 โอน/QR ⇄' : bill.paymentMethod === 'SPLIT' ? '🔄 สลับ ⇄' : `${bill.paymentMethod} ⇄`}
                            </button>
                          </td>
                          <td className="p-2.5 text-right text-pink-600 font-semibold">
                            {bill.tipAmount ? formatCurrency(bill.tipAmount) : '-'}
                          </td>
                          <td className="p-2.5 text-right font-black text-amber-950 bg-amber-50/40">
                            {formatCurrency(bill.grandTotal)}
                          </td>
                          <td className="p-2.5 text-center font-sans">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setSelectedBillForReceipt(bill)}
                                className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition cursor-pointer"
                                title="ดูใบเสร็จ"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setEditingBill(bill)}
                                className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                                title="แก้ไขบิล / เปลี่ยนช่าง / เปลี่ยนวิธีชำระเงิน"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeletingBill(bill)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="ลบบิลออกจากระบบ (มีป๊อปอัพยืนยัน)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: 📅 MONTHLY VIEW (โหมดสรุปรายเดือน) */}
      {/* ========================================================================= */}
      {activeTab === 'MONTHLY' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Monthly Filter Bar */}
          <div className="bg-stone-900 text-white rounded-3xl p-4 sm:p-5 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleStepMonth(-1)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
                  title="เดือนก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStepMonth(1)}
                  className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition cursor-pointer"
                  title="เดือนถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700 px-3 py-1.5 rounded-xl">
                <Calendar className="w-4 h-4 text-amber-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer"
                />
              </div>

              {/* Quick Month Pills */}
              <div className="flex flex-wrap items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSetMonthOffset(0)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedMonth === currentMonthStr
                      ? 'bg-amber-500 text-stone-950 shadow-2xs ring-2 ring-amber-400/40'
                      : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                  }`}
                >
                  เดือนนี้
                </button>
                <button
                  type="button"
                  onClick={() => handleSetMonthOffset(1)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-800 text-stone-300 hover:bg-stone-700 transition cursor-pointer"
                >
                  เดือนที่แล้ว (-1)
                </button>
                <button
                  type="button"
                  onClick={() => handleSetMonthOffset(2)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-800 text-stone-300 hover:bg-stone-700 transition cursor-pointer hidden sm:inline-block"
                >
                  ย้อนหลัง 2 เดือน
                </button>
                <button
                  type="button"
                  onClick={() => handleSetMonthOffset(3)}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-stone-800 text-stone-300 hover:bg-stone-700 transition cursor-pointer hidden md:inline-block"
                >
                  ย้อนหลัง 3 เดือน
                </button>
              </div>
            </div>

            {/* Monthly Actions */}
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
              <span className="text-xs text-amber-300 font-bold bg-amber-950/60 px-3 py-1.5 rounded-xl border border-amber-500/30">
                📅 {formatThaiMonthYear(selectedMonth)}
              </span>
              <button
                onClick={() => handleOpenPDFReport('MONTHLY')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-stone-950 rounded-xl text-xs font-black transition shadow-xs cursor-pointer"
                title="เปิดเอกสารรายงานสมุดรายวันและงบรายได้รายเดือนสำหรับนักบัญชี (PDF)"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>โหลด Report บัญชีรายเดือน (PDF)</span>
              </button>
              <button
                onClick={() => handleExportCSV('MONTHLY')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={handlePrint}
                className="p-1.5 bg-stone-800 hover:bg-stone-700 border border-stone-700 text-stone-300 rounded-xl transition cursor-pointer"
                title="พิมพ์รายงาน"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monthly 5 KPI Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Monthly Heads */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-amber-600" /> จำนวนหัวทั้งเดือน
                </span>
                <span className="w-7 h-7 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center text-xs font-black">
                  💈
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-stone-900 font-mono">
                  {formatNumber(monthlyHeads)} <span className="text-xs font-bold text-stone-500">หัว</span>
                </div>
                <div className="text-[11px] text-stone-400 font-medium mt-0.5">
                  จากทั้งหมด {monthlyBills.length} บิล
                </div>
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                เฉลี่ย {(monthlyHeads / daysInMonth).toFixed(1)} หัว/วัน
              </div>
            </div>

            {/* 2. Monthly Cash */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-600" /> เงินสดทั้งเดือน (Cash)
                </span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  💵
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-emerald-700 font-mono">
                  {formatCurrency(monthlyCash)}
                </div>
                <div className="text-[11px] text-emerald-800 font-medium mt-0.5">
                  {monthlyTotal > 0 ? Math.round((monthlyCash / monthlyTotal) * 100) : 0}% ของยอดรวมทั้งเดือน
                </div>
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                รับเข้าเป็นเงินสด
              </div>
            </div>

            {/* 3. Monthly Transfer */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-cyan-600" /> เงินโอนทั้งเดือน (Transfer)
                </span>
                <span className="w-7 h-7 rounded-xl bg-cyan-50 text-cyan-700 flex items-center justify-center text-xs font-black">
                  📱
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-cyan-700 font-mono">
                  {formatCurrency(monthlyTransfer)}
                </div>
                <div className="text-[11px] text-cyan-800 font-medium mt-0.5">
                  {monthlyTotal > 0 ? Math.round((monthlyTransfer / monthlyTotal) * 100) : 0}% ของยอดรวมทั้งเดือน
                </div>
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                สแกนโอน / PromptPay
              </div>
            </div>

            {/* 4. Monthly Total */}
            <div className="bg-amber-50/70 border border-amber-300/80 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-700" /> ยอดขายรวมทั้งเดือน
                </span>
                <span className="w-7 h-7 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center text-xs font-black">
                  💰
                </span>
              </div>
              <div className="my-2">
                <div className="text-2xl font-black text-amber-950 font-mono">
                  {formatCurrency(monthlyTotal)}
                </div>
                <div className="text-[11px] text-amber-900 font-medium mt-0.5">
                  เงินสด + เงินโอน
                </div>
              </div>
              <div className="text-[10px] text-amber-800 pt-1 border-t border-amber-200/60 font-semibold">
                ทิปช่างทั้งเดือน: {formatCurrency(monthlyTips)}
              </div>
            </div>

            {/* 5. Monthly Net Profit */}
            <div className="bg-white border border-stone-200 rounded-3xl p-4 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" /> กำไรสุทธิทั้งเดือน
                </span>
                <span className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-black">
                  📈
                </span>
              </div>
              <div className="my-2">
                <div className={`text-2xl font-black font-mono ${monthlyNetProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(monthlyNetProfit)}
                </div>
                <div className="text-[11px] text-rose-600 font-medium mt-0.5">
                  หักรายจ่ายร้าน: -{formatCurrency(monthlyExpenseTotal)}
                </div>
              </div>
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100">
                กำไรแท้จริงของร้าน
              </div>
            </div>
          </div>

          {/* Monthly Barber Revenue Breakdown Box */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 border border-amber-200 font-black flex items-center justify-center text-lg shadow-2xs">
                  ✂️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight">
                    ยอดรายได้สะสมของช่างแต่ละคนประจำเดือน {formatThaiMonthYear(selectedMonth)}
                  </h3>
                  <p className="text-xs text-stone-500">
                    สรุปผลงานช่างทั้งเดือน: ค่าตัดผม • ค่าเคมี • ค่าสินค้า • ค่าทิป และจำนวนหัว
                  </p>
                </div>
              </div>
            </div>

            {/* Barber Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {monthlyBarberData.stats.map((st) => {
                const percentOfTotal = monthlyBarberData.grandTotalGenerated > 0 
                  ? Math.round((st.totalGenerated / monthlyBarberData.grandTotalGenerated) * 100) 
                  : 0;

                return (
                  <div
                    key={st.barber.id}
                    className="bg-stone-50/80 border border-stone-200/90 rounded-2xl p-4 shadow-2xs space-y-3 relative flex flex-col justify-between hover:border-amber-300 transition"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-stone-200/70">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-xs"
                          style={{ backgroundColor: st.barber.color || '#D97706' }}
                        >
                          {st.barber.nickname.slice(0, 2)}
                        </div>
                        <div>
                          <h4 className="font-extrabold text-stone-900 text-xs flex items-center gap-1.5">
                            ช่าง{st.barber.nickname}
                            <span className="text-[10px] text-stone-500 font-normal font-mono">({st.barber.name})</span>
                          </h4>
                          <span className="text-[10px] text-amber-800 font-bold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                            {st.totalHeads} หัว ({percentOfTotal}% ของร้าน)
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block uppercase font-bold">รวมทั้งเดือน</span>
                        <strong className="text-sm font-black text-stone-900 font-mono block">
                          {formatCurrency(st.totalGenerated)}
                        </strong>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <Scissors className="w-3.5 h-3.5 text-amber-600" /> ค่าตัดผม ({st.haircutCount} หัว)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.haircutSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <FlaskConical className="w-3.5 h-3.5 text-cyan-600" /> ค่าเคมี ดัด/ยืด/ย้อม ({st.chemicalCount} งาน)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.chemicalSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <ShoppingBag className="w-3.5 h-3.5 text-purple-600" /> ค่าขายสินค้า ({st.productCount} ชิ้น)
                        </span>
                        <strong className="text-stone-900 font-bold font-mono text-xs">
                          {formatCurrency(st.productSales)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between p-2 rounded-xl bg-white border border-stone-200/70">
                        <span className="text-stone-600 flex items-center gap-1.5 text-[11px] font-medium">
                          <HeartHandshake className="w-3.5 h-3.5 text-pink-500" /> ค่าทิป
                        </span>
                        <strong className="text-pink-600 font-bold font-mono text-xs">
                          {formatCurrency(st.tipTotal)}
                        </strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary Table for Month */}
            <div className="overflow-x-auto rounded-2xl border border-stone-200 mt-2">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-stone-100/80 text-stone-700 font-extrabold uppercase text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">ช่างตัดผม</th>
                    <th className="p-3 text-center">จำนวนหัว (Heads)</th>
                    <th className="p-3 text-right">ค่าตัดผม (฿)</th>
                    <th className="p-3 text-right">ค่าเคมี (฿)</th>
                    <th className="p-3 text-right">ค่าขายสินค้า (฿)</th>
                    <th className="p-3 text-right">ค่าทิป (฿)</th>
                    <th className="p-3 text-right bg-amber-50/60 font-black text-amber-900">รวมรายได้ทั้งหมด (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white">
                  {monthlyBarberData.stats.map((st) => (
                    <tr key={st.barber.id} className="hover:bg-stone-50 transition">
                      <td className="p-3 font-bold text-stone-900 flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: st.barber.color || '#D97706' }}
                        />
                        <span>ช่าง{st.barber.nickname}</span>
                      </td>
                      <td className="p-3 text-center font-bold font-mono text-stone-800">
                        {formatNumber(st.totalHeads)} หัว
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.haircutSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.chemicalSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-stone-800">
                        {formatCurrency(st.productSales)}
                      </td>
                      <td className="p-3 text-right font-mono text-pink-600 font-semibold">
                        {formatCurrency(st.tipTotal)}
                      </td>
                      <td className="p-3 text-right font-mono font-black text-amber-950 bg-amber-50/40">
                        {formatCurrency(st.totalGenerated)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-stone-100 font-black text-stone-900 text-xs border-t-2 border-stone-300">
                  <tr>
                    <td className="p-3">รวมช่างทุกคนทั้งเดือน</td>
                    <td className="p-3 text-center font-mono text-amber-900">{formatNumber(monthlyBarberData.totalHaircutCount)} หัว</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(monthlyBarberData.totalHaircut)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(monthlyBarberData.totalChemical)}</td>
                    <td className="p-3 text-right font-mono">{formatCurrency(monthlyBarberData.totalProduct)}</td>
                    <td className="p-3 text-right font-mono text-pink-600">{formatCurrency(monthlyBarberData.totalTips)}</td>
                    <td className="p-3 text-right font-mono text-sm text-amber-950 bg-amber-100/70">
                      {formatCurrency(monthlyBarberData.grandTotalGenerated)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* FULL MONTH DAILY LEDGER TABLE (วันที่ 1 ถึงสิ้นเดือน) */}
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-black flex items-center justify-center text-lg shadow-2xs">
                  🗓️
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                    ตารางบันทึกรายรับรายวันทั้งเดือน (วันที่ 1 ถึง {daysInMonth} {formatThaiMonthYear(selectedMonth)})
                  </h3>
                  <p className="text-xs text-stone-500">
                    แจกแจงเงินสด เงินโอน จำนวนหัว ยอดขายรวม และกำไรสุทธิในแต่ละวันเพื่อนำไปลงโปรแกรมบัญชีได้ทันที
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center bg-stone-100 border border-stone-200 rounded-xl p-1">
                  <button
                    onClick={() => setTableFilter('ALL_DAYS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      tableFilter === 'ALL_DAYS'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    แสดงครบทุกวัน (1 - {daysInMonth})
                  </button>
                  <button
                    onClick={() => setTableFilter('ACTIVE_DAYS')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      tableFilter === 'ACTIVE_DAYS'
                        ? 'bg-white text-stone-900 shadow-2xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    เฉพาะวันที่มีรายการ
                  </button>
                </div>

                <button
                  onClick={() => handleOpenPDFReport('MONTHLY')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 rounded-xl text-xs font-black transition cursor-pointer"
                  title="ดาวน์โหลดสมุดรายวันเป็น PDF"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-700" />
                  <span>PDF รายงานบัญชี</span>
                </button>

                <button
                  onClick={() => handleExportCSV('MONTHLY')}
                  className="flex items-center gap-1 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 border border-stone-200 text-stone-800 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-stone-200 max-h-[550px] overflow-y-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="sticky top-0 bg-stone-100 text-stone-700 font-extrabold uppercase text-[10px] border-b border-stone-200 z-10 shadow-xs">
                  <tr>
                    <th className="p-3 text-center w-16">วันที่</th>
                    <th className="p-3 text-center w-14">วัน</th>
                    <th className="p-3 text-center">จำนวนหัว (Heads)</th>
                    <th className="p-3 text-right text-emerald-800">💵 เงินสด (฿)</th>
                    <th className="p-3 text-right text-cyan-800">📱 เงินโอน (฿)</th>
                    <th className="p-3 text-right font-black text-amber-900 bg-amber-50/70">💰 รวมยอดขายวันนั้น (฿)</th>
                    <th className="p-3 text-right text-rose-700">💸 ค่าใช้จ่าย (฿)</th>
                    <th className="p-3 text-right font-black text-stone-900">📈 กำไรสุทธิ (฿)</th>
                    <th className="p-3 text-center w-20">จำนวนบิล</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200 bg-white font-mono">
                  {displayedLedger.map((row) => {
                    const hasActivity = row.billsCount > 0 || row.expenses > 0;

                    return (
                      <tr
                        key={row.dayNum}
                        className={`transition ${
                          row.isToday
                            ? 'bg-amber-50/60 font-semibold'
                            : row.isWeekend
                            ? 'bg-stone-50/50 hover:bg-stone-100/80'
                            : 'hover:bg-stone-50'
                        }`}
                      >
                        <td className="p-2.5 text-center font-bold text-stone-900 font-sans">
                          <div className="flex items-center justify-center gap-1">
                            <span>{row.dayNum}</span>
                            {row.isToday && (
                              <span className="bg-amber-500 text-white text-[9px] px-1 py-0.2 rounded-md font-bold">
                                วันนี้
                              </span>
                            )}
                          </div>
                        </td>

                        <td
                          className={`p-2.5 text-center font-sans text-[11px] font-bold ${
                            row.dayName === 'ส.' || row.dayName === 'อา.'
                              ? 'text-rose-500'
                              : 'text-stone-500'
                          }`}
                        >
                          {row.dayName}
                        </td>

                        <td className="p-2.5 text-center font-sans font-bold text-stone-800">
                          {row.heads > 0 ? (
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-black">
                              {formatNumber(row.heads)} หัว
                            </span>
                          ) : (
                            <span className="text-stone-300">-</span>
                          )}
                        </td>

                        <td className="p-2.5 text-right font-bold text-emerald-800">
                          {row.cash > 0 ? formatCurrency(row.cash) : <span className="text-stone-300 font-normal">0฿</span>}
                        </td>

                        <td className="p-2.5 text-right font-bold text-cyan-800">
                          {row.transfer > 0 ? formatCurrency(row.transfer) : <span className="text-stone-300 font-normal">0฿</span>}
                        </td>

                        <td className="p-2.5 text-right font-black text-amber-950 bg-amber-50/50">
                          {row.total > 0 ? (
                            <span className="text-xs font-black">{formatCurrency(row.total)}</span>
                          ) : (
                            <span className="text-stone-300 font-normal">0฿</span>
                          )}
                        </td>

                        <td className="p-2.5 text-right text-rose-600 font-medium">
                          {row.expenses > 0 ? `-${formatCurrency(row.expenses)}` : <span className="text-stone-300 font-normal">0฿</span>}
                        </td>

                        <td className="p-2.5 text-right font-black">
                          {hasActivity ? (
                            <span className={row.net >= 0 ? 'text-emerald-700' : 'text-rose-600'}>
                              {formatCurrency(row.net)}
                            </span>
                          ) : (
                            <span className="text-stone-300 font-normal">0฿</span>
                          )}
                        </td>

                        <td className="p-2.5 text-center font-sans text-[11px] text-stone-500">
                          {row.billsCount > 0 ? `${row.billsCount} บิล` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>

                <tfoot className="sticky bottom-0 bg-stone-900 text-white font-mono text-xs border-t-2 border-stone-800 z-10 shadow-lg">
                  <tr>
                    <td colSpan={2} className="p-3 font-bold font-sans text-amber-300 text-xs">
                      รวมทั้งเดือน ({formatThaiMonthYear(selectedMonth)})
                    </td>
                    <td className="p-3 text-center font-sans font-black text-amber-300">
                      {formatNumber(monthlyHeads)} หัว
                    </td>
                    <td className="p-3 text-right font-black text-emerald-300">
                      {formatCurrency(monthlyCash)}
                    </td>
                    <td className="p-3 text-right font-black text-cyan-300">
                      {formatCurrency(monthlyTransfer)}
                    </td>
                    <td className="p-3 text-right font-black text-amber-300 text-sm bg-stone-800/80">
                      {formatCurrency(monthlyTotal)}
                    </td>
                    <td className="p-3 text-right font-bold text-rose-300">
                      -{formatCurrency(monthlyExpenseTotal)}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-300 text-sm">
                      {formatCurrency(monthlyNetProfit)}
                    </td>
                    <td className="p-3 text-center font-sans font-bold text-stone-300">
                      {monthlyBills.length} บิล
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: 📊 ALL-IN-ONE & COMPARISON (ภาพรวม & เปรียบเทียบ) */}
      {/* ========================================================================= */}
      {activeTab === 'ALL_IN_ONE' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <span className="text-xs font-extrabold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" /> สรุปเปรียบเทียบสถิติหลัก: รายวัน vs ทั้งเดือน
              </span>
              <span className="text-xs text-stone-400">
                วัน: <strong className="text-stone-800">{formatThaiDate(selectedDate)}</strong> | เดือน: <strong className="text-stone-800">{formatThaiMonthYear(selectedMonth)}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-4">
              {/* Card 1: Heads */}
              <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-stone-600 flex items-center gap-1.5 mb-2">
                  <Users className="w-4 h-4 text-amber-600" /> สรุปจำนวนหัวลูกค้า
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">วันนี้:</span>
                    <strong className="text-stone-900 font-mono text-sm">{formatNumber(dailyHeads)} หัว</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">ทั้งเดือน:</span>
                    <strong className="text-stone-900 font-mono text-sm">{formatNumber(monthlyHeads)} หัว</strong>
                  </div>
                </div>
              </div>

              {/* Card 2: Cash */}
              <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-stone-600 flex items-center gap-1.5 mb-2">
                  <Wallet className="w-4 h-4 text-emerald-600" /> สรุปยอดเงินสด (Cash)
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">วันนี้:</span>
                    <strong className="text-emerald-800 font-mono text-sm">{formatCurrency(dailyCash)}</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">ทั้งเดือน:</span>
                    <strong className="text-emerald-800 font-mono text-sm">{formatCurrency(monthlyCash)}</strong>
                  </div>
                </div>
              </div>

              {/* Card 3: Transfer */}
              <div className="bg-stone-50/70 border border-stone-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-stone-600 flex items-center gap-1.5 mb-2">
                  <CreditCard className="w-4 h-4 text-cyan-600" /> สรุปยอดเงินโอน (Transfer)
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">วันนี้:</span>
                    <strong className="text-cyan-800 font-mono text-sm">{formatCurrency(dailyTransfer)}</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-stone-200/70">
                    <span className="text-stone-600">ทั้งเดือน:</span>
                    <strong className="text-cyan-800 font-mono text-sm">{formatCurrency(monthlyTransfer)}</strong>
                  </div>
                </div>
              </div>

              {/* Card 4: Total */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <div className="text-xs font-extrabold text-amber-950 flex items-center gap-1.5 mb-2">
                  <Sparkles className="w-4 h-4 text-amber-700" /> รวมยอดขายสุทธิ
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-amber-200">
                    <span className="text-stone-600">วันนี้:</span>
                    <strong className="text-amber-950 font-mono text-sm">{formatCurrency(dailyTotal)}</strong>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-xl bg-white border border-amber-200">
                    <span className="text-stone-600">ทั้งเดือน:</span>
                    <strong className="text-amber-950 font-mono text-sm">{formatCurrency(monthlyTotal)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Category Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category breakdown */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-stone-700 flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-amber-600" /> สัดส่วนรายได้ตามหมวดบริการทั้งเดือน
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-amber-50/50 border border-amber-200">
                  <span className="flex items-center gap-2 font-bold text-amber-950">
                    <span>✂️ งานตัดผม & ออกแบบ</span>
                  </span>
                  <strong className="font-mono text-amber-950 text-sm">{formatCurrency(monthlyHaircutSales)}</strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-cyan-50/50 border border-cyan-200">
                  <span className="flex items-center gap-2 font-bold text-cyan-950">
                    <span>🧪 งานเคมี ดัด/ยืด/ทำสี</span>
                  </span>
                  <strong className="font-mono text-cyan-950 text-sm">{formatCurrency(monthlyChemicalSales)}</strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-purple-50/50 border border-purple-200">
                  <span className="flex items-center gap-2 font-bold text-purple-950">
                    <span>🧴 สินค้าจัดแต่งทรง & ดูแลผม</span>
                  </span>
                  <strong className="font-mono text-purple-950 text-sm">{formatCurrency(monthlyProductSales)}</strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-pink-50/50 border border-pink-200">
                  <span className="flex items-center gap-2 font-bold text-pink-950">
                    <span>💖 ทิปช่าง</span>
                  </span>
                  <strong className="font-mono text-pink-950 text-sm">{formatCurrency(monthlyTips)}</strong>
                </div>
              </div>
            </div>

            {/* Payment Method distribution */}
            <div className="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-black uppercase text-stone-700 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-emerald-600" /> สัดส่วนช่องทางชำระเงินทั้งเดือน
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
                  <span className="flex items-center gap-2 font-bold text-emerald-950">
                    <span>💵 เงินสด (Cash)</span>
                    <span className="text-[10px] text-emerald-700 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200 font-normal">
                      {monthlyTotal > 0 ? Math.round((monthlyCash / monthlyTotal) * 100) : 0}%
                    </span>
                  </span>
                  <strong className="font-mono text-emerald-950 text-sm">{formatCurrency(monthlyCash)}</strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-cyan-50/50 border border-cyan-200">
                  <span className="flex items-center gap-2 font-bold text-cyan-950">
                    <span>📱 เงินโอน (Transfer & QR)</span>
                    <span className="text-[10px] text-cyan-700 bg-white px-1.5 py-0.5 rounded-md border border-cyan-200 font-normal">
                      {monthlyTotal > 0 ? Math.round((monthlyTransfer / monthlyTotal) * 100) : 0}%
                    </span>
                  </span>
                  <strong className="font-mono text-cyan-950 text-sm">{formatCurrency(monthlyTransfer)}</strong>
                </div>

                <div className="flex justify-between items-center p-2.5 rounded-2xl bg-stone-50 border border-stone-200">
                  <span className="font-bold text-stone-700">💰 ยอดรวมทั้งหมด</span>
                  <strong className="font-mono text-stone-900 text-sm">{formatCurrency(monthlyTotal)}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bill Receipt Modal Preview */}
      <ReceiptModal
        isOpen={Boolean(selectedBillForReceipt)}
        onClose={() => setSelectedBillForReceipt(null)}
        bill={selectedBillForReceipt}
        settings={settings}
      />

      {/* Edit Bill Modal */}
      {editingBill && (
        <EditBillModal
          isOpen={!!editingBill}
          onClose={() => setEditingBill(null)}
          bill={editingBill}
          barbers={barbers}
          onSaveBill={(updated) => {
            if (onUpdateBill) onUpdateBill(updated);
            setEditingBill(null);
          }}
        />
      )}

      {/* Delete Bill Modal with Confirmation Popup */}
      {deletingBill && (
        <DeleteBillModal
          isOpen={!!deletingBill}
          onClose={() => setDeletingBill(null)}
          bill={deletingBill}
          onConfirmDelete={(billId) => {
            if (onDeleteBill) onDeleteBill(billId);
            setDeletingBill(null);
          }}
        />
      )}

      {/* Professional Accountant PDF Report Modal */}
      {showAccountantPDFModal && (
        <AccountantPDFModal
          isOpen={showAccountantPDFModal}
          onClose={() => setShowAccountantPDFModal(false)}
          reportType={accountantPDFReportType}
          selectedDate={selectedDate}
          selectedMonth={selectedMonth}
          bills={bills}
          expenses={expenses}
          barbers={barbers}
          settings={settings}
          onExportCSV={() => handleExportCSV(accountantPDFReportType)}
        />
      )}
    </div>
  );
};
